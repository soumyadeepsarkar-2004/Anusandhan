# Handoff Report — Institutional Verification Idempotency & Anti-Double-Spending Patch

**Agent**: `explorer_m1_r3_2` (Archetype: Explorer; Roles: Technical Exploration, Patch Design, Synthesis)  
**Working Directory**: `c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_m1_r3_2\`  
**Date**: 2026-11-03T22:38:00Z  
**Type**: Hard Handoff (Investigation & Patch Design Complete)  

---

## 1. Observation

1. **Empirical Defect Manifestation**:
   - Location: `server/routes/authRoutes.js:277-310`
   - In `challenger_m1_r2_1/verify_challenges.mjs:282-346`, repeated sequential calls to `POST /api/auth/verify-institutional-email` incremented credits by 10 on each invocation (10 -> 20 -> 30).
   - In concurrent burst testing, 5 concurrent verification requests against a fresh user account inflated credits to 60 (initial 10 + 5 × 10) instead of the expected 20 (single +10 bonus).
   - Verbatim log output from Challenger 1:
     ```text
     After second verification call: status=200, resp={"verified":true,"domain":"iisc.ac.in","bonusCreditsAwarded":10,"message":"Institutional scholar affiliation verified successfully! +10 outreach credits awarded."}, creditsRemaining=30
     After 5 concurrent verification calls on fresh user: creditsRemaining=60
     [DEFECT DETECTED] Race condition / replay double-spending: creditsRemaining is 60 instead of 20!
     ```

2. **Source Code Inspection**:
   - In `server/routes/authRoutes.js:247-272`: No check exists on whether the authenticated user account (`isInstitutionalVerified`) is already verified before evaluating domain rules.
   - In `server/routes/authRoutes.js:280-292`: The MongoDB query is `{ email: normalizedEmail }` rather than an atomic idempotency filter `{ email: normalizedEmail, isInstitutionalVerified: { $ne: true } }`.
   - In `server/routes/authRoutes.js:301-309`: The in-memory fallback block unconditionally executes `user.creditsRemaining = (user.creditsRemaining || 10) + 10;` without validating whether `user.isInstitutionalVerified` is already true.

---

## 2. Logic Chain

1. **Idempotency Invariant**:
   - Granting institutional verification and 10 bonus outreach credits is strictly a one-time onboarding action per student account.
   - Any re-verification attempt on an account that already has `isInstitutionalVerified === true` must be rejected with HTTP 400 Bad Request.

2. **Pre-Check Fast-Path**:
   - Checking `currentUser?.isInstitutionalVerified === true` before checking domains or acquiring write locks eliminates redundant processing and safely rejects sequential replay attacks.

3. **Atomic Document-Level Concurrency Protection**:
   - To prevent concurrent bursts from double-spending, MongoDB's update filter must include `isInstitutionalVerified: { $ne: true }`.
   - The first request to acquire the document lock matches the document, sets `isInstitutionalVerified: true`, and increments `creditsRemaining` by 10.
   - All other concurrent requests in the batch evaluate against `isInstitutionalVerified: true`, matching 0 documents. Mongoose returns `updatedUserDoc = null`.
   - When `updatedUserDoc` is null, the endpoint immediately returns HTTP 400 Bad Request:
     ```json
     {
       "verified": true,
       "error": "Institutional affiliation has already been verified for this account."
     }
     ```
   - Zero additional credits are awarded, eliminating credit inflation.

4. **In-Memory Store Synchronization & Parity**:
   - In test or simulation environments where MongoDB is offline (`!isDbConnected()`), the endpoint performs the exact same check on `memoryUsers.get(normalizedEmail)`.
   - If `user.isInstitutionalVerified === true`, it returns HTTP 400 Bad Request; otherwise, it applies the verification and increments credits.
   - When MongoDB is active, successful updates update `memoryUsers`, guaranteeing store consistency.

5. **Backwards Compatibility**:
   - First-time verifications (`gateway.test.js`, `tier1_features.test.mjs`, `tier3_interactions.test.mjs`, `tier4_realworld.test.mjs`) continue to return 200 OK with `verified: true`, `domain`, and `bonusCreditsAwarded: 10`.
   - Public domain rejection tests (`tier2_boundaries.test.mjs`) continue to return 400 with `verified: false` and `message: 'Domain is not recognized...'`.

---

## 3. Caveats

1. **Active Database vs In-Memory Fallback**: When MongoDB is running, document-level atomic locks are enforced by MongoDB engine. When running in pure in-memory mode, Node.js single-threaded event loop ensures sequential execution across synchronous operations; no async `await` is introduced inside the in-memory update path.
2. **Read-Only Scope**: This agent is read-only. The source code in `server/routes/authRoutes.js` has not been modified directly; exact drop-in patches have been designed and documented in `analysis.md` and below for the implementer agent (`worker`).

---

## 4. Conclusion

The double-spending race condition in `POST /api/auth/verify-institutional-email` is completely remediable with an exact drop-in patch in `server/routes/authRoutes.js:247-320`:
1. Pre-check guarding entry before domain checking:
   ```javascript
   if (currentUser?.isInstitutionalVerified === true) {
     return res.status(400).json({
       verified: true,
       error: 'Institutional affiliation has already been verified for this account.'
     });
   }
   ```
2. Atomic MongoDB conditional filter:
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
   if (!updatedUserDoc) {
     return res.status(400).json({
       verified: true,
       error: 'Institutional affiliation has already been verified for this account.'
     });
   }
   ```
3. In-memory synchronization in `memoryUsers` enforcing the identical idempotency check.

All details and exact line-by-line diffs are documented in:
`c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_m1_r3_2\analysis.md`.

---

## 5. Verification Method

To verify the patch once applied by the worker:

1. **Adversarial Verification Harness (Challenger 1)**:
   ```powershell
   node c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\challenger_m1_r2_1\verify_challenges.mjs
   ```
   *Expected*: Challenge 2.3 passes. Sequential replay returns HTTP 400. 5 concurrent requests yield strictly 20 credits (not 60).

2. **Gateway Unit Suite**:
   ```powershell
   cd c:\PROJECTS\ResearchIntern_Pro\server
   npm test
   ```
   *Expected*: All tests pass, including institutional verification.

3. **E2E Suite (Tiers 1–4)**:
   ```powershell
   node --test tests/e2e/tier1_features.test.mjs tests/e2e/tier2_boundaries.test.mjs tests/e2e/tier3_interactions.test.mjs tests/e2e/tier4_realworld.test.mjs
   ```
   *Expected*: 42 / 42 tests pass with 0 failures.
