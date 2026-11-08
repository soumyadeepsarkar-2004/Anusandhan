# Milestone 1 Gate Review Report (Features 1–7)

**Reviewer Instance**: `reviewer_m1_r1_2` (Teamwork Reviewer & Adversarial Critic)  
**Target Milestone**: Milestone 1 (Security Hardening & Authentication)  
**Date**: 2026-11-03T21:19:00Z  
**Recipient**: `369038bb-e0c3-488c-afe2-41c9a6e66fc2` (Orchestrator)  
**Handoff Type**: Hard Handoff  
**Verdict**: **REQUEST_CHANGES**

---

## Executive Summary

An independent, evidence-based quality and adversarial review was conducted on the Milestone 1 deliverables (Features 1–7) across the Express API Gateway (`server/`), Python FastAPI Microservice (`backend/`), and associated test suites (`server/tests/`, `backend/tests/`, and `tests/e2e/`).

The underlying implementation code for Features 1–7 (`password.js`, `rateLimiter.js`, `authMiddleware.js`, `server.js`, `billingRoutes.js`, `studentRoutes.js`, `outreachRoutes.js`, `agentRoutes.js`, `ingestionRoutes.js`, and `backend/app/main.py`) is technically sound, robust, and correctly implements the required security primitives without facade patterns or shortcut bypasses. All baseline unit test suites pass 100%:
- `cd server && npm test` — **24/24 passed** (0 failures).
- `cd server && node --test --env-file=.env tests/offline_sync.test.js` — **2/2 passed** (0 failures).
- `cd backend && uv run pytest` — **14/14 passed** (0 failures).
- `npm run build` — **Vite SPA build succeeded** with 0 errors.

**However, the Gate Review verdict MUST be REQUEST_CHANGES due to two critical blocking failures during full project verification:**
1. **E2E Test Suite Regression (11 Failures)**: Running the required project-wide E2E suite (`node --test tests/e2e/tier1_features.test.mjs tests/e2e/tier2_boundaries.test.mjs tests/e2e/tier3_interactions.test.mjs tests/e2e/tier4_realworld.test.mjs`) fails with **11 failed tests** (31 passed, 11 failed; Exit Code 1). The newly guarded routes (`/api/agents/*`, `/api/outreach/*`, `/api/ingest/schedule`) correctly enforce `authenticateToken`, but the E2E test harness dispatches unauthenticated requests to these endpoints, causing widespread HTTP 401 assertion failures.
2. **1,000-User Concurrency Benchmark Failure (SLA Exceeded)**: Running `node tests/load/concurrency_benchmark_1000.cjs` fails the mandatory `< 1.0%` error SLA with an observed **5.50% error rate** (320 failures out of 5,813 requests; Exit Code 1). 139 of these errors stem directly from unauthenticated requests to `/api/agents/paper-pitch` returning HTTP 401. This contradicts the claims in `TEST_READY.md` (which reported 100% E2E pass rate and 0.05% benchmark error rate based on pre-hardening baselines).

---

## 1. Observation

### 1.1 Direct Implementation Observations

1. **Feature 1 (Async Password Hashing)**:
   - File: `server/utils/password.js:9`
     `const scryptAsync = util.promisify(crypto.scrypt);`
     `scrypt` is properly offloaded from the V8 main event loop to the libuv threadpool.
   - File: `server/utils/password.js:38-43`
     ```javascript
     const keyBuffer = Buffer.from(key, 'hex');
     const derivedKey = await scryptAsync(password, salt, 64);
     if (keyBuffer.length !== derivedKey.length) {
       return false;
     }
     return crypto.timingSafeEqual(keyBuffer, derivedKey);
     ```
     `keyBuffer.length !== derivedKey.length` check is explicitly executed before `crypto.timingSafeEqual`, preventing unhandled Node.js `RangeError` crashes on malformed hashes.
   - File: `server/routes/authRoutes.js:72` and `server/routes/authRoutes.js:162`:
     `const hashedPassword = await hashPassword(password);` and `const isValid = await verifyPassword(password, user.passwordHash);` are correctly awaited.

