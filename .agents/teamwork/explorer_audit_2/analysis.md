# Comprehensive Backend, Database, and Infrastructure Scalability Audit

**Target System**: Anusandhan (अनुसंधान AI) — High-Performance Academic Internship & Opportunity Intelligence Platform  
**Target Scale**: 1,000 Active Concurrent University Scholars & Students  
**Audit Date**: 2026-11-04  
**Auditor**: Explorer Agent (`explorer_audit_2`)  
**Scope**: `server/` (Express API Gateway), `backend/` (FastAPI AI Microservice), `tests/` (Adversarial, E2E, Load Benchmark), `docker-compose.prod.yml`

---

## 1. Executive Summary

Anusandhan has completed major hardening milestones (Milestone 1 Rounds 1–3), achieving clean execution on the 1,000-user concurrency benchmark (`tests/load/concurrency_benchmark_1000.cjs`: 7,381 requests, 529.2 req/sec throughput, 0.00% error rate), 24/24 Gateway unit tests, 42/42 E2E lifecycle tests, and 14/14 Python backend tests.

However, a forensic inspection of the codebase against Milestone 2 requirements and multi-container deployment architecture reveals **6 critical gaps and architectural inconsistencies** that directly impact multi-tenant isolation, campus-wide scalability, and containerized clustering:

1. **Redis TCP Client Absence (`server/services/redisCache.js`)**: While `docker-compose.prod.yml` and logs claim Redis TCP operation via `REDIS_URL=redis://redis-cache:6379`, `redisCache.js` contains **zero Redis TCP client library code** (`ioredis` or `redis` npm packages are missing from `package.json`). Cache and rate limiting run exclusively in local Node.js process memory, causing split-brain rate limiting and zero cache sharing across gateway replicas.
2. **Campus-Wide Auth Throttling & Test Failure (`tests/adversarial/auth_concurrency_stress.test.mjs`)**: Mounting `authLimiter` (120 req / 15m) globally over `/api/auth` without per-account keying blocks all 120 concurrent logins (yielding `0 !== 120` assertion failure) whenever 120 registrations occur from the same campus NAT IP or test runner.
3. **Multi-Tenant State Leakage & `'student_active'` Bleeding**:
   - Fallback `'student_active'` remains in `server/routes/studentRoutes.js` (lines 10, 40, 59) and `server/routes/outreachRoutes.js` (line 105).
   - In `server/routes/outreachRoutes.js`, line 9 uses a single shared `let memoryOutreach = [];`, and `PUT /:id/status` allows cross-tenant state mutation (IDOR).
   - In `backend/app/routers/outreach_router.py`, `GET /api/v1/outreach/queue` dumps all students' dispatch queues globally without student isolation.
4. **Unauthenticated & Unisolated Background Job Queue (`server/queues/jobQueue.js`, `server/server.js`)**: `POST /api/jobs` and `GET /api/jobs/:jobId` are completely unauthenticated. Job records store no `userId`, allowing any caller to inspect arbitrary user jobs.
5. **MongoDB Connection Lifecycle & Schema Mismatches**:
   - `server/server.js` lacks `mongoose.connection.on('error')`, `on('disconnected')`, and `on('reconnected')` listeners.
   - `server/models/Student.js` does not declare an `id` field, yet `studentRoutes.js` executes `Student.findOne({ id: studentId })`.
6. **Billing Credit Fulfillment Gap (`server/routes/billingRoutes.js`)**: Webhook handler receives `payment.captured` and sets `order.status = 'paid'`, but does not increment user credits or upgrade the `User` document in MongoDB.

---

## 2. Component-by-Component Status & Forensic Analysis

### 2.1 Authentication & Session Handling

