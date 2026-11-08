## 2026-11-03T21:31:33Z
Identity: You are teamwork_worker for Milestone 1 Iteration 2.
Working directory: c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\worker_m1_r2\
Original request path: c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\ORIGINAL_REQUEST.md
Master project path: c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\PROJECT.md
Gate status path: c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\orchestrator\GATE_STATUS.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Write Ownership:
- `server/server.js`
- `server/middleware/rateLimiter.js`
- `server/models/User.js`
- `server/routes/authRoutes.js`
- `tests/e2e/tier1_features.test.mjs`
- `tests/e2e/tier2_boundaries.test.mjs`
- `tests/e2e/tier3_interactions.test.mjs`
- `tests/e2e/tier4_realworld.test.mjs`
- `tests/load/concurrency_benchmark_1000.cjs`
- `TEST_READY.md`

Task Description:
Implement the verified fixes for Issues 1, 2, and 3 from the Iteration 2 Explorer reports:
1. Issue 1 (E2E Test Suites & Concurrency Load Benchmark Auth Synchronization):
   Read `c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_m1_r2_1\analysis.md`.
   Apply the verified diffs to:
   - `tests/e2e/tier1_features.test.mjs`
   - `tests/e2e/tier2_boundaries.test.mjs`
   - `tests/e2e/tier3_interactions.test.mjs`
   - `tests/e2e/tier4_realworld.test.mjs`
   - `tests/load/concurrency_benchmark_1000.cjs`
   Inject valid JWT Bearer tokens (via `POST /api/auth/register`) on requests to protected endpoints (`/api/agents/*`, `/api/outreach/*`, `/api/ingest/schedule`).
2. Issue 2 (Rate Limiter Middleware Execution Order & Direct Client IP Spoofing):
   Read `c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_m1_r2_2\analysis.md`.
   Apply the verified diffs to `server/server.js` and `server/middleware/rateLimiter.js`:
   - Mount lightweight JWT extraction middleware before route mounting so `req.user.id` is populated for per-user rate limiting (`usr:${req.user.id}`).
   - Secure `trust proxy` in `server.js` and harden socket `remoteAddress` extraction so direct clients cannot spoof IPs via forged `X-Forwarded-For`.
   - Verify that `cd server && node --test --env-file=.env tests/adversarial_m1.test.js` passes all 13 tests 100%.
3. Issue 3 (MongoDB Persistence for Institutional Email Verification):
   Read `c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_m1_r2_3\analysis.md`.
   Apply the verified diffs to `server/models/User.js` and `server/routes/authRoutes.js` to declare and persist `isInstitutionalVerified: true` and `institutionalEmail` to MongoDB when `isDbConnected()` is true.
4. Refresh `TEST_READY.md` with updated E2E pass rates (all 42 passing) and benchmark SLA results (< 1.0% error rate).

Verification Requirements:
Execute and verify all of the following commands:
1. `cd server && npm test` (all 24 passing)
2. `cd server && node --test --env-file=.env tests/adversarial_m1.test.js` (all 13 passing)
3. `cd server && node --test --env-file=.env tests/offline_sync.test.js` (all 2 passing)
4. `cd backend && uv run pytest` (all 14 passing)
5. `npm run build` (clean build)
6. `node --test tests/e2e/tier1_features.test.mjs tests/e2e/tier2_boundaries.test.mjs tests/e2e/tier3_interactions.test.mjs tests/e2e/tier4_realworld.test.mjs` (all 42 passing, 0 failing)
7. `node tests/load/concurrency_benchmark_1000.cjs` (error rate < 1.0%, zero unhandled server crashes)

Write your full handoff report to `c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\worker_m1_r2\handoff.md`.
Send a completion message to the orchestrator when finished.
