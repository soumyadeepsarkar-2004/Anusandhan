# Technical Analysis Report: Institutional Verification Idempotency & Anti-Double-Spending Patch

**Agent**: `explorer_m1_r3_2` (Archetype: Explorer; Roles: Technical Exploration, Patch Design, Synthesis)  
**Investigation Scope**: Defect 2 from Milestone 1 Iteration 2 Gate (`/api/auth/verify-institutional-email` race condition & credit double-spending)  
**Working Directory**: `c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_m1_r3_2\`  
**Target File**: `c:\PROJECTS\ResearchIntern_Pro\server\routes\authRoutes.js` (Lines 247–320)  
**Date**: 2026-11-03T22:36:00Z  

---

## 1. Observation

### 1.1 Empirical Defect Manifestation
During Challenger 1's adversarial verification (`c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\challenger_m1_r2_1\verify_challenges.mjs:282-346`):
- **Sequential Replay**: Calling `POST /api/auth/verify-institutional-email` repeatedly on an already-verified user account awarded +10 credits on each successive call (initial 10 credits -> 20 credits -> 30 credits -> ...).
- **Concurrent Burst**: Disagreeing race conditions occurred when 5 concurrent requests hit the endpoint for a fresh user account, inflating `creditsRemaining` to 60 (initial 10 credits + 5 × 10 credits) instead of the single +10 allowance (expected exactly 20 credits).
- **Empirical Execution Output**:
  ```text
  After second verification call: status=200, resp={"verified":true,"domain":"iisc.ac.in","bonusCreditsAwarded":10,"message":"Institutional scholar affiliation verified successfully! +10 outreach credits awarded."}, creditsRemaining=30
  After 5 concurrent verification calls on fresh user: creditsRemaining=60
  [DEFECT DETECTED] Race condition / replay double-spending: creditsRemaining is 60 instead of 20!
  ```

### 1.2 Direct Code Vulnerability Analysis (`server/routes/authRoutes.js:277-310`)
Inspecting `server/routes/authRoutes.js` revealed three critical flaws:
```javascript
277:     let updatedUserDoc = null;
278:     if (isDbConnected()) {
279:       try {
280:         updatedUserDoc = await User.findOneAndUpdate(
281:           { email: normalizedEmail },   // <-- FLAW 1: Non-conditional query. Matches regardless of isInstitutionalVerified state
282:           {
283:             $set: {
284:               isVerified: true,
285:               isInstitutionalVerified: true,
286:               institutionalEmail: normalizedInstEmail,
287:               updatedAt: new Date()
288:             },
289:             $inc: { creditsRemaining: 10 } // <-- Unconditionally increments credits by 10 on every invocation
290:           },
291:           { new: true }
292:         );
293:       } catch (dbErr) {
294:         console.error('[Auth Verify Institutional Error - DB]:', dbErr);
295:       }
296:     }
297: 
298:     if (updatedUserDoc) {
299:       memoryUsers.set(normalizedEmail, updatedUserDoc.toObject ? updatedUserDoc.toObject() : updatedUserDoc);
300:     } else {
301:       const user = memoryUsers.get(normalizedEmail);
302:       if (user) {
303:         user.isVerified = true;
304:         user.isInstitutionalVerified = true;
305:         user.institutionalEmail = normalizedInstEmail;
306:         user.creditsRemaining = (user.creditsRemaining || 10) + 10; // <-- FLAW 2: In-memory store unconditionally increments
307:         user.updatedAt = new Date();
308:       }
309:     }
```

1. **Missing Pre-check**: There is zero pre-validation of the caller's existing verification status before checking domain rules or applying credit grants. An already-verified user can re-submit the endpoint endlessly.
2. **Missing Atomic Concurrency Guard in MongoDB**: The MongoDB filter query is `{ email: normalizedEmail }`. It lacks the conditional requirement `{ isInstitutionalVerified: { $ne: true } }`. Consequently, MongoDB locks the document and executes `$inc: { creditsRemaining: 10 }` for each concurrent request in the batch.
3. **Flawed Fallback and In-Memory Race**: If MongoDB is offline, or if a database operation returned null, the code falls into `else { user.creditsRemaining = (user.creditsRemaining || 10) + 10; }` without verifying whether `user.isInstitutionalVerified` was already true.

---

## 2. Logic Chain

1. **Idempotency Invariant**:
   - Institutional scholar verification is a one-time onboarding milestone. A student account must receive the bonus grant of +10 outreach credits exactly once (advancing baseline credits from 10 to 20).
   - Any subsequent call for an account where `isInstitutionalVerified === true` must be rejected as an invalid redundant attempt.

2. **Pre-Check Defense Layer**:
   - Before executing regex domain parsing or database write locks, the route should inspect the authenticated account's current state (`currentUser?.isInstitutionalVerified === true`).
   - If already verified, immediately return HTTP 400 Bad Request with:
     ```json
     {
       "verified": true,
       "error": "Institutional affiliation has already been verified for this account."
     }
     ```
   - This eliminates unnecessary computation and rejects sequential replays at the entry gate.

3. **Atomic Concurrency Defense in MongoDB**:
   - In a concurrent burst (e.g. 5 parallel requests), multiple requests may pass the read pre-check simultaneously before any write finishes.
   - To prevent the race condition, the database write must be atomic at the document level:
     ```javascript
     updatedUserDoc = await User.findOneAndUpdate(
       { email: normalizedEmail, isInstitutionalVerified: { $ne: true } },
       {
         $set: {
           isVerified: true,
           isInstitutionalVerified: true,
           institutionalEmail: normalizedInstEmail,
           updatedAt: new Date()
         },
         $inc: { creditsRemaining: 10 }
       },
       { new: true }
     );
     ```
   - **Race Resolution**: The first request to acquire the document lock finds `isInstitutionalVerified: false` (matching `$ne: true`), mutates the document, sets `isInstitutionalVerified: true`, increments credits by 10, and returns `updatedUserDoc`.
   - All subsequent concurrent requests in the burst evaluate `{ isInstitutionalVerified: { $ne: true } }` against `isInstitutionalVerified: true`. The filter matches zero documents, so Mongoose returns `null`.
   - When `updatedUserDoc` is `null`, the route returns HTTP 400 Bad Request without awarding credits or touching `memoryUsers`.

4. **In-Memory Store Synchronization & Parity**:
   - When running in local development or test suites without an active MongoDB connection (`!isDbConnected()`), the endpoint relies on `memoryUsers`.
   - Parity requires that `memoryUsers.get(normalizedEmail)` strictly checks `if (user.isInstitutionalVerified === true)` and returns HTTP 400 Bad Request.
   - When MongoDB IS connected, successful updates are synced to `memoryUsers` (`memoryUsers.set(...)`), maintaining consistent dual-store state.

5. **Test Suite Compatibility**:
   - `server/tests/gateway.test.js`: Makes 1 verification request on a fresh user -> Passes with 200 OK (`bonusCreditsAwarded: 10`, `domain: 'iisc.ac.in'`).
   - `tests/e2e/tier1_features.test.mjs`: Makes 1 verification request on a fresh user -> Passes with 200 OK.
   - `tests/e2e/tier2_boundaries.test.mjs`: Tests rejection of public domains (`gmail.com`, `yahoo.co.in`, `hotmail.com`) on an unverified user -> Passes with 400 (`verified: false`, `message: 'Domain is not recognized...'`).
   - `tests/e2e/tier3_interactions.test.mjs` & `tests/e2e/tier4_realworld.test.mjs`: Verify once, check profile has 20 credits and `isVerified: true` -> Passes.
   - `challenger_m1_r2_1/verify_challenges.mjs`: Challenge 2.3 sequential replay call receives HTTP 400; 5 concurrent requests yield exactly 20 credits (1 success, 4 rejections) -> Passes.

---

## 3. Exact Patch Diffs for `server/routes/authRoutes.js`

### 3.1 Target File: `server/routes/authRoutes.js`
**Target Range**: Lines 247 to 320

```diff
--- a/server/routes/authRoutes.js
+++ b/server/routes/authRoutes.js
@@ -247,6 +247,33 @@
 router.post('/verify-institutional-email', authenticateToken, async (req, res) => {
   try {
     const { institutionalEmail } = req.body;
     if (!institutionalEmail) {
       return res.status(400).json({ error: 'Institutional email is required' });
     }
 
+    const normalizedEmail = (req.user?.email || '').toLowerCase().trim();
+    if (!normalizedEmail) {
+      return res.status(401).json({ error: 'Access token required.' });
+    }
+
+    // 1. Pre-check: Reject if account has already been verified
+    let currentUser = null;
+    if (isDbConnected()) {
+      try {
+        currentUser = await User.findOne({ email: normalizedEmail });
+      } catch {
+        currentUser = memoryUsers.get(normalizedEmail);
+      }
+    } else {
+      currentUser = memoryUsers.get(normalizedEmail);
+    }
+    if (!currentUser) {
+      currentUser = memoryUsers.get(normalizedEmail);
+    }
+
+    if (currentUser?.isInstitutionalVerified === true) {
+      return res.status(400).json({
+        verified: true,
+        error: 'Institutional affiliation has already been verified for this account.'
+      });
+    }
+
-    const domain = institutionalEmail.split('@')[1]?.toLowerCase();
+    const domain = institutionalEmail.split('@')[1]?.toLowerCase()?.trim();
     const isAccredited = domain && (
       domain.endsWith('.ac.in') ||
       domain.endsWith('.edu') ||
@@ -274,38 +301,57 @@
     // Award verified badge and bonus credits in memory / database
-    const normalizedEmail = (req.user?.email || '').toLowerCase().trim();
     const normalizedInstEmail = institutionalEmail.toLowerCase().trim();
 
     let updatedUserDoc = null;
     if (isDbConnected()) {
       try {
         updatedUserDoc = await User.findOneAndUpdate(
-          { email: normalizedEmail },
+          { email: normalizedEmail, isInstitutionalVerified: { $ne: true } },
           {
             $set: {
               isVerified: true,
               isInstitutionalVerified: true,
               institutionalEmail: normalizedInstEmail,
               updatedAt: new Date()
             },
             $inc: { creditsRemaining: 10 }
           },
           { new: true }
         );
       } catch (dbErr) {
         console.error('[Auth Verify Institutional Error - DB]:', dbErr);
+        throw dbErr;
       }
-    }
-
-    if (updatedUserDoc) {
+
+      if (!updatedUserDoc) {
+        return res.status(400).json({
+          verified: true,
+          error: 'Institutional affiliation has already been verified for this account.'
+        });
+      }
+
       memoryUsers.set(normalizedEmail, updatedUserDoc.toObject ? updatedUserDoc.toObject() : updatedUserDoc);
     } else {
+      // In-Memory fallback store with atomic idempotency check
       const user = memoryUsers.get(normalizedEmail);
       if (!user) {
+        return res.status(404).json({ error: 'User profile not found.' });
+      }
+
+      if (user.isInstitutionalVerified === true) {
+        return res.status(400).json({
+          verified: true,
+          error: 'Institutional affiliation has already been verified for this account.'
+        });
+      }
+
       user.isVerified = true;
       user.isInstitutionalVerified = true;
       user.institutionalEmail = normalizedInstEmail;
       user.creditsRemaining = (user.creditsRemaining || 10) + 10;
       user.updatedAt = new Date();
     }
```

### 3.2 Full Replacement Block for `router.post('/verify-institutional-email', ...)`
For clean, drop-in replacement in `server/routes/authRoutes.js`:

```javascript
/**
 * POST /api/auth/verify-institutional-email
 * Validates accredited university / national lab domain (.ac.in, .edu, .res.in)
 */
router.post('/verify-institutional-email', authenticateToken, async (req, res) => {
  try {
    const { institutionalEmail } = req.body;
    if (!institutionalEmail) {
      return res.status(400).json({ error: 'Institutional email is required' });
    }

    const normalizedEmail = (req.user?.email || '').toLowerCase().trim();
    if (!normalizedEmail) {
      return res.status(401).json({ error: 'Access token required.' });
    }

    // 1. Pre-check: Reject if account has already been verified
    let currentUser = null;
    if (isDbConnected()) {
      try {
        currentUser = await User.findOne({ email: normalizedEmail });
      } catch {
        currentUser = memoryUsers.get(normalizedEmail);
      }
    } else {
      currentUser = memoryUsers.get(normalizedEmail);
    }
    if (!currentUser) {
      currentUser = memoryUsers.get(normalizedEmail);
    }

    if (currentUser?.isInstitutionalVerified === true) {
      return res.status(400).json({
        verified: true,
        error: 'Institutional affiliation has already been verified for this account.'
      });
    }

    const domain = institutionalEmail.split('@')[1]?.toLowerCase()?.trim();
    const isAccredited = domain && (
      domain.endsWith('.ac.in') ||
      domain.endsWith('.edu') ||
      domain.endsWith('.res.in') ||
      domain.includes('iisc.') ||
      domain.includes('tifr.') ||
      domain.includes('mpg.de') ||
      domain.includes('ethz.ch') ||
      domain.includes('cern.ch')
    );

    if (!isAccredited) {
      return res.status(400).json({
        verified: false,
        message: 'Domain is not recognized as an accredited university or national research lab (.ac.in, .edu, .res.in).'
      });
    }

    // Award verified badge and bonus credits in memory / database
    const normalizedInstEmail = institutionalEmail.toLowerCase().trim();

    let updatedUserDoc = null;
    if (isDbConnected()) {
      try {
        updatedUserDoc = await User.findOneAndUpdate(
          { email: normalizedEmail, isInstitutionalVerified: { $ne: true } },
          {
            $set: {
              isVerified: true,
              isInstitutionalVerified: true,
              institutionalEmail: normalizedInstEmail,
              updatedAt: new Date()
            },
            $inc: { creditsRemaining: 10 }
          },
          { new: true }
        );
      } catch (dbErr) {
        console.error('[Auth Verify Institutional Error - DB]:', dbErr);
        throw dbErr;
      }

      if (!updatedUserDoc) {
        return res.status(400).json({
          verified: true,
          error: 'Institutional affiliation has already been verified for this account.'
        });
      }

      memoryUsers.set(normalizedEmail, updatedUserDoc.toObject ? updatedUserDoc.toObject() : updatedUserDoc);
    } else {
      // In-Memory store synchronization with atomic idempotency enforcement
      const user = memoryUsers.get(normalizedEmail);
      if (!user) {
        return res.status(404).json({ error: 'User profile not found.' });
      }

      if (user.isInstitutionalVerified === true) {
        return res.status(400).json({
          verified: true,
          error: 'Institutional affiliation has already been verified for this account.'
        });
      }

      user.isVerified = true;
      user.isInstitutionalVerified = true;
      user.institutionalEmail = normalizedInstEmail;
      user.creditsRemaining = (user.creditsRemaining || 10) + 10;
      user.updatedAt = new Date();
    }

    res.json({
      verified: true,
      domain,
      bonusCreditsAwarded: 10,
      message: 'Institutional scholar affiliation verified successfully! +10 outreach credits awarded.'
    });
  } catch (err) {
    res.status(500).json({ error: 'Institutional verification failed: ' + err.message });
  }
});
```

---

## 4. Verification Method

### 4.1 Unit & Gateway Test Verification
Run the standard Express gateway test suite:
```powershell
cd c:\PROJECTS\ResearchIntern_Pro\server
npm test
```
*Expected*: All tests pass, including `Institutional Email Verification grants verified scholar status` (`tests/gateway.test.js:161-194`).

### 4.2 Adversarial Concurrency & Double-Spending Verification
Run Challenger 1's adversarial verification harness:
```powershell
node c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\challenger_m1_r2_1\verify_challenges.mjs
```
*Expected*:
1. Challenge 2.1 passes (Mongoose schema paths).
2. Challenge 2.2 passes (Initial verification awards +10 credits, advancing balance from 10 to 20).
3. Challenge 2.3 passes:
   - Second sequential call receives HTTP 400 Bad Request with `{ verified: true, error: "Institutional affiliation has already been verified for this account." }`.
   - 5 concurrent requests on a fresh user account award exactly one +10 grant; `creditsRemaining` is strictly 20 (not 60).

### 4.3 Opaque-Box E2E Regression Verification
Run the 4-tier E2E suite:
```powershell
node --test tests/e2e/tier1_features.test.mjs tests/e2e/tier2_boundaries.test.mjs tests/e2e/tier3_interactions.test.mjs tests/e2e/tier4_realworld.test.mjs
```
*Expected*: 42 / 42 tests pass with 0 errors.

### 4.4 High-Concurrency Auth Stress Test
Run the 120-burst registration and login challenge:
```powershell
node --test tests/adversarial/auth_concurrency_stress.test.mjs
```
*Expected*: 120 / 120 registrations and logins pass without event loop stalls or unhandled rejections.
