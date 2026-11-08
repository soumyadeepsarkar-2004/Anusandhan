# Milestone 1: Security Hardening Analysis — Features 5 & 6
**Explorer Instance 2 Analysis Report**  
**Working Directory**: `.agents/teamwork/explorer_m1_r1_2/`  
**Date**: 2026-11-03T20:46:00Z  
**Status**: Completed (Read-Only Investigation)  

---

## 1. Executive Summary

This investigation covers two core security vulnerabilities in Milestone 1 (Security Hardening & Authentication) of the Anusandhan platform:
1. **Feature 5 (Route Authentication Guards)**: Critical Express routes (`/api/students/me`, `/api/outreach/*`, `/api/ingest/*`, and `/api/agents/*`) currently lack authentication middleware. Unauthenticated anonymous users can modify student profile state, dispatch academic cold outreach, trigger heavy internet scraping pipelines, and consume costly AI inference tokens (Google Gemini / Python microservice).
2. **Feature 6 (IDOR & Cryptography Fixes)**: 
   - **IDOR**: In `server/routes/billingRoutes.js`, `GET /invoice/:orderId` does not check order ownership (`order.userId === req.user.id`), enabling any authenticated user to inspect arbitrary customer invoices and financial metadata.
   - **Webhook Raw-Body Conflict**: In `server/server.js`, global `express.json()` consumes the incoming request stream before the route-level `express.raw()` in `billingRoutes.js` can process it, forcing fallback to `JSON.stringify(req.body)`, which invalidates cryptographic HMAC signatures.
   - **Webhook `timingSafeEqual` Crash**: In `billingRoutes.js`, passing mismatched buffer lengths to `crypto.timingSafeEqual` throws an unhandled `RangeError` (triggering an unhandled 500 error instead of a 400 rejection) and bypasses signature checks in non-production environments.

Concrete code diffs, line numbers, and test compatibility strategies are detailed below.

---

## 2. Feature 5: Route Authentication Guard Across Express Routes

### 2.1. `server/routes/studentRoutes.js`

#### Direct Observations
- **File**: `server/routes/studentRoutes.js`
- **Lines 1–4**:
  ```javascript
  1: import express from 'express';
  2: import { Student } from '../models/Student.js';
  3: 
  4: const router = express.Router();
  ```
- **Line 36**: `router.get('/me', async (req, res) => {`
- **Line 48**: `router.put('/me', async (req, res) => {`
- **Finding**: `authenticateToken` is never imported or applied. Any anonymous request to `GET /api/students/me` or `PUT /api/students/me` succeeds and can read or overwrite the student profile.

#### Proposed Modification
- Import `authenticateToken` from `../middleware/authMiddleware.js`.
- Insert `authenticateToken` as route middleware on both `GET /me` and `PUT /me`.

```javascript
// Before (Lines 36 & 48)
router.get('/me', async (req, res) => {
router.put('/me', async (req, res) => {

// After
router.get('/me', authenticateToken, async (req, res) => {
router.put('/me', authenticateToken, async (req, res) => {
```

---

### 2.2. `server/routes/outreachRoutes.js`

#### Direct Observations
- **File**: `server/routes/outreachRoutes.js`
- **Lines 1–5**:
  ```javascript
  1: import express from 'express';
  2: import { Outreach } from '../models/Outreach.js';
  3: import { PythonBridge } from '../services/pythonBridge.js';
  4: 
  5: const router = express.Router();
  ```
- **Existing Routes**:
  - `GET /oauth/google-url` (line 19): Generates Google OAuth consent URL. Should remain public for unauthenticated onboarding / auth init.
  - `POST /oauth/callback` (line 33): Handles authorization code exchange.
  - `POST /draft` (line 49): Generates 140-word academic pitch draft via PythonBridge / local synthesis.
  - `POST /enqueue` (line 73): Enqueues cold email with jitter.
  - `GET /` (line 103): Fetches student CRM application list.
  - `PUT /:id/status` (line 114): Updates application stage.
