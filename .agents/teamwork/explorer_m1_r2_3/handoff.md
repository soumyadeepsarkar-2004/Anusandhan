# Milestone 1 Iteration 2 — Explorer Handoff Report: Issue 3 (MongoDB Persistence for Institutional Verification)

**Agent ID**: `explorer_m1_r2_3`  
**Roles**: Teamwork Explorer, Investigator, Synthesizer  
**Date**: 2026-11-03T21:26:00Z  
**Recipient**: `369038bb-e0c3-488c-afe2-41c9a6e66fc2` (Orchestrator)  
**Status**: Ready for Implementation  
**Analysis Reference**: `c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_m1_r2_3\analysis.md`

---

## 1. Observation

1. **Defect in Institutional Verification Endpoint** (`server/routes/authRoutes.js:270-277`):
   ```javascript
   // Award verified badge and bonus credits in memory / database
   const user = memoryUsers.get(req.user.email);
   if (user) {
     user.isVerified = true;
     user.institutionalEmail = institutionalEmail;
     user.creditsRemaining = (user.creditsRemaining || 10) + 10;
   }
   ```
   Direct observation:
   - The endpoint checks neither `isDbConnected()` nor executes any MongoDB query on the `User` model.
   - It sets only `isVerified = true` in memory, failing to set `isInstitutionalVerified = true`.
   - In `server/routes/authRoutes.js:94-102` (`router.post('/register')`), when `isDbConnected()` is true, `userDoc.save()` is executed but `memoryUsers` is NOT populated. As a result, if a user registered while MongoDB was connected, `memoryUsers.get(req.user.email)` in `verify-institutional-email` returns `undefined`, leaving both the database and memory un-updated.

2. **Schema Omission in User Model** (`server/models/User.js:56-81`):
   ```javascript
   creditsRemaining: { 
     type: Number, 
     default: 10 
   },
   isVerified: { 
     type: Boolean, 
     default: false 
   },
   linkedAccounts: {
     githubUrl: String,
     orcidId: String,
     googleScholarUrl: String,
     huggingFaceUrl: String
   },
   ```
   Direct observation:
   - Neither `isInstitutionalVerified` nor `institutionalEmail` is defined in `UserSchema`.
   - By default, Mongoose schemas enforce `strict: true`. Any fields passed in `$set` that are omitted from `UserSchema` are stripped by Mongoose before sending the update to MongoDB.

3. **Downstream Test Expectations in E2E Suites**:
   - In `tests/e2e/tier3_interactions.test.mjs:68-75`:
     ```javascript
     const profileRes = await testFetch(`${BASE_URL}/api/auth/me`, {
       headers: { 'Authorization': `Bearer ${token}` }
     });
     assert.strictEqual(profileRes.status, 200);
     const profileData = await profileRes.json();
     assert.strictEqual(profileData.user.isVerified, true, 'User must now be verified');
     assert.strictEqual(profileData.user.creditsRemaining, 20, 'Credits must increment to 20');
     ```
   - In `tests/e2e/tier4_realworld.test.mjs:71-77`:
     ```javascript
     const meRes = await testFetch(`${BASE_URL}/api/auth/me`, {
       headers: { 'Authorization': `Bearer ${token}` }
     });
     assert.strictEqual(meRes.status, 200);
     const meData = await meRes.json();
     assert.strictEqual(meData.user.isVerified, true, 'User profile must show verified status');
     assert.strictEqual(meData.user.creditsRemaining, 20, 'Credits must be updated to 20');
     ```
   - When MongoDB is active, `GET /api/auth/me` (`server/routes/authRoutes.js:194-197`) executes `User.findOne({ email })`. Because MongoDB was never updated by `verify-institutional-email`, `User.findOne` returns the unverified user, breaking these test assertions.

