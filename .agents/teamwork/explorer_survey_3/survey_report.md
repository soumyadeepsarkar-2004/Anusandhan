# Anusandhan (अनुसंधान AI) — Comprehensive System Survey Report

**Date:** 2026-11-03T20:30:00Z  
**Surveyor:** Teamwork Explorer (Instance 3)  
**Target Platform:** Anusandhan Platform (`https://anusandhan.ai`)  
**Scope:** Security Audit, Deployment Infrastructure, Documentation Framework, and 1,000-User Concurrency & Load Verification  
**Working Directory:** `c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_survey_3\`

---

## 1. Executive Summary

This survey assesses the production readiness of the Anusandhan platform for scaling to **1,000 active concurrent university scholars and students**. The platform is designed with a hybrid microservice architecture:
- A client tier built on **React 18 + Vite 5 + TailwindCSS**, supporting Web, Mobile (**Capacitor 8**), and Desktop (**Electron 45**).
- An API Gateway / Backend-For-Frontend (BFF) built on **Node.js 20 + Express 4.21**, managing student CRM, authentication, caching, rate limiting, and background queues.
- An AI and literature microservice built on **Python 3.12 + FastAPI 0.162**, providing Gemini 3.8 LLM integrations, PyPDF extraction, Research Readiness Score (RRS) diagnostics, and bibliometric scraping.
- Multi-tier data layers: **PostgreSQL (Supabase PgBouncer)**, **MongoDB (Mongoose)**, and **Redis (Upstash / local)** with in-memory fallbacks.

### Key Survey Findings:
1. **Frontend Baseline:** `npm run build` passes cleanly (`tsc && vite build` completed in 6.12s, 0 TypeScript or bundling errors).
2. **Backend Baseline Tests:** Express gateway tests (18/18 pass), offline sync tests (2/2 pass), and Python pytest tests (14/14 pass) are all currently passing in isolation.
3. **Security Vulnerabilities:** Identified **3 Critical**, **5 High**, and **4 Medium** security vulnerabilities across authentication, rate limiting, CORS configuration, IDOR, synchronous CPU blocking in password hashing, and hardcoded secrets.
4. **Deployment Infrastructure:** `docker-compose.prod.yml` is missing PostgreSQL and MongoDB service definitions, health checks, and depends-on health conditions; `redisCache.js` only supports Upstash REST API and ignores standard TCP `redis://` URLs; Kubernetes manifests and environment validation scripts are completely absent.
5. **Documentation:** There is currently zero repository documentation (no `README.md`, no `docs/` folder).
6. **Concurrency Verification:** Existing `tests/load/k6_2000_users.js` requires the `k6` CLI, which is not installed on the Windows environment; an in-process, pure Node.js/Python load runner simulating 1,000 concurrent sessions is required to meet the < 1% error rate criteria.

---

## 2. Feature Inventory & Dependency Matrix

### 2.1 Frontend Client Tier (`/src`)
| Component / Module | Description | Key Dependencies | State / Readiness |
|---|---|---|---|
| **Core App Shell (`App.tsx`, `AppLayout.tsx`)** | Primary navigation, tab switching (Radar, Pitch, Practice, CRM, Opportunities), multilingual audio player, onboarding modals. | `react`, `react-dom`, `framer-motion`, `lucide-react` | Operational. Responsive across desktop and mobile. |
| **Opportunity Explorer (`OpportunityExplorer.tsx`)** | Faculty discovery, fellowship deadlines, scraped lab openings, faceted search. | `framer-motion`, `lucide-react`, `clsx` | Operational. High-frequency queries. |
| **Outreach Composer (`OutreachComposer.tsx`)** | 146-word academic pitch generator with human approval guard and Google OAuth direct dispatch. | `lucide-react`, `tailwind-merge` | Operational. Human-in-the-loop enforced. |
| **Student Profile & RRS Hub (`StudentProfileHub.tsx`)** | Academic profile, CV upload, 5-pillar RRS score visualization, institutional verification. | `framer-motion`, `lucide-react` | Operational. |
| **Multilingual Voice Assistant (`VoiceMentorModal.tsx`, `useVoiceAgent.ts`)** | Spoken assistant supporting Hindi, Hinglish, English with WebSocket duplex streaming and UI routing. | Web Audio API, WebSockets | Operational with fallback. |
| **Legal & Consent (`DPDPConsentBanner.tsx`, modals)** | DPDP 2023 compliant data consent banner, privacy policy, terms of service. | React hooks, LocalStorage | Operational. |
| **Cross-Platform Wrappers** | Android/iOS mobile deployment and Electron desktop builds. | `@capacitor/core`, `@capacitor/android`, `electron` | Configured in `capacitor.config.ts`, `electron/`. |

