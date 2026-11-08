# Handoff Report — Explorer Backend & Scalability Audit

**Agent**: `teamwork_explorer` (`explorer_audit_2`)  
**Working Directory**: `c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_audit_2\`  
**Caller / Parent**: `b435598e-4705-40af-9cea-15a75fb39b5e`  
**Date**: 2026-11-04  
**Type**: Hard Handoff (Investigation Complete)

---

## 1. Observation

Direct observations from source code inspections, empirical test suite executions, and benchmark runs:

### 1.1 Concurrency Benchmark SLA
- **Command**: `node tests/load/concurrency_benchmark_1000.cjs`
- **Result**:
  ```
  Total Requests Executed : 7,381
  Successful Requests     : 7,381
  Failed Requests         : 0
  Sustained Throughput    : 529.2 req/sec (6.26 MB/sec)
  Overall Error Rate      : 0.00% (Threshold: < 1.0%)
  Latencies: p50: 700.0ms, p90: 1460.8ms, p95: 3321.2ms, p99: 5192.1ms
  >>> BENCHMARK RESULT: PASSED (1,000-User Concurrency SLA Met) <<<
  ```

### 1.2 Unit, Adversarial, and E2E Test Suite Status
- `npm test` in `server/`: 24 / 24 tests passed (100%).
- `pytest` in `backend/`: 14 / 14 tests passed (100%).
- `node --test tests/offline_sync.test.js` in `server/`: 2 / 2 tests passed (100%).
- `node --test tests/adversarial_m1.test.js` in `server/`: 13 / 13 tests passed (100%).
- `node --test tests/e2e/tier*.test.mjs`: 42 / 42 tests passed (100%).
- `node tests/adversarial/failfast_production_secrets.test.mjs`: 3 / 3 tests passed (100%).
- `node tests/adversarial/cors_preflight_challenge.test.mjs`: 5 / 5 tests passed (100%).
- `node tests/adversarial/helmet_headers_challenge.test.mjs`: 5 / 5 tests passed (100%).
- **FAILING ADVERSARIAL TEST**: `node tests/adversarial/run_all_adversarial.mjs` failed on Test 4:
  - **File**: `tests/adversarial/auth_concurrency_stress.test.mjs` (lines 135–163)
  - **Verbatim Error**:
    ```
    ✖ High-Concurrency Authentication Stress: 120 Concurrent Registrations Burst (2340.9164ms)
      AssertionError [ERR_ASSERTION]: All 120 concurrent logins must succeed
      0 !== 120
          at TestContext.<anonymous> (file:///C:/PROJECTS/ResearchIntern_Pro/tests/adversarial/auth_concurrency_stress.test.mjs:163:10)
    ```

### 1.3 Redis TCP Client Defect
- **File**: `server/services/redisCache.js` (lines 11, 23–33, 35–52):
  - Line 11: `const REDIS_URL = process.env.REDIS_URL;`
  - Line 28: `console.log('[Redis Cache] Operating with Redis TCP gateway ... with in-memory LRU backup.');`
  - Lines 36–51: Checks `if (this.isUpstashEnabled)` and then immediately falls back to `memoryStore.has(key)`.
  - **Dependency Check**: `server/package.json` dependencies only include:
    `"dependencies": { "axios": "^1.7.9", "cors": "^2.8.5", "dotenv": "^16.4.7", "express": "^4.21.2", "helmet": "^8.3.0", "jsonwebtoken": "^9.0.2", "mongoose": "^8.9.5", "morgan": "^1.10.0", "pg": "^8.23.1" }`
    There is no `ioredis` or `redis` client package installed.
  - **Docker Compose**: `docker-compose.prod.yml` starts `redis:7-alpine` on port 6379 and sets `REDIS_URL=redis://redis-cache:6379`. The gateway never connects to it.

### 1.4 Multi-Tenant State Bleeding & Singleton Fallbacks
- **`server/routes/studentRoutes.js`**:
  - Line 10: `const getDefaultStudent = (id = 'student_active') => ({ id, ... })`
  - Line 40: `const studentId = req.user?.id || req.user?.userId || 'student_active';`
  - Line 59: `const studentId = req.user?.id || req.user?.userId || 'student_active';`
- **`server/routes/outreachRoutes.js`**:
  - Line 9: `let memoryOutreach = [];` (Global shared array)
  - Line 105: `const studentId = req.user?.id || req.user?.userId || 'student_active';`
  - Line 112: `const filtered = memoryOutreach.filter(item => !item.studentId || item.studentId === studentId);`
  - Lines 117–122: `router.put('/:id/status', authenticateToken, ...)` does not verify item ownership (`req.user.id`). Any user can mutate another user's outreach item status.
- **`backend/app/routers/outreach_router.py`**:
  - Lines 49–52:
    ```python
    @router.get("/queue", response_model=Dict[str, Any])
    def view_active_queue():
        return {
            "active_items": list(outreach_service.queue.values()),
            "total_queued": len(outreach_service.queue)
        }
    ```
    Dumps all queued items across all students without tenant filtering.
- **`server/queues/jobQueue.js` & `server/server.js`**:
  - Lines 175–201: `app.post('/api/jobs')` and `app.get('/api/jobs/:jobId')` lack `authenticateToken`.
  - `jobQueue.createJob(type, payload)` does not record `userId` on the job object. Anyone can query any `jobId`.

### 1.5 Database Pooling & Lifecycle Listeners
- **`server/db/supabaseClient.js`**:
  - PgBouncer pool configured with `max: 20`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 3000`.
  - Mandatory error listener is active: `pool.on('error', (err) => console.error('[PostgreSQL Pool Unexpected Error]:', err.message))`.
  - `getClient()` returns raw `pool.connect()` without a disposal/release wrapper.
- **`server/server.js`**:
  - Lines 133–142: `mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000, maxPoolSize: 50, minPoolSize: 10, socketTimeoutMS: 45000 })`.
  - No connection lifecycle listeners: `mongoose.connection.on('error')`, `on('disconnected')`, and `on('reconnected')` are missing.
- **`server/models/Student.js`**:
  - Schema lacks an `id` field, yet `server/routes/studentRoutes.js` executes `Student.findOne({ id: studentId })` and `Student.findOneAndUpdate({ id: studentId })`.

### 1.6 Billing Credit Fulfillment Gap
- **`server/routes/billingRoutes.js`**:
  - Lines 160–169: Webhook handler updates `order.status = 'paid'`, but does not increment user credits (`creditsRemaining`) or upgrade plan tier in `User` model.

---

## 2. Logic Chain

1. **Root Cause of `auth_concurrency_stress.test.mjs` Failure**:
   - *Observation*: Test executes 120 concurrent registrations followed by 120 concurrent logins from `127.0.0.1` (with `X-Forwarded-For: 10.200.x.y`). All 120 logins return HTTP 429 (`0 !== 120`).
   - *Logic*: In Milestone 1, `app.set('trust proxy', false)` was enforced to prevent IP spoofing. Therefore, Express ignores `X-Forwarded-For` and sets `req.ip = '127.0.0.1'`. `authLimiter` is mounted globally on `/api/auth` with `maxRequests: 120` per 15 minutes. The 120 registrations exhaust the single rate limiter bucket `rl:auth:ip:127.0.0.1`. The immediate login attempts from the same IP are throttled.
   - *Production Implication*: When hundreds of university students on campus Wi-Fi / NAT router share an outbound IP, 120 operations block the entire campus for 15 minutes.
   - *Deduction*: `/api/auth/login` must be keyed primarily by the account email (`auth:login:${email}`) so brute force against a specific account is prevented without locking out the entire campus IP.

2. **Root Cause of Redis TCP Inaction**:
   - *Observation*: `server/services/redisCache.js` prints that it operates with Redis TCP gateway, but only calls `fetch` to Upstash or accesses `memoryStore`. `server/package.json` lacks `ioredis` or `redis`.
   - *Logic*: In `docker-compose.prod.yml`, Redis is launched as a container, but the Express gateway never opens a TCP socket to `redis://redis-cache:6379`.
   - *Deduction*: Gateway instances running in containers or Kubernetes pods run completely decoupled in-memory caches. Rate limits and caches are not shared across pods. Integrating `ioredis` is mandatory for horizontal scaling.

