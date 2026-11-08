# Survey Phase Handoff Report: Express API Gateway

**From**: `teamwork_explorer_1` (Survey Phase)  
**To**: Orchestrator (`369038bb-e0c3-488c-afe2-41c9a6e66fc2`)  
**Target Component**: Express API Gateway (`server/` and related root deployment configurations)  
**Date**: 2026-11-03  
**Status**: Hard Handoff (Investigation & Survey Complete)  

---

## 1. Observation

1. **Baseline Test Execution**:
   - `cd server && npm test` executed `node --test --env-file=.env tests/gateway.test.js` against running process PID 13420:
     - 18 passing, 0 failing, duration 447.4ms.
   - `cd server && node --test --env-file=.env tests/offline_sync.test.js` executed:
     - 2 passing, 0 failing, duration 89.7ms.
   - `tests/gateway.test.js:5` hardcodes `const BASE_URL = 'http://localhost:5000'`. It does not launch the Express application within the test process; it fails with `ECONNREFUSED` if port 5000 is not already bound by an external process.
2. **Event Loop Starvation in Password Cryptography**:
   - `server/utils/password.js:9`: `const derivedKey = crypto.scryptSync(password, salt, 64);`
   - `server/utils/password.js:19`: `const derivedKey = crypto.scryptSync(password, salt, 64);`
   - Both `hashPassword` and `verifyPassword` invoke the synchronous CPU-intensive `crypto.scryptSync` directly on the main Node.js thread.
3. **Orphaned PostgreSQL Layer**:
   - `server/db/supabaseClient.js:19–25`: `pool = new Pool({ connectionString, max: 20, ... })` is initialized.
   - Search across `server/`: Only `server.js:27` (health check status) and `services/dataIngestionService.js:8` import `supabaseClient.js`. In `dataIngestionService.js`, `pool` and `query` are imported but never invoked.
   - No route or service in `server/` reads or writes to PostgreSQL, despite `server/db/schema.sql` having complete DDL for 5 tables.
   - `server/db/supabaseClient.js` contains no `pool.on('error', ...)` handler.
4. **Redis Protocol Mismatch & In-Memory Leaks**:
   - `docker-compose.prod.yml:24,51–58` deploys `redis:7-alpine` and sets `REDIS_URL=redis://redis-cache:6379`.
   - `server/services/redisCache.js:9–10,22` only checks `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`. It does not support TCP Redis protocols (`redis://`).
   - `server/services/redisCache.js:13–14`: `memoryStore = new Map()` and `memoryExpiry = new Map()` have no maximum size or LRU eviction. Keys expire only when individually requested.
   - `server/queues/jobQueue.js:12`: `this.jobs = new Map()` never prunes completed/failed jobs.
5. **Multi-Tenant State Pollution**:
   - `server/routes/studentRoutes.js:7–34`: `let memoryStudent = { id: 'student_active', ... };`
   - `server/routes/studentRoutes.js:36–66`: Endpoints `GET /me` and `PUT /me` have no authentication middleware and operate on the single global `memoryStudent` object.
   - `server/routes/outreachRoutes.js:105`: Hardcodes `{ studentId: 'student_active' }`.
6. **Authentication Gaps & Security Vulnerabilities**:
   - `server/server.js:36`: `app.use(cors({ origin: '*' }))` allows wildcard CORS.
   - `server/server.js:37` vs `server/routes/billingRoutes.js:127`: Global `express.json({ limit: '10mb' })` runs before `express.raw()`, corrupting raw request body bytes required for Razorpay webhook HMAC verification.
   - `server/routes/billingRoutes.js:138–141`: `crypto.timingSafeEqual` throws an unhandled exception if `signature.length !== expectedSignature.length`.
   - `server/routes/ingestionRoutes.js:37–61`: `POST /api/ingest/refresh` and `POST /api/ingest/schedule` have no authentication or authorization checks.
   - `server/middleware/authMiddleware.js:3` and `server/routes/authRoutes.js:9`: Hardcoded fallback secret `'research_intern_pro_jwt_secret_key_2026'`.
   - `server/middleware/rateLimiter.js:14–17`: Reads `req.headers['x-forwarded-for']` without `app.set('trust proxy', true)` in Express, permitting rate-limit bypass via header spoofing.
