## 2026-11-03T22:34:32Z
You are worker_m1_r3, the implementation worker for Milestone 1 Iteration 3 (Security Hardening & Authentication, Load Concurrency SLA, Idempotency, and Proxy Hardening).
Your Working Directory is: c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\worker_m1_r3\
(All your metadata, progress, and handoff files MUST be written in this directory).

## Mandatory Integrity Warning
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

## Context & Inputs
You are implementing the comprehensive fixes for all defects identified during the Iteration 2 Gate:
Read these essential files before starting:
1. Requirements: c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\ORIGINAL_REQUEST.md
2. Master plan: c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\PROJECT.md
3. Gate status: c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\orchestrator\GATE_STATUS.md
4. Explorer 1 report (Concurrency benchmark, socket pooling, health cache): c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_m1_r3_1\analysis.md
5. Explorer 2 report (Institutional verification idempotency & race condition): c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_m1_r3_2\analysis.md
6. Explorer 3 report (JWT fallback secret removal & proxy hardening): c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_m1_r3_3\analysis.md

## Scope & File Write Ownership
You own exclusive write permissions for:
1. `tests/load/concurrency_benchmark_1000.cjs`
2. `server/services/pythonBridge.js`
3. `server/server.js`
4. `server/routes/authRoutes.js`
5. `server/middleware/rateLimiter.js`
6. `TEST_READY.md`

## Concrete Tasks to Implement
Apply the exact drop-in patches authored by the 3 Explorers:

### Task 1: Concurrency SLA & Socket Pooling (from Explorer 1)
- In `tests/load/concurrency_benchmark_1000.cjs`:
  - Add `maxFreeSockets: 1000` to `http.Agent({ keepAlive: true, maxSockets: 1000, maxFreeSockets: 1000, keepAliveMsecs: 10000 })`.
  - In `executeRequestWithRetry`: increase retry budget to 8 retries with exponential jittered backoff: `100 * Math.pow(1.5, 8 - retries) + Math.random() * 200`.
- In `server/services/pythonBridge.js`:
  - Configure Axios client with `http.Agent({ keepAlive: true, maxSockets: 100, maxFreeSockets: 50, timeout: 5000 })` to pool connections to FastAPI.
- In `server/server.js`:
  - Cache `PythonBridge.checkHealth()` result in `/api/health` with a 3-second TTL so telemetry bursts do not churn outbound loopback sockets.

### Task 2: Institutional Verification Idempotency & Race Condition (from Explorer 2)
- In `server/routes/authRoutes.js`:
  - In `POST /api/auth/verify-institutional-email`:
    - Add pre-check: if `currentUser?.isInstitutionalVerified === true`, return 400 Bad Request: `{ verified: true, error: "Institutional affiliation has already been verified for this account." }`.
    - Use atomic conditional query in MongoDB: `User.findOneAndUpdate({ email: normalizedEmail, isInstitutionalVerified: { $ne: true } }, { $set: { isVerified: true, isInstitutionalVerified: true, institutionalEmail: normalizedInstEmail, updatedAt: new Date() }, $inc: { creditsRemaining: 10 } }, { new: true })`. If null, return 400 Bad Request.
    - In-memory store: enforce the identical check on `memoryUsers.get(normalizedEmail)`.

### Task 3: Secrets & Proxy Hardening (from Explorer 3)
- In `server/server.js`:
  - Startup check: if `!process.env.JWT_SECRET`, throw fatal Error in production mode (`throw new Error('FATAL: JWT_SECRET environment variable is required in production.')`); in dev/test mode, derive safe ephemeral secret: `process.env.JWT_SECRET = crypto.randomBytes(32).toString('hex')`.
  - Remove `'researchintern_pro_production_secret_key_2026'` completely. Use `process.env.JWT_SECRET`.
  - Default `trust proxy` to `false` unless `process.env.TRUST_PROXY` / `process.env.TRUSTED_PROXIES` is explicitly set.
- In `server/middleware/rateLimiter.js`:
  - Remove `'researchintern_pro_production_secret_key_2026'`. Use `process.env.JWT_SECRET`.

### Task 4: Documentation
- Update `TEST_READY.md` with verified test results and benchmark telemetry.

## Verification Requirements
You MUST run and verify that all test commands pass with clean exit codes:
1. `cd server && npm test`
2. `cd server && node --test --env-file=.env tests/adversarial_m1.test.js`
3. `cd server && node --test --env-file=.env tests/offline_sync.test.js`
4. `cd backend && uv run pytest`
5. `npm run build`
6. `node --test tests/e2e/tier1_features.test.mjs tests/e2e/tier2_boundaries.test.mjs tests/e2e/tier3_interactions.test.mjs tests/e2e/tier4_realworld.test.mjs`
7. `node tests/load/concurrency_benchmark_1000.cjs` (MUST PASS with error rate < 1.0% and exit code 0)
8. `node .agents/teamwork/challenger_m1_r2_1/verify_challenges.mjs` (verify Defect 1 and Defect 2 are defended)
