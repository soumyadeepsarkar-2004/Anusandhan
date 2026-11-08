# Handoff Report — Explorer Survey 3 (Security, Deployment, Documentation, Concurrency)

**Author:** teamwork_explorer instance 3  
**Target:** Orchestrator (`369038bb-e0c3-488c-afe2-41c9a6e66fc2`)  
**Date:** 2026-11-03T20:35:00Z  
**Type:** Hard Handoff (Survey Phase Complete)  
**Deliverable File:** `c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_survey_3\survey_report.md`

---

## 1. Observation

Direct observations verified through local filesystem tools and command executions:

1. **Root Frontend Build Baseline:**
   - Command: `npm run build`
   - Result: Exit code 0 in 6.12s.
   - Verbatim output:
     ```
     > anusandhan@1.0.0 build
     > tsc && vite build
     vite v5.4.21 building for production...
     ✓ 1979 modules transformed.
     dist/index.html                          1.66 kB │ gzip:  0.79 kB
     dist/assets/index-qvs75CLf.js          340.10 kB │ gzip: 86.09 kB
     ✓ built in 6.12s
     ```

2. **Express Gateway Test Suite:**
   - Command: `cd server && npm test`
   - Result: Exit code 0 in 455ms.
   - Verbatim output: `ℹ tests 18, ℹ pass 18, ℹ fail 0, ℹ duration_ms 454.9615`.

3. **Offline Sync Test Suite:**
   - Command: `cd server && node --test --env-file=.env tests/offline_sync.test.js`
   - Result: Exit code 0 in 94ms.
   - Verbatim output: `✔ Offline Outbox Item Schema & Idempotency Key Generation`, `✔ Outbox Deduplication and Idempotency Guard`, `ℹ pass 2, ℹ fail 0`.

4. **Python FastAPI Test Suite:**
   - Command: `cd backend && uv run pytest`
   - Result: Exit code 0 in 0.71s.
   - Verbatim output: `14 passed, 1 warning in 0.71s`.

5. **Security Vulnerabilities directly observed in code:**
   - `server/middleware/rateLimiter.js:14-17`:
     ```javascript
     const ip = req.headers['cf-connecting-ip'] || 
                req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                req.socket?.remoteAddress || 
                'anonymous';
     ```
     Unvalidated header trusting permits arbitrary rate limit bypass. Exploit is already active in `scratch/benchmark_concurrency.cjs:29`.
   - `backend/app/main.py:34-40`:
     ```python
     app.add_middleware(
         CORSMiddleware,
         allow_origins=["*"],
         allow_credentials=True,
         allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["*"],
     )
     ```
     `allow_origins=["*"]` with `allow_credentials=True` is an invalid/insecure Starlette CORS configuration.
   - `server/routes/studentRoutes.js:36,48`: No `authenticateToken` middleware; all requests read/write global object `memoryStudent` with `id: 'student_active'`.
   - `server/routes/billingRoutes.js:170-176`: Invoice retrieval `GET /api/billing/invoice/:orderId` has no user ownership check (`order.userId === req.user.id`), enabling IDOR.
   - `server/utils/password.js:9,19`: Uses `crypto.scryptSync(password, salt, 64)`, blocking Node's main event loop thread synchronously.
   - `server/.env:5`: `JWT_SECRET=researchintern_pro_production_secret_key_2026` is committed to git. Fallback strings in `authRoutes.js:9` and `authMiddleware.js:3` default to `'research_intern_pro_jwt_secret_key_2026'`.
   - `server/db/supabaseClient.js:24`: `ssl: { rejectUnauthorized: false }` disables TLS certificate verification.
   - `server/server.js:36`: Wide open CORS `app.use(cors({ origin: '*' }))` without Helmet security headers.
   - Root `npm audit`: 5 vulnerabilities (4 moderate, 1 high: esbuild <=0.24.2, glob, minimatch).

6. **Deployment Infrastructure Observations:**
   - Root `Dockerfile`: Multi-stage build (Node 20 Alpine -> Nginx Alpine Slim) configured with gzip, basic security headers, and SPA routing.
   - `server/Dockerfile`: Node 20 Alpine, runs as `USER node`, health check on `/api/health`.
   - `backend/Dockerfile`: Python 3.12-slim, runs as `USER scholar`, health check on `/`, 2 Uvicorn workers.
   - `docker-compose.prod.yml`: Missing `postgres` and `mongodb` service blocks; `gateway` sets `REDIS_URL=redis://redis-cache:6379` but `redisCache.js` only checks `UPSTASH_REDIS_REST_URL`; services lack `healthcheck` declarations and `condition: service_healthy`.
   - Kubernetes: 0 `.yaml` files in repository (no `k8s/` directory).
   - Environment validation: 0 pre-flight validation scripts exist.

7. **Documentation Observations:**
   - 0 markdown documentation files outside `node_modules` (no root `README.md`, no `docs/` folder).
   - FastAPI auto-generates Swagger at `/docs` and ReDoc at `/redoc`.