- **Finding**: `/enqueue`, `/:id/status`, `/draft`, and `GET /` have zero authentication. Any unauthenticated caller can spam professors, query student applications, or alter application pipeline statuses.

#### Proposed Modification
- Import `authenticateToken` from `../middleware/authMiddleware.js`.
- Apply `authenticateToken` to `/draft`, `/enqueue`, `GET /`, and `PUT /:id/status`.
- Retain `GET /oauth/google-url` as public to preserve OAuth initiation.

---

### 2.3. `server/routes/ingestionRoutes.js`

#### Direct Observations
- **File**: `server/routes/ingestionRoutes.js`
- **Lines 1–5**:
  ```javascript
  1: import express from 'express';
  2: import { ingestionService } from '../services/dataIngestionService.js';
  3: import { ingestionScheduler } from '../services/dataIngestionScheduler.js';
  4: 
  5: const router = express.Router();
  ```
- **Existing Routes**:
  - `GET /status` (line 8): Read-only telemetry for health checks and scrapers. (Must remain public).
  - `GET /postings` (line 13): Read-only academic opportunities. (Must remain public for students browsing opportunities).
  - `POST /refresh` (line 37): Scraper trigger executing `ingestionService.runFullIngestionSweep()`.
  - `POST /schedule` (line 50): Scraper reconfiguration setting `intervalMinutes`.
  - `GET /history` (line 64): Recent scrape logs.
- **Finding**: `POST /refresh` and `POST /schedule` can be triggered by unauthenticated clients, causing DoS on external universities and internal scraper worker threads.

#### Proposed Modification
- Import `authenticateToken` from `../middleware/authMiddleware.js`.
- Guard `POST /refresh` and `POST /schedule` with `authenticateToken`.
- Leave `GET /status` and `GET /postings` public.

---

### 2.4. `server/routes/agentRoutes.js`

#### Direct Observations
- **File**: `server/routes/agentRoutes.js`
- **Lines 1–5**:
  ```javascript
  1: import express from 'express';
  2: import { PythonBridge } from '../services/pythonBridge.js';
  3: 
  4: const router = express.Router();
  ```
- **Existing Routes**:
  - `POST /paper-pitch` (line 7): Triggers paper deconstruction via `PythonBridge.deconstructPaper`.
  - `POST /mock-interview` (line 43): Triggers mock interview viva via `PythonBridge.mockInterview`.
  - `POST /cv-diagnostic` (line 72): Triggers CV gap audit via `PythonBridge.diagnoseCV`.
  - `POST /grant-radar` (line 112): Triggers grant radar scan via `PythonBridge.scanGrantRadar`.
- **Finding**: All 4 endpoints invoke computationally intensive AI inference routines with no authentication. Anyone can trigger unlimited requests, resulting in API quota exhaustion and denial-of-wallet attacks.

#### Proposed Modification
- Import `authenticateToken` from `../middleware/authMiddleware.js`.
- Apply `router.use(authenticateToken);` at the top of the router (or explicitly on each of the 4 POST routes).

---

### 2.5. Test Compatibility Analysis (`server/tests/gateway.test.js`)

When route authentication guards are added to `outreachRoutes.js` and `ingestionRoutes.js`, existing unauthenticated tests in `gateway.test.js` will receive HTTP 401:
- `test('Outreach Enqueue blocks automated dispatches without human confirmation')` (line 152) calls `POST /api/outreach/enqueue`.
- `test('Outreach Enqueue accepts confirmed pitch with randomized jitter delay')` (line 168) calls `POST /api/outreach/enqueue`.
- `test('Ingestion schedule API endpoint allows dynamic interval reconfiguration')` (line 226) calls `POST /api/ingest/schedule`.

To keep tests passing in Milestone 1 without breaking regressions:
- In `gateway.test.js`, register or obtain a valid test token (already demonstrated at line 112 in `Institutional Email Verification`) and include `Authorization: Bearer ${token}` in the headers for those three tests.

