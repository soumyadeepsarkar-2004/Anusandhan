# Handoff Report: Milestone 1 - Feature 1 (Async Password Hashing) & Feature 2 (Anti-Abuse Rate Limiting)

**Author:** teamwork_explorer instance 1 (Milestone 1: Security Hardening & Authentication)  
**Date:** 2026-11-03  
**Working Directory:** `c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_m1_r1_1\`  
**Target Files:**
- `server/utils/password.js`
- `server/routes/authRoutes.js`
- `server/middleware/rateLimiter.js`
- `server/server.js`

---

## 1. Observation

1. **Synchronous `crypto.scryptSync` Blocking Event Loop:**
   - In `server/utils/password.js`:
     - Line 7: `export function hashPassword(password) {`
     - Line 9: `  const derivedKey = crypto.scryptSync(password, salt, 64);`
     - Line 13: `export function verifyPassword(password, storedHash) {`
     - Line 19: `  const derivedKey = crypto.scryptSync(password, salt, 64);`
     - Line 20: `  return crypto.timingSafeEqual(keyBuffer, derivedKey);`
   - In `server/routes/authRoutes.js`:
     - Line 61: `    const hashedPassword = hashPassword(password);`
     - Line 151: `    const isValid = verifyPassword(password, user.passwordHash);`
   - Both functions in `authRoutes.js` are called synchronously inside asynchronous Express route handlers (`router.post('/register', async ...)` line 31, `router.post('/login', async ...)` line 121).
   - In `server/tests/gateway.test.js`:
     - Line 109–141: Test `Institutional Email Verification grants verified scholar status` registers a user and takes **61.9ms** for that single HTTP roundtrip, dominated by synchronous `scryptSync` CPU computation.

2. **Unverified IP Extraction & Rate Limiter Spoofing:**
   - In `server/middleware/rateLimiter.js`:
     - Lines 14–17:
       ```javascript
       const ip = req.headers['cf-connecting-ip'] || 
                  req.headers['x-forwarded-for']?.split(',')[0].trim() || 
                  req.socket?.remoteAddress || 
                  'anonymous';
       ```
   - In `scratch/benchmark_concurrency.cjs`:
     - Lines 27–31:
       ```javascript
       headers: {
         'Content-Type': 'application/json',
         'cf-connecting-ip': `192.168.1.${Math.floor(Math.random() * 250) + 1}`
       }
       ```
   - The benchmark specifically evades rate limiting by rotating client-forged `cf-connecting-ip` headers on every request.

3. **Rate Limiting Mounting & Calibration in Express:**
   - In `server/server.js`:
     - Line 31: `const app = express();` does not configure `app.set('trust proxy', 1)`.
     - Line 39: `app.use(apiLimiter);` is mounted globally across every endpoint.
     - Lines 51, 56, 57: `authLimiter` is mounted on `/api/auth`, `aiLimiter` on `/api/voice` and `/api/agents`.
   - In `server/middleware/rateLimiter.js`:
     - `authLimiter`: `windowSeconds: 900`, `maxRequests: 60`.
     - `aiLimiter`: `windowSeconds: 60`, `maxRequests: 25`.
     - `apiLimiter`: `windowSeconds: 60`, `maxRequests: 300`.
   - Under 1,000 active concurrent users or behind an institutional university campus NAT (where 50–100 students share a single public IP), the global `apiLimiter` of 300 req/min will trigger HTTP 429 within 3–5 seconds, locking out valid scholars.
   - Public read endpoints (`/api/faculty`, `/api/fellowships`, `/api/health`) lack a dedicated high-throughput read limiter and are unnecessarily constrained by `apiLimiter`.

4. **Existing Test Suite Baseline:**
   - Executed `npm --prefix server test`: 18 tests passing in 349ms (`tests/gateway.test.js`).
   - Executed `node --test --env-file=server/.env server/tests/offline_sync.test.js`: 2 tests passing in 87ms.
   - Executed `node scratch/benchmark_concurrency.cjs`: 500 requests across 50 sockets complete with 100% 2xx status.

---

## 2. Logic Chain

1. **Event Loop Starvation -> Async Scrypt Conversion:**
   - From Observation 1: `crypto.scryptSync` executes on the single V8 event loop thread. Scrypt takes ~30–70ms per call.
   - If 50 students attempt concurrent registration or authentication, 50 * 50ms = 2,500ms of CPU execution locks the single thread.
   - Health checks, database callbacks, and Redis cache reads are unable to execute during this window, causing HTTP 504 timeouts.
   - Converting to `util.promisify(crypto.scrypt)` delegates the computation to the `libuv` worker thread pool (`UV_THREADPOOL_SIZE`), freeing the event loop to continue servicing I/O immediately.
   - In `server/routes/authRoutes.js`, because lines 31 and 121 are already `async` functions, calling `await hashPassword(...)` (line 61) and `await verifyPassword(...)` (line 151) is completely non-breaking and non-blocking.
   - In `server/utils/password.js`, checking buffer lengths before `crypto.timingSafeEqual(keyBuffer, derivedKey)` prevents uncaught `RangeError` exceptions if malformed hashes are verified.

2. **IP Spoofing -> Trusted Proxy Verification (`req.ip`):**
   - From Observation 2: `rateLimiter.js` blindly trusts `req.headers['cf-connecting-ip']` and the leftmost element of `req.headers['x-forwarded-for']`.
   - Any client can inject a randomized `cf-connecting-ip` header to generate new rate-limit keys `${prefix}:${ip}`, completely bypassing all rate limits (as demonstrated in `scratch/benchmark_concurrency.cjs`).
   - Conversely, an attacker can specify a target student's IP in `cf-connecting-ip` to exhaust that student's quota (DoS).
   - By enabling `app.set('trust proxy', 1)` in `server/server.js`, Express uses `proxy-addr` to trust only the immediate upstream reverse proxy (Cloudflare, Nginx, ALB, or Ingress) and reliably populates `req.ip`.
   - In `rateLimiter.js`, replacing header parsing with `req.ip || req.socket?.remoteAddress || '127.0.0.1'` ensures that spoofed headers from direct clients are disregarded.
   - For authenticated users, keying by `req.user?.id` when present prevents students in a university computer lab behind a common NAT gateway from sharing a single IP rate-limit bucket.

3. **1,000-User Concurrency -> Differentiated Rate Limiting:**
   - From Observation 3: The current global `apiLimiter` (300 req/min) chokes the gateway under 1,000 active concurrent users.
   - Public reads (`/api/faculty`, `/api/fellowships`) are backed by Redis caching (`X-Cache: HIT`, sub-5ms) and should be served with high throughput (**1,200 req/min**).
   - Auth endpoints (`/api/auth/*`) require credential brute-force protection, but 60 req / 15 min is too restrictive for campus NATs; **120 req / 15 min** (~8 req/min) prevents dictionary attacks while tolerating multi-user lab logins.
   - AI endpoints (`/api/voice/*`, `/api/agents/*`) invoke LLMs and TTS models; **30 req/min** protects model token quotas while enabling interactive multi-turn dialogue.
   - State-mutating API operations (`/api/students`, `/api/outreach`, `/api/jobs`, `/api/ingest`, `/api/billing`) are capped at **600 req/min** (10 req/s per user/IP), preventing database pool exhaustion.
   - Health check (`/api/health`) is unthrottled, ensuring infrastructure probes (Kubernetes liveness/readiness, Docker health checks) are never 429'd.

---

## 3. Caveats

1. **Proxy Hop Depth:**
   - Setting `app.set('trust proxy', 1)` assumes exactly one reverse proxy hop (e.g. Cloudflare -> Express, or Nginx -> Express, or K8s Ingress -> Express). If an architecture places multiple proxies in front of Express (e.g., Cloudflare -> AWS ALB -> Nginx -> Express), the trust proxy setting should be configured to the appropriate hop count or subnet range via `process.env.TRUST_PROXY || 1`.
2. **Worker Threadpool Sizing (`UV_THREADPOOL_SIZE`):**
   - Node.js defaults to 4 libuv worker threads. If 100 concurrent scrypt operations occur simultaneously, they queue in the thread pool. For production deployments with 1,000 concurrent users, launching Node with `UV_THREADPOOL_SIZE=64` (e.g. in `docker-compose.prod.yml` or container startup script) maximizes hashing throughput without blocking the event loop.
3. **In-Memory Cache vs Upstash Redis:**
   - In local development without Redis, `rateLimiter.js` falls back to `memoryStore` in `redisCache.js`. This works per-process. In a horizontally scaled multi-pod Kubernetes cluster, `REDIS_URL` or Upstash Redis ensures rate-limit states are synchronized across pods.

---

## 4. Conclusion

1. **Feature 1 (Async Password Hashing):**
   - `server/utils/password.js` must be refactored to use `util.promisify(crypto.scrypt)` for both `hashPassword` and `verifyPassword`, adding buffer length checks before `crypto.timingSafeEqual`.
   - `server/routes/authRoutes.js` must `await` `hashPassword` at line 61 and `await` `verifyPassword` at line 151.
2. **Feature 2 (Anti-Abuse Rate Limiting):**
   - `server/middleware/rateLimiter.js` must be updated to eliminate unverified `cf-connecting-ip` and `x-forwarded-for` parsing, replacing them with `req.ip || req.socket?.remoteAddress || '127.0.0.1'` and user-aware keying (`req.user?.id ? 'usr:...' : 'ip:...'`).
   - Calibrate differentiated rate limiters: `publicReadLimiter` (1,200 req/min), `authLimiter` (120 req/15min), `aiLimiter` (30 req/min), and `apiLimiter` (600 req/min), all with environment variable overrides.
   - `server/server.js` must configure `app.set('trust proxy', 1)`, remove the global 300 req/min `apiLimiter` choke point, and mount the differentiated limiters per route category.
3. Complete implementation diffs and architectural documentation are recorded in `analysis.md`.

---

## 5. Verification Method

To independently verify the implementation:

1. **Gateway Test Suite:**
   ```bash
   npm --prefix server test
   ```
   *Expected outcome:* All 18 tests pass with 0 errors.

2. **Offline Sync Test Suite:**
   ```bash
   node --test --env-file=server/.env server/tests/offline_sync.test.js
   ```
   *Expected outcome:* All tests pass.

3. **Concurrency & Rate Limit Load Verification:**
   - In `scratch/benchmark_concurrency.cjs`, remove the spoofed `'cf-connecting-ip'` header at lines 29–30.
   - Execute:
     ```bash
     node scratch/benchmark_concurrency.cjs
     ```
   *Expected outcome:* 500 requests across 50 sockets complete with **100% 2xx status** and **0 rate-limited (429) failures**, proving that `publicReadLimiter` (1,200 req/min) correctly handles concurrent load without header spoofing.

4. **IP Spoofing Immunity Verification:**
   - Send requests with `curl -H "cf-connecting-ip: 10.99.99.99" http://localhost:5000/api/faculty`.
   - Inspect response headers: `X-RateLimit-Limit: 1200`, and verify the server rate-limits based on the true client IP (`req.ip`), disregarding the spoofed header.

5. **Invalidation Conditions:**
   - Any appearance of `crypto.scryptSync` in `server/utils/password.js`.
   - Unhandled promises in `server/routes/authRoutes.js` (missing `await` on password methods).
   - Any direct reference to `req.headers['cf-connecting-ip']` or raw `req.headers['x-forwarded-for']` in `server/middleware/rateLimiter.js`.
   - Missing `app.set('trust proxy', ...)` in `server/server.js`.
   - Failure of `npm --prefix server test` or elevated error rate (>1%) on the concurrency benchmark.