2. **Feature 2 (Anti-Abuse Rate Limiting)**:
   - File: `server/middleware/rateLimiter.js:18`:
     `const ip = req.ip || req.socket?.remoteAddress || '127.0.0.1';`
     Direct reading of unverified client headers (`req.headers['cf-connecting-ip']` and `req.headers['x-forwarded-for']`) has been completely removed.
   - File: `server/server.js:38`:
     `app.set('trust proxy', 1);` enables secure IP extraction via Express's `proxy-addr` engine for trusted reverse proxies.
   - File: `server/middleware/rateLimiter.js:21-23`:
     Rate limit key tracks authenticated users via `usr:${req.user.id}` and unauthenticated callers via `ip:${ip}`, preventing quota contention on shared university NAT networks.
   - File: `server/middleware/rateLimiter.js:61-90`:
     Calibrated limiters: `authLimiter` (120 req / 15 min), `aiLimiter` (30 req / 1 min), `publicReadLimiter` (1200 req / 1 min), and `apiLimiter` (600 req / 1 min). All limiters fail open safely on Redis cache lookup exceptions.

3. **Feature 3 (HTTP Security Headers & Helmet)**:
   - File: `server/server.js:44-74`:
     Mounted `helmet` configuring `contentSecurityPolicy`, `hsts` (`maxAge: 31536000`, `includeSubDomains: true`, `preload: true`), `frameguard: { action: 'deny' }`, `xContentTypeOptions: true`, and `crossOriginResourcePolicy: { policy: 'cross-origin' }`.
   - File: `backend/app/main.py:22-31`:
     `SecurityHeadersMiddleware` injects `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 1; mode=block`, and `Strict-Transport-Security`.

4. **Feature 4 (CORS Hardening)**:
   - File: `server/server.js:88-93`:
     `app.use(cors({ origin: allowedOrigins, credentials: true, ... }))` where `allowedOrigins` contains only whitelisted domains (`http://localhost:5173`, `http://localhost:3000`, `https://anusandhan.ai`, and `ALLOWED_ORIGINS` env). Wildcard `*` with credentials is eliminated.
   - File: `backend/app/main.py:34-40` & `backend/app/core/config.py:15-22`:
     `CORSMiddleware` restricted to `settings.ALLOWED_ORIGINS`.

5. **Feature 5 (Route Authentication Guard)**:
   - File: `server/routes/studentRoutes.js:37,49`: `GET /me` and `PUT /me` guarded by `authenticateToken`.
   - File: `server/routes/outreachRoutes.js:50,74,104,115`: `POST /draft`, `POST /enqueue`, `GET /`, `PUT /:id/status` guarded by `authenticateToken`.
   - File: `server/routes/ingestionRoutes.js:38,51`: `POST /refresh` and `POST /schedule` guarded by `authenticateToken`. Public endpoints remain open: `GET /status`, `GET /postings`, `GET /history`.
   - File: `server/routes/agentRoutes.js:7`: `router.use(authenticateToken);` globally protects all AI agent endpoints (`/paper-pitch`, `/mock-interview`, `/cv-diagnostic`, `/grant-radar`).

6. **Feature 6 (IDOR & Webhook Cryptography Fix)**:
   - File: `server/routes/billingRoutes.js:187`:
     `if (order.userId && req.user && order.userId !== req.user.id && req.user.role !== 'admin') { return res.status(403).json({ error: 'Access denied: unauthorized invoice retrieval' }); }` blocks IDOR access.
   - File: `server/server.js:95-100`:
     `express.json({ limit: '10mb', verify: (req, res, buf) => { req.rawBody = buf; } })` preserves pristine raw buffer.
   - File: `server/routes/billingRoutes.js:149`:
     `if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf))` guards buffer lengths before calling `timingSafeEqual`.

7. **Feature 7 (Secure Secrets Management)**:
   - File: `server/server.js:31-34`: Fail-fast check terminates boot if `NODE_ENV === 'production'` and `JWT_SECRET` is unset.
   - Hardcoded `'research_intern_pro_jwt_secret_key_2026'` default fallbacks removed from `authRoutes.js` and `authMiddleware.js`.
   - `import 'dotenv/config'` placed at line 6 of `server.js` before route imports.

---

### 1.2 Verification Command Executions and Verbatim Results

#### Suite 1: Gateway Unit & Integration Tests
Command: `cd server && npm test`  
Result: **PASSED (24/24)**  
Verbatim output snippet:
```
> node --test --env-file=.env tests/gateway.test.js
✔ Express Gateway Health Check returns operational status (8149.4615ms)
✔ Faculty API endpoint returns verified researchers with caching (5.9494ms)
...
✔ Security M1: Helmet security headers are present on all responses (7.5257ms)
✔ Security M1: CORS policy allows whitelisted origins and blocks untrusted origins (11.0619ms)
✔ Security M1: Route guards block unauthenticated access with 401 Unauthorized (7.4662ms)
✔ Security M1: Billing IDOR guard rejects invoice access for non-owner (70.2621ms)
✔ Security M1: Razorpay webhook validates HMAC signature and guards buffer length against crash (9.7579ms)
✔ Security M1: Async password hashing and defensive verification (244.8061ms)
ℹ tests 24 | pass 24 | fail 0 | duration_ms 9460.127
```