---

## 3. Feature 6: IDOR and Cryptography Fixes

### 3.1. Insecure Direct Object Reference (IDOR) in `server/routes/billingRoutes.js`

#### Direct Observations
- **File**: `server/routes/billingRoutes.js`
- **Lines 77–108 (`create-order`)**:
  ```javascript
  96:     const order = {
  97:       orderId,
  98:       userId: req.user.id,
  99:       userEmail: req.user.email,
  ...
  108:    orderHistory.set(orderId, order);
  ```
- **Lines 170–176 (`GET /invoice/:orderId`)**:
  ```javascript
  170: router.get('/invoice/:orderId', authenticateToken, (req, res) => {
  171:   const { orderId } = req.params;
  172:   const order = orderHistory.get(orderId);
  173: 
  174:   if (!order) {
  175:     return res.status(404).json({ error: 'Invoice not found for order ' + orderId });
  176:   }
  ```
- **Finding**: The route checks `authenticateToken`, but only verifies whether the order exists (`!order`). It never verifies `order.userId === req.user.id`. Any logged-in user can supply another user's `orderId` and view their complete invoice, name, email, billing address, and transaction amount.

#### Proposed Fix
Directly after line 176:
```javascript
  // IDOR Protection: Ensure user owns this order
  if (order.userId !== req.user.id && req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: You do not have permission to view this invoice.' });
  }
```

---

### 3.2. Razorpay Webhook Raw-Body Parsing Conflict

#### Direct Observations
- **File**: `server/server.js` Lines 36–37:
  ```javascript
  36: app.use(cors({ origin: '*' }));
  37: app.use(express.json({ limit: '10mb' }));
  ...
  59: app.use('/api/billing', billingRoutes);
  ```
- **File**: `server/routes/billingRoutes.js` Lines 127–135:
  ```javascript
  127: router.post('/webhook/razorpay', express.raw({ type: 'application/json' }), (req, res) => {
  ...
  130:     const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
  131: 
  132:     const expectedSignature = crypto
  133:       .createHmac('sha256', RAZORPAY_KEY_SECRET)
  134:       .update(bodyStr)
  135:       .digest('hex');
  ```
- **Finding**:
  1. `app.use(express.json())` in `server.js` processes and consumes the incoming readable stream for all `application/json` requests before `billingRoutes.js` is reached.
  2. In `billingRoutes.js`, the route-level `express.raw({ type: 'application/json' })` middleware skips execution because `req._body` is already set by `express.json()`.
  3. Consequently, `req.body` is an Object, not a Buffer or raw string.
  4. Line 130 uses `JSON.stringify(req.body)`. `JSON.stringify` does not preserve original byte order, whitespace, or unicode formatting of Razorpay's original payload, causing HMAC signature mismatch.

#### Proposed Fix
1. In `server/server.js`, configure `express.json()` with the `verify` hook:
   ```javascript
   app.use(express.json({
     limit: '10mb',
     verify: (req, res, buf) => {
       req.rawBody = buf;
     }
   }));
   ```
2. In `server/routes/billingRoutes.js`, remove `express.raw({ type: 'application/json' })` from the route definition, and compute HMAC directly on the raw buffer `req.rawBody`:
   ```javascript
   const rawPayload = Buffer.isBuffer(req.rawBody)
     ? req.rawBody
     : (Buffer.isBuffer(req.body)
       ? req.body
       : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body), 'utf8'));
   ```

---

### 3.3. `crypto.timingSafeEqual` Buffer Length Mismatch Crash & Rejection Bypass