| Component | Status | Implementation Details | Forensic Verification |
|---|---|---|---|
| **Password Hashing** | ✅ Verified | `server/utils/password.js`: Uses `util.promisify(crypto.scrypt)` offloaded to libuv threadpool. 16-byte random salt, 64-byte key length. Stored as `${salt}:${derivedKeyHex}`. | `tests/adversarial_m1.test.js` (CHALLENGE 2A) confirms 50 concurrent scrypt calls execute in bounded latency (~3.1s) without blocking event loop. |
| **Password Verification** | ✅ Verified | Length check `keyBuffer.length !== derivedKey.length` precedes `crypto.timingSafeEqual` to avoid RangeError crashes. Wrapped in try/catch. | Verified against corrupted, truncated, and empty hashes in test suite. |
| **JWT Generation & Verification** | ✅ Verified | `server/routes/authRoutes.js`: 14-day expiry (`{ expiresIn: '14d' }`). Injected into `req.user` via `server/middleware/authMiddleware.js`. | Protected route guards reject missing (401) and invalid (403) tokens across all routes. |
| **Production Secrets Fail-Fast** | ✅ Verified | `server/server.js` (lines 33-41) & `authMiddleware.js`: Throws fatal error on boot if `JWT_SECRET` is unset/empty in `NODE_ENV=production`. Derives safe 32-byte ephemeral hex in dev/test. | Verified in `tests/adversarial/failfast_production_secrets.test.mjs` (3/3 passed). |
| **Institutional Email Verification** | ✅ Verified | `server/routes/authRoutes.js` (`POST /api/auth/verify-institutional-email`): Validates `.ac.in`, `.edu`, `.res.in`, `iisc.`, `tifr.`, `mpg.de`, `ethz.ch`, `cern.ch`. | Idempotent race-condition guard prevents double-crediting via atomic MongoDB query. |
| **Credit Management Idempotency** | ⚠️ Partial | In `authRoutes.js`, institutional attestation awards +10 credits atomically with `{ isInstitutionalVerified: { $ne: true } }`. But in `billingRoutes.js`, payment capture does NOT credit user accounts. | In `billingRoutes.js` lines 160-169, `order.status = 'paid'` is updated in memory, but `User.creditsRemaining` is never modified. |

---

### 2.2 Database Pooling & Connections

#### PostgreSQL Pool (`server/db/supabaseClient.js`)
- **Configuration**:
  - `pg.Pool` initialized with `max: 20`, `idleTimeoutMillis: 30000`, `connectionTimeoutMillis: 3000`, `ssl: { rejectUnauthorized: false }`.
  - Tuned for Supabase transaction pooling via PgBouncer on port 6543.
- **Error Handling**:
  - Mandatory error listener implemented (lines 28-30):
    ```javascript
    pool.on('error', (err) => {
      console.error('[PostgreSQL Pool Unexpected Error]:', err.message);
    });
    ```
    This prevents backend process crashes when idle PostgreSQL client sockets are terminated by PgBouncer or firewalls.
- **Health Check & Telemetry**:
  - `checkHealth()` executes `SELECT 1` and returns latency in milliseconds.
  - Queries exceeding 150ms log a warning: `[Database Slow Query]`.
- **Gaps**:
  - `getClient()` returns raw `await pool.connect()` without an automated wrapper or auto-release helper. If developers call `getClient()`, client socket leaks will exhaust the 20-connection pool.

#### MongoDB Connection (`server/server.js`, `server/models/*`)
- **Configuration**:
  - `mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 5000, maxPoolSize: 50, minPoolSize: 10, socketTimeoutMS: 45000 })`.
  - Models (`User.js`, `Student.js`, `Outreach.js`) set `bufferCommands: false` to prevent silent query hangs during disconnects.
