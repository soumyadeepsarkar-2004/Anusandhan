# Milestone 1 Technical Analysis: Feature 1 (Async Password Hashing) & Feature 2 (Anti-Abuse Rate Limiting)

**Author:** teamwork_explorer instance 1 (Milestone 1: Security Hardening & Authentication)  
**Date:** 2026-11-03  
**Status:** Completed Analysis  
**Working Directory:** `c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_m1_r1_1\`

---

## 1. Executive Summary

This investigation provides the detailed architectural analysis and concrete, verified diff recommendations for the first two core features of **Milestone 1 (Security Hardening & Authentication)**:
1. **Feature 1: Asynchronous Password Hashing**: Replacing `crypto.scryptSync` with `util.promisify(crypto.scrypt)` in `server/utils/password.js` and updating all callers in `server/routes/authRoutes.js` to `await` the resulting promises. This eliminates a critical event-loop blocking bottleneck where concurrent logins stall the single-threaded Node.js gateway for seconds.
2. **Feature 2: Anti-Abuse Rate Limiting**: Remediating the critical **SEC-01** rate limit bypass vulnerability in `server/middleware/rateLimiter.js`. Raw header trusting (`cf-connecting-ip`, `x-forwarded-for`) is eliminated in favor of Express's verified `req.ip` backed by `app.set('trust proxy', 1)` in `server/server.js`. Limits are calibrated specifically for 1,000 active concurrent university scholars, introducing differentiated tiers for public cached reads (1,200 req/min), authentication brute-force protection (120 req/15min), AI/voice microservice quotas (30 req/min), and state-mutating API operations (600 req/min).

---

## 2. Feature 1: Asynchronous Password Hashing

### 2.1 Problem Analysis & Concurrency Bottleneck
In `server/utils/password.js`, password hashing and verification are implemented synchronously using `crypto.scryptSync(password, salt, 64)`.
- **Current Lines:**
  - `server/utils/password.js:9`: `const derivedKey = crypto.scryptSync(password, salt, 64);`
  - `server/utils/password.js:19`: `const derivedKey = crypto.scryptSync(password, salt, 64);`
- **Impact under Concurrency:**
  Scrypt is deliberately compute- and memory-intensive to defeat hardware brute-forcing. A single execution of `crypto.scryptSync` consumes ~30–70ms of dedicated CPU time. Because Node.js executes JavaScript on a single thread, `scryptSync` blocks the main event loop completely.
  Under an influx of students (e.g. 50 concurrent login/registration requests during a class or conference session), the Node.js event loop freezes for **1.5 to 3.5 seconds**. During this freeze:
  - Network I/O callbacks are stalled.
  - Express cannot accept incoming TCP connections.
  - Health checks (`GET /api/health`) and cached read queries (`GET /api/fellowships`) time out.
  - Upstream reverse proxies (Nginx / ALB / Ingress) return HTTP 504 Gateway Timeout.

### 2.2 Implementation Strategy
- Use `util.promisify(crypto.scrypt)` to offload cryptographic key derivation from the V8 event loop thread to Node's internal `libuv` worker thread pool (`UV_THREADPOOL_SIZE`).
- Change `hashPassword` and `verifyPassword` signatures to `async function`.
- Defensive hardening:
  - Validate that `storedHash` is a valid string containing `:` before splitting.
  - Guard `crypto.timingSafeEqual(keyBuffer, derivedKey)` with a length check (`keyBuffer.length !== derivedKey.length`). `crypto.timingSafeEqual` throws a fatal `RangeError` if the two buffer lengths do not match; returning `false` defensively avoids server crashes if a corrupted or legacy short hash is evaluated.
  - Wrap `verifyPassword` in `try ... catch` to safely return `false` on malformed hex or unexpected cryptographic errors.

### 2.3 Affected Files & Line Numbers

#### A. Target File: `server/utils/password.js`
- **Lines 5–21**
- **Existing Code:**
```javascript
import crypto from 'crypto';

export function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

