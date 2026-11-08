# Express API Gateway Architecture & Baseline Survey Report

**Project**: Anusandhan (अनुसंधान) API Gateway & BFF  
**Target Concurrency**: Up to 1,000 Active Concurrent University Scholars & Students  
**Investigator**: Teamwork Explorer (Survey Phase)  
**Date**: 2026-11-03  
**Status**: Survey Complete — Verified Codebase Evidence Chain Established  

---

## 1. Executive Summary

The Anusandhan Express API Gateway (`server/`) is an ES-module Node.js 20 backend serving as a Backend-For-Frontend (BFF) and API Gateway. It orchestrates MongoDB data persistence, student CRM, authentication, caching, background data ingestion from ArXiv/OpenAlex, and RPC communication with the FastAPI Python AI microservice.

### Baseline Health Summary
| Test Suite | Command | Execution Result | Baseline Status |
|---|---|---|---|
| Gateway Integration Suite | `cd server && npm test` (`tests/gateway.test.js`) | 18 passing, 0 failing (447.4ms) | **Healthy** (requires live server on port 5000) |
| Offline Sync Suite | `cd server && node --test --env-file=.env tests/offline_sync.test.js` | 2 passing, 0 failing (89.7ms) | **Healthy** (pure algorithmic unit test) |

While all current functional tests pass against the development in-memory fallbacks, the codebase contains critical architectural bottlenecks, missing database wirings, race conditions, event-loop blocking cryptographic calls, and security vulnerabilities that will cause total failure under **1,000 active concurrent users**.

---

## 2. Server Architecture & Request Routing

### 2.1 Entry Point & Lifecycle
- **File**: `server/server.js` (147 lines)
- **Module Format**: ES Modules (`"type": "module"` in `server/package.json:6`)
- **Direct Run Detection**: Lines 136–144 check `process.argv[1]` and launch `app.listen(PORT)` when not in `test` mode (`process.env.NODE_ENV !== 'test'`).
- **Telemetry & Health**: `GET /api/health` (lines 91–108) reports status of Node gateway, PgBouncer pool, MongoDB, Redis cache, and Python microservice.

### 2.2 Global Middleware Pipeline
1. `cors({ origin: '*' })` (`server/server.js:36`): Permissive wildcard CORS. In production, this permits arbitrary third-party origins to query the gateway.
2. `express.json({ limit: '10mb' })` (`server/server.js:37`): Global JSON body parser.  
   *Critical Conflict*: Consumes the request stream before `server/routes/billingRoutes.js:127` can apply `express.raw({ type: 'application/json' })`, corrupting raw payload byte streams required for cryptographic webhook HMAC verification.
3. `morgan('dev')` (`server/server.js:38`): Console request logging.
4. `apiLimiter` (`server/server.js:39`): Sliding-window rate limiter applying 300 requests/60s per IP.
5. Global Error Handler (`server/server.js:118–125`): Standard 4-argument Express error middleware returning sanitized errors in production.

### 2.3 Route Registry
| Path Prefix | Target Router | Middleware Applied | Authentication Enforced |
|---|---|---|---|
| `/api/auth` | `routes/authRoutes.js` | `authLimiter` (60 req / 15m) | Hybrid (`/me`, `/refresh-token`, `/verify-institutional-email`) |
| `/api/students` | `routes/studentRoutes.js` | None (only global `apiLimiter`) | **None (UNAUTHENTICATED)** |
| `/api/faculty` | `routes/facultyRoutes.js` | None (only global `apiLimiter`) | Public |
| `/api/fellowships` | `routes/fellowshipRoutes.js` | None (only global `apiLimiter`) | Public |
| `/api/outreach` | `routes/outreachRoutes.js` | None (only global `apiLimiter`) | **None (UNAUTHENTICATED)** |
| `/api/voice` | `routes/voiceRoutes.js` | `aiLimiter` (25 req / 60s) | Public / Student Context |
| `/api/agents` | `routes/agentRoutes.js` | `aiLimiter` (25 req / 60s) | Public / Student Context |
| `/api/ingest` | `routes/ingestionRoutes.js` | None (only global `apiLimiter`) | **None (UNAUTHENTICATED on trigger & schedule)** |
| `/api/billing` | `routes/billingRoutes.js` | None (only global `apiLimiter`) | Authenticated for order creation & invoice |
| `/api/jobs` | `server.js:62–88` | None | Public |
| `/api/health` | `server.js:91–108` | None | Public |

