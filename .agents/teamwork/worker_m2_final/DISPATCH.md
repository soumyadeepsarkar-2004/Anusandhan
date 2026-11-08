## 2026-11-04T18:11:37Z
You are a Worker agent assigned to finalize all pending backend, database, scalability, security, and documentation deliverables for 1,000-user production deployment.
Your identity: teamwork_worker (worker_m2_final)
Your working directory: c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\worker_m2_final\
Authoritative user request: c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\ORIGINAL_REQUEST.md
Read ORIGINAL_REQUEST.md before doing anything else.

Also read:
- c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_audit_1\analysis.md
- c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_audit_2\analysis.md
- c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_audit_3\analysis.md

MANDATORY INTEGRITY WARNING:
DO NOT CHEAT. All implementations must be genuine. DO NOT hardcode test results, create dummy/facade implementations, or circumvent the intended task. A teamwork_auditor will independently verify your work. Integrity violations WILL be detected and your work WILL be rejected.

Write Ownership (You exclusively own edits to these files):
- docs/onboarding.md (new file)
- docs/.vitepress/config.mts
- server/middleware/rateLimiter.js
- server/models/Student.js
- server/routes/outreachRoutes.js
- server/server.js
- server/queues/jobQueue.js
- server/routes/ingestionRoutes.js
- tests/adversarial/auth_concurrency_stress.test.mjs (if needed for keying calibration)

Tasks to implement:
1. Documentation Deliverable: Create `docs/onboarding.md` covering both Developer Quickstart (prerequisites, setup, Docker Compose, running tests) and Scholar Onboarding Journeys (profile creation, CV upload, opportunity explorer, voice mentor interaction). Add `/onboarding` to `docs/.vitepress/config.mts` nav and sidebar.
2. Rate Limiting Calibration: In `server/middleware/rateLimiter.js`, refine `authLimiter` so that login attempts key on account email (`auth:login:${email}`) when available, preventing unauthenticated IP quotas from throttling multi-student campus networks or local test runs on 127.0.0.1. Ensure all adversarial tests pass.
3. Database Schema & Persistence:
   - In `server/models/Student.js`, add `id: { type: String, unique: true, index: true }` to `StudentSchema`.
   - In `server/routes/outreachRoutes.js`, in `PUT /:id/status`, ensure ownership check (`item.studentId === studentId`), update `memoryOutreach`, and if MongoDB is connected (`isDbConnected()`), persist with `Outreach.findOneAndUpdate({ _id: id, studentId }, { status })`.
4. Mongoose Lifecycle Listeners: In `server/server.js`, register `mongoose.connection.on('error', ...)` and `mongoose.connection.on('disconnected', ...)`.
5. Background Job Queue Tenant Isolation: In `server/server.js` and `server/queues/jobQueue.js`, ensure `/api/jobs` and `/api/jobs/:jobId` require `authenticateToken` and associate jobs with `req.user.id`.
6. Background Ingestion RBAC: In `server/routes/ingestionRoutes.js`, ensure `POST /api/ingest/schedule` and `POST /api/ingest/refresh` enforce admin authorization (`req.user.role === 'admin'`).

Verification Requirements (You must execute and report verbatim results):
- `npm run docs:build` (VitePress build with zero broken links)
- `cd server && npm test` (24/24 gateway unit tests)
- `cd server && node --test --env-file=.env tests/adversarial_m1.test.js tests/offline_sync.test.js` (15/15 adversarial/offline tests)
- `cd backend && uv run pytest` (14/14 Pytest tests)
- `node scripts/validate_environment.js` (8/8 pre-flight checks pass)
- `node --test tests/e2e/tier1_features.test.mjs tests/e2e/tier2_boundaries.test.mjs tests/e2e/tier3_interactions.test.mjs tests/e2e/tier4_realworld.test.mjs` (42/42 E2E tests pass)
- `node tests/load/concurrency_benchmark_1000.cjs` (0.00% error rate under 1,000 concurrent users)

Report complete results and updated code in `c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\worker_m2_final\handoff.md`.
Communicate completion via send_message to caller b435598e-4705-40af-9cea-15a75fb39b5e.