export function verifyPassword(password, storedHash) {
  if (!storedHash || !storedHash.includes(':')) {
    return false;
  }
  const [salt, key] = storedHash.split(':');
  const keyBuffer = Buffer.from(key, 'hex');
  const derivedKey = crypto.scryptSync(password, salt, 64);
  return crypto.timingSafeEqual(keyBuffer, derivedKey);
}
```

- **Proposed Replacement Code:**
```javascript
/**
 * Secure Cryptographic Password Hashing Utility
 * Uses asynchronous Node.js crypto scrypt offloaded to libuv threadpool
 * to prevent main event loop starvation during concurrent auth bursts.
 */
import crypto from 'crypto';
import util from 'util';

const scryptAsync = util.promisify(crypto.scrypt);

/**
 * Asynchronously generates a salt and hashes a plaintext password using scrypt.
 * @param {string} password - Plaintext password
 * @returns {Promise<string>} Format: `${salt}:${derivedKeyHex}`
 */
export async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await scryptAsync(password, salt, 64);
  return `${salt}:${derivedKey.toString('hex')}`;
}

/**
 * Asynchronously verifies a password against a stored salt:hash string.
 * Validates buffer length before timingSafeEqual to prevent RangeError crashes.
 * @param {string} password - Plaintext password candidate
 * @param {string} storedHash - Stored hash formatted as `${salt}:${derivedKeyHex}`
 * @returns {Promise<boolean>}
 */
export async function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string' || !storedHash.includes(':')) {
    return false;
  }
  try {
    const [salt, key] = storedHash.split(':');
    if (!salt || !key) {
      return false;
    }
    const keyBuffer = Buffer.from(key, 'hex');
    const derivedKey = await scryptAsync(password, salt, 64);
    if (keyBuffer.length !== derivedKey.length) {
      return false;
    }
    return crypto.timingSafeEqual(keyBuffer, derivedKey);
  } catch {
    return false;
  }
}
```

#### B. Target File: `server/routes/authRoutes.js`
Search confirms `hashPassword` and `verifyPassword` are only invoked in two locations across the entire repository:
1. **Registration Handler (`POST /api/auth/register`)**:
   - **Line 61**:
     ```javascript
     // BEFORE (Line 61):
     const hashedPassword = hashPassword(password);

     // AFTER (Line 61):
     const hashedPassword = await hashPassword(password);
     ```
   - Context: Handler at line 31 is already declared `async (req, res) => { ... }`.
2. **Login Handler (`POST /api/auth/login`)**:
   - **Line 151**:
     ```javascript
     // BEFORE (Line 151):
     const isValid = verifyPassword(password, user.passwordHash);

     // AFTER (Line 151):
     const isValid = await verifyPassword(password, user.passwordHash);
     ```
   - Context: Handler at line 121 is already declared `async (req, res) => { ... }`.

---

## 3. Feature 2: Anti-Abuse Rate Limiting

### 3.1 Problem Analysis: IP Spoofing & Complete Bypass (SEC-01)
In `server/middleware/rateLimiter.js` lines 14–17:
```javascript
const ip = req.headers['cf-connecting-ip'] || 
           req.headers['x-forwarded-for']?.split(',')[0].trim() || 
           req.socket?.remoteAddress || 
           'anonymous';
