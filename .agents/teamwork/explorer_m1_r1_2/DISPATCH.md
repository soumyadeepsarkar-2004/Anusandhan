## 2026-11-03T20:38:01Z
Identity: You are teamwork_explorer instance 2 for Milestone 1 (Security Hardening & Authentication).
Working directory: c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_m1_r1_2\
Original request path: c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\ORIGINAL_REQUEST.md
Master project path: c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\PROJECT.md

Task:
Read ORIGINAL_REQUEST.md and PROJECT.md first.
Analyze the implementation details and produce precise, concrete fix recommendations for:
1. Feature 5: Route authentication guard across unauthenticated Express routes:
   - `server/routes/studentRoutes.js`: Apply `authenticateToken` to `/me` endpoints (`GET /me`, `PUT /me`).
   - `server/routes/outreachRoutes.js`: Apply `authenticateToken` to `/enqueue`, `/:id/status`, etc.
   - `server/routes/ingestionRoutes.js`: Apply auth guard to scraper triggers (`/refresh`, `/schedule`).
   - `server/routes/agentRoutes.js`: Apply auth guard to autonomous agent triggers.
2. Feature 6: IDOR and Cryptography fixes:
   - `server/routes/billingRoutes.js`: Fix IDOR in `GET /invoice/:orderId` by verifying user owns the order (`order.userId === req.user.id`).
   - Fix Razorpay webhook HMAC verification: fix raw-body parsing conflict with `express.json()`; fix `crypto.timingSafeEqual` length mismatch crash.
Write your findings and actionable code modification plan to `c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_m1_r1_2\analysis.md` and `handoff.md`. Include exact line numbers and verified diff recommendations.
Do NOT implement code directly. Send a completion message to the orchestrator when finished.