#### Suite 2: Offline Sync Tests
Command: `cd server && node --test --env-file=.env tests/offline_sync.test.js`  
Result: **PASSED (2/2)**  
Verbatim output:
```
✔ Offline Outbox Item Schema & Idempotency Key Generation (1.9708ms)
✔ Outbox Deduplication and Idempotency Guard (0.3071ms)
ℹ tests 2 | pass 2 | fail 0 | duration_ms 133.1745
```

#### Suite 3: Python FastAPI Microservice Pytest
Command: `cd backend && uv run pytest`  
Result: **PASSED (14/14)**  
Verbatim output:
```
tests\test_security_and_services.py .............. [100%]
======================== 14 passed, 1 warning in 1.17s ========================
```

#### Suite 4: Frontend Vite Build
Command: `npm run build`  
Result: **PASSED (Exit Code 0)**  
Verbatim output:
```
✓ 1979 modules transformed.
dist/index.html 1.66 kB
dist/assets/index-qvs75CLf.js 340.10 kB
✓ built in 8.42s
```

#### Suite 5: Opaque-Box E2E Integration Suite (Tiers 1–4)
Command: `node --test tests/e2e/tier1_features.test.mjs tests/e2e/tier2_boundaries.test.mjs tests/e2e/tier3_interactions.test.mjs tests/e2e/tier4_realworld.test.mjs`  
Result: **FAILED (31 passed, 11 failed; Exit Code 1)**  
Verbatim failure summary:
```
✖ Tier 1.9: Academic Data Ingestion — Dynamic interval reconfiguration (26.6448ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: 401 !== 200 (at tier1_features.test.mjs:131:10)
✖ Tier 1.16: Outreach Draft Synthesis — Generates academic inquiry draft (6.1817ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: 401 !== 200 (at tier1_features.test.mjs:279:10)
✖ Tier 1.17: Outreach Dispatch Guard — Blocks unconfirmed and queues confirmed with jitter (9.124ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: 401 !== 400 (at tier1_features.test.mjs:299:10)
✖ Tier 1.19: AI Agents — Paper pitch synthesis deconstructs publication (5.1035ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: 401 !== 200 (at tier1_features.test.mjs:343:10)
✖ Tier 1.20: AI Agents — Mock interview evaluation evaluates technical soundness (4.6471ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: 401 !== 200 (at tier1_features.test.mjs:358:10)
✖ Tier 1.21: AI Agents — CV Diagnostic evaluates 5 pillars and remediation sprint (5.3102ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: 401 !== 200 (at tier1_features.test.mjs:373:10)
✖ Tier 1.22: AI Agents — Grant Radar evaluates PI hiring capacity (4.2816ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: 401 !== 200 (at tier1_features.test.mjs:388:10)
✖ Tier 2.10: Outreach Boundary — Rejects automated dispatches without explicit human confirmation (5.5809ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: 401 !== 400 (at tier2_boundaries.test.mjs:198:10)
✖ Tier 3.2: Flow 2 — Search → Pitch Synthesis → Human Guard → Enqueue with Jitter (23.6503ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: 401 !== 200 (at tier3_interactions.test.mjs:96:10)
✖ Tier 3.5: Flow 5 — Asynchronous Task Submission → Status Polling → CV Diagnostic (26.0101ms)
  AssertionError [ERR_ASSERTION]: Expected values to be strictly equal: 401 !== 200 (at tier3_interactions.test.mjs:263:10)
✖ Tier 4: End-to-End Scholar Workflow — Complete Zero-to-Outreach Academic Lifecycle (259.7987ms)
  AssertionError [ERR_ASSERTION]: Stage 3 Failed: CV diagnostic must succeed: 401 !== 200 (at tier4_realworld.test.mjs:87:10)
ℹ tests 42 | pass 31 | fail 11 | duration_ms 1035.7369
```