---

## 3. Database Connectivity, Pooling & Error Boundaries

### 3.1 PostgreSQL (Supabase / PgBouncer)
- **File**: `server/db/supabaseClient.js` (59 lines)
- **Driver**: `pg` (v8.23.1)
- **Configuration**:
  ```javascript
  pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 20, // Max physical connections multiplexed by PgBouncer
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 3000,
    ssl: { rejectUnauthorized: false }
  });
  ```
- **Observations & Evidence**:
  1. **Zero Route Usage**: Across the entire `server/` directory, `supabaseClient.js` is only imported by `server.js:27` (for health reporting) and `services/dataIngestionService.js:8`. In `dataIngestionService.js`, `pool` and `query` are imported but **never executed**.
  2. **Orphaned Schema**: `server/db/schema.sql` defines 5 comprehensive relational tables (`users`, `faculty`, `fellowships`, `outreach_drafts`, `orders`), but no backend queries execute against them.
  3. **Unhandled Error Crash Risk**: There is no `pool.on('error', (err) => ...)` listener on `pool`. In `node-postgres`, an idle client experiencing a network termination or PgBouncer restart emits an uncaught `error` event, crashing the Node process.
  4. **Null Propagation Bug**: When `DATABASE_URL` is undefined, `query()` returns `null` (`server/db/supabaseClient.js:36`). Callers expecting `res.rows` will throw `TypeError: Cannot read properties of null (reading 'rows')`.

### 3.2 MongoDB (Mongoose)
- **File**: `server/server.js:42–48`
- **Driver**: `mongoose` (v8.9.5)
- **Connection Configuration**:
  ```javascript
  mongoose.connect(MONGODB_URI, {
    serverSelectionTimeoutMS: 2000
  })
  ```
- **Observations & Evidence**:
  1. **Connection Pooling Defaults**: No `maxPoolSize` or `minPoolSize` is specified; Mongoose defaults to `maxPoolSize: 100`. Under 1,000 active concurrent connections, standard pool sizing must be calibrated alongside socket timeout and keep-alive settings.
  2. **Command Buffering Inconsistency**:
     - `models/User.js:79`: sets `bufferCommands: false, autoIndex: false`. When MongoDB is down, calls fail fast and fall back to in-memory maps.
     - `models/Student.js`, `models/Professor.js`, `models/Outreach.js`: do **NOT** set `bufferCommands: false`. If MongoDB is unavailable or reconnecting, operations hang until timeout (10,000ms+), exhausting request sockets.
  3. **Data Loss via Disconnected Fallbacks**:
     - In `server/routes/authRoutes.js:260–265` (`POST /api/auth/verify-institutional-email`), when MongoDB is connected, the user is stored in MongoDB. However, the verification endpoint exclusively mutates `memoryUsers.get(req.user.email)`. Because the user is not in `memoryUsers`, `user` is `undefined`, and MongoDB is never updated. Verified scholar status is permanently lost on subsequent queries.

### 3.3 Redis & Caching Tier
- **File**: `server/services/redisCache.js` (141 lines)
- **Mechanism**: Upstash REST API (`process.env.UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN`) with an in-memory `Map` fallback (`memoryStore`).
- **Observations & Evidence**:
  1. **Protocol Mismatch with Production Docker Compose**:
     - `docker-compose.prod.yml:24,51–58` deploys `redis:7-alpine` on port 6379 with `REDIS_URL=redis://redis-cache:6379`.
     - `server/services/redisCache.js` contains **zero** TCP Redis connection code (no `ioredis` or `redis` npm package). It strictly looks for `UPSTASH_REDIS_REST_URL`.
     - Result: In the production container environment, the gateway completely ignores the provisioned Redis container and runs exclusively on the in-memory fallback.
  2. **Memory Leak (No LRU / Max Size Eviction)**:
     - `memoryStore` and `memoryExpiry` are plain JavaScript `Map` instances (`server/services/redisCache.js:13–14`).
     - Expired entries are only deleted if `get(key)` is explicitly called on that exact key (`lines 51–56`).
     - Dynamic queries (`/api/faculty?q=<search>`, rate limiter keys `rl:api:<ip>`, job status keys) create unique entries that are never evicted unless queried again.
     - Under 1,000 active concurrent users, memory consumption will increase monotonically until Node.js crashes with `JavaScript heap out of memory`.