4. **Baseline Verification Commands**:
   - `cd server; npm test` → Passed (24/24 tests pass, duration: 5.05s).
   - `cd server; node --test --env-file=.env tests/offline_sync.test.js` → Passed (2/2 tests pass, duration: 105ms).
   - `cd backend; uv run pytest` → Passed (14/14 tests pass, duration: 1.12s).
   - `npm run build` → Passed (Exit code 0, built in 5.68s).

---

## 2. Logic Chain

1. **Step 1 (Schema Strictness)**:
   - From Observation 2, `User.js` defines `isVerified` but lacks `isInstitutionalVerified` and `institutionalEmail`.
   - Because Mongoose enforces `strict: true`, executing `User.findOneAndUpdate(..., { $set: { isInstitutionalVerified: true, institutionalEmail: ... } })` drops those undeclared fields.
   - Therefore, `UserSchema` must be augmented to declare `isInstitutionalVerified: { type: Boolean, default: false }` and `institutionalEmail: { type: String, lowercase: true, trim: true }`.

2. **Step 2 (Database Mutation in `verify-institutional-email`)**:
   - From Observation 1, lines 270-277 only mutate the local Map.
   - When `isDbConnected()` is true, the route must execute `User.findOneAndUpdate({ email: normalizedEmail }, { $set: { isVerified: true, isInstitutionalVerified: true, institutionalEmail: normalizedInstEmail, updatedAt: new Date() }, $inc: { creditsRemaining: 10 } }, { new: true })`.
   - This ensures persistent MongoDB storage across server restarts and clustered replicas.

3. **Step 3 (Dual-Store Memory Cache Synchronization)**:
   - When the MongoDB query succeeds and returns `updatedUserDoc`, updating `memoryUsers.set(normalizedEmail, updatedUserDoc.toObject ? updatedUserDoc.toObject() : updatedUserDoc)` guarantees that both stores are identical.
   - If `isDbConnected()` is false (as in local unit test runners where MongoDB is inactive), the endpoint falls back gracefully to updating `memoryUsers`, keeping `npm test` completely green.
   - In `POST /register`, adding `memoryUsers.set(normalizedEmail, savedUser.toObject ? savedUser.toObject() : savedUser)` after `await userDoc.save()` prevents cache misses if the database subsequently disconnects.

4. **Step 4 (Resolution of Downstream Inconsistencies)**:
   - From Observation 3, `GET /api/auth/me` fetches the user document via `User.findOne({ email })` when `isDbConnected()` is true.
   - With `User.findOneAndUpdate` persisting `isVerified: true`, `isInstitutionalVerified: true`, and `$inc: { creditsRemaining: 10 }`, `GET /api/auth/me` returns the updated attributes, satisfying `tier3_interactions.test.mjs` and `tier4_realworld.test.mjs`.

---

## 3. Caveats

- **No Caveats on Core Scope**: The required changes are localized entirely to `server/models/User.js` and `server/routes/authRoutes.js`.
- **E2E Test Auth Headers**: As noted in Reviewer 1's handoff, tests in `tests/e2e/` (Tiers 1–4) and `tests/load/concurrency_benchmark_1000.cjs` require bearer tokens to pass Milestone 1 Feature 5 guards. This handoff focuses specifically on Issue 3 (MongoDB persistence), and provides the foundation for those E2E tests to pass when tokens are attached.

---

## 4. Conclusion

Issue 3 is completely mapped with root causes and exact line numbers identified.
To remediate Issue 3:
1. Update `server/models/User.js` (lines 60-63) to declare `isInstitutionalVerified` and `institutionalEmail`.
2. Update `server/routes/authRoutes.js` (lines 88-102 and 270-277) to persist `isVerified: true`, `isInstitutionalVerified: true`, `institutionalEmail`, and increment `creditsRemaining` by 10 to MongoDB when `isDbConnected() === true`, synchronizing `memoryUsers` in all scenarios.