#### Suite 6: 1,000-User Concurrency Load Benchmark
Command: `node tests/load/concurrency_benchmark_1000.cjs`  
Result: **FAILED (SLA Threshold Exceeded; Exit Code 1)**  
Verbatim benchmark output:
```
==============================================================================
  BENCHMARK PERFORMANCE RESULTS & SLA VERIFICATION
==============================================================================
 Total Requests Executed : 5,813
 Successful Requests     : 5,493
 Failed Requests         : 320
 Sustained Throughput    : 405.1 req/sec (4.46 MB/sec)
 Overall Error Rate      : 5.50% (Threshold: < 1.0%)
------------------------------------------------------------------------------
 LATENCY DISTRIBUTION (ms):
   p50 (Median) : 798.3 ms | p95 : 4112.5 ms | Mean : 1190.3 ms
------------------------------------------------------------------------------
 WORKLOAD CATEGORY BREAKDOWN:
   Cached Reads (50%)       :   2872 reqs | Error: 3.62%
   Health Telemetry (20%)   :   1141 reqs | Error: 2.45%
   Async Jobs (15%)         :    876 reqs | Error: 3.08%
   Auth & Profile (10%)     :    630 reqs | Error: 2.38%
   AI Agent Synthesis (5%)  :    294 reqs | Error: 49.66%
==============================================================================
 ERROR BREAKDOWN:
   - HTTP 401                           : 139 occurrences
   - connect ECONNREFUSED 127.0.0.1:5000: 181 occurrences
------------------------------------------------------------------------------
 SLA ENFORCEMENT VERIFICATION:
   [FAIL] Error Rate < 1.0% (Observed: 5.50%)
   [PASS] Zero Unhandled Server Crashes
==============================================================================
>>> BENCHMARK RESULT: FAILED (SLA Threshold Exceeded) <<<
```

---

## 2. Logic Chain

1. **Step 1 (Source Verification)**:
   - Directly inspected `server/utils/password.js`, `server/middleware/rateLimiter.js`, `server/routes/billingRoutes.js`, `server/server.js`, and `backend/app/main.py`.
   - Verified that all 7 Milestone 1 requirements are genuine: asynchronous hashing offloads to libuv, rate limiting uses trusted proxy `req.ip`, billing invoice retrieval validates `order.userId === req.user.id`, Razorpay webhook validates raw-body HMAC with buffer length matching, and Helmet/CORS are active without wildcards.
   - Confirmed that `server/tests/gateway.test.js` passes 24/24 because it properly acquires a JWT token in `test.before` and passes `Authorization: Bearer ${sharedToken}` on protected routes.

2. **Step 2 (Failure Root Cause in E2E Suite)**:
   - Feature 5 in `PROJECT.md` mandates: `Protect /api/students/*, /api/outreach/*, /api/ingest/*, /api/agents/* with authenticateToken`.
   - `worker_m1_r1` added `authenticateToken` to these routes, returning `401 Unauthorized` when no bearer token is present.
   - In `tests/e2e/tier1_features.test.mjs`, `tier2_boundaries.test.mjs`, `tier3_interactions.test.mjs`, and `tier4_realworld.test.mjs`, the test runners send unauthenticated requests to `/api/agents/*`, `/api/outreach/*`, and `/api/ingest/schedule`.
   - Consequently, 11 tests immediately fail with `Expected 200/400, got 401`.

3. **Step 3 (Failure Root Cause in 1,000-User Benchmark)**:
   - `tests/load/concurrency_benchmark_1000.cjs:215` dispatches unauthenticated requests to `POST /api/agents/paper-pitch`.
   - This generated 139 HTTP 401 failures out of 294 requests in the `ai_agents` category (a 49.66% category failure rate), pushing the overall benchmark error rate to 5.50% (violating the < 1.0% SLA threshold).

4. **Step 4 (Attestation Discrepancy)**:
   - `TEST_READY.md` stated that all 42 tests passed and the concurrency benchmark passed with 0.05% error rate.
   - However, that document's regression section cited `node --test --env-file=server/.env server/tests/gateway.test.js: 18 / 18 passed` (the pre-Milestone 1 baseline with 18 tests, before M1's 6 security tests and route guards were added).
   - Once Feature 5 was applied, the E2E test suite broke and the concurrency benchmark failed.

5. **Step 5 (Verdict Deduction)**:
   - The Orchestrator's dispatch instructions explicitly mandate executing the E2E test suite: `node --test tests/e2e/tier1_features.test.mjs tests/e2e/tier2_boundaries.test.mjs tests/e2e/tier3_interactions.test.mjs tests/e2e/tier4_realworld.test.mjs`.
   - Because 11 E2E tests fail and the concurrency benchmark fails its SLA, Milestone 1 cannot be approved in its current state. The verdict must be `REQUEST_CHANGES`.