8. **Concurrency & Load Verification Observations:**
   - `tests/load/k6_2000_users.js` exists, but running `k6 version` exits with code 1 (`k6 : The term 'k6' is not recognized`).
   - `scratch/benchmark_concurrency.cjs` exists (pure Node.js http.Agent script), currently set for only 50 concurrency and 500 requests against unauthenticated endpoints.

---

## 2. Logic Chain

1. **Baseline Stability (Observation 1–4):**
   - Because all existing test suites pass (`npm run build`, Express tests, offline sync tests, Python pytest), the current codebase has functional integrity and a clean baseline to harden.

2. **Security Vulnerabilities (Observation 5):**
   - Because `rateLimiter.js` trusts `cf-connecting-ip` from raw headers without checking a trusted proxy whitelist, any client can generate a random IP on every request and completely evade rate limiting.
   - Because `crypto.scryptSync` is synchronous and takes ~50ms of CPU time, 50 concurrent login/registration requests will lock the Node event loop for ~2.5 seconds, stalling all concurrent HTTP requests.
   - Because `studentRoutes.js` uses a single shared object `student_active` without authentication, concurrent users will overwrite each other's state, violating data isolation.
   - Because CORS is wildcarded with credentials on FastAPI and Express, malicious third-party origins can make unauthorized requests.
   - Therefore, resolving these vulnerabilities is required before production deployment.

3. **Deployment Deficiencies (Observation 6):**
   - Because `docker-compose.prod.yml` omits PostgreSQL and MongoDB services, attempting to run `docker compose up` in an isolated environment will cause the backend services to fail or fall back silently to in-memory mocks.
   - Because `redisCache.js` only reads `UPSTASH_REDIS_REST_URL`, the `redis:7-alpine` container defined in docker-compose is never connected, defeating cache acceleration under Docker.
   - Because Kubernetes manifests and pre-flight validation scripts are absent, production orchestrators cannot deploy or validate cluster health.

4. **Documentation Void (Observation 7):**
   - Because no docs exist, external scholars, university partners, and developers have no onboarding instructions or API reference. An integrated or standalone documentation framework is necessary to fulfill Acceptance Criteria R3.

5. **Load Test Execution (Observation 8):**
   - Because `k6` binary is not installed on the Windows environment, verifying 1,000 active concurrent users requires an in-process, pure Node.js asynchronous load test harness using native `http.Agent` with `keepAlive: true, maxSockets: 1000`.

---

## 3. Caveats

1. **Live Cloud Services:** Remote Upstash Redis, remote Supabase PostgreSQL, and live Google Gemini API keys were not invoked with live production credentials; tests ran against local emulations, mocks, and in-memory fallbacks.
2. **Container Runtime:** `docker compose` was surveyed statically via compose and Dockerfile files rather than spinning up live Docker containers on the Windows host.
3. **Assumptions:** Assumed that 1,000 active concurrent users generate ~250–500 RPS based on realistic 2–4s user think time across the 5 identified traffic tiers.

---

## 4. Conclusion

The Anusandhan platform has solid algorithmic and UI foundations, but requires targeted hardening across four pillars to satisfy the production launch acceptance criteria:
1. **Security:** Remediate the 3 Critical and 5 High vulnerabilities (rate limit IP spoofing, CORS misconfiguration, missing route authentication, IDOR on invoices, synchronous scrypt event loop blocking, hardcoded JWT secrets).
2. **Deployment:** Complete `docker-compose.prod.yml` with PostgreSQL, MongoDB, health checks, and standard Redis TCP support; author `k8s/` manifests; create `scripts/validate_environment.js`.
3. **Documentation:** Build a browsable documentation site covering Product Overview, Backend Architecture, API Reference, and Developer Onboarding.
4. **Concurrency:** Deploy a pure Node.js 1,000-user concurrency test runner (`tests/load/concurrency_benchmark_1000.cjs`) to verify < 1% error rate and < 150ms p95 latency.

All detailed findings, dependency matrices, and step-by-step remediation plans are documented in `survey_report.md`.

---

## 5. Verification Method

To independently verify the survey findings:

1. **Verify Root Frontend Build:**
   ```bash
   npm run build
   ```
   *Expected:* Exit code 0, bundles in `dist/`.

2. **Verify Express Gateway Tests:**
   ```bash
   cd server && npm test
   ```
   *Expected:* 18 tests passing.

3. **Verify Offline Sync Tests:**
   ```bash
   cd server && node --test --env-file=.env tests/offline_sync.test.js
   ```
   *Expected:* 2 tests passing.

4. **Verify Python FastAPI Tests:**
   ```bash
   cd backend && uv run pytest
   ```
   *Expected:* 14 tests passing.

5. **Verify Security Findings:**
   - Inspect `server/middleware/rateLimiter.js:14-17` to verify IP spoofing vulnerability.
   - Inspect `backend/app/main.py:34-40` to verify invalid CORS wildcard with credentials.
   - Inspect `server/routes/billingRoutes.js:170` to verify missing user ownership check on invoices.
   - Inspect `server/utils/password.js:9,19` to verify synchronous `crypto.scryptSync`.

6. **Verify Infrastructure Gaps:**
   - Inspect `docker-compose.prod.yml` to verify absence of `postgres` and `mongodb` services.
   - Execute `k6 version` in terminal to verify absence of k6 CLI.