### Proposed Diff 1: `server/models/User.js`
```diff
--- a/server/models/User.js
+++ b/server/models/User.js
@@ -60,6 +60,15 @@ const UserSchema = new mongoose.Schema({
   isVerified: { 
     type: Boolean, 
     default: false 
+  },
+  isInstitutionalVerified: {
+    type: Boolean,
+    default: false
+  },
+  institutionalEmail: {
+    type: String,
+    lowercase: true,
+    trim: true
   },
   linkedAccounts: {
     githubUrl: String,
```

### Proposed Diff 2: `server/routes/authRoutes.js`
```diff
--- a/server/routes/authRoutes.js
+++ b/server/routes/authRoutes.js
@@ -88,6 +88,8 @@ router.post('/register', async (req, res) => {
       role: 'student',
       creditsRemaining: 10,
       isVerified: false,
+      isInstitutionalVerified: false,
+      institutionalEmail: null,
       linkedAccounts: {},
       createdAt: new Date()
     };
@@ -97,6 +99,7 @@ router.post('/register', async (req, res) => {
       try {
         const userDoc = new User(userData);
         savedUser = await userDoc.save();
+        memoryUsers.set(normalizedEmail, savedUser.toObject ? savedUser.toObject() : savedUser);
       } catch {
         userData.id = userId;
         memoryUsers.set(normalizedEmail, userData);
@@ -270,11 +273,38 @@ router.post('/verify-institutional-email', authenticateToken, async (req, res)
     // Award verified badge and bonus credits in memory / database
-    const user = memoryUsers.get(req.user.email);
-    if (user) {
-      user.isVerified = true;
-      user.institutionalEmail = institutionalEmail;
-      user.creditsRemaining = (user.creditsRemaining || 10) + 10;
-    }
+    const normalizedEmail = (req.user?.email || '').toLowerCase().trim();
+    const normalizedInstEmail = institutionalEmail.toLowerCase().trim();
+
+    let updatedUserDoc = null;
+    if (isDbConnected()) {
+      try {
+        updatedUserDoc = await User.findOneAndUpdate(
+          { email: normalizedEmail },
+          {
+            $set: {
+              isVerified: true,
+              isInstitutionalVerified: true,
+              institutionalEmail: normalizedInstEmail,
+              updatedAt: new Date()
+            },
+            $inc: { creditsRemaining: 10 }
+          },
+          { new: true }
+        );
+      } catch (dbErr) {
+        console.error('[Auth Verify Institutional Error - DB]:', dbErr);
+      }
+    }
+
+    if (updatedUserDoc) {
+      memoryUsers.set(normalizedEmail, updatedUserDoc.toObject ? updatedUserDoc.toObject() : updatedUserDoc);
+    } else {
+      const user = memoryUsers.get(normalizedEmail);
+      if (user) {
+        user.isVerified = true;
+        user.isInstitutionalVerified = true;
+        user.institutionalEmail = normalizedInstEmail;
+        user.creditsRemaining = (user.creditsRemaining || 10) + 10;
+        user.updatedAt = new Date();
+      }
+    }
```

---

## 5. Verification Method

1. **Verify No Regressions in Unit Test Suite**:
   ```powershell
   cd server
   npm test
   ```
   *Expected Result*: 24/24 passing tests, including `Institutional Email Verification grants verified scholar status`.

2. **Verify Offline Sync Tests**:
   ```powershell
   cd server
   node --test --env-file=.env tests/offline_sync.test.js
   ```
   *Expected Result*: 2/2 passing tests.

3. **Verify Python Microservice Tests**:
   ```powershell
   cd backend
   uv run pytest
   ```
   *Expected Result*: 14/14 passing tests.

4. **Verify Frontend Build**:
   ```powershell
   npm run build
   ```
   *Expected Result*: `tsc && vite build` exits with code 0.

5. **Verify MongoDB Persistence (When MongoDB is running)**:
   Register a test user, execute `POST /api/auth/verify-institutional-email`, and call `GET /api/auth/me`.
   *Expected Result*: `profile.user.isVerified === true`, `profile.user.isInstitutionalVerified === true`, `profile.user.creditsRemaining === 20`, and `profile.user.institutionalEmail === '<provided email>'`.