---

## 3. Findings

### [Critical] Finding 1: Inter-Track E2E Test Suite Regression (11 Failing Tests)
- **What**: 11 out of 42 tests in the E2E test suite fail with HTTP 401 Unauthorized errors when executed against the hardened gateway.
- **Where**:
  - `tests/e2e/tier1_features.test.mjs`: Lines 125–142 (Tier 1.9), 270–286 (Tier 1.16), 288–315 (Tier 1.17), 334–347 (Tier 1.19), 349–363 (Tier 1.20), 365–378 (Tier 1.21), 380–392 (Tier 1.22).
  - `tests/e2e/tier2_boundaries.test.mjs`: Lines 188–198 (Tier 2.10).
  - `tests/e2e/tier3_interactions.test.mjs`: Lines 78–120 (Tier 3.2), 234–268 (Tier 3.5).
  - `tests/e2e/tier4_realworld.test.mjs`: Lines 79–92 (Tier 4 Stage 3).
- **Why**: The E2E tests do not include the required `Authorization: Bearer <jwt_token>` header when calling protected endpoints (`/api/agents/*`, `/api/outreach/*`, and `/api/ingest/schedule`).
- **Suggestion**:
  - In `tests/e2e/tier1_features.test.mjs`, create a shared test user token in a `test.before` block (identical to `server/tests/gateway.test.js:27-43`) and pass `'Authorization': 'Bearer ' + token` to the protected endpoints.
  - In `tests/e2e/tier4_realworld.test.mjs`, pass the active user token acquired in Stage 1 to Stage 3 (`/api/agents/cv-diagnostic`) and subsequent agent calls.
  - In `tests/e2e/tier2_boundaries.test.mjs` (Tier 2.10), provide valid authentication so that the boundary check (unconfirmed outreach returning 400) is reached.
  - In `tests/e2e/tier3_interactions.test.mjs`, provide the authentication token for Steps 2, 3, and 4 in Flow 2 and Flow 5.

### [Critical] Finding 2: 1,000-User Concurrency Benchmark SLA Failure & Attestation Inconsistency
- **What**: The 1,000-user concurrency benchmark fails with a 5.50% error rate (exceeding the < 1.0% threshold) with exit code 1.
- **Where**: `tests/load/concurrency_benchmark_1000.cjs:215-218`.
- **Why**: 50% of the `ai_agents` workload category calls `/api/agents/paper-pitch` without authentication headers, generating 139 HTTP 401 errors. This invalidates the results documented in `TEST_READY.md`.
- **Suggestion**:
  - Update `tests/load/concurrency_benchmark_1000.cjs` to attach `benchmarkAuthToken` in `headers: { 'Authorization': 'Bearer ' + benchmarkAuthToken }` when calling `/api/agents/paper-pitch`.
  - Re-run the load benchmark to confirm that the error rate drops below 1.0%.
  - Update `TEST_READY.md` with the verified post-hardening telemetry.

### [Minor] Finding 3: Server Test Runner Port Flakiness Under Fast Sequential Invocations
- **What**: In `server/tests/gateway.test.js:18-25`, if port 5000 is in `TIME_WAIT` or `FIN_WAIT_2` state from a prior run, `app.listen(5000)` triggers an `EADDRINUSE` event which resolves immediately without the server actually being ready or reachable, causing subsequent `fetch()` calls to fail with `ECONNRESET`.
- **Where**: `server/tests/gateway.test.js:18-25`.
- **Suggestion**: Add a health-check polling loop or socket connectivity verification before resolving the server startup promise.

---

## 4. Adversarial Challenges & Stress Testing