---

## 4. Concurrency Bottlenecks for 1,000 Active Users

### 4.1 Event Loop Starvation: Synchronous `crypto.scryptSync`
- **Location**: `server/utils/password.js:9,19`
- **Evidence**:
  ```javascript
  // Line 9:
  const derivedKey = crypto.scryptSync(password, salt, 64);
  // Line 19:
  const derivedKey = crypto.scryptSync(password, salt, 64);
  ```
- **Impact**: `crypto.scryptSync` is synchronous and deliberately computationally heavy (~50–120ms of pure CPU time per call depending on hardware). Because Node.js is single-threaded, calling `scryptSync` completely freezes the event loop. If 10–20 concurrent users register or log in simultaneously, all incoming network I/O, health checks, and API requests are blocked for 1–2+ seconds. Under 1,000 users, response latency will degrade into HTTP 504 timeouts and server unresponsiveness.
- **Required Remediation**: Replace `crypto.scryptSync` with asynchronous `util.promisify(crypto.scrypt)` or non-blocking password hashing that delegates to libuv's worker thread pool.

### 4.2 Shared Global State & Concurrency Collision
- **Location**: `server/routes/studentRoutes.js:7–34`, `server/routes/outreachRoutes.js:8`
- **Evidence**:
  ```javascript
  // server/routes/studentRoutes.js:7
  let memoryStudent = { id: 'student_active', ... };
  // server/routes/outreachRoutes.js:8
  let memoryOutreach = [];
  ```
- **Impact**:
  - `memoryStudent` is a single shared mutable JavaScript object.
  - When user A updates their profile via `PUT /api/students/me`, user B querying `GET /api/students/me` sees user A's data.
  - The identifier `'student_active'` is hardcoded; there is zero multi-tenant session isolation.
  - 1,000 active users will overwrite and corrupt each other's student records.

### 4.3 Race Conditions in Sliding-Window Rate Limiter
- **Location**: `server/middleware/rateLimiter.js:23–31`
- **Evidence**:
  ```javascript
  const entry = (await cache.get(key)) || { count: 0, reset: now + windowSeconds };
  if (now > entry.reset) {
    entry.count = 0;
    entry.reset = now + windowSeconds;
  }
  entry.count += 1;
  await cache.set(key, entry, Math.max(1, entry.reset - now));
  ```
- **Impact**: Non-atomic read-modify-write pattern. Under concurrent traffic from the same IP (e.g. university campus NAT or DDoS flood), parallel requests read identical `entry.count`, increment locally, and write back, losing updates and failing to throttle abusive clients accurately.

### 4.4 In-Memory Background Job Queue Leak
- **Location**: `server/queues/jobQueue.js:10–39`
- **Evidence**:
  ```javascript
  class JobQueue {
    constructor() {
      this.jobs = new Map();
      ...
    }
  ```
- **Impact**: Every job created by `/api/jobs` is stored permanently in `this.jobs.set(jobId, jobData)`. Completed or failed jobs are never removed from `this.jobs`. Over hours of sustained operation with 1,000 users submitting CVs or papers, this map will continuously accumulate memory. Furthermore, jobs queued in `this.queue` reside strictly in local RAM; if the process restarts or scales to multiple containers, in-flight jobs are dropped.

### 4.5 Synchronous Web-Scraping Sweeps in Gateway Thread
- **Location**: `server/services/dataIngestionScheduler.js:28–35`
- **Evidence**: The gateway directly runs `ingestionService.runFullIngestionSweep()` every 30 minutes inside the HTTP server process, making remote HTTP fetches to OpenAlex and ArXiv, processing XML payloads, and flushing cache keys. Heavy parsing or external network timeouts directly degrade gateway throughput.

---

## 5. Security Vulnerabilities & Anti-Abuse Review

### 5.1 Critical Security Vulnerabilities
1. **Unauthenticated Profile & CRM Endpoints**:
   - `server/routes/studentRoutes.js`: `GET /api/students/me` and `PUT /api/students/me` have **no** `authenticateToken` middleware. Anyone can read and update student data without credentials.
   - `server/routes/outreachRoutes.js`: `GET /api/outreach/` and `PUT /api/outreach/:id/status` have **no** `authenticateToken` middleware.
