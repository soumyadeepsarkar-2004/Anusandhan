## 2026-11-03T20:49:08Z
Identity: You are teamwork_worker for Milestone 1 (Security Hardening & Authentication).
Working directory: c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\worker_m1_r1\
Original request path: c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\ORIGINAL_REQUEST.md
Master project path: c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\PROJECT.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

File Write Ownership:
You have exclusive write ownership of:
- `server/utils/password.js`
- `server/routes/authRoutes.js`
- `server/middleware/rateLimiter.js`
- `server/middleware/authMiddleware.js`
- `server/server.js`
- `server/routes/studentRoutes.js`
- `server/routes/outreachRoutes.js`
- `server/routes/ingestionRoutes.js`
- `server/routes/agentRoutes.js`
- `server/routes/billingRoutes.js`
- `server/package.json`
- `server/tests/gateway.test.js`
- `backend/app/main.py`
- `backend/app/core/config.py`

Task Description:
Implement all 7 features of Milestone 1 based on the analysis from the 3 Explorers:
- Explorer 1 Report: `c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_m1_r1_1\analysis.md`
- Explorer 2 Report: `c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_m1_r1_2\analysis.md`
- Explorer 3 Report: `c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_m1_r1_3\analysis.md`

Detailed Requirements:
1. Feature 1: Async password hashing.
   In `server/utils/password.js`, replace synchronous `crypto.scryptSync` with `util.promisify(crypto.scrypt)`. Make `hashPassword` and `verifyPassword` async. Add defensive buffer length checks before `crypto.timingSafeEqual` and handle try/catch safely.
   In `server/routes/authRoutes.js`, ensure all calls to `hashPassword` and `verifyPassword` are awaited properly.
2. Feature 2: Anti-abuse rate limiting.
   In `server/middleware/rateLimiter.js`, remove unverified `cf-connecting-ip` and `x-forwarded-for` header trusting. Use `req.ip` backed by Express `trust proxy`. Calibrate limits for 1,000 active users (public reads: 1200/min, auth: 120/15min, ai: 30/min, general api: 600/min).
   In `server/server.js`, configure `app.set('trust proxy', 1)`.
3. Feature 3: Helmet integration.
   Install/ensure `helmet` is in `server/package.json`. In `server/server.js`, mount `helmet` configuring CSP, HSTS, X-Frame-Options, noSniff, and `crossOriginResourcePolicy: { policy: 'cross-origin' }` (ensuring non-production local requests and cross-origin SPA requests work cleanly).
4. Feature 4: CORS hardening.
   In `server/server.js`, replace wildcard `origin: '*'` with an explicit origin check against `ALLOWED_ORIGINS` / `FRONTEND_URL` fallback (`http://localhost:5173`, `http://localhost:3000`, `https://anusandhan.ai`).
   In `backend/app/main.py`, replace `allow_origins=["*"]` with `settings.ALLOWED_ORIGINS`. In `backend/app/core/config.py`, support `ALLOWED_ORIGINS` environment variable and include `https://anusandhan.ai`.
5. Feature 5: Route authentication guards.
   Apply `authenticateToken` middleware to:
   - `server/routes/studentRoutes.js` (`GET /me`, `PUT /me`)
   - `server/routes/outreachRoutes.js` (`POST /draft`, `POST /enqueue`, `GET /`, `PUT /:id/status`) - keep Google OAuth URL public.
   - `server/routes/ingestionRoutes.js` (`POST /refresh`, `POST /schedule`) - keep `GET /status`, `GET /postings` public.
   - `server/routes/agentRoutes.js` (`router.use(authenticateToken)`).
   Update `server/tests/gateway.test.js` to provide a valid JWT Bearer token on requests to protected routes so all 18 existing tests continue to pass.
6. Feature 6: IDOR and Webhook Cryptography fixes.
   In `server/routes/billingRoutes.js`:
   - In `GET /invoice/:orderId`, check `if (order.userId !== req.user.id && req.user.role !== 'admin')` return 403 Forbidden.
   - In `POST /webhook/razorpay`, capture raw body properly using `req.rawBody` (configured in `server/server.js` via `express.json({ verify: (req, res, buf) => { req.rawBody = buf; } })`), and add length validation `signatureBuf.length === expectedBuf.length` before `crypto.timingSafeEqual` to prevent RangeError crashes.
7. Feature 7: Secure secrets management.
   Remove hardcoded JWT fallback secret in `server/routes/authRoutes.js` and `server/middleware/authMiddleware.js`.
   In `server/server.js`, ensure `dotenv` loads first (`import 'dotenv/config'`). Add production check ensuring server does not start without `JWT_SECRET` in production mode.

Verification Requirements:
After making the changes, run and verify all test suites:
1. `cd server && npm test` (all tests must pass with 0 failures)
2. `cd server && node --test --env-file=.env tests/offline_sync.test.js` (must pass)
3. `cd backend && uv run pytest` (must pass with 14 passed)
4. `npm run build` at project root (must succeed with exit code 0)

Write your full handoff report to `c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\worker_m1_r1\handoff.md`. Include test commands, verbatim execution outputs, and modified files list.
When finished, send a message to the orchestrator.

## 2026-11-03T20:57:28Z
**Context**: Milestone 1 Implementation Check
**Content**: Checking in on Worker M1 R1 implementation progress.
Please ensure:
1. `server/routes/billingRoutes.js:174` enforces the IDOR check:
   `if (order.userId && req.user && order.userId !== req.user.id && req.user.role !== 'admin') { return res.status(403).json({ error: 'Access denied: unauthorized invoice retrieval' }); }`
2. `server/routes/billingRoutes.js:127-145` validates signature buffer length before `crypto.timingSafeEqual`:
   `const sigBuf = Buffer.from(signature || '', 'utf8'); const expBuf = Buffer.from(expectedSignature, 'utf8'); if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) { return res.status(400).json({ error: 'Invalid Razorpay webhook signature' }); }`
3. Execute and document all test suite runs (`npm test` in server, `offline_sync.test.js`, `pytest` in backend, root `npm run build`).
**Action**: Please report status and deliver handoff.md once tests pass.