### 2.2 Express API Gateway (`/server`)
| Feature / Route | Endpoint Path | Description | Upstream / Downstream Dependencies |
|---|---|---|---|
| **Authentication** | `/api/auth` (`routes/authRoutes.js`) | User registration, login, JWT token issuance (14d), session inspection (`/me`), institutional email validation (`.ac.in`, `.edu`, `.res.in`). | `jsonwebtoken`, `crypto.scryptSync`, MongoDB `User`, in-memory fallback |
| **Student Profile CRM** | `/api/students` (`routes/studentRoutes.js`) | Fetch and update student profile, RRS pillars, skill tags. | MongoDB `Student`, in-memory `memoryStudent` |
| **Faculty Radar** | `/api/faculty` (`routes/facultyRoutes.js`) | National and global faculty directory, mentor ratings, grant indicators, live scraped postings. | `redisCache.js`, `PythonBridge.js`, `dataIngestionService.js` |
| **Fellowship Radar** | `/api/fellowships` (`routes/fellowshipRoutes.js`) | Funded internship program directory filtered by lifecycle (`active`, `upcoming`, `passed`). | `redisCache.js`, `dataIngestionService.js` |
| **Outreach Dispatch** | `/api/outreach` (`routes/outreachRoutes.js`) | Google OAuth 2.0 flow for Gmail dispatch, pitch drafting, anti-spam jitter queue (`queue_with_jitter`). | `PythonBridge.js`, MongoDB `Outreach`, Google OAuth |
| **Multilingual Voice** | `/api/voice` (`routes/voiceRoutes.js`) | Turn-by-turn spoken dialogue routing, dynamic opportunity recommendations. | `PythonBridge.js`, `dataIngestionService.js` |
| **Autonomous Agents** | `/api/agents` (`routes/agentRoutes.js`) | Paper deconstruction into limitations and 146w pitch; mock PI screening viva. | `PythonBridge.js` |
| **Data Ingestion & Scraper** | `/api/ingest` (`routes/ingestionRoutes.js`) | Status, live postings, manual sweep trigger, dynamic interval scheduling. | `dataIngestionService.js`, `dataIngestionScheduler.js` |
| **Monetization & Billing** | `/api/billing` (`routes/billingRoutes.js`) | Free Scholar, Scholar Pro (₹499/$9), Lab Pass (₹4999/$99); Razorpay HMAC verification; GST invoicing. | `crypto.createHmac`, Razorpay, Stripe |
| **Background Job Queue** | `/api/jobs` (`server.js`, `queues/jobQueue.js`) | Asynchronous processing of heavy CV extraction and paper deconstruction returning 202 Accepted. | `jobQueue.js` (in-memory worker, max 6 concurrent), `redisCache.js` |
| **Health Telemetry** | `/api/health` (`server.js`) | System status, database pool state, redis cache hit/miss ratio, Python microservice reachability. | `PythonBridge.js`, `redisCache.js`, `supabaseClient.js`, `mongoose` |

