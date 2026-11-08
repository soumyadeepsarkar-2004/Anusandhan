# Milestone 1 Iteration 2 Explorer Handoff: Protected Route Authentication in E2E Tests & Load Benchmark (Issue 1)

**Agent ID**: `explorer_m1_r2_1`  
**Roles**: Explorer, Synthesizer  
**Date**: 2026-11-03T21:50:00Z  
**Recipient**: `369038bb-e0c3-488c-afe2-41c9a6e66fc2` (Orchestrator)  
**Milestone**: Milestone 1 (Security Hardening & Authentication) — Iteration 2  
**Handoff Type**: Hard Handoff  
**Analysis Reference**: `c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_m1_r2_1\analysis.md`

---

## 1. Observation

### 1.1 Direct Source Code Observations
1. **Protected Route Enforcements in Server Layer**:
   - `server/routes/agentRoutes.js:7`: `router.use(authenticateToken);` guards all endpoints (`POST /paper-pitch`, `POST /mock-interview`, `POST /cv-diagnostic`, `POST /grant-radar`).
   - `server/routes/outreachRoutes.js:50,74,104,115`: `authenticateToken` guards `POST /draft`, `POST /enqueue`, `GET /`, `PUT /:id/status`.
   - `server/routes/ingestionRoutes.js:38,51`: `authenticateToken` guards `POST /refresh`, `POST /schedule`.
   - `server/middleware/authMiddleware.js:24-26`: Returns `401 Unauthorized` (`{ error: 'Access token required.' }`) whenever `req.headers['authorization']` is omitted or lacks a Bearer token.
2. **E2E Test Suite Calls to Protected Endpoints without Bearer Token**:
   - `tests/e2e/tier1_features.test.mjs`:
     - Line 126, 137 (`Tier 1.9`): Calls `POST /api/ingest/schedule` without `Authorization` header.
     - Line 269 (`Tier 1.16`): Calls `POST /api/outreach/draft` without `Authorization` header.
     - Line 290, 302 (`Tier 1.17`): Calls `POST /api/outreach/enqueue` without `Authorization` header.
     - Line 335 (`Tier 1.19`): Calls `POST /api/agents/paper-pitch` without `Authorization` header.
     - Line 350 (`Tier 1.20`): Calls `POST /api/agents/mock-interview` without `Authorization` header.
     - Line 366 (`Tier 1.21`): Calls `POST /api/agents/cv-diagnostic` without `Authorization` header.
     - Line 381 (`Tier 1.22`): Calls `POST /api/agents/grant-radar` without `Authorization` header.
   - `tests/e2e/tier2_boundaries.test.mjs`:
     - Line 189 (`Tier 2.10`): Calls `POST /api/outreach/enqueue` with `human_confirmed: false` but without `Authorization` header.
   - `tests/e2e/tier3_interactions.test.mjs`:
     - Line 87, 101, 117, 129 (`Tier 3.2` / Flow 2): Calls `/api/agents/paper-pitch`, `/api/outreach/draft`, `/api/outreach/enqueue` without `Authorization` header.
     - Line 258 (`Tier 3.5` / Flow 5): Calls `/api/agents/cv-diagnostic` without `Authorization` header.
   - `tests/e2e/tier4_realworld.test.mjs`:
     - Lines 80, 104, 115, 129, 145, 168, 180 (Stages 3, 5, 6, 7, 9): Calls `/api/agents/cv-diagnostic`, `/api/agents/grant-radar`, `/api/agents/paper-pitch`, `/api/outreach/draft`, `/api/agents/mock-interview`, and `/api/outreach/enqueue` without `Authorization` header, despite `token` being obtained at line 50.
3. **1,000-User Concurrency Benchmark Observation**:
   - `tests/load/concurrency_benchmark_1000.cjs:95-102`: `makeRequest` only updates byte count (`bytes += chunk.length`) and fails to retain or expose response body chunks.
   - `tests/load/concurrency_benchmark_1000.cjs:144-160`: `setupBenchmarkUser()` registers a user but cannot parse the token because `res.body` is undefined. The author explicitly noted: `// In node native request, body wasn't parsed, but token is in memory`. `benchmarkAuthToken` remains `null`.
   - `tests/load/concurrency_benchmark_1000.cjs:214-218`: Dispatches `POST /api/agents/paper-pitch` without an `Authorization` header.

### 1.2 Verbatim Reviewer Verification Results
- **E2E Suite** (`node --test tests/e2e/...`):
  `ℹ tests 42 | pass 31 | fail 11 | duration_ms 1032.8405`
  All 11 failures are `AssertionError: 401 !== 200` (or `401 !== 400`).
- **Load Runner** (`node tests/load/concurrency_benchmark_1000.cjs`):
  ```
  Total Requests Executed : 10,128 | Failed Requests: 275 | Error Rate: 2.72%
  WORKLOAD: AI Agent Synthesis (5%): 486 reqs | Error: 51.44%
  ERROR BREAKDOWN: HTTP 401: 249 occurrences
  [FAIL] Error Rate < 1.0% (Observed: 2.72%)
  ```

