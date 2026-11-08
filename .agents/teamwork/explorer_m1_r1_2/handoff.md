# Handoff Report: Milestone 1 Security Hardening (Features 5 & 6)

**Agent Identity**: explorer_m1_r1_2 (Explorer Instance 2)  
**Parent Orchestrator ID**: 369038bb-e0c3-488c-afe2-41c9a6e66fc2  
**Timestamp**: 2026-11-03T20:47:00Z  
**Type**: Hard (Task Complete)  

---

## 1. Observation

### Feature 5: Route Authentication Guards
1. **`server/routes/studentRoutes.js`**:
   - Lines 1–4: `Student` model imported; `authenticateToken` is NOT imported.
   - Line 36: `router.get('/me', async (req, res) => {`
   - Line 48: `router.put('/me', async (req, res) => {`
   - Neither route has authentication middleware.
2. **`server/routes/outreachRoutes.js`**:
   - Lines 1–5: `Outreach` model and `PythonBridge` imported; `authenticateToken` is NOT imported.
   - Line 49: `router.post('/draft', async (req, res) => {`
   - Line 73: `router.post('/enqueue', async (req, res) => {`
   - Line 103: `router.get('/', async (req, res) => {`
   - Line 114: `router.put('/:id/status', async (req, res) => {`
   - Endpoints `/draft`, `/enqueue`, `/`, and `/:id/status` are unauthenticated.
   - Line 19: `router.get('/oauth/google-url', (req, res) => {` provides Google OAuth consent URL.
3. **`server/routes/ingestionRoutes.js`**:
   - Lines 1–5: `ingestionService` and `ingestionScheduler` imported; `authenticateToken` is NOT imported.
   - Line 37: `router.post('/refresh', async (req, res) => {` triggers `ingestionService.runFullIngestionSweep()`.
   - Line 50: `router.post('/schedule', (req, res) => {` reconfigures scraper interval `ingestionScheduler.setIntervalMinutes(intervalMinutes)`.
   - Both triggers are unauthenticated.
   - Lines 8 (`GET /status`) and 13 (`GET /postings`) provide read-only data for health monitoring and student searching.
4. **`server/routes/agentRoutes.js`**:
   - Lines 1–5: `PythonBridge` imported; `authenticateToken` is NOT imported.
   - Lines 7 (`POST /paper-pitch`), 43 (`POST /mock-interview`), 72 (`POST /cv-diagnostic`), and 112 (`POST /grant-radar`) invoke AI microservice models via `PythonBridge` without any authentication.

### Feature 6: IDOR and Cryptography Fixes
5. **`server/routes/billingRoutes.js` (IDOR)**:
   - Line 77: `router.post('/create-order', authenticateToken, ...)` assigns `userId: req.user.id` to the order record (line 98).
   - Lines 170–176: `router.get('/invoice/:orderId', authenticateToken, (req, res) => { const { orderId } = req.params; const order = orderHistory.get(orderId); if (!order) return res.status(404)... }`.
   - There is NO check that `order.userId === req.user.id`. Any logged-in user can query any orderId and retrieve full customer invoices.
6. **`server/server.js` and `server/routes/billingRoutes.js` (Webhook Raw Body Parsing Conflict)**:
   - `server/server.js` line 37: `app.use(express.json({ limit: '10mb' }));` is mounted globally before `app.use('/api/billing', billingRoutes)` at line 59.
   - `server/routes/billingRoutes.js` line 127: `router.post('/webhook/razorpay', express.raw({ type: 'application/json' }), ...)`: `express.raw()` is ignored because `express.json()` already parsed and consumed the stream.
   - Line 130: `const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);`: Serializing the parsed JSON object does not match the original byte-for-byte wire representation that Razorpay signed.
7. **`server/routes/billingRoutes.js` (Webhook `crypto.timingSafeEqual` RangeError Crash)**:
   - Line 138: `const isAuthentic = crypto.timingSafeEqual(Buffer.from(signature || '', 'utf8'), Buffer.from(expectedSignature, 'utf8'));`
   - Node.js `crypto.timingSafeEqual` throws `RangeError [ERR_CRYPTO_TIMING_SAFE_EQUAL_LENGTH]: Input buffers must have the same byte length` if buffer lengths differ.
   - When `signature` is missing or length != 64 bytes, execution jumps to catch block (line 164), returning HTTP 500 instead of HTTP 400.
   - Line 143: `if (!isAuthentic && process.env.NODE_ENV === 'production')`: In non-production environments, signature verification failure is bypassed.

---

## 2. Logic Chain

1. **Route Guards (Feature 5)**:
   - Supported by Observations 1–4.
   - Exposing profile modification (`PUT /api/students/me`), cold email dispatch (`POST /api/outreach/enqueue`), web scraper execution (`POST /api/ingest/refresh`, `POST /api/ingest/schedule`), and heavy AI endpoints (`POST /api/agents/*`) without authentication allows unauthorized data mutation, spam generation, scraper DoS, and LLM token draining.
   - Importing `authenticateToken` from `server/middleware/authMiddleware.js` and adding it to these endpoints verifies the JWT Bearer token and assigns `req.user`. Unauthenticated calls receive HTTP 401.