### 2.3 Python FastAPI AI Microservice (`/backend`)
| Router / Service | Endpoint Path | Description | Underlying Model / Service |
|---|---|---|---|
| **CV Ingestion & RRS** | `/api/v1/cv` (`routers/cv_router.py`) | PDF upload parsing, magic byte check, 5MB limit, skill extraction, RRS scoring. | `pypdf`, `pdf_service.py`, `security.py` |
| **Scholar Bibliometrics** | `/api/v1/faculty` (`routers/scholar_router.py`) | Faculty filtering by student co-authorship ratio, active funding, domain. | `scholar_service.py`, OpenAlex, Semantic Scholar |
| **Outreach Engine** | `/api/v1/outreach` (`routers/outreach_router.py`) | 140-180w academic draft generation, randomized 4-12 min jitter queue, 7-day polite bump. | `outreach_service.py` |
| **Voice Agent & WebSockets** | `/api/v1/voice` (`routers/voice_router.py`) | Spoken dialogue turn processing (`/turn`), bidirectional streaming WebSocket (`/ws`). | `voice_mentor_agent.py`, Sarvam AI / fallback |
| **Academic Agents** | `/api/v1/agents` (`routers/agent_router.py`) | Paper deconstruction agent, mock interview agent, CV diagnostic agent, grant radar agent. | `google-genai` (Gemini 3.8 Flash), deterministic fallback |
| **Security Audit** | `/api/v1/audit` (`routers/audit_router.py`) | Telemetry on SSRF filters, file upload rules, outreach limits, academic domain whitelists. | `config.py`, `security.py` |

---

## 3. Security Audit & Vulnerability Assessment

### 3.1 Vulnerability Matrix

| ID | Severity | Category | Vulnerability Description | File & Line Reference |
|---|---|---|---|---|
| **SEC-01** | **CRITICAL** | Anti-Abuse / Rate Limiting | **IP Spoofing / Complete Rate Limiter Bypass** via unverified `cf-connecting-ip` and `x-forwarded-for` headers. | `server/middleware/rateLimiter.js:14-17` |
| **SEC-02** | **CRITICAL** | Network / CORS | **Starlette / FastAPI CORS Misconfiguration**: `allow_origins=["*"]` combined with `allow_credentials=True`. | `backend/app/main.py:34-40` |
| **SEC-03** | **CRITICAL** | Broken Access Control | **Missing Authentication on Core Endpoints**: Student profile (`/api/students/me`), Outreach enqueue (`/api/outreach/enqueue`), Ingestion controls (`/api/ingest/refresh`), Agent endpoints (`/api/agents/*`). | `server/routes/studentRoutes.js:36,48`, `server/routes/outreachRoutes.js:73`, `server/routes/ingestionRoutes.js:37,50` |
| **SEC-04** | **HIGH** | Broken Object Level Auth | **Insecure Direct Object Reference (IDOR) on Invoices**: `GET /api/billing/invoice/:orderId` does not verify user ownership of the order. | `server/routes/billingRoutes.js:170-176` |
| **SEC-05** | **HIGH** | Denial of Service / Concurrency | **Synchronous `crypto.scryptSync` Blocks Node Event Loop**: Password hashing and verification block the single-threaded event loop during registration and login bursts. | `server/utils/password.js:9,19` |
| **SEC-06** | **HIGH** | Credential Management | **Hardcoded Secrets & Insecure Fallbacks**: Production JWT secret committed to repository `.env`, fallback hardcoded secrets across auth and billing routes. | `server/.env:5`, `server/routes/authRoutes.js:9`, `server/routes/billingRoutes.js:12-14` |
| **SEC-07** | **HIGH** | Cryptographic Flaw | **Razorpay Webhook TimingSafeEqual Crash & Production Bypass**: Buffer length mismatch throws unhandled exception; signature check bypassed when `NODE_ENV !== 'production'`. | `server/routes/billingRoutes.js:138-145` |
| **SEC-08** | **HIGH** | Transport Security | **Disabled SSL Certificate Validation for PostgreSQL**: `rejectUnauthorized: false` permits Man-In-The-Middle attacks on database traffic. | `server/db/supabaseClient.js:24` |
| **SEC-09** | **MEDIUM** | Security Headers | **Missing Helmet & Security Headers in Express Gateway**: Express does not configure CSP, HSTS, X-Frame-Options, or X-Content-Type-Options. | `server/server.js:35-39` |
| **SEC-10** | **MEDIUM** | Network / CORS | **Wildcard CORS in Express Gateway**: `app.use(cors({ origin: '*' }))` permits cross-origin requests from any domain. | `server/server.js:36` |
| **SEC-11** | **MEDIUM** | Supply Chain | **Root Dependencies Vulnerabilities**: 5 vulnerabilities reported by `npm audit` (esbuild, glob, minimatch). | Root `package-lock.json` |
| **SEC-12** | **MEDIUM** | Memory Exhaustion / DoS | **PDF Ingestion Memory Buffer & Incomplete Regex Scan**: `file.read()` buffers full file in memory before size check; regex scan only inspects first 100KB of PDF. | `backend/app/routers/cv_router.py:23`, `backend/app/core/security.py:106` |

