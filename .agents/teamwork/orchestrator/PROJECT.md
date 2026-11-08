# Project: Anusandhan Production Hardening & Launch

## Architecture
Anusandhan (https://anusandhan.ai) is a high-performance academic research internship and opportunity intelligence platform architected as a hybrid microservice system to support up to 1,000 active concurrent university scholars and students:

1. **Client Tier (`src/`)**:
   - Modern React 18 + Vite 5 + TailwindCSS SPA with Framer Motion.
   - Cross-platform distribution: Web, Android/iOS (Capacitor 8), Desktop (Electron 45).
   - Offline Outbox in IndexedDB with idempotent synchronization.

2. **API Gateway & Backend-For-Frontend (`server/`)**:
   - Node.js 20 + Express 4.21 Gateway.
   - Authentication (JWT 14d, institutional email validation, async scrypt).
   - Anti-Abuse Rate Limiting (trusted proxy validation, Redis sliding window / memory fallback).
   - Multi-tenant student profile CRM and outreach queue.
   - Job Queue (in-memory worker with bounded LRU eviction and 202 Accepted status).
   - Database Connectivity: Supabase PostgreSQL (PgBouncer pool), MongoDB, Redis (TCP `redis://` and Upstash REST).

3. **AI & Literature Microservice (`backend/`)**:
   - Python 3.12 + FastAPI 0.162 async service.
   - Google Gemini 3.8 Flash integrations via `google-genai` SDK with deterministic heuristic fallback.
   - PyPDF CV analysis & 5-pillar Research Readiness Score (RRS).
   - Scholar bibliometrics, grant capacity scanning, paper deconstruction, mock PI interviews.
   - Shared `httpx.AsyncClient` connection pool in FastAPI lifespan.

4. **Infrastructure Tier (`docker-compose.prod.yml`, `k8s/`)**:
   - Multi-container Docker Compose: Frontend, Gateway, AI Microservice, Redis, PostgreSQL, MongoDB.
   - All services equipped with health checks and `condition: service_healthy`.
   - Kubernetes manifests (`k8s/`) with horizontal pod autoscalers (HPA).
   - Pre-flight environment validation script (`scripts/validate_environment.js`).

5. **Documentation Portal**:
   - Integrated browsable documentation covering Product Overview, Backend Architecture, API Reference, and Developer Onboarding.

---

## Feature Inventory
Every feature from the Survey phase appears here with its assigned milestone:

| # | Feature | Description | Milestone | Source |
|---|---------|-------------|-----------|--------|
| 1 | Async Password Hashing | Replace `crypto.scryptSync` with async `crypto.scrypt` to prevent event loop starvation under login bursts | M1 | Survey 1, 3 |
| 2 | Anti-Abuse Rate Limiting | Fix IP spoofing in `rateLimiter.js` with trusted proxy verification; calibrate for 1,000 users | M1 | Survey 1, 3 |
| 3 | HTTP Security Headers & Helmet | Integrate `helmet` in Express gateway; enforce CSP, HSTS, X-Frame-Options, X-Content-Type | M1 | Survey 3 |
| 4 | CORS Hardening | Restrict CORS in Express (`server.js`) and FastAPI (`main.py`) to `ALLOWED_ORIGINS`; remove wildcard credentials | M1 | Survey 2, 3 |
| 5 | Route Authentication Guard | Protect `/api/students/*`, `/api/outreach/*`, `/api/ingest/*`, `/api/agents/*` with `authenticateToken` | M1 | Survey 1, 3 |
| 6 | IDOR & Webhook Cryptography Fix | Check order ownership in `billingRoutes.js`; fix `timingSafeEqual` length mismatch in Razorpay webhook | M1 | Survey 1, 3 |
| 7 | Secure Secrets Management | Remove hardcoded JWT fallback secrets; enforce clean environment variable loading | M1 | Survey 1, 3 |
| 8 | Multi-Tenant State Isolation | Eliminate global `student_active` singleton in Express; isolate student data per authenticated user ID | M2 | Survey 1, 3 |
| 9 | Database Connection Pooling | Implement robust PostgreSQL pool error handling, MongoDB pooling, and connection leak prevention | M2 | Survey 1, 3 |
| 10 | Redis TCP Protocol & LRU Eviction | Update `redisCache.js` to support standard `redis://` URLs; add LRU size limits to prevent memory leaks | M2 | Survey 1, 3 |
| 11 | Job Queue Bounded Pruning | Implement pruning of completed/failed jobs in `jobQueue.js` to prevent unbounded memory growth | M2 | Survey 1 |
| 12 | FastAPI Lifespan & Pooled HTTP Client | Add FastAPI lifespan managing shared `httpx.AsyncClient` with connection pooling | M2 | Survey 2 |
| 13 | FastAPI Async Concurrency Conversion | Convert synchronous `def` agent endpoints to `async def` and non-blocking model execution | M2 | Survey 2 |
| 14 | Inter-Service Path Routing Fix | Align `PYTHON_SERVICE_URL` in `docker-compose.prod.yml` to include `/api/v1` matching FastAPI routes | M2 | Survey 1, 2 |
| 15 | Complete Docker Compose Infrastructure | Add `postgres:16-alpine`, `mongo:7-jammy`, health checks, and `condition: service_healthy` to compose | M3 | Survey 3 |
| 16 | Kubernetes Manifests (`k8s/`) | Author production K8s manifests: Namespace, ConfigMaps, Secrets, Deployments, Services, Ingress, HPA | M3 | Survey 3 |
| 17 | Environment Validation Script | Create `scripts/validate_environment.js` to verify all required configs and DB connectivity before start | M3 | Survey 3 |
| 18 | Production Health Checks | Verify `/api/health` and FastAPI root health check accurately report DB, cache, and service status | M3 | Survey 1, 3 |
| 19 | Product Overview Documentation | Document platform vision, scholar democratizing mission, RRS pillars, and academic integrity safeguards | M4 | Survey 3 |
| 20 | Backend Architecture Documentation | Document Express BFF, FastAPI AI, connection pooling, job queue 202 Accepted, and offline sync | M4 | Survey 3 |
| 21 | API Reference Documentation | Document all Express and FastAPI endpoints with complete request/response schemas and error codes | M4 | Survey 3 |
| 22 | Developer Onboarding & Runbooks | Document prerequisites, local setup, test execution, environment configuration, and deployment runbooks | M4 | Survey 3 |
| 23 | 1,000-User Concurrency Load Harness | Pure Node.js `http.Agent` load benchmark simulating 1,000 concurrent sessions with < 1% error rate | E2E Track | Survey 3 |
| 24 | Opaque-Box E2E Test Suite (Tiers 1-4) | Comprehensive test suite verifying all 22 inventoried features from end-user perspective | E2E Track | Survey 3 |
| 25 | Adversarial Coverage Hardening (Tier 5) | White-box adversarial testing for edge cases, race conditions, pool exhaustion, and failure recovery | Final M | Survey 3 |

---

## Milestones

| # | Name | Scope | Dependencies | Status |
|---|------|-------|-------------|--------|
| M1 | Security Hardening & Authentication | Features 1–7: Async scrypt, rate limiter anti-spoofing, Helmet headers, CORS restrictions, route authentication, IDOR fix, webhook crypto fix, secret externalization | None | IN_PROGRESS |
| M2 | Concurrency & Scalability Hardening | Features 8–14: Multi-tenant state isolation, DB connection pooling, Redis TCP & LRU cache, bounded job queue, FastAPI lifespan & pooled HTTP client, async agent routes, RPC URL alignment | M1 | PLANNED |
| M3 | Production Deployment Infrastructure | Features 15–18: Full docker-compose with Postgres & Mongo, K8s manifests (`k8s/`), environment validation script, verified health checks | M1, M2 | PLANNED |
| M4 | Product & API Documentation | Features 19–22: Complete documentation site with Product Overview, Backend Architecture, API Reference, and Developer Onboarding | None (can run in parallel) | PLANNED |
| E2E | E2E Testing Track | Features 23–24: 1,000-user concurrency benchmark harness + Tiers 1–4 requirement-driven opaque-box tests | Runs in parallel with M1–M4 | IN_PROGRESS |
| Final | Final Verification & Hardening | Phase 1: 100% E2E test pass (Tiers 1–4). Phase 2: Tier 5 adversarial testing. | M1, M2, M3, M4, E2E | PLANNED |

---

## Interface Contracts

### Gateway ↔ Auth Middleware
- Token format: `Authorization: Bearer <jwt_token>`
- Decoded token payload: `{ id: string, email: string, role: string, is_verified: boolean }`
- Injected into request: `req.user = decoded`

### Gateway ↔ FastAPI AI Microservice (`pythonBridge.js`)
- Base URL: `${PYTHON_SERVICE_URL}` (default `http://127.0.0.1:8000/api/v1`)
- Endpoints:
  - `POST /api/v1/cv/diagnose` -> `{ rrs: number, pillars: object, gaps: array }`
  - `POST /api/v1/agents/paper-pitch` -> `{ limitations: array, pitch_146w: string }`
  - `POST /api/v1/agents/mock-interview` -> `{ feedback: string, score: number, follow_up: string }`
  - `GET /api/v1/audit/status` -> `{ status: "healthy", ssrf_filter: "active" }`
- Internal service authentication: Header `X-Internal-Service-Key` validated if configured.

### Gateway ↔ Database Connection Pools
- PostgreSQL: `Pool` with max 20 connections, idle timeout 30s, connection timeout 5s, mandatory `pool.on('error')` handler.
- MongoDB: `mongoose.connect` with `maxPoolSize: 50, minPoolSize: 10, serverSelectionTimeoutMS: 5000`.
- Redis: TCP client connecting via `REDIS_URL` with retry strategy, falling back to Upstash HTTP REST or bounded LRU memory cache.

---

## Code Layout
- Frontend SPA: `src/` (Components, Hooks, Types, Config)
- Documentation: `src/docs/` or `docs/`
- Express Gateway: `server/`
  - Routes: `server/routes/`
  - Middleware: `server/middleware/`
  - Services: `server/services/`
  - Database: `server/db/`
  - Queues: `server/queues/`
  - Utilities: `server/utils/`
  - Tests: `server/tests/`
- Python AI Backend: `backend/`
  - App: `backend/app/`
    - Routers: `backend/app/routers/`
    - Services: `backend/app/services/`
    - Agents: `backend/app/agents/`
    - Core: `backend/app/core/`
  - Tests: `backend/tests/`
- Infrastructure & Deployment:
  - `docker-compose.prod.yml`
  - `Dockerfile`, `server/Dockerfile`, `backend/Dockerfile`
  - `k8s/` (Kubernetes manifests)
  - `scripts/` (Validation scripts)
  - `tests/load/` (Concurrency and load benchmark scripts)