- **Gaps**:
  - **Missing Connection Event Listeners**: In `server/server.js`, connection is initialized with `.then(...).catch(...)`, but lacks runtime event hooks:
    ```javascript
    mongoose.connection.on('error', (err) => console.error('[MongoDB Error]:', err));
    mongoose.connection.on('disconnected', () => console.warn('[MongoDB Disconnected]'));
    mongoose.connection.on('reconnected', () => console.log('[MongoDB Reconnected]'));
    ```
  - **Schema/Query Inconsistency in `server/models/Student.js`**: `StudentSchema` has fields `email`, `fullName`, etc., but lacks an `id` field. Meanwhile, `server/routes/studentRoutes.js` executes `Student.findOne({ id: studentId })` and `Student.findOneAndUpdate({ id: studentId })`. In production with MongoDB active, this causes document queries to fail to match.

#### Redis Client & Multi-Tier Caching (`server/services/redisCache.js`)
- **Current State**:
  - Has an in-memory LRU cache capped at `MAX_MEMORY_KEYS = 5000` with TTL expiration.
  - Supports Upstash HTTP REST if `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN` are present.
- **CRITICAL GAP**:
  - In `server/services/redisCache.js`, line 11 defines `const REDIS_URL = process.env.REDIS_URL;`. Line 28 logs `Operating with Redis TCP gateway ... with in-memory LRU backup`.
  - However, **no Redis TCP client library (such as `ioredis` or `redis`) is imported, instantiated, or configured**.
  - `server/package.json` contains no Redis client dependency.
  - In `docker-compose.prod.yml` or Kubernetes (`k8s/`), where `REDIS_URL=redis://redis-cache:6379` is configured, the gateway **silently ignores the Redis server** and runs in local process memory.
  - Under 1,000 users distributed across multiple Node.js worker processes or Kubernetes pods, cache misses increase and rate limits are not shared across pods.

---

### 2.3 Multi-Tenant State Isolation & Session Bleeding

Forensic inspection identified several state-bleeding risks where multi-tenant boundaries are compromised:

#### 1. `'student_active'` Singleton Fallback
- **Location**:
  - `server/routes/studentRoutes.js` (lines 10, 40, 59):
    ```javascript
    const getDefaultStudent = (id = 'student_active') => ({ ... });
    const studentId = req.user?.id || req.user?.userId || 'student_active';
    ```
  - `server/routes/outreachRoutes.js` (line 105):
    ```javascript
    const studentId = req.user?.id || req.user?.userId || 'student_active';
    ```
  - `server/services/pythonBridge.js` (line 85):
    ```javascript
    async enqueueOutreach(payload, studentId = 'student_active')
    ```
- **Risk**: If a malformed or edge-case token lacks `id`/`userId`, the request silently defaults to `'student_active'`, causing data cross-contamination between different student sessions.
- **Remediation**: Strictly enforce `req.user.id`. If missing, reject immediately with HTTP 401/403. Eliminate all `'student_active'` defaults.

#### 2. Outreach Route CRM Global Memory Leak & IDOR
- **Location**: `server/routes/outreachRoutes.js`:
  - Line 9: `let memoryOutreach = [];` — single global array in gateway memory.
  - Line 112: `const filtered = memoryOutreach.filter(item => !item.studentId || item.studentId === studentId);`
    Notice `!item.studentId`: any record missing `studentId` leaks to every student!
  - Lines 117–122:
    ```javascript
    router.put('/:id/status', authenticateToken, async (req, res) => {
      const { id } = req.params;
      const { status } = req.body;
      memoryOutreach = memoryOutreach.map(item => item.id === id ? { ...item, status } : item);
      res.json({ success: true, updatedId: id, newStatus: status });
    });
    ```
    IDOR vulnerability: Any authenticated user can modify the status of another user's outreach application simply by passing its `id`.
  - Disconnected Persistence: Neither `POST /draft` nor `POST /enqueue` saves anything into `Outreach` in MongoDB or `memoryOutreach`. Applications created by students disappear from the CRM list.