### 3.2 Evidence Chains & Deep Analysis

#### Evidence Chain SEC-01: Rate Limiting Bypass
- **Observation:** `server/middleware/rateLimiter.js` lines 14-17 extract client IP as:
  ```javascript
  const ip = req.headers['cf-connecting-ip'] || 
             req.headers['x-forwarded-for']?.split(',')[0].trim() || 
             req.socket?.remoteAddress || 
             'anonymous';
  ```
- **Logic Chain:** Because Express does not validate trusted proxy subnets or verify Cloudflare source headers, any external client can inject an arbitrary header value like `'cf-connecting-ip': '1.2.3.4'`. The key is formed as `${prefix}:${ip}`. By rotating the header with every request (as demonstrated in `scratch/benchmark_concurrency.cjs:29`), an attacker can send unlimited requests without ever triggering rate limiting (429 status).
- **Remediation:** Configure `app.set('trust proxy', 1)` in Express only when behind a verified reverse proxy, or rely on `req.ip` with standard proxy configuration, or bind rate limiting to authenticated user IDs when tokens are present.

#### Evidence Chain SEC-02: FastAPI CORS Misconfiguration
- **Observation:** `backend/app/main.py` lines 34-40 configure:
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["*"],
      allow_credentials=True,
      allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allow_headers=["*"],
  )
  ```
- **Logic Chain:** Starlette's `CORSMiddleware` raises a runtime warning or rejects responses when `allow_origins=["*"]` is combined with `allow_credentials=True`. Modern web browsers disallow credentialed HTTP requests where the `Access-Control-Allow-Origin` header is wildcarded (`*`). Furthermore, `backend/app/core/config.py` already defined a sanctioned list `settings.ALLOWED_ORIGINS` which was erroneously bypassed.
- **Remediation:** Replace `allow_origins=["*"]` with `settings.ALLOWED_ORIGINS` or a configured environment variable list.

#### Evidence Chain SEC-03: Missing Authentication & Shared State
- **Observation:** In `server/routes/studentRoutes.js` lines 36-66, the `/me` endpoints operate without `authenticateToken`. Lines 7-34 define a single in-memory variable `let memoryStudent = { id: 'student_active', ... }`.
- **Logic Chain:** When 1,000 students access the platform concurrently, every student query accesses or mutates the same in-memory object `student_active`. In addition, `server/routes/outreachRoutes.js` line 73 (`/enqueue`) and line 114 (`/:id/status`) allow any unauthenticated client to queue outreach or alter application status.
- **Remediation:** Apply `authenticateToken` middleware to all user-specific routes (`studentRoutes`, `outreachRoutes`, `billingRoutes`). Read and update records keyed by `req.user.id` or `req.user.email`.

#### Evidence Chain SEC-05: Synchronous `crypto.scryptSync` Event Loop Blocking
- **Observation:** `server/utils/password.js` lines 9 and 19 execute:
  ```javascript
  const derivedKey = crypto.scryptSync(password, salt, 64);
  ```
- **Logic Chain:** `scrypt` is deliberately compute- and memory-intensive to thwart brute-force attacks. Calling `crypto.scryptSync` synchronously freezes the single Node.js event loop thread for 30–80ms per call. Under 1,000 concurrent users logging in or registering, 50 concurrent login requests will freeze the entire API gateway for 2–4 seconds, causing all concurrent requests (including lightweight health and cached reads) to stall and time out.
- **Remediation:** Refactor `hashPassword` and `verifyPassword` to use asynchronous `crypto.scrypt` wrapped in `util.promisify` or native async callbacks so work is offloaded to the libuv threadpool (`UV_THREADPOOL_SIZE`).

---

## 4. Deployment Infrastructure Assessment

### 4.1 Docker & Compose Architecture
Currently, the repository contains:
1. `Dockerfile` (Root): Multi-stage build (Node 20 Alpine -> Nginx Alpine Slim) for the frontend SPA.
2. `server/Dockerfile`: Node 20 Alpine with non-root user `node` and health check `curl -f http://localhost:5000/api/health`.
3. `backend/Dockerfile`: Python 3.12-slim with non-root user `scholar` and health check `curl -f http://localhost:8000/`.
4. `docker-compose.prod.yml`: Composes `frontend`, `gateway`, `ai-microservice`, and `redis-cache`.