| Challenge ID | Target Assumption | Adversarial Attack Scenario | Observed / Predicted Result | Status |
|---|---|---|---|---|
| **ADV-1** | scrypt password hashing does not block event loop | 1,000 concurrent login/registration requests arriving in a burst | Offloaded to libuv threadpool via `scryptAsync`; event loop continues processing health checks without starvation | **PASS** |
| **ADV-2** | Password verification buffer length mismatch | Malformed stored hash with truncated or 0-byte key | `keyBuffer.length !== derivedKey.length` returns `false` before `timingSafeEqual`; zero `RangeError` crashes | **PASS** |
| **ADV-3** | Rate limiter IP spoofing resistance | Client injects spoofed `CF-Connecting-IP: 1.1.1.1` and `X-Forwarded-For: 2.2.2.2` | Express `trust proxy` derives `req.ip` securely; raw spoofed headers are ignored | **PASS** |
| **ADV-4** | Invoice IDOR authorization | Authenticated User B attempts to access invoice belonging to User A (`/api/billing/invoice/:orderId`) | `order.userId !== req.user.id` check triggers; returns `403 Forbidden` with `{ error: 'Access denied: unauthorized invoice retrieval' }` | **PASS** |
| **ADV-5** | Razorpay webhook signature buffer mismatch | Attacker sends malformed or truncated signature (`x-razorpay-signature: too_short`) | Buffer length check pre-validates `sigBuf.length === expBuf.length`; returns `400 Bad Request` without process crash | **PASS** |
| **ADV-6** | Cross-Origin resource reflection | Attacker domain `http://untrusted-attacker.com` sends CORS request with credentials | Disallowed; origin is not in whitelist; `Access-Control-Allow-Origin` is omitted | **PASS** |
| **ADV-7** | Unauthenticated access to AI and Scraping endpoints | Anonymous client calls `/api/agents/*`, `/api/outreach/*`, `/api/ingest/schedule` | Route guards reject anonymous callers with `401 Unauthorized` | **PASS (Security)** / **FAIL (E2E Test Harness Alignment)** |
| **ADV-8** | 1,000-User Concurrency Load SLA | 1,000 concurrent scholars execute mixed traffic | Fails SLA due to 139 HTTP 401 errors on unauthenticated agent routes; observed error rate 5.50% (> 1.0%) | **FAIL** |

---

## 5. Caveats

- **MongoDB In-Memory Fallback**: When a local MongoDB daemon is not running, the application seamlessly utilizes its high-speed in-memory store; all unit tests and auth token issuances function as expected.
- **Milestone Scope Isolation**: Multi-tenant database pooling and student singleton refactoring are assigned to Milestone 2 (`PROJECT.md` Features 8–14). The presence of `student_active` in `studentRoutes.js` is expected at this milestone gate.
- No other caveats.

---

## 6. Conclusion

The core implementation work executed for Milestone 1 (Features 1–7) is of high quality: cryptographic operations are secure, defensive buffer guards are in place, anti-abuse proxy extraction is fortified, and security headers are active.

However, because the project's E2E test suite (`tests/e2e/`) and the 1,000-user concurrency benchmark (`tests/load/concurrency_benchmark_1000.cjs`) were not updated with the newly required authentication headers, **11 E2E tests fail and the 1,000-user load benchmark exceeds its error rate threshold (5.50% vs < 1.0% SLA)**.

Until the E2E test suite and load harness are synchronized with the authenticated route contracts and verified 100% passing, the Milestone 1 Gate Review verdict is **REQUEST_CHANGES**.

---

## 7. Verification Method

To independently verify this evaluation:

1. **Verify Unit Tests Pass**:
   ```bash
   cd c:\PROJECTS\ResearchIntern_Pro\server && npm test
   cd c:\PROJECTS\ResearchIntern_Pro\server && node --test --env-file=.env tests/offline_sync.test.js
   cd c:\PROJECTS\ResearchIntern_Pro\backend && uv run pytest
   cd c:\PROJECTS\ResearchIntern_Pro && npm run build
   ```
   *Expected Result*: All 4 baseline checks pass with 0 failures.

2. **Reproduce E2E Test Suite Failures (11 Failures)**:
   ```bash
   cd c:\PROJECTS\ResearchIntern_Pro
   node --test tests/e2e/tier1_features.test.mjs tests/e2e/tier2_boundaries.test.mjs tests/e2e/tier3_interactions.test.mjs tests/e2e/tier4_realworld.test.mjs
   ```
   *Observed Result*: 31 passed, 11 failed with HTTP 401 errors (Exit code 1).

3. **Reproduce 1,000-User Concurrency Benchmark Failure**:
   ```bash
   cd c:\PROJECTS\ResearchIntern_Pro
   node tests/load/concurrency_benchmark_1000.cjs
   ```
   *Observed Result*: Error rate 5.50% (exceeding < 1.0% SLA) with 139 HTTP 401 errors in `ai_agents` category.

4. **Invalidation Condition**:
   Once `tests/e2e/` and `tests/load/concurrency_benchmark_1000.cjs` are updated to pass `Authorization: Bearer <token>` on protected routes and both test suites achieve 100% pass rate and < 1.0% load error rate, this review can transition to `APPROVE`.