```
- **Vulnerability Breakdown:**
  1. **Direct Header Trust:** External HTTP clients can supply arbitrary headers like `cf-connecting-ip: 10.0.0.1` or `x-forwarded-for: 10.0.0.1`.
  2. **Rate Limit Bypass:** An attacker can rotate pseudo-random IPs on every request (e.g. `cf-connecting-ip: 192.168.1.X`, as demonstrated in `scratch/benchmark_concurrency.cjs:29`). The sliding-window rate limiter constructs keys using `${prefix}:${ip}`. Because the IP is perpetually unique, the attacker completely bypasses the rate limiter and can flood the system with unbounded requests.
  3. **Targeted Denial of Service (Victim Framing):** An attacker can repeatedly send requests bearing a victim's IP in `cf-connecting-ip`, artificially exhausting the victim's rate limit quota and locking them out of the platform.

### 3.2 Secure Proxy Architecture & IP Extraction
- **Express Proxy Configuration:**
  In `server/server.js`, Express must be configured with `app.set('trust proxy', 1)`.
  When `trust proxy` is set to `1`:
  - Express evaluates `X-Forwarded-For` using the battle-tested `proxy-addr` library.
  - Express trusts only 1 hop upstream (e.g., Cloudflare, Nginx reverse proxy, AWS ALB, or Kubernetes Ingress).
  - Express populates `req.ip` securely by taking the client IP reported by the trusted proxy, ignoring any forged upstream headers injected by the client.
  - If no proxy is present (direct connection), Express uses `req.socket.remoteAddress`.
- **In `rateLimiter.js`:**
  Replace unverified header parsing with:
  ```javascript
  const ip = req.ip || req.socket?.remoteAddress || '127.0.0.1';
  ```
- **Campus Multi-Tenant User Awareness:**
  In university environments (e.g. IISc Bangalore, IITs, state colleges), hundreds of active scholars connect through a shared institutional NAT gateway / campus Wi-Fi proxy.
  If rate limits for authenticated routes are keyed strictly by IP, all students in a computer lab share the same quota.
  By checking `req.user?.id` when present, authenticated users are rate-limited individually:
  ```javascript
  const identifier = req.user?.id ? `usr:${req.user.id}` : `ip:${ip}`;
  ```

### 3.3 Rate Limit Calibration for 1,000 Active Users

#### Quantitative Scale Model:
- **Concurrency Target:** 1,000 active concurrent users.
- **Aggregated Gateway Throughput:** Assuming each active user generates an average of 15–30 requests per minute while actively exploring fellowships, reading faculty profiles, and querying agents:
  - System-wide traffic: ~250–500 requests/second total (~15,000–30,000 req/min).
  - Distributed across user sessions and IPs.
- **Campus NAT Contention:** Up to 100 students may share a single public IP.
- **Route Profiling & Calibration:**

| Limiter | Target Endpoints | Window | Max Requests | Rationale & Protection Target |
|---|---|---|---|---|
| **`publicReadLimiter`** | `GET /api/faculty`, `GET /api/fellowships`, `GET /api/health` | 60s (1 min) | **1,200 req/min** (Env: `RATE_LIMIT_MAX_PUBLIC`) | Backed by Redis/memory cache (`X-Cache: HIT`, sub-5ms). Accommodates rapid pagination, search filters, and high-density campus NATs without false positives. |
| **`authLimiter`** | `POST /api/auth/login`, `POST /api/auth/register`, `/api/auth/*` | 900s (15 min) | **120 req/15min** (Env: `RATE_LIMIT_MAX_AUTH`) | Prevents automated credential stuffing and dictionary attacks (~8 req/min). Accommodates multiple students logging in from a shared lab IP while blocking brute-force attacks. |
| **`aiLimiter`** | `POST /api/voice/*`, `POST /api/agents/*` | 60s (1 min) | **30 req/min** (Env: `RATE_LIMIT_MAX_AI`) | Expensive upstream AI inference (Google Gemini Flash, Sarvam Voice, FastAPI microservice). Allows interactive multi-turn voice dialog (~1 request every 2s) while shielding LLM token budgets. |
| **`apiLimiter`** | `POST /api/jobs`, `/api/students/*`, `/api/outreach/*`, `/api/ingest/*`, `/api/billing/*` | 60s (1 min) | **600 req/min** (Env: `RATE_LIMIT_MAX_API`) | Standard traffic shaping for database-write operations, background job submissions, and CRM actions (10 req/s per IP/user). |

### 3.4 Integration in `server/server.js`
In `server/server.js`:
1. Enable `app.set('trust proxy', 1);` immediately after creating `const app = express();`.
2. Do **not** apply a tight 300 req/min `apiLimiter` globally to every single route. Instead:
   - Mount differentiated limiters to route namespaces:
     - `/api/auth` -> `authLimiter`
     - `/api/faculty` & `/api/fellowships` -> `publicReadLimiter`
     - `/api/voice` & `/api/agents` -> `aiLimiter`
     - `/api/students`, `/api/outreach`, `/api/jobs`, `/api/ingest`, `/api/billing` -> `apiLimiter`
   - Ensure `/api/health` is exempt from aggressive rate limiting so Kubernetes and Docker health checks are never rejected with HTTP 429.

---

## 4. Concrete Code Diff Recommendations

### 4.1 Diff for `server/utils/password.js`

```diff
--- a/server/utils/password.js
+++ b/server/utils/password.js
@@ -1,22 +1,46 @@
 /**
  * Secure Cryptographic Password Hashing Utility
- * Uses Node.js crypto scrypt with unique salt for high-security password storage.
+ * Uses asynchronous Node.js crypto scrypt offloaded to libuv threadpool
+ * to prevent main event loop starvation during concurrent auth bursts.
  */
 import crypto from 'crypto';