### 4.2 Infrastructure Deficiencies & Gaps

| Infrastructure Item | Current State | Defect / Risk | Required Action |
|---|---|---|---|
| **PostgreSQL Database** | Missing from `docker-compose.prod.yml` | Express gateway expects `DATABASE_URL` (PgBouncer/Postgres), but no Postgres service is provisioned in compose. Gateway falls back to memory. | Add `postgres` service (`postgres:16-alpine`) with health check (`pg_isready`), volume persistence, and environment credentials. |
| **MongoDB Database** | Missing from `docker-compose.prod.yml` | Express gateway attempts connection to `mongodb://127.0.0.1:27017/researchintern_pro`. In Docker, `127.0.0.1` refers to the container itself; connection fails. | Add `mongodb` service (`mongo:7-jammy`) with health check (`mongosh --eval 'db.runCommand("ping").ok'`) and volume persistence. |
| **Redis Cache Connectivity** | Service exists (`redis:7-alpine`), but code mismatch | `docker-compose.prod.yml` provides `REDIS_URL=redis://redis-cache:6379`, but `server/services/redisCache.js` only looks for `UPSTASH_REDIS_REST_URL`. Local Redis is ignored. | Update `redisCache.js` to support standard TCP `redis://` client (e.g. `ioredis` or standard `redis`) when `REDIS_URL` is set. |
| **Docker Compose Health Checks** | Services lack `healthcheck` specifications | Containers start simultaneously without waiting for database readiness; `depends_on` lacks `condition: service_healthy`. | Add health check blocks to all services and configure dependent services to wait for `service_healthy`. |
| **Kubernetes Manifests** | 0 manifests present in repository | Platform cannot be deployed to Kubernetes clusters (e.g., GKE, EKS, K8s). | Author production Kubernetes manifests in `k8s/`: Namespace, ConfigMaps, Secrets, Deployments, Services, Ingress, and HPA. |
| **Environment Validation Script** | 0 validation scripts present | Missing pre-flight check for required variables (`JWT_SECRET`, `DATABASE_URL`, `MONGODB_URI`, `PORT`), leading to silent runtime fallback errors. | Create `scripts/validate_environment.js` to assert configurations prior to container launch. |

---

## 5. Documentation Platform & Architecture Survey

### 5.1 Current Repository Documentation State
- Markdown file search outside `node_modules` and `.venv` revealed **0 documentation files** (no root `README.md`, no `docs/` directory).
- Backend FastAPI microservice exposes automatic OpenAPI Swagger UI at `/docs` and ReDoc at `/redoc`.
- Express Gateway exposes only `/` returning a JSON object.

### 5.2 Documentation Platform Evaluation