2. **Unprotected Administrative / Scraper Triggers**:
   - `server/routes/ingestionRoutes.js:37–47`: `POST /api/ingest/refresh` allows unauthenticated callers to trigger resource-intensive full-web scraping sweeps.
   - `server/routes/ingestionRoutes.js:50–61`: `POST /api/ingest/schedule` allows unauthenticated callers to reconfigure the scraping interval (e.g., setting `intervalMinutes: 1` to flood external research portals).
3. **Razorpay Webhook Raw Body Corruption & Crash**:
   - `server/routes/billingRoutes.js:127`: Uses `express.raw({ type: 'application/json' })`, but global `express.json({ limit: '10mb' })` in `server.js:37` has already parsed and consumed the stream.
   - `server/routes/billingRoutes.js:130`: Uses `typeof req.body === 'string' ? req.body : JSON.stringify(req.body)`. Re-serializing parsed JSON does not preserve exact whitespace and key order, causing HMAC verification to fail for valid webhooks.
   - `server/routes/billingRoutes.js:138–141`: `crypto.timingSafeEqual` is called directly without verifying that `Buffer.byteLength(signature)` matches `Buffer.byteLength(expectedSignature)`. If an attacker supplies an invalid signature with length != 64, Node.js throws a fatal `ERR_INVALID_ARG_VALUE` exception.
4. **Hardcoded Fallback JWT Secrets**:
   - `server/middleware/authMiddleware.js:3`: `const JWT_SECRET = process.env.JWT_SECRET || 'research_intern_pro_jwt_secret_key_2026';`
   - `server/routes/authRoutes.js:9`: `const JWT_SECRET = process.env.JWT_SECRET || 'research_intern_pro_jwt_secret_key_2026';`
   - If `JWT_SECRET` is omitted from the environment, tokens can be forged by any attacker who knows this repository fallback.
5. **Rate Limiting IP Spoofing**:
   - `server/middleware/rateLimiter.js:14–17`: Reads `req.headers['x-forwarded-for']` directly without `app.set('trust proxy', true)` in `server.js`. Attackers can send arbitrary `X-Forwarded-For: 1.2.3.4` headers to bypass rate limits or exhaust quotas of legitimate users.
6. **Missing HTTP Security Headers**:
   - No `helmet` middleware is configured in `server.js`. Missing `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `Strict-Transport-Security`, and CSP headers.

### 5.2 Anti-Abuse Protections (Verified Working)
1. **Mandatory Human Confirmation for Outreach**: `server/routes/outreachRoutes.js:77–79` rejects outreach enqueuing with HTTP 400 if `human_confirmed !== true`.
2. **Randomized Anti-Spam Jitter**: `server/routes/outreachRoutes.js:87` and `server/services/emailService.js:126–130` calculate a 4-to-12-minute randomized dispatch delay to protect email sender inbox reputation.
3. **Accredited Institutional Domain Verification**: `server/routes/authRoutes.js:240–250` enforces regex validation for `.ac.in`, `.edu`, `.res.in`, `iisc.`, `tifr.`, `mpg.de`, `ethz.ch`, `cern.ch`.

---

## 6. Offline Synchronization & Client Contract

### 6.1 Server-Side State
- The Express gateway currently has **no dedicated offline outbox sync endpoint** or idempotency tracking table.
- `server/tests/offline_sync.test.js` tests standalone client-side logic (creating an outbox object with an `id` prefix and deduplicating array items with a `Set`).

### 6.2 Frontend Contract (`src/services/offlineSyncEngine.ts`)
- Client records actions into `localStorage` under `anusandhan_outbox_queue`.
- Types handled: `QUEUE_OUTREACH`, `UPDATE_PROFILE`, `SCHEDULE_BUMP`, `UPDATE_CRM_STATUS`.
- On network reconnect, client attempts `POST http://localhost:5000/api/outreach/enqueue`.
- **Gaps**:
  1. The client hardcodes `http://localhost:5000` rather than using configured environment base URLs.
  2. The server endpoint `/api/outreach/enqueue` does not inspect or record `item.id` (idempotency key), making repeated dispatches vulnerable to duplicate queuing if retried.

---

## 7. Baseline Test Execution Results

Both baseline test suites were executed on the live environment and recorded verbatim:

### 7.1 Express Gateway Health & Functional Suite
**Command**: `cd server && npm test`  
**Command Line**: `node --test --env-file=.env tests/gateway.test.js`  
**Result**: 18 tests passed, 0 failed, duration 447.4ms.