#### 3. Python Outreach Queue Multi-Tenant Leak
- **Location**: `backend/app/routers/outreach_router.py`:
  - Lines 45–52:
    ```python
    @router.get("/queue", response_model=Dict[str, Any])
    def view_active_queue():
        return {
            "active_items": list(outreach_service.queue.values()),
            "total_queued": len(outreach_service.queue)
        }
    ```
  - Lines 27–30:
    ```python
    @router.post("/enqueue", response_model=EnqueueOutreachResponse)
    def queue_email_dispatch(
        req: EnqueueOutreachRequest,
        x_student_id: str = Header("student_demo", alias="X-Student-ID")
    ):
    ```
- **Risk**: `GET /api/v1/outreach/queue` returns all items in `outreach_service.queue` globally across all students. Any student can inspect target professors and email addresses of other students. Furthermore, `X-Student-ID` defaults to `"student_demo"`, sharing rate limit quotas.

#### 4. Background Job Queue Tenant Isolation
- **Location**: `server/queues/jobQueue.js` & `server/server.js`:
  - `jobQueue.createJob(type, payload)` does not record `userId`.
  - `POST /api/jobs` and `GET /api/jobs/:jobId` in `server/server.js` (lines 175–201) have NO `authenticateToken` middleware!
  - Anyone can query any `jobId` and read the parsed CV results or academic paper deconstructions of other students.

---

### 2.4 Security Hardening

#### 1. HTTP Security Headers (Helmet)
- **Status**: ✅ Production Ready.
- **Configuration** (`server/server.js`, lines 73–103):
  - CSP: Restricts `default-src 'self'`, whitelists API connect origins.
  - HSTS: `maxAge: 31536000`, `includeSubDomains: true`, `preload: true`.
  - Frameguard: `action: 'deny'`.
  - X-Content-Type-Options: `nosniff`.
  - Cross-Origin-Resource-Policy: `policy: 'cross-origin'`.
  - In `backend/app/main.py`: `SecurityHeadersMiddleware` injects identical headers.

#### 2. CORS Policies
- **Status**: ✅ Production Ready.
- Express Gateway whitelists `http://localhost:5173`, `http://localhost:3000`, `https://anusandhan.ai`, plus any comma-separated entries in `ALLOWED_ORIGINS` or `FRONTEND_URL`.
- Disallows wildcards when `credentials: true`.
- Verified in `tests/adversarial/cors_preflight_challenge.test.mjs` against unauthorized origins.

#### 3. Rate Limiting Calibration & The Campus NAT Flaw
- **Current Configuration** (`server/middleware/rateLimiter.js`):
  - Sliding window algorithm using Redis/in-memory cache.
  - `trust proxy: false` by default prevents direct clients from spoofing IPs via `X-Forwarded-For`.
  - Supports `usr:${userId}` when authenticated.
  - Limits: `authLimiter`: 120 req / 15m; `aiLimiter`: 30 req / 60s; `publicReadLimiter`: 1200 req / 60s; `apiLimiter`: 600 req / 60s.
- **CRITICAL DEFECT**:
  - `authLimiter` is mounted on the entire `/api/auth` router (`server/server.js` line 164).
  - Unauthenticated requests have no `userId`, so they are keyed by IP (`ip:${ip}`).
  - Since `trust proxy` is false, all local or campus requests share a single IP.
  - **In `tests/adversarial/auth_concurrency_stress.test.mjs`**, a burst of 120 registrations from `127.0.0.1` immediately exhausts the 120-request limit. The subsequent 120 logins all receive HTTP 429 Too Many Requests (`AssertionError: 0 !== 120`).
  - **Real-World Impact**: In a university deployment where hundreds of students share an egress IP (e.g., `14.139.x.x`), 120 requests block the entire campus for 15 minutes.
  - **Fix**:
    1. Key `/api/auth/login` by account email (`auth:login:${email}`) so brute force against an account is blocked without throttling other users on the same IP.
    2. Split `/api/auth/register` and `/api/auth/login` into distinct limiter tiers.
    3. Increase the IP quota for authenticated and campus networks.