| Platform Option | Architecture & Fit | Pros | Cons | Recommendation |
|---|---|---|---|---|
| **Option A: VitePress** | Static Site Generator built on Vite | Blazing fast build (< 2s), markdown-first, native Vite integration matching root toolchain, beautiful default theme, built-in full-text search. | Vue-based templating (though 95% is pure markdown). | **Strong Candidate** |
| **Option B: Integrated React Documentation Portal** | Built directly inside `/src/components/docs` under `/docs` route | 0 new dev dependencies, builds with existing `npm run build`, instant zero-bundle overhead, accessible offline inside Capacitor mobile & Electron desktop apps. | Requires authoring React components or loading MDX, slightly more UI layout code. | **Strong Candidate for Unified App Experience** |
| **Option C: Docusaurus** | React-based documentation framework | React-based, standard documentation ecosystem, rich plugin support. | Adds ~100MB of dependencies, slower build times, separate npm package lifecycle. | Acceptable, but heavier than needed. |
| **Option D: MkDocs Material** | Python-based static site generator | Clean aesthetic, fast markdown rendering. | Disconnected from frontend JavaScript/TypeScript toolchain; requires Python environment. | Less suitable for full-stack repo. |

### 5.3 Recommended Documentation Architecture
A complete documentation suite structured into 4 primary sections:
1. **Product Overview:**
   - Platform vision: Democatizing elite research internships for 1,000+ university scholars.
   - Core features: Universal Faculty Radar, Fellowship Deadlines, 146-word Precision Pitch Composer, Research Readiness Score (RRS) 5-pillar assessment, Multilingual Spoken AI Assistant (Hindi/English).
   - Academic Integrity Safeguards: DPDP 2023 compliance, Human-in-the-Loop mandatory approval, 4-12 min randomized anti-spam jitter queues, institutional email verification (`.ac.in`, `.edu`, `.res.in`).
2. **Backend Architecture:**
   - System diagram: Frontend Clients (Web/Capacitor/Electron) -> Express Gateway (Node.js 20, BFF) -> Python FastAPI AI Microservice (Python 3.12).
   - Data Layer Architecture: PostgreSQL (Supabase PgBouncer, connection pooling max 20), MongoDB (scholar CRM, application tracking), Redis (Upstash/local caching with sub-5ms TTL).
   - Background Processing: BullMQ / in-memory worker job queues (202 Accepted pattern), autonomous academic ingestion scheduler (30-minute sweeps).
   - Offline Synchronization: IndexedDB client outbox, idempotency keys, FIFO background synchronization on reconnection.
3. **API Reference Specification:**
   - Express Gateway Endpoints: Comprehensive request/response schema, authentication requirements, rate limits, status codes for all 10 route modules.
   - FastAPI Microservice Endpoints: CV parsing, scholar bibliometrics, 140w draft generator, voice WebSocket streaming (`/ws`), agent endpoints (`/paper-pitch`, `/mock-interview`).
4. **Developer Onboarding & Runbooks:**
   - Prerequisites (Node.js 20+, Python 3.12+, Docker, uv).
   - Environment Setup (`.env.example` walkthrough, key generation).
   - Local Development commands (`npm run dev`, `cd server && npm run dev`, `cd backend && uvicorn app.main:app`).
   - Test Suites execution (`npm test`, `pytest`, offline sync tests, load test).
   - Docker Production Deployment (`docker compose -f docker-compose.prod.yml up -d`).

---

## 6. 1,000-User Concurrency & Load Verification Plan

### 6.1 Concurrency Model & Requirements
To support **1,000 active concurrent scholars and students**:
- **Simultaneous Virtual Sessions:** 1,000 concurrent sockets/clients actively browsing, querying, and submitting tasks.
- **Pacing & User Think Time:** Average 2–4 seconds think time between user actions -> **250 to 500 requests per second (RPS)** sustained throughput.
- **Target Acceptance Criteria:**
  - Overall Error Rate: `< 1.0%` (0 unhandled crashes, 0 process exits).
  - p95 Latency for Cached Reads (`/api/faculty`, `/api/fellowships`): `< 50ms`.
  - p95 Latency for API Endpoints (`/api/health`, `/api/jobs`): `< 150ms`.
  - Database Connection Pool: Zero connection timeout errors (`max: 20` properly multiplexed).