#### Direct Observations
- **File**: `server/routes/billingRoutes.js` Lines 129–145:
  ```javascript
  129:     const signature = req.headers['x-razorpay-signature'];
  ...
  137:     // Timing-safe comparison to prevent side-channel attacks
  138:     const isAuthentic = crypto.timingSafeEqual(
  139:       Buffer.from(signature || '', 'utf8'),
  140:       Buffer.from(expectedSignature, 'utf8')
  141:     );
  142: 
  143:     if (!isAuthentic && process.env.NODE_ENV === 'production') {
  144:       return res.status(400).json({ error: 'Invalid Razorpay webhook signature' });
  145:     }
  ```
- **Finding**:
  1. `crypto.timingSafeEqual(a, b)` requires `a.length === b.length`. If `signature` is missing, empty, or not exactly 64 characters (the length of a SHA256 hex string), Node.js throws `RangeError: Input buffers must have the same byte length`.
  2. The unhandled exception is caught by line 164 (`catch (err)`), returning HTTP 500: `{"error":"Webhook processing error: Input buffers must have the same byte length"}`. This is an unhandled error and crash vector.
  3. Furthermore, line 143 only rejects invalid signatures when `process.env.NODE_ENV === 'production'`. In development and test environments, an unauthentic webhook payload is accepted, allowing unauthorized order state manipulation.

#### Proposed Fix
- Check signature existence and validate length equality prior to calling `crypto.timingSafeEqual`.
- Enforce strict rejection on `!isAuthentic` across all environments.

```javascript
    const signature = req.headers['x-razorpay-signature'];
    if (!signature || typeof signature !== 'string') {
      return res.status(400).json({ error: 'Missing or invalid Razorpay signature header' });
    }

    const signatureBuf = Buffer.from(signature, 'utf8');
    const expectedBuf = Buffer.from(expectedSignature, 'utf8');

    // Timing-safe comparison with prior length check to prevent RangeError crash
    const isAuthentic = signatureBuf.length === expectedBuf.length &&
      crypto.timingSafeEqual(signatureBuf, expectedBuf);

    if (!isAuthentic) {
      return res.status(400).json({ error: 'Invalid Razorpay webhook signature' });
    }
```

---

## 4. Complete Actionable Code Diffs

### 4.1. `server/routes/studentRoutes.js`
```diff
--- a/server/routes/studentRoutes.js
+++ b/server/routes/studentRoutes.js
@@ -1,5 +1,6 @@
 import express from 'express';
 import { Student } from '../models/Student.js';
+import { authenticateToken } from '../middleware/authMiddleware.js';
 
 const router = express.Router();
 
@@ -33,16 +34,16 @@
   creditsRemaining: 10
 };
 
-router.get('/me', async (req, res) => {
+router.get('/me', authenticateToken, async (req, res) => {
   try {
     let student = await Student.findOne({ id: 'student_active' });
     if (!student) {
       student = memoryStudent;
     }
     res.json(student);
   } catch {
     res.json(memoryStudent);
   }
 });
 
-router.put('/me', async (req, res) => {
+router.put('/me', authenticateToken, async (req, res) => {
   try {
     const updates = req.body;
```

---

### 4.2. `server/routes/outreachRoutes.js`
```diff
--- a/server/routes/outreachRoutes.js
+++ b/server/routes/outreachRoutes.js
@@ -1,6 +1,7 @@
 import express from 'express';
 import { Outreach } from '../models/Outreach.js';
 import { PythonBridge } from '../services/pythonBridge.js';
+import { authenticateToken } from '../middleware/authMiddleware.js';
 
 const router = express.Router();
 
@@ -46,7 +47,7 @@
 });
 
 // Generate 140-word academic draft
-router.post('/draft', async (req, res) => {
+router.post('/draft', authenticateToken, async (req, res) => {
   try {
     const pythonDraft = await PythonBridge.generateOutreachDraft(req.body);
     if (pythonDraft) {
@@ -70,7 +71,7 @@
 });
 
 // Enqueue cold outreach with jitter
-router.post('/enqueue', async (req, res) => {
+router.post('/enqueue', authenticateToken, async (req, res) => {
   try {
     const { draft_id, professor_email, human_confirmed } = req.body;
 
@@ -100,7 +101,7 @@
 });
 
 // View all student applications (CRM pipeline)
-router.get('/', async (req, res) => {
+router.get('/', authenticateToken, async (req, res) => {
   try {
     const items = await Outreach.find({ studentId: 'student_active' });
     if (items.length > 0) return res.json(items);
@@ -111,7 +112,7 @@
 });
 
 // Update application CRM stage
-router.put('/:id/status', async (req, res) => {
+router.put('/:id/status', authenticateToken, async (req, res) => {
   const { id } = req.params;
   const { status } = req.body;
   memoryOutreach = memoryOutreach.map(item => item.id === id ? { ...item, status } : item);
```