#### 4. Razorpay Webhook HMAC Cryptographic Verification
- **Status**: ✅ Production Ready.
- **Implementation** (`server/routes/billingRoutes.js`, lines 126–151):
  - Computes `crypto.createHmac('sha256', RAZORPAY_KEY_SECRET).update(rawPayload).digest('hex')`.
  - Length equality check `sigBuf.length !== expBuf.length` precedes `crypto.timingSafeEqual(sigBuf, expBuf)`.
  - Uses `req.rawBody` captured in `express.json({ verify: ... })`.
  - Verified in `tests/adversarial_m1.test.js` CHALLENGE 4 (all mutated/tampered signatures rejected with 400).

---

### 2.5 Background Schedulers & Queue Management

#### 1. Data Ingestion Scheduler (`server/services/dataIngestionScheduler.js`)
- Runs background sweeps every 30 minutes (`intervalMs = 1800000`).
- Runs initial sweep 2 seconds after boot.
- Has clean `start()` and `stop()` lifecycle methods with `clearInterval`.
- Dynamic reconfiguration via `setIntervalMinutes(mins)`.

#### 2. Data Ingestion Service (`server/services/dataIngestionService.js`)
- Manages real-world scraping from OpenAlex, ArXiv, and institutional portals.
- 1,113 lines of robust parsing, fallback seeding, and caching.

#### 3. Schedulers & Queue Gaps
- **Lack of RBAC on Ingestion Admin Endpoints (`server/routes/ingestionRoutes.js`)**:
  - `POST /api/ingest/refresh` and `POST /api/ingest/schedule` require `authenticateToken`, but do not verify that `req.user.role === 'admin'`. Any authenticated student can trigger heavy scraping sweeps or reconfigure the scheduler interval.
- **Job Queue Lifecycle Management (`server/queues/jobQueue.js`)**:
  - In-memory worker handles tasks with up to 6 concurrent workers.
  - `prune()` limits completed jobs to `maxJobs = 1000`.
  - Missing graceful drain on `SIGTERM`/`SIGINT`. If the gateway process is terminated, in-flight jobs are dropped silently without updating their status to `'failed'`.

---

## 3. Specific Gaps & Proposed Code Fixes

### Gap 1: Redis TCP Client Integration in `server/services/redisCache.js`
- **File**: `server/services/redisCache.js` (lines 6–35, 75–115) and `server/package.json`
- **Issue**: Standard `redis://` URLs configured in `docker-compose.prod.yml` (`redis://redis-cache:6379`) are ignored because no Redis client library is instantiated.
- **Proposed Fix**:
  1. Add `ioredis` to `server/package.json`: `"ioredis": "^5.4.1"`.
  2. In `redisCache.js`, initialize `ioredis.Redis` if `REDIS_URL` is set:
```javascript
import Redis from 'ioredis';

// In constructor:
if (this.redisUrl && !this.isUpstashEnabled) {
  try {
    this.redisClient = new Redis(this.redisUrl, {
      maxRetriesPerRequest: 3,
      enableReadyCheck: true,
      retryStrategy(times) {
        return Math.min(times * 100, 3000);
      }
    });
    this.redisClient.on('error', (err) => console.error('[Redis Client Error]:', err.message));
    this.redisClient.on('connect', () => console.log('[Redis Cache] Connected to Redis TCP instance.'));
  } catch (err) {
    console.warn('[Redis Cache] Failed to create Redis client, falling back to memory:', err.message);
  }
}
```
  3. Route `get`, `set`, and `del` to `this.redisClient` when active.

---