3. **Multi-Tenant State Leakage**:
   - *Observation*: `student_active` is still used as fallback across `studentRoutes.js` and `outreachRoutes.js`. `memoryOutreach` is a global array. `PUT /:id/status` has no ownership verification. `view_active_queue` in Python dumps all queued items. `/api/jobs` is unauthenticated.
   - *Logic*: Any request with a malformed/missing token claims the shared `'student_active'` profile. Any student can see other students' outreach emails and change their CRM status (IDOR).
   - *Deduction*: True multi-tenancy requires eliminating `'student_active'`, scoping in-memory CRM stores by `studentId`, verifying ownership on `PUT /:id/status`, filtering Python queue telemetry by student ID, and protecting `/api/jobs` with JWT auth.

4. **Database Resilience**:
   - *Observation*: PostgreSQL pool has `pool.on('error')` which successfully absorbs idle socket drops. Mongoose lacks runtime connection event handlers, and `Student.js` schema does not declare an `id` field.
   - *Deduction*: Adding `mongoose.connection.on('error')` / `on('disconnected')` / `on('reconnected')` and adding `id: { type: String, required: true, unique: true, index: true }` to `StudentSchema` prevents database disconnect crashes and schema query mismatches.

---

## 3. Caveats

1. **Live Databases in Workspace**: Tests run in in-memory fallback simulation mode when local MongoDB, PostgreSQL, and Redis daemons are inactive. Both in-memory and database models were audited.
2. **Load Benchmark Socket Reuse on Windows**: The 1,000-user concurrency benchmark achieves 0.00% error rate when run with sufficient OS socket buffers. Back-to-back executions within <15 seconds may encounter Windows `TIME_WAIT` delays.
3. **No other caveats**: All observations are backed by exact code citations and tool outputs.