---

### 4.3. `server/routes/ingestionRoutes.js`
```diff
--- a/server/routes/ingestionRoutes.js
+++ b/server/routes/ingestionRoutes.js
@@ -1,6 +1,7 @@
 import express from 'express';
 import { ingestionService } from '../services/dataIngestionService.js';
 import { ingestionScheduler } from '../services/dataIngestionScheduler.js';
+import { authenticateToken } from '../middleware/authMiddleware.js';
 
 const router = express.Router();
 
@@ -34,7 +35,7 @@
 });
 
 // POST /api/ingest/refresh - Trigger on-demand real-world data scrape
-router.post('/refresh', async (req, res) => {
+router.post('/refresh', authenticateToken, async (req, res) => {
   try {
     const result = await ingestionService.runFullIngestionSweep();
     res.json({
@@ -47,7 +48,7 @@
 });
 
 // POST /api/ingest/schedule - Configure autonomous sweep interval
-router.post('/schedule', (req, res) => {
+router.post('/schedule', authenticateToken, (req, res) => {
   const { intervalMinutes } = req.body;
   if (!intervalMinutes || typeof intervalMinutes !== 'number' || intervalMinutes < 1) {
     return res.status(400).json({ error: 'Valid intervalMinutes (>= 1) is required' });
```

---

### 4.4. `server/routes/agentRoutes.js`
```diff
--- a/server/routes/agentRoutes.js
+++ b/server/routes/agentRoutes.js
@@ -1,8 +1,11 @@
 import express from 'express';
 import { PythonBridge } from '../services/pythonBridge.js';
+import { authenticateToken } from '../middleware/authMiddleware.js';
 
 const router = express.Router();
 
+router.use(authenticateToken);
+
 // 1. Paper Deconstruction & Precision Pitch Endpoint
 router.post('/paper-pitch', async (req, res) => {
   try {
```

---

### 4.5. `server/routes/billingRoutes.js`
```diff
--- a/server/routes/billingRoutes.js
+++ b/server/routes/billingRoutes.js
@@ -124,24 +124,36 @@
 });
 
 // POST /api/billing/webhook/razorpay - Cryptographic signature verification
-router.post('/webhook/razorpay', express.raw({ type: 'application/json' }), (req, res) => {
+router.post('/webhook/razorpay', (req, res) => {
   try {
     const signature = req.headers['x-razorpay-signature'];
-    const bodyStr = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
+    if (!signature || typeof signature !== 'string') {
+      return res.status(400).json({ error: 'Missing or invalid Razorpay signature header' });
+    }
+
+    const rawPayload = Buffer.isBuffer(req.rawBody)
+      ? req.rawBody
+      : (Buffer.isBuffer(req.body)
+        ? req.body
+        : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body), 'utf8'));
 
     const expectedSignature = crypto
       .createHmac('sha256', RAZORPAY_KEY_SECRET)
-      .update(bodyStr)
+      .update(rawPayload)
       .digest('hex');
 
-    // Timing-safe comparison to prevent side-channel attacks
-    const isAuthentic = crypto.timingSafeEqual(
-      Buffer.from(signature || '', 'utf8'),
-      Buffer.from(expectedSignature, 'utf8')
-    );
+    const signatureBuf = Buffer.from(signature, 'utf8');
+    const expectedBuf = Buffer.from(expectedSignature, 'utf8');
 
-    if (!isAuthentic && process.env.NODE_ENV === 'production') {
+    // Timing-safe comparison with length pre-check to prevent RangeError crash
+    const isAuthentic = signatureBuf.length === expectedBuf.length &&
+      crypto.timingSafeEqual(signatureBuf, expectedBuf);
+
+    if (!isAuthentic) {
       return res.status(400).json({ error: 'Invalid Razorpay webhook signature' });
     }
 
-    const payload = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
+    const payload = (typeof req.body === 'object' && !Buffer.isBuffer(req.body))
+      ? req.body
+      : JSON.parse(rawPayload.toString('utf8'));
     const event = payload.event;
@@ -174,6 +186,11 @@
   if (!order) {
     return res.status(404).json({ error: 'Invoice not found for order ' + orderId });
   }
+
+  // IDOR Authorization Guard: Caller must be the owner of the order or an administrator
+  if (order.userId !== req.user.id && req.user.role !== 'admin') {
+    return res.status(403).json({ error: 'Access denied: You do not have permission to view this invoice.' });
+  }
 
   const basePrice = (order.amount / 100) / 1.18;
   const gstAmount = (order.amount / 100) - basePrice;
```