### Gap 2: Fix Auth Rate Limiting for Campus NAT & Multi-User Concurrency
- **File**: `server/middleware/rateLimiter.js` (lines 88–95) and `server/server.js` (line 164)
- **Issue**: Single global `authLimiter` with `maxRequests: 120` on `/api/auth` causes 120 registrations to exhaust the IP bucket, blocking subsequent logins (`auth_concurrency_stress.test.mjs` failure).
- **Proposed Fix**:
  Separate `authLimiter` into:
  1. `loginLimiter`: Keyed primarily by email (`auth:login:${email}`) with higher IP ceiling (`maxRequests: 300` per 15 min or per-account limit of 15 attempts).
  2. `registerLimiter`: Keyed by IP with 120 requests per 15 minutes.
  3. Apply `loginLimiter` to `/api/auth/login` and `registerLimiter` to `/api/auth/register`:
```javascript
export const loginLimiter = createRateLimiter({
  windowSeconds: 900,
  maxRequests: process.env.RATE_LIMIT_MAX_LOGIN ? parseInt(process.env.RATE_LIMIT_MAX_LOGIN, 10) : 300,
  prefix: 'rl:login',
  keyGenerator: (req) => {
    const email = req.body?.email ? req.body.email.toLowerCase().trim() : '';
    let rawIp = (req.app?.get('trust proxy') ? req.ip : null) || req.socket?.remoteAddress || req.ip || '127.0.0.1';
    return email ? `acc:${email}` : `ip:${rawIp}`;
  },
  message: 'Too many login attempts for this account or location. Please try again in 15 minutes.'
});
```

---

### Gap 3: Eradicate `'student_active'` and Enforce Multi-Tenant Isolation
- **Files**:
  - `server/routes/studentRoutes.js` (lines 10, 40, 59)
  - `server/routes/outreachRoutes.js` (lines 9, 105, 112, 117–122)
  - `backend/app/routers/outreach_router.py` (lines 29, 45–52)
- **Proposed Fix**:
  1. In `studentRoutes.js`:
     Replace `const studentId = req.user?.id || req.user?.userId || 'student_active';` with:
     ```javascript
     const studentId = req.user?.id || req.user?.userId;
     if (!studentId) {
       return res.status(401).json({ error: 'Unauthorized: User identifier missing from token.' });
     }
     ```
  2. In `outreachRoutes.js`:
     - Replace global `let memoryOutreach = [];` with per-tenant Map: `const memoryOutreachByStudent = new Map();`.
     - In `PUT /:id/status`: Check that the application belongs to `studentId`:
     ```javascript
     router.put('/:id/status', authenticateToken, async (req, res) => {
       const studentId = req.user?.id || req.user?.userId;
       const { id } = req.params;
       const { status } = req.body;
       // Verify ownership before updating
       const list = memoryOutreachByStudent.get(studentId) || [];
       const item = list.find(i => i.id === id);
       if (!item) {
         return res.status(404).json({ error: 'Outreach application not found or unauthorized' });
       }
       item.status = status;
       res.json({ success: true, updatedId: id, newStatus: status });
     });
     ```
  3. In `backend/app/routers/outreach_router.py`:
     - Filter `view_active_queue` by `x_student_id` header or return only the calling student's items.

---

### Gap 4: Authenticate & Isolate Asynchronous Job Queue
- **Files**: `server/server.js` (lines 175–201) and `server/queues/jobQueue.js` (lines 29–45)
- **Issue**: `/api/jobs` and `/api/jobs/:jobId` have no authentication or owner checks.
- **Proposed Fix**:
  1. Protect `/api/jobs` and `/api/jobs/:jobId` with `authenticateToken`.
  2. Attach `userId: req.user.id` to `jobData` in `jobQueue.createJob`.
  3. In `GET /api/jobs/:jobId`, verify:
  ```javascript
  if (job.userId && req.user && job.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: unauthorized task status query' });
  }
  ```

---