7. **Environment Variable Path Discrepancy**:
   - `server/services/pythonBridge.js:8`: `const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000/api/v1';`
   - `docker-compose.prod.yml:23`: `PYTHON_SERVICE_URL=http://ai-microservice:8000` (missing `/api/v1`). Calls to `/audit/status` will route to `http://ai-microservice:8000/audit/status` instead of `http://ai-microservice:8000/api/v1/audit/status`, causing 404 errors.

---

## 2. Logic Chain

1. **From Observation 2**: `crypto.scryptSync` blocks the Node.js event loop synchronously for ~50–100ms per invocation. Under 1,000 active concurrent users with concurrent logins/registrations, the single Node event loop is starved, making the server completely unresponsive and causing request timeouts for all endpoints.
2. **From Observation 3**: Because PostgreSQL is not queried anywhere and no `pool.on('error')` exists, any idle connection drop from Supabase / PgBouncer will emit an unhandled error and crash the gateway process, while user and outreach data are kept in volatile RAM.
3. **From Observation 4**: In production Docker Compose, `REDIS_URL` is ignored because `redisCache.js` only understands Upstash HTTP endpoints. Therefore, production runs on `memoryStore`. Because `memoryStore` has no max size or eviction, the server will leak memory under sustained user activity and crash with OOM.
4. **From Observation 5**: Because `studentRoutes.js` and `outreachRoutes.js` use a singleton in-memory object with hardcoded `student_active`, concurrent student users will collide, see each other's data, and overwrite records.
5. **From Observation 6**: Wildcard CORS, lack of route authentication on student/outreach/ingestion routes, hardcoded JWT secrets, and broken webhook raw-body parsing represent critical security vulnerabilities that prevent production sign-off.
6. **From Observation 7**: The `/api/v1` prefix discrepancy between `pythonBridge.js` and `docker-compose.prod.yml` guarantees that containerized inter-service communication between Express and FastAPI will fail with HTTP 404 in production.

---

## 3. Caveats

- **Load Testing Baseline**: Formal concurrent load benchmarking (e.g. via autocannon, k6, or artillery) was not executed during this read-only survey phase. Performance bottlenecks are identified via static code analysis of event-loop blocking operations and data structure scaling characteristics.
- **Python Backend State**: The internal implementation of the FastAPI AI service (`backend/app`) was inspected for routing prefixes (`/api/v1`), but a full audit of the Python service is reserved for its designated survey task.
- **PostgreSQL Connection**: A live PostgreSQL instance was not connected during this test run because `DATABASE_URL` was not present in `server/.env`.

---

## 4. Conclusion

The Express API Gateway codebase is functionally rich and provides extensive fallbacks that allow its 18 integration tests and 2 unit tests to pass cleanly in development mode. However, it is **unprepared for 1,000 active concurrent users and production deployment**:
1. **Critical Scalability Blockers**: Synchronous `scryptSync`, unbounded in-memory maps (`memoryStore`, `jobs`), and hardcoded singleton student state (`student_active`).
2. **Critical Infrastructure Disconnects**: `REDIS_URL` ignored in favor of Upstash; PostgreSQL tables orphaned; Python URL missing `/api/v1` in `docker-compose.prod.yml`.
3. **Critical Security Vulnerabilities**: Unauthenticated student profile and outreach endpoints; wildcard CORS; timingSafeEqual crash bug; unprotected scraper triggers.

---

## 5. Verification Method

To independently verify these findings:
1. **Verify Baseline Test Pass**:
   ```powershell
   cd c:\PROJECTS\ResearchIntern_Pro\server
   npm test
   node --test --env-file=.env tests/offline_sync.test.js
   ```
2. **Verify Event Loop Blocking (`scryptSync`)**:
   Inspect `server/utils/password.js:9,19`. Observe synchronous `crypto.scryptSync`.
3. **Verify PostgreSQL Disconnect**:
   Run grep across `server/` for `supabaseClient`. Confirm only `server.js` (status) and `dataIngestionService.js` (unused import) appear.
4. **Verify Redis Implementation**:
   Inspect `server/services/redisCache.js:9–28`. Confirm absence of `redis://` or `REDIS_URL` parsing.
5. **Verify Singleton Identity Pollution**:
   Inspect `server/routes/studentRoutes.js:7–10,38,55`. Observe `id: 'student_active'`.
6. **Verify Docker Compose URL Mismatch**:
   Compare `docker-compose.prod.yml:23` (`http://ai-microservice:8000`) with `server/services/pythonBridge.js:8` (which defaults to `/api/v1`).