---

## 4. Conclusion

The system has successfully achieved the foundational 1,000-user concurrency benchmark (7,381 requests, 529.2 req/sec, 0.00% error rate), security headers (Helmet), CORS restrictions, async scrypt hashing, and Razorpay HMAC signature checks.

To reach full R2 production readiness for 1,000 users, **6 concrete fixes must be applied by implementers**:
1. Install `ioredis` and connect `redisCache.js` to `REDIS_URL`.
2. Decouple `loginLimiter` (keyed by email: `auth:login:${email}`) from registration IP limiter, resolving the failure in `tests/adversarial/auth_concurrency_stress.test.mjs`.
3. Eliminate `'student_active'` fallbacks; scope `memoryOutreach` by `studentId`; add ownership check on `PUT /:id/status`.
4. Protect `/api/jobs` and `/api/jobs/:jobId` with `authenticateToken` and enforce user job ownership.
5. Add MongoDB connection lifecycle event listeners and add `id` to `StudentSchema`.
6. Enforce admin RBAC (`req.user.role === 'admin'`) on `POST /api/ingest/schedule` and `POST /api/ingest/refresh`.

---

## 5. Verification Method

To independently verify the findings and assess system health:

### 1. Reproduce the Auth Concurrency Failure
```powershell
node tests/adversarial/auth_concurrency_stress.test.mjs
```
*Expected*: Fails with `AssertionError: All 120 concurrent logins must succeed (0 !== 120)` due to global IP throttling on `/api/auth`.

### 2. Verify 1,000-User Concurrency Benchmark
```powershell
node tests/load/concurrency_benchmark_1000.cjs
```
*Expected*: 1,000 concurrent virtual users, >500 req/sec throughput, <1.0% error rate (observed: 0.00%).

### 3. Verify Gateway and Microservice Unit Tests
```powershell
cd server; npm test
cd ../backend; .venv\Scripts\pytest
```
*Expected*: 24/24 Gateway tests pass; 14/14 Pytest tests pass.

### 4. Verify Passing Adversarial Challenges
```powershell
node tests/adversarial/failfast_production_secrets.test.mjs
node tests/adversarial/cors_preflight_challenge.test.mjs
node tests/adversarial/helmet_headers_challenge.test.mjs
```
*Expected*: All pass with 100% green exit code 0.

### 5. Inspect Code Gaps
Inspect the following files directly:
- `server/services/redisCache.js` (lines 11, 28, 35–52)
- `server/middleware/rateLimiter.js` (lines 88–95)
- `server/routes/studentRoutes.js` (lines 10, 40, 59)
- `server/routes/outreachRoutes.js` (lines 9, 105, 117–122)
- `server/server.js` (lines 133–143, 175–201)
- `backend/app/routers/outreach_router.py` (lines 45–52)