### Gap 5: MongoDB Reconnect Listeners & Student Schema Consistency
- **Files**: `server/server.js` (lines 133–143) and `server/models/Student.js`
- **Issue**: Missing runtime connection event handling; missing `id` field in `StudentSchema`.
- **Proposed Fix**:
  1. In `server/server.js`:
  ```javascript
  mongoose.connection.on('error', (err) => {
    console.error('[MERN Gateway MongoDB Error]:', err.message);
  });
  mongoose.connection.on('disconnected', () => {
    console.warn('[MERN Gateway MongoDB Disconnected] Operating in fallback mode.');
  });
  mongoose.connection.on('reconnected', () => {
    console.log('[MERN Gateway MongoDB Reconnected] Resumed live cluster connection.');
  });
  ```
  2. In `server/models/Student.js`:
  Add `id: { type: String, required: true, unique: true, index: true }` to `StudentSchema`.

---

### Gap 6: Admin RBAC on Ingestion Configuration Endpoints
- **File**: `server/routes/ingestionRoutes.js` (lines 38, 51)
- **Issue**: Any authenticated student can call `POST /api/ingest/schedule` or `POST /api/ingest/refresh`.
- **Proposed Fix**:
  Add an admin guard middleware or check `if (req.user?.role !== 'admin') return res.status(403).json({ error: 'Admin privilege required' });`.

---

## 4. Verification Checklist for R2 Requirements

| Requirement | Audit Item | Status | Verification Method |
|---|---|---|---|
| **R2.1** | Password hashing via async scrypt with libuv threadpool offload | ✅ Compliant | `server/utils/password.js` verified; `tests/adversarial_m1.test.js` CHALLENGE 2A passes. |
| **R2.2** | JWT Token issuance, 14d expiration, fail-fast production secret validation | ✅ Compliant | `server/middleware/authMiddleware.js` verified; `failfast_production_secrets.test.mjs` passes. |
| **R2.3** | Institutional email verification domain check & double-credit idempotency | ✅ Compliant | `server/routes/authRoutes.js` verified; atomic `$inc` with `$ne: true` verified. |
| **R2.4** | PostgreSQL connection pool with PgBouncer tuning & `pool.on('error')` | ⚠️ Remediation Needed | `supabaseClient.js` has pool error listener; `getClient()` requires disposal wrapper. |
| **R2.5** | MongoDB Mongoose connection pooling (10–50 sockets) & reconnect handling | ⚠️ Remediation Needed | Add `mongoose.connection.on('error'/'disconnected')` listeners in `server.js`; align `Student.js` schema. |
| **R2.6** | Redis client configuration supporting standard `redis://` URLs & LRU cap | ❌ Non-Compliant | `redisCache.js` needs genuine `ioredis` TCP client initialization. |
| **R2.7** | Elimination of global `student_active` singleton and tenant state bleeding | ⚠️ Remediation Needed | Remove `'student_active'` fallbacks; isolate CRM `memoryOutreach` by `studentId`. |
| **R2.8** | Security headers (Helmet CSP, HSTS, X-Frame-Options) on all responses | ✅ Compliant | Verified across 200, 400, 401, 404 in `helmet_headers_challenge.test.mjs`. |
| **R2.9** | CORS restrictions matching whitelisted origins; no wildcard credentials | ✅ Compliant | Verified in `cors_preflight_challenge.test.mjs` across Express and FastAPI. |
| **R2.10** | Rate limiting anti-spoofing and campus NAT calibration | ⚠️ Remediation Needed | Decouple `loginLimiter` (keyed by email) from registration IP limiter; resolves test failure. |
| **R2.11** | Razorpay webhook HMAC verification via `crypto.timingSafeEqual` | ✅ Compliant | Verified against fuzzing/mutations in `adversarial_m1.test.js` CHALLENGE 4. |
| **R2.12** | Background data ingestion schedulers & queue lifecycle management | ⚠️ Remediation Needed | Enforce admin RBAC on ingestion schedule endpoints; authenticate `/api/jobs`. |
| **R2.13** | 1,000-User Concurrency SLA (< 1% error rate, zero crashes) | ✅ Compliant | `tests/load/concurrency_benchmark_1000.cjs` passed with 0.00% error rate over 7,381 reqs. |