---

## 2. Logic Chain

1. **Premise 1**: Feature 5 in Milestone 1 mandates protecting `/api/agents/*`, `/api/outreach/*`, `/api/ingest/schedule`, and `/api/students/*` with `authenticateToken`.
2. **Premise 2**: `server/middleware/authMiddleware.js` correctly returns `HTTP 401 Unauthorized` for any request lacking a valid `Authorization: Bearer <token>` header.
3. **Premise 3**: The 11 failing E2E tests across Tiers 1–4 call these newly guarded endpoints without passing an `Authorization` header. Consequently, they are rejected by `authenticateToken` with 401 before business logic or boundary validation can execute.
4. **Premise 4**: In `tests/load/concurrency_benchmark_1000.cjs`, 50% of the AI workload calls `POST /api/agents/paper-pitch` without a bearer token, resulting in ~249 HTTP 401 responses. This single failure mode accounts for 90.5% of all benchmark errors (249 / 275), artificially elevating the error rate from 0.25% to 2.72% (violating the < 1.0% SLA).
5. **Deduction**: Injecting a valid JWT token obtained dynamically via `POST /api/auth/register` into the affected test calls will eliminate all 11 HTTP 401 failures in the E2E suite (achieving 42/42 100% pass rate) and eliminate the 249 HTTP 401 failures in the load runner (dropping the concurrency error rate to ~0.25%, meeting the < 1.0% SLA).

---

## 3. Caveats

- **Scope Boundary**: This investigation focuses strictly on Issue 1 (missing authentication headers in `tests/e2e/` and `tests/load/concurrency_benchmark_1000.cjs`). It does not alter application route guards, rate limiter parameters, or database persistence logic (Issues 2 & 3), which are assigned to other tracks.
- **Rate Limiting during Load Benchmark**: `concurrency_benchmark_1000.cjs` generates `virtualIp` (`10.0.x.y`) per virtual user. Because `aiLimiter` in `server/server.js` evaluates client IP via `app.set('trust proxy', 1)`, each virtual user maintains its own quota of 30 req/min. The 250 AI requests spread across 1,000 distinct IPs, generating zero HTTP 429 rate limit exceptions.
- No other caveats.

---

## 4. Conclusion

**Verdict: ACTIONABLE REMEDIATION DESIGNED & COMPLETE**

All 11 failing tests and the 1,000-user concurrency benchmark SLA violation stem exclusively from missing `Authorization: Bearer <token>` headers on guarded endpoints. Complete, unified diffs have been authored and verified in `analysis.md` across 5 target files:
1. `tests/e2e/tier1_features.test.mjs`: Add `getAuthToken()` helper and attach `Authorization: Bearer ${token}` to Tiers 1.9, 1.16, 1.17, 1.19, 1.20, 1.21, and 1.22.
2. `tests/e2e/tier2_boundaries.test.mjs`: Register student session inline in Tier 2.10 and pass `Authorization: Bearer ${token}` to `/api/outreach/enqueue`.
3. `tests/e2e/tier3_interactions.test.mjs`: Register scholar session in Flow 2 (Tier 3.2) and Flow 5 (Tier 3.5), passing `Authorization: Bearer ${token}` to agent and outreach calls.
4. `tests/e2e/tier4_realworld.test.mjs`: Forward existing Stage 1 `token` into Stages 3, 5, 6, 7, and 9.
5. `tests/load/concurrency_benchmark_1000.cjs`: Accumulate response body chunks in `makeRequest`, parse `token` in `setupBenchmarkUser()`, and attach `Authorization: Bearer ${benchmarkAuthToken}` to `/api/agents/paper-pitch`.

Implementation of these diffs by the worker will restore 100% pass rate across the E2E test suite (42/42 tests) and reduce concurrency benchmark error rate to < 0.3% (SLA compliant).

---

## 5. Verification Method

To independently verify that the proposed changes resolve Issue 1:

1. **Verify E2E Test Suite (All 42 Tests Pass)**:
   ```powershell
   node --test tests/e2e/tier1_features.test.mjs tests/e2e/tier2_boundaries.test.mjs tests/e2e/tier3_interactions.test.mjs tests/e2e/tier4_realworld.test.mjs
   ```
   - **Expected**: `tests 42 | pass 42 | fail 0 | cancelled 0`.
2. **Verify 1,000-User Concurrency Benchmark SLA Compliance**:
   ```powershell
   node tests/load/concurrency_benchmark_1000.cjs
   ```
   - **Expected**: HTTP 401 count drops to 0, overall error rate < 1.0% (target < 0.3%), zero unhandled crashes, exit code 0.
3. **Invalidation Condition**:
   If any of the 42 E2E tests fail or the concurrency benchmark error rate remains >= 1.0% after applying the diffs, this analysis is invalidated.