```
✔ Express Gateway Health Check returns operational status (138.1093ms)
✔ Faculty API endpoint returns verified researchers with caching (8.4463ms)
✔ Fellowships API endpoint returns prestigious funded programs (7.7223ms)
✔ Fellowships API endpoint filters by lifecycle status (active, upcoming, passed) (14.9063ms)
✔ Asynchronous Job Queue accepts tasks with 202 Accepted (14.2082ms)
✔ Live Academic Data Ingestion Engine reports operational status and telemetry (3.9187ms)
✔ Billing & Monetization API returns 3 tiers with INR & USD pricing (4.0448ms)
✔ Institutional Email Verification grants verified scholar status (74.2647ms)
✔ Outreach Google OAuth URL endpoint returns valid authorization parameters (4.576ms)
✔ Outreach Enqueue blocks automated dispatches without human confirmation (3.6556ms)
✔ Outreach Enqueue accepts confirmed pitch with randomized jitter delay (11.7848ms)
✔ Faculty API endpoint properly resolves international/global scope queries (5.6702ms)
✔ Voice Agent API endpoint handles fellowship status intent and returns opportunity links (9.2543ms)
✔ Live Academic Scraper API endpoint returns scraped postings with verified schema (4.0291ms)
✔ Ingestion schedule API endpoint allows dynamic interval reconfiguration (8.8321ms)
✔ Faculty API endpoint filters with scraped=true and returns only live scraped opportunities (7.6147ms)
✔ Faculty API endpoint preserves scraped opportunities when querying keywords (q=robot) (3.6886ms)
✔ Voice Agent API endpoint handles scraped postings intent and routes to scraped subTab (7.7061ms)
ℹ tests 18
ℹ suites 0
ℹ pass 18
ℹ fail 0
ℹ duration_ms 447.4007
```

**Key Discovery**: `tests/gateway.test.js` makes live network fetches against `http://localhost:5000`. The test suite succeeds because a background Node process (`PID 13420`) is running `server.js`. If the gateway process is not running, all 18 tests fail with connection refused.

### 7.2 Offline Sync Unit Suite
**Command**: `cd server && node --test --env-file=.env tests/offline_sync.test.js`  
**Result**: 2 tests passed, 0 failed, duration 89.7ms.

```
✔ Offline Outbox Item Schema & Idempotency Key Generation (1.9744ms)
✔ Outbox Deduplication and Idempotency Guard (0.1885ms)
ℹ tests 2
ℹ suites 0
ℹ pass 2
ℹ fail 0
ℹ duration_ms 89.6669
```

---

## 8. Feature Inventory & Dependency Matrix