### 6.2 Traffic Scenario Distribution
| Traffic Category | Endpoint(s) | Percentage | Concurrency / Load Impact |
|---|---|---|---|
| **High-Frequency Read (Cached)** | `GET /api/faculty?scope=national`<br>`GET /api/fellowships?status=active` | **50%** | Tests Redis caching layer, sub-5ms latency, cache HIT ratio > 90%. |
| **Platform Telemetry & Health** | `GET /api/health`<br>`GET /api/ingest/status` | **20%** | Tests gateway event loop responsiveness and service health checks. |
| **Async Task Ingestion** | `POST /api/jobs` (CV / Paper pitch) | **15%** | Tests asynchronous job queue, 202 Accepted response, worker decoupling. |
| **Authenticated User Session** | `GET /api/students/me`<br>`GET /api/outreach` | **10%** | Tests JWT authentication, database read performance, user isolation. |
| **AI / Agent Interaction** | `POST /api/voice/turn`<br>`POST /api/agents/paper-pitch` | **5%** | Tests rate limiter (`aiLimiter`), circuit-breaker, fallback synthesis under load. |

### 6.3 Concurrency Test Runner Implementation Plan
Because `k6` is not installed on the Windows environment, relying exclusively on `k6` causes local execution failure. 
**Recommended Solution:**
A dual verification harness:
1. **Primary Node.js Native Load Test Script (`tests/load/concurrency_benchmark_1000.cjs`):**
   - Built using Node.js standard `http.Agent` with `keepAlive: true, maxSockets: 1000`.
   - Simulates 1,000 virtual users across configurable ramp-up (30s), sustain (60s), and ramp-down (15s).
   - Generates random client IPs and valid JWT bearer tokens.
   - Calculates real-time RPS, throughput, p50, p95, p99 latency, and enforces the `< 1%` error rate threshold.
   - Exits with code 0 on success, code 1 if error rate > 1%.
2. **Supplemental k6 Script (`tests/load/k6_2000_users.js`):**
   - Retained for cloud/containerized CI pipelines where k6 is installed.

### 6.4 Necessary Backend Hardening for 1,000 Concurrency
Before running the 1,000-user load test, the following bottlenecks must be resolved:
1. **Rate Limiter Configuration:** In `rateLimiter.js`, the general `apiLimiter` is set to 300 requests/min. A 1,000-user load test will immediately trigger 429 errors unless test IPs or bypass tokens are configured, or the limiter uses a Redis sliding log that aggregates per user.
2. **Password Hashing:** Asynchronous `scrypt` must replace `crypto.scryptSync`.
3. **Redis Connection:** Replace outbound HTTP `fetch()` to Upstash with standard connection pooling or optimized LRU memory cache under zero-budget local test conditions.
4. **PostgreSQL Connection Pool:** Ensure connections are released promptly (`pool.query` or explicit `client.release()`) to prevent pool exhaustion.

---

## 7. Baseline Verification Evidence

All baseline verification commands specified in `ORIGINAL_REQUEST.md` were executed and verified:

### 7.1 Root Frontend Build
- **Command:** `npm run build`
- **Result:** **PASSED (Exit code 0)**
- **Duration:** 6.12s
- **Evidence Output:**
  ```text
  > anusandhan@1.0.0 build
  > tsc && vite build

  vite v5.4.21 building for production...
  transforming...
  ✓ 1979 modules transformed.
  rendering chunks...
  dist/index.html                          1.66 kB │ gzip:  0.79 kB
  dist/assets/index-EDOAuXAj.css          69.28 kB │ gzip: 11.84 kB
  dist/assets/vendor-utils-B5JVzsfH.js    10.66 kB │ gzip:  4.28 kB
  dist/assets/vendor-icons-DhoMa2g1.js    29.73 kB │ gzip:  7.33 kB
  dist/assets/vendor-motion-2C-vUe9F.js  115.54 kB │ gzip: 38.33 kB
  dist/assets/vendor-react-BYt5yP78.js   133.93 kB │ gzip: 43.13 kB
  dist/assets/index-qvs75CLf.js          340.10 kB │ gzip: 86.09 kB
  ✓ built in 6.12s
  ```