---

### 4.6. `server/server.js`
```diff
--- a/server/server.js
+++ b/server/server.js
@@ -34,7 +34,12 @@
 
 // 1. Global Middleware & Rate Limiting
 app.use(cors({ origin: '*' }));
-app.use(express.json({ limit: '10mb' }));
+app.use(express.json({
+  limit: '10mb',
+  verify: (req, res, buf) => {
+    req.rawBody = buf;
+  }
+}));
 app.use(morgan('dev'));
 app.use(apiLimiter);
```

---

## 5. Verification Strategy & Independent Validation Plan

Once the implementer applies the diffs, verify using the following tests:

1. **Route Guard Verification (Feature 5)**:
   - Run `curl -i http://localhost:5000/api/students/me` -> Expect `HTTP 401 Unauthorized` with `{"error":"Access token required."}`.
   - Run `curl -i -X POST http://localhost:5000/api/outreach/enqueue` -> Expect `HTTP 401 Unauthorized`.
   - Run `curl -i -X POST http://localhost:5000/api/ingest/refresh` -> Expect `HTTP 401 Unauthorized`.
   - Run `curl -i -X POST http://localhost:5000/api/agents/paper-pitch` -> Expect `HTTP 401 Unauthorized`.
   - Provide valid `Authorization: Bearer <valid_token>` to all above endpoints -> Expect status `200` or `202`.

2. **IDOR Verification (Feature 6)**:
   - Create Order 1 with User A token (`userA`).
   - Attempt to fetch `GET /api/billing/invoice/:order1Id` with User B token (`userB`).
   - Expect `HTTP 403 Forbidden` with `{"error":"Access denied: You do not have permission to view this invoice."}`.
   - Attempt to fetch `GET /api/billing/invoice/:order1Id` with User A token (`userA`).
   - Expect `HTTP 200 OK` with full invoice details.

3. **Razorpay Webhook Verification (Feature 6)**:
   - Send `POST /api/billing/webhook/razorpay` with invalid signature header (`x-razorpay-signature: invalid_short_sig`).
   - Verify server returns `HTTP 400 Bad Request` and DOES NOT throw `RangeError` (no 500 error).
   - Send `POST /api/billing/webhook/razorpay` without `x-razorpay-signature` header.
   - Verify server returns `HTTP 400 Bad Request` cleanly.
   - Send `POST /api/billing/webhook/razorpay` with valid HMAC calculated over raw JSON body bytes.
   - Verify server returns `HTTP 200 OK` with `{"status":"ok","verified":true}` and updates order status.

4. **Automated Test Suite**:
   - Run `npm test` in `server/`.