| Feature ID | Feature Name | Gateway Endpoints | Storage / Persistence | Upstream Dependencies | 1,000-User Status |
|---|---|---|---|---|---|
| **FEAT-01** | System Telemetry & Health Monitoring | `GET /api/health`, `GET /` | In-memory stats, `pg.Pool`, Mongoose status | Python `/api/v1/audit/status`, Redis Cache | Operational; relies on in-memory cache stats |
| **FEAT-02** | User Registration & Cryptographic Auth | `POST /api/auth/register`, `POST /api/auth/login` | Mongoose `User` + `memoryUsers` fallback | `utils/password.js` (`crypto.scryptSync`) | **CRITICAL BOTTLENECK**: Event loop frozen by synchronous scrypt |
| **FEAT-03** | Token Session Lifecycle & Rotation | `GET /api/auth/me`, `POST /api/auth/refresh-token` | JWT verification (14d validity) | `jsonwebtoken`, `authMiddleware.js` | Works; lacks token revocation & refresh token store |
| **FEAT-04** | Institutional Scholar Accreditation | `POST /api/auth/verify-institutional-email` | Mongoose `User` (`isVerified`, bonus credits) | Regex domain validator | **BUG**: Does not update MongoDB when connected; updates memory only |
| **FEAT-05** | Student Profile & RRS Studio | `GET /api/students/me`, `PUT /api/students/me` | Mongoose `Student` + `memoryStudent` | Single shared object `student_active` | **CRITICAL BUG**: Unauthenticated; all 1,000 users share one profile |
| **FEAT-06** | Faculty & Lab Discovery Catalog | `GET /api/faculty` | In-memory `UNIVERSAL_FACULTY` + Ingestion seeds | Python `/api/v1/faculty`, Redis Cache | High performance; cache key unbounded memory leak |
| **FEAT-07** | Fellowship Programs & Lifecycle Engine | `GET /api/fellowships`, `GET /api/fellowships/:id` | Dynamic status computation (active/upcoming/passed) | Ingestion service, Redis Cache | Fully functional; cached with 1800s TTL |
| **FEAT-08** | Outreach Email Generation & Jitter Enqueue | `POST /api/outreach/draft`, `POST /api/outreach/enqueue` | Mongoose `Outreach` + `memoryOutreach` | Python `/api/v1/outreach/*`, Google OAuth | Unauthenticated CRM; mandatory human confirmation verified |
| **FEAT-09** | Multilingual Voice & Intent Router | `POST /api/voice/turn` | Stateless RPC router | Python `/api/v1/voice/turn`, Sarvam AI / Gemini | Operational with Node gateway fallback dialog |
| **FEAT-10** | Academic AI Agent Tools | `/api/agents/paper-pitch`, `mock-interview`, `cv-diagnostic`, `grant-radar` | Stateless RPC router | Python `/api/v1/agents/*` | Operational with Node gateway fallback synthesis |
| **FEAT-11** | Autonomous Data Scraper & Ingestion Scheduler | `/api/ingest/status`, `postings`, `refresh`, `schedule`, `history` | In-memory scraped postings + dynamic seeds | ArXiv API, OpenAlex API | **SECURITY RISK**: Unauthenticated refresh and schedule reconfiguration |
| **FEAT-12** | Monetization, Razorpay & Invoicing | `/api/billing/plans`, `create-order`, `webhook/razorpay`, `invoice/:orderId` | In-memory `orderHistory` Map | Razorpay HMAC-SHA256, Stripe | **CRITICAL BUG**: Raw body lost by global json parser; timingSafeEqual crash |
| **FEAT-13** | Asynchronous Job Queue | `POST /api/jobs`, `GET /api/jobs/:jobId` | In-memory `JobQueue` (Map + Array) | Python CV / Paper parsing RPC | **MEMORY LEAK**: Jobs stored permanently in RAM; lost on restart |

---

## 9. Dependency & Environment Configuration Audit

### 9.1 `server/package.json` Audit
- **Installed**: `axios` (^1.7.9), `cors` (^2.8.5), `dotenv` (^16.4.7), `express` (^4.21.2), `jsonwebtoken` (^9.0.2), `mongoose` (^8.9.5), `morgan` (^1.10.0), `pg` (^8.23.1).
- **Missing Required Dependencies**:
  - `ioredis`: Required to connect to `redis-cache:6379` deployed in Docker Compose.
  - `helmet`: Required for production HTTP security headers.
  - `express-rate-limit` & `rate-limit-redis`: Required for distributed, atomic rate limiting across cluster instances.
  - `cookie-parser`: Required for secure HttpOnly cookie management.
  - `supertest` (devDependencies): Required to run gateway tests without requiring a pre-started external server.

### 9.2 Environment Configuration Discrepancies
| Variable | `server/.env` (Dev) | `docker-compose.prod.yml` | Code Expectation | Resolution Needed |
|---|---|---|---|---|
| `PORT` | 5000 | 5000 | Default 5000 | Aligned |
| `NODE_ENV` | `development` | `production` | Used for error sanitization | Aligned |
| `MONGODB_URI` | `mongodb://127.0.0.1:27017/...` | Not configured | Fallback to in-memory | Needs production MongoDB connection or managed URI |
| `DATABASE_URL` | **Missing** | **Missing** | Supabase PgBouncer | Needs Supabase / PostgreSQL URI for relational persistence |
| `REDIS_URL` | **Missing** | `redis://redis-cache:6379` | `redisCache.js` expects `UPSTASH_*` | Add TCP Redis connection support in `redisCache.js` |
| `PYTHON_SERVICE_URL` | `http://127.0.0.1:8000/api/v1` | `http://ai-microservice:8000` | Code expects `/api/v1` prefix | **MISCONFIGURED**: `docker-compose.prod.yml` lacks `/api/v1`, breaking Python RPC |
| `JWT_SECRET` | Configured | Configured with fallback | Must be non-default in prod | Ensure strong secret enforcement |