### 7.2 Express Gateway Tests
- **Command:** `cd server && npm test`
- **Result:** **PASSED (Exit code 0)**
- **Summary:** 18 passed, 0 failed, duration 455ms.
- **Evidence:** 18 tests passing covering health checks, faculty queries, fellowship status, job queue 202 Accepted, billing pricing, institutional verification, OAuth URLs, and voice agent routing.

### 7.3 Offline Sync Tests
- **Command:** `cd server && node --test --env-file=.env tests/offline_sync.test.js`
- **Result:** **PASSED (Exit code 0)**
- **Summary:** 2 passed, 0 failed, duration 94ms.
- **Evidence:** Verified offline outbox item schema, idempotency keys, deduplication, and FIFO queue replay.

### 7.4 Python FastAPI Tests
- **Command:** `cd backend && uv run pytest`
- **Result:** **PASSED (Exit code 0)**
- **Summary:** 14 passed, 0 failed, 1 warning (Starlette testclient httpx deprecation), duration 0.71s.
- **Evidence:** Verified SSRF filters, PDF validation, academic draft limits, 7-day polite bump, RRS calculation, mock interview viva, and voice agent streaming.

---

## 8. Actionable Implementation Plan

Based on the survey findings, the implementation work is organized into 4 clear tracks:

### Track 1: Security Hardening (Addresses R2)
1. Fix IP spoofing vulnerability in `server/middleware/rateLimiter.js` by validating trusted proxy configurations.
2. Correct CORS middleware in `backend/app/main.py` to use `settings.ALLOWED_ORIGINS` instead of `allow_origins=["*"]`.
3. Add `helmet` to `server/server.js` and configure CSP, HSTS, X-Frame-Options, X-Content-Type-Options.
4. Protect unauthenticated routes in `server/routes/studentRoutes.js`, `outreachRoutes.js`, and `agentRoutes.js` with `authenticateToken`.
5. Fix IDOR vulnerability in `server/routes/billingRoutes.js` by checking order ownership (`order.userId === req.user.id`).
6. Refactor `crypto.scryptSync` in `server/utils/password.js` to asynchronous `crypto.scrypt`.
7. Externalize JWT secrets and remove hardcoded default credentials from codebase.
8. Resolve npm audit vulnerabilities in root `package.json`.

### Track 2: Deployment Infrastructure (Addresses R4)
1. Update `docker-compose.prod.yml` to include:
   - `postgres` service with health check (`pg_isready`) and volume persistence.
   - `mongodb` service with health check (`mongosh ping`) and volume persistence.
   - Environment variables for `DATABASE_URL` and `MONGODB_URI` passed to gateway.
   - `healthcheck` definitions and `condition: service_healthy` on all services.
2. Enhance `server/services/redisCache.js` to support standard `redis://` connections via `ioredis` or Node Redis client alongside Upstash REST.
3. Author production Kubernetes manifests under `k8s/`:
   - Namespace, ConfigMaps, Secrets.
   - Deployments and Services for Frontend, Gateway, FastAPI, Redis, Postgres, Mongo.
   - Ingress and HorizontalPodAutoscalers (HPA).
4. Create environment validation script `scripts/validate_environment.js` to check configuration and database reachability before startup.

### Track 3: Product & API Documentation (Addresses R3)
1. Build a comprehensive documentation framework (integrating browsable pages covering Product Overview, Backend Architecture, API Reference, and Developer Onboarding).
2. Document all Express Gateway routes and FastAPI microservice routes with schemas and examples.
3. Ensure the documentation site builds cleanly without breaking `npm run build`.

### Track 4: 1,000-User Concurrency & Load Verification (Addresses R1)
1. Author `tests/load/concurrency_benchmark_1000.cjs` (pure Node.js asynchronous runner using `http.Agent`).
2. Implement realistic traffic mix (50% cached reads, 20% health, 15% async jobs, 10% auth/profile, 5% AI agents).
3. Verify test runs against running backend services simulating 1,000 concurrent sessions with error rate < 1.0% and p95 latency < 150ms.