2. **IDOR Resolution (Feature 6)**:
   - Supported by Observation 5.
   - In `billingRoutes.js`, because `orderHistory` records `userId: req.user.id` at creation time, comparing `order.userId !== req.user.id` (and permitting `req.user.role === 'admin'`) enforces strict object-level access control.
   - Unauthorized attempts return HTTP 403 Forbidden.

3. **Webhook Raw Body Conflict Resolution (Feature 6)**:
   - Supported by Observation 6.
   - `express.json()` supports a `verify: (req, res, buf) => { req.rawBody = buf; }` hook that captures the exact unmutated byte buffer before JSON parsing.
   - In `billingRoutes.js`, removing `express.raw({ type: 'application/json' })` and passing `req.rawBody` directly into `crypto.createHmac().update(rawPayload)` guarantees exact byte alignment with Razorpay's HMAC signature.

4. **Timing-Safe Equality Crash Prevention (Feature 6)**:
   - Supported by Observation 7.
   - Checking `signatureBuf.length === expectedBuf.length` before invoking `crypto.timingSafeEqual` prevents Node.js from throwing `RangeError`.
   - Returning HTTP 400 when `signature` is missing or inauthentic enforces security across all environments.

---

## 3. Caveats

1. **Existing Test Suite (`server/tests/gateway.test.js`)**:
   - `gateway.test.js` contains 3 tests that call protected endpoints without Authorization headers:
     - Lines 152 & 168: `POST /api/outreach/enqueue`
     - Line 226: `POST /api/ingest/schedule`
   - Applying `authenticateToken` will cause these 3 tests to receive HTTP 401 unless updated with a valid Bearer token (using the user registration flow demonstrated at line 109 of `gateway.test.js`).
2. **Public vs Guarded Ingestion Endpoints**:
   - `GET /api/ingest/status` and `GET /api/ingest/postings` must remain unauthenticated so that public health checks and opportunity search functions can query them without friction.
3. **Multi-Tenant State Isolation (Milestone 2)**:
   - In `studentRoutes.js`, `Student.findOne({ id: 'student_active' })` uses a global singleton. Guarding the route with `authenticateToken` secures the endpoint for M1, but per-user isolation (`id: req.user.id`) is scheduled for Milestone 2 (Feature 8).

---

## 4. Conclusion

The investigation provides an actionable plan to resolve all Feature 5 and Feature 6 vulnerabilities:
1. Protect `/api/students/me`, `/api/outreach/enqueue`, `/api/outreach/:id/status`, `/api/outreach/draft`, `/api/outreach/`, `/api/ingest/refresh`, `/api/ingest/schedule`, and `/api/agents/*` using `authenticateToken`.
2. Fix IDOR in `server/routes/billingRoutes.js` by checking `order.userId === req.user.id`.
3. Capture `req.rawBody` via `express.json({ verify })` in `server/server.js`, remove route-level `express.raw()`, and pass `rawPayload` into HMAC update.
4. Prevent `crypto.timingSafeEqual` buffer length mismatch crashes in `billingRoutes.js` with length pre-checks, returning clean HTTP 400 responses.

Full diff specifications are documented in `c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_m1_r1_2\analysis.md`.

---

## 5. Verification Method

1. **Route Authentication Checks**:
   ```bash
   curl -i http://localhost:5000/api/students/me
   # Must return 401 Unauthorized
   curl -i -X POST http://localhost:5000/api/outreach/enqueue -H "Content-Type: application/json" -d "{}"
   # Must return 401 Unauthorized
   curl -i -X POST http://localhost:5000/api/ingest/refresh
   # Must return 401 Unauthorized
   curl -i -X POST http://localhost:5000/api/agents/paper-pitch -H "Content-Type: application/json" -d "{}"
   # Must return 401 Unauthorized
   ```

2. **IDOR Check**:
   - Create an order with User A's token.
   - Request `GET /api/billing/invoice/:orderId` with User B's token.
   - Must return 403 Forbidden with `{"error":"Access denied: You do not have permission to view this invoice."}`.

3. **Webhook Verification & Crash Prevention**:
   - Send `POST /api/billing/webhook/razorpay` with malformed signature (`x-razorpay-signature: short`).
   - Must return 400 Bad Request, NOT 500 RangeError.
   - Send `POST /api/billing/webhook/razorpay` with valid HMAC matching `req.rawBody`.
   - Must return 200 OK with `{"status":"ok","verified":true}`.

4. **Automated Test Command**:
   ```bash
   cd c:\PROJECTS\ResearchIntern_Pro\server && npm test
   ```