+import util from 'util';
 
-export function hashPassword(password) {
+const scryptAsync = util.promisify(crypto.scrypt);
+
+/**
+ * Asynchronously generates a salt and hashes a plaintext password using scrypt.
+ * @param {string} password - Plaintext password
+ * @returns {Promise<string>} Format: `${salt}:${derivedKeyHex}`
+ */
+export async function hashPassword(password) {
   const salt = crypto.randomBytes(16).toString('hex');
-  const derivedKey = crypto.scryptSync(password, salt, 64);
+  const derivedKey = await scryptAsync(password, salt, 64);
   return `${salt}:${derivedKey.toString('hex')}`;
 }
 
-export function verifyPassword(password, storedHash) {
-  if (!storedHash || !storedHash.includes(':')) {
+/**
+ * Asynchronously verifies a password against a stored salt:hash string.
+ * Validates buffer length before timingSafeEqual to prevent RangeError crashes.
+ * @param {string} password - Plaintext password candidate
+ * @param {string} storedHash - Stored hash formatted as `${salt}:${derivedKeyHex}`
+ * @returns {Promise<boolean>}
+ */
+export async function verifyPassword(password, storedHash) {
+  if (!storedHash || typeof storedHash !== 'string' || !storedHash.includes(':')) {
     return false;
   }
-  const [salt, key] = storedHash.split(':');
-  const keyBuffer = Buffer.from(key, 'hex');
-  const derivedKey = crypto.scryptSync(password, salt, 64);
-  return crypto.timingSafeEqual(keyBuffer, derivedKey);
+  try {
+    const [salt, key] = storedHash.split(':');
+    if (!salt || !key) {
+      return false;
+    }
+    const keyBuffer = Buffer.from(key, 'hex');
+    const derivedKey = await scryptAsync(password, salt, 64);
+    if (keyBuffer.length !== derivedKey.length) {
+      return false;
+    }
+    return crypto.timingSafeEqual(keyBuffer, derivedKey);
+  } catch {
+    return false;
+  }
 }
```

---

### 4.2 Diff for `server/routes/authRoutes.js`

```diff
--- a/server/routes/authRoutes.js
+++ b/server/routes/authRoutes.js
@@ -58,7 +58,7 @@ router.post('/register', async (req, res) => {
       return res.status(409).json({ error: 'An account with this email address already exists. Please sign in.' });
     }
 
-    const hashedPassword = hashPassword(password);
+    const hashedPassword = await hashPassword(password);
     const userId = 'usr_' + Date.now().toString(36);
 
     const userData = {
@@ -148,7 +148,7 @@ router.post('/login', async (req, res) => {
       return res.status(401).json({ error: 'No account found with this email. Please check your credentials or register.' });
     }
 
-    const isValid = verifyPassword(password, user.passwordHash);
+    const isValid = await verifyPassword(password, user.passwordHash);
     if (!isValid) {
       return res.status(401).json({ error: 'Incorrect password. Please try again.' });
     }
```

---

### 4.3 Diff for `server/middleware/rateLimiter.js`

```diff
--- a/server/middleware/rateLimiter.js
+++ b/server/middleware/rateLimiter.js
@@ -1,22 +1,28 @@
 /**
  * Production Sliding-Window Rate Limiting Middleware
  * Protects APIs, Auth, and AI endpoints against abuse and DDoS attacks.
+ * Calibrated for up to 1,000 active concurrent university scholars and students.
  */
 import { cache } from '../services/redisCache.js';
 
 export const createRateLimiter = ({
   windowSeconds = 60,
   maxRequests = 100,
   prefix = 'rl',
-  message = 'Too many requests. Please slow down and try again later.'
+  message = 'Too many requests. Please slow down and try again later.',
+  keyGenerator = null
 }) => {
   return async (req, res, next) => {
-    const ip = req.headers['cf-connecting-ip'] || 
-               req.headers['x-forwarded-for']?.split(',')[0].trim() || 
-               req.socket?.remoteAddress || 
-               'anonymous';
+    // 1. Secure Client IP Extraction: Rely on Express's validated req.ip (powered by 'trust proxy')
+    // Never trust raw untrusted cf-connecting-ip or unverified x-forwarded-for headers directly
+    const ip = req.ip || req.socket?.remoteAddress || '127.0.0.1';
 
-    const key = `${prefix}:${ip}`;
+    // 2. Identifier: Supports per-user rate limiting if authenticated, falling back to verified IP
+    const identifier = keyGenerator
+      ? keyGenerator(req)
+      : (req.user?.id ? `usr:${req.user.id}` : `ip:${ip}`);
+
+    const key = `${prefix}:${identifier}`;
     const now = Math.floor(Date.now() / 1000);
 
     try {
@@ -51,29 +57,37 @@ export const createRateLimiter = ({
   };
 };
 
-// 1. Strict Auth Limiter (Prevents credential brute-forcing)
+// 1. Strict Auth Limiter (Prevents credential brute-forcing; calibrated for 1,000 users / campus NATs)
 export const authLimiter = createRateLimiter({
   windowSeconds: 900, // 15 minutes
-  maxRequests: 60,
+  maxRequests: process.env.RATE_LIMIT_MAX_AUTH ? parseInt(process.env.RATE_LIMIT_MAX_AUTH, 10) : 120,
   prefix: 'rl:auth',
   message: 'Too many authentication attempts. Please try again in 15 minutes.'
 });
 
-// 2. AI & Voice Endpoint Limiter (Protects free-tier LLM/TTS quotas)
+// 2. AI & Voice Endpoint Limiter (Protects LLM/TTS quotas while permitting interactive sessions)
 export const aiLimiter = createRateLimiter({
   windowSeconds: 60,
-  maxRequests: 25,
+  maxRequests: process.env.RATE_LIMIT_MAX_AI ? parseInt(process.env.RATE_LIMIT_MAX_AI, 10) : 30,
   prefix: 'rl:ai',
   message: 'AI reasoning queue is currently busy. Please wait a few seconds.'
 });
 
-// 3. General API Limiter (Standard traffic shaping)
+// 3. Public Read Limiter (High-throughput for cached faculty catalog, fellowship searches, health checks)
+export const publicReadLimiter = createRateLimiter({
+  windowSeconds: 60,
+  maxRequests: process.env.RATE_LIMIT_MAX_PUBLIC ? parseInt(process.env.RATE_LIMIT_MAX_PUBLIC, 10) : 1200,
+  prefix: 'rl:public',
+  message: 'High read volume detected. Please slow down.'
+});
+
+// 4. General API Limiter (Standard traffic shaping for state mutations and general endpoints)
 export const apiLimiter = createRateLimiter({
   windowSeconds: 60,
-  maxRequests: 300,
+  maxRequests: process.env.RATE_LIMIT_MAX_API ? parseInt(process.env.RATE_LIMIT_MAX_API, 10) : 600,
   prefix: 'rl:api',
   message: 'Traffic threshold reached. Please throttle requests.'
 });
 
-export default { createRateLimiter, authLimiter, aiLimiter, apiLimiter };
+export default { createRateLimiter, authLimiter, aiLimiter, publicReadLimiter, apiLimiter };
```

---

### 4.4 Diff for `server/server.js`

```diff
--- a/server/server.js
+++ b/server/server.js
@@ -22,7 +22,7 @@ import { ingestionScheduler } from './services/dataIngestionScheduler.js';
 import { PythonBridge } from './services/pythonBridge.js';
 import { cache } from './services/redisCache.js';
-import { authLimiter, aiLimiter, apiLimiter } from './middleware/rateLimiter.js';
+import { authLimiter, aiLimiter, publicReadLimiter, apiLimiter } from './middleware/rateLimiter.js';
 import { jobQueue } from './queues/jobQueue.js';
 import { pool } from './db/supabaseClient.js';
 
@@ -31,6 +31,8 @@ dotenv.config();
 const app = express();
+// Enable secure proxy trust for reverse proxies (Nginx, Cloudflare, K8s Ingress, Docker)
+app.set('trust proxy', 1);
 const PORT = process.env.PORT || 5000;
 const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/researchintern_pro';
 
@@ -36,7 +38,6 @@ const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/resea
 // 1. Global Middleware & Rate Limiting
 app.use(cors({ origin: '*' }));
 app.use(express.json({ limit: '10mb' }));
 app.use(morgan('dev'));
-app.use(apiLimiter);
 
 // 2. Resilient Database Layer (Supabase PostgreSQL / MongoDB / In-Memory)
@@ -49,15 +50,15 @@ mongoose.connect(MONGODB_URI, {
 });
 
 // 3. Mount Routes with Targeted Rate Limiters
-app.use('/api/auth', authLimiter, authRoutes);
-app.use('/api/students', studentRoutes);
-app.use('/api/faculty', facultyRoutes);
-app.use('/api/fellowships', fellowshipRoutes);
-app.use('/api/outreach', outreachRoutes);
+app.use('/api/auth', authLimiter, authRoutes);
+app.use('/api/faculty', publicReadLimiter, facultyRoutes);
+app.use('/api/fellowships', publicReadLimiter, fellowshipRoutes);
+app.use('/api/students', apiLimiter, studentRoutes);
+app.use('/api/outreach', apiLimiter, outreachRoutes);
 app.use('/api/voice', aiLimiter, voiceRoutes);
 app.use('/api/agents', aiLimiter, agentRoutes);
-app.use('/api/ingest', ingestionRoutes);
-app.use('/api/billing', billingRoutes);
+app.use('/api/ingest', apiLimiter, ingestionRoutes);
+app.use('/api/billing', apiLimiter, billingRoutes);
```

---

## 5. Verification & Testing Plan

### 5.1 Unit Tests for Password Hashing
Implement unit tests in `server/tests/password.test.js`:
1. `hashPassword`: Verify returned format is `${salt}:${derivedKey}`, length of salt is 32 hex chars, key is 128 hex chars.
2. `verifyPassword`: Verify that correct password matches `true`.
3. `verifyPassword`: Verify that incorrect password matches `false`.
4. `verifyPassword`: Verify that malformed hash string (missing colon, empty, non-hex, null) returns `false` without throwing an unhandled exception.
5. `verifyPassword`: Verify that hash with invalid key buffer length does not trigger `RangeError` from `timingSafeEqual`.
6. Non-blocking verification: Hash 20 passwords concurrently using `Promise.all` and ensure total execution time scales across worker threads without freezing an active setInterval timer on the main loop.

### 5.2 Unit Tests for Anti-Abuse Rate Limiter
Implement unit tests in `server/tests/rateLimiter.test.js`:
1. **IP Extraction Validation**:
   - Send request with `cf-connecting-ip: 1.2.3.4` without trusted proxy header -> verify limiter uses `req.ip` (`127.0.0.1`), NOT the spoofed header.
   - Send request with `x-forwarded-for: 5.6.7.8, 127.0.0.1` with `trust proxy: 1` -> verify limiter correctly uses the trusted hop client IP `5.6.7.8`.
2. **Quota Enforcement & Headers**:
   - Send requests up to `maxRequests` -> verify `X-RateLimit-Limit`, `X-RateLimit-Remaining` decrement correctly.
   - Send `maxRequests + 1` -> verify response is HTTP 429 with `Retry-After` header and error payload `{ error: 'Rate limit exceeded' }`.
3. **Fail-Open Resilience**:
   - Simulate cache error (mock cache throwing error) -> verify middleware invokes `next()` cleanly without crashing the gateway.

### 5.3 High-Concurrency Benchmark Validation
- Run `node scratch/benchmark_concurrency.cjs`.
- In `scratch/benchmark_concurrency.cjs`, remove the spoofed `cf-connecting-ip` header at lines 29-30 so all requests originate from standard `127.0.0.1`.
- Verify that with `publicReadLimiter` set to 1,200 req/min, 500 requests across 50 sockets complete with **100% success rate (HTTP 200/202)** and **0 rate-limited (429) errors**.
