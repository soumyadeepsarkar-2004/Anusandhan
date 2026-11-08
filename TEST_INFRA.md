# TEST_INFRA — Dual-Track End-to-End Testing & Concurrency Infrastructure
**Project**: Anusandhan (अनुसंधान AI) — Autonomous Platform for Global Research Internships & Fellowships  
**Integrity Mode**: Production Hardening & 1,000 Concurrent Scholar Scalability  
**Target URL**: `http://127.0.0.1:5000` (Gateway) | `http://127.0.0.1:8000` (FastAPI AI Microservice)

---

## 1. Executive Summary & Testing Philosophy

The Anusandhan platform is architected to empower up to 1,000 concurrent active university scholars seeking high-impact research internships and fellowships worldwide. To ensure absolute reliability under real-world academic cycles (application deadlines, semester transitions, and fellowship portal openings), the quality strategy follows a **Dual-Track Testing Architecture**:

1. **Development Milestone Track (M1–M4)**: Progressive unit and component hardening (scrypt password hashing, rate limiting, connection pooling, dockerization, documentation).
2. **E2E & Concurrency Track (E2E)**: Autonomous, requirement-driven, opaque-box validation simulating real scholars interacting with the full production stack, coupled with a native 1,000-user asynchronous load benchmark.

### Core Testing Tenets:
- **Opaque-Box Verification**: Tests interact strictly via public HTTP/REST interfaces, verifying observable status codes, headers, and payload structures against authoritative specifications without relying on internal mocks.
- **Zero Mock Fallacy**: All tests execute against running gateway and microservice endpoints, ensuring genuine socket handling, connection pooling, and serialization.
- **Strict Performance SLA**: Sub-second responsiveness with `< 1%` error rate and `0` unhandled process exceptions across continuous 1,000 concurrent user streams.

---

## 2. System Architecture Under Test

The test suite exercises the integrated four-tier architecture:

```
[ Client Tier / Synthetic Users ]
             │
             ▼ (HTTP / Keep-Alive Pool: 1,000 sockets)
┌────────────────────────────────────────────────────────┐
│  Node.js 20 Express Gateway & BFF (Port 5000)          │
│  ├─ Helmet Security Headers & CORS Enforcement         │
│  ├─ Async Scrypt Auth & JWT (14d lifecycle)            │
│  ├─ Trusted Proxy Rate Limiter (Sliding Window)        │
│  ├─ BullMQ / In-Memory Job Queue (202 Accepted)        │
│  └─ Redis Cache Layer (TCP redis:// & In-Memory LRU)   │
└────────────┬─────────────────────────────┬─────────────┘
             │                             │
             ▼                             ▼
┌───────────────────────────┐ ┌──────────────────────────┐
│ Python FastAPI Microservice│ │ Persistence Tier         │
│ (Port 8000 /api/v1)       │ │ ├─ Supabase PostgreSQL   │
│ ├─ PyPDF Extraction & RRS │ │ │  (PgBouncer max 20)    │
│ ├─ ArXiv Paper Pitcher    │ │ ├─ MongoDB (maxPool 50)  │
│ ├─ Mock Technical Viva    │ │ └─ Redis (Cache/Limiter) │
│ └─ Multilingual Voice Bot │ └──────────────────────────┘
└───────────────────────────┘
```

---

## 3. The 4-Tier Opaque-Box Methodology

The test suite in `tests/e2e/` is partitioned into four distinct, progressive tiers:

```
┌────────────────────────────────────────────────────────┐
│ Tier 4: Real-World Workload Scenarios                  │
│ Full scholar journey: Onboard → Verify → Search →      │
│ Pitch → Viva → Human Dispatch → Telemetry              │
├────────────────────────────────────────────────────────┤
│ Tier 3: Cross-Feature Interactions                     │
│ Pairwise flows: Auth ↔ CRM, Search ↔ Pitch,            │
│ Billing ↔ Webhook ↔ Invoicing, Async Job ↔ Polling     │
├────────────────────────────────────────────────────────┤
│ Tier 2: Boundary & Corner Cases                        │
│ Input malformation, injection safety, auth guards,     │
│ IDOR protection, HMAC validation, 10MB body limits     │
├────────────────────────────────────────────────────────┤
│ Tier 1: Feature Coverage (Isolation)                   │
│ Independent endpoint contracts: Health, Faculty,       │
│ Fellowships, Ingestion, Auth, Billing, Voice, Agents   │
└────────────────────────────────────────────────────────┘
```

### Tier 1: Feature Coverage (Isolation Tests)
- **File**: `tests/e2e/tier1_features.test.mjs`
- **Scope**: Verifies individual endpoints and services in isolation to validate basic interface contracts and response schemas.
- **Coverage**:
  - `GET /api/health`: System health telemetry, database pool status, cache metrics, microservice bridge status.
  - `GET /api/faculty`: Verified faculty queries with scope filtering (`scope=national`, `scope=international`), keyword searches (`q=`), and live scraped flags (`scraped=true`). Validates `X-Cache` header (`HIT` or `MISS`).
  - `GET /api/fellowships`: Funded research fellowship programs (IISc SRFP, DAAD WISE, CERN Summer Student), verifying application portal URLs and lifecycle statuses (`active`, `upcoming`, `passed`).
  - `GET /api/ingest/status`, `GET /api/ingest/postings`, `POST /api/ingest/schedule`: Autonomous scraper telemetry and dynamic interval reconfiguration.
  - `POST /api/jobs`, `GET /api/jobs/:id`: Asynchronous task submission returning HTTP `202 Accepted` and status lookup.
  - `GET /api/billing/plans`: Subscription tiers with INR and USD pricing.
  - `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`: User lifecycle, scrypt hash validation, and JWT token issuance.
  - `POST /api/auth/verify-institutional-email`: Verification of accredited academic domains (`.ac.in`, `.edu`) and bonus outreach credit awards.
  - `GET /api/outreach/oauth/google-url`: Google OAuth 2.0 authorization URL with `gmail.send` scope.
  - `POST /api/outreach/draft`: 146-word precision cold pitch synthesis.
  - `POST /api/outreach/enqueue`: Academic integrity human-confirmation gate.
  - `POST /api/voice/turn`: Multilingual Hindi/English natural language intent classification.
  - `POST /api/agents/*`: Paper deconstruction pitch, mock interview screening, CV gap diagnostic, and grant capacity radar.

### Tier 2: Boundary & Corner Cases
- **File**: `tests/e2e/tier2_boundaries.test.mjs`
- **Scope**: Asserts system resilience against missing parameters, invalid formats, authorization failures, and boundary conditions.
- **Coverage**:
  - **Auth Failures**: Missing email/password/name (400), short passwords < 6 chars (400), duplicate email collision (409), wrong password (401), non-existent user login (401).
  - **Route Protection**: Accessing guarded endpoints (`/api/auth/me`, `/api/billing/create-order`) without token (401), with malformed tokens (403), or with expired tokens (403).
  - **Domain Validation**: Rejecting non-academic public email domains (`@gmail.com`, `@yahoo.com`) on institutional attestation (400).
  - **Queue Faults**: Job submission without required `type` field (400), querying non-existent `jobId` (404).
  - **Academic Integrity**: Enqueueing cold emails with `human_confirmed: false` blocked with HTTP 400.
  - **Billing & Security Boundaries**: Non-existent plan order (400), non-existent invoice (404), invalid Razorpay HMAC-SHA256 webhook signatures (400).
  - **Fuzzing & Injection Resistance**: SQL/NoSQL injection tokens in search queries (`' OR '1'='1`, `{"$gt": ""}`) handled safely without server errors.
  - **404 Routing**: Clean JSON 404 responses for invalid route endpoints without unhandled crashes.

### Tier 3: Cross-Feature Interactions
- **File**: `tests/e2e/tier3_interactions.test.mjs`
- **Scope**: Exercises multi-step stateful workflows across independent subsystems.
- **Coverage**:
  - **Flow 1: Registration → Institutional Attestation → Credit Grant**: Scholar registers, verifies `.ac.in` domain, and validates credit balance increments by +10.
  - **Flow 2: Search → Pitch Synthesis → Human Guard → Enqueue**: Scholar finds a PI, extracts publication bottleneck, drafts pitch, attempts unconfirmed send (blocked), approves pitch, and verifies jitter delay queue.
  - **Flow 3: Voice Dialogue → Fellowship Dynamic Filter Navigation**: Voice query asks for upcoming deadlines; assistant resolves intent and returns opportunity links directly correlating to fellowship catalog.
  - **Flow 4: Plan Selection → Order Creation → Webhook Fulfillment → GST Invoice**: Scholar selects Scholar Pro, creates checkout order, validates Razorpay signature event, and verifies GST-compliant invoice generation (SAC 998431, CGST, SGST, PAID status).
  - **Flow 5: Asynchronous CV Extraction → Status Polling → Diagnostic Analysis**: Task submitted to job queue (202), polled until completed, and results fed into CV diagnostic engine.

### Tier 4: Real-World Workload Scenarios
- **File**: `tests/e2e/tier4_realworld.test.mjs`
- **Scope**: Models the complete authentic scholar workflow from onboarding to application readiness.
- **Coverage**:
  - End-to-end 10-step student journey:
    1. Account creation for an undergraduate student from IIT Delhi.
    2. Institutional domain attestation (`student@iitd.ac.in`) yielding Verified Scholar badge.
    3. Comprehensive CV diagnostic evaluating 5 RRS pillars (code execution, methodology, foundations, lab tooling, professionalism).
    4. Faculty radar exploration filtering active grant-funded laboratories.
    5. Grant capacity verification examining PI funding longevity and student first-author ratios.
    6. ArXiv paper deconstruction crafting a 146-word precision inquiry.
    7. Mock technical viva simulation with scored feedback.
    8. Google OAuth 2.0 direct Gmail authorization link check.
    9. Ethical outreach dispatch with human approval and randomized anti-spam jitter delay (240–720s).
    10. Platform telemetry inspection verifying zero system errors during the entire workflow.

---

## 4. 1,000-User Concurrency & Load Benchmark

- **Runner**: `tests/load/concurrency_benchmark_1000.cjs`
- **Engine**: Pure asynchronous Node.js engine leveraging native `http.Agent({ keepAlive: true, maxSockets: 1000 })`.
- **Target Concurrency**: Up to 1,000 simultaneous virtual scholars.

### Realistic Traffic Distribution Matrix

To replicate genuine academic portal traffic during peak announcement cycles, the benchmark distributes virtual user requests across five realistic workloads:

| Share | Category | Target Endpoint | Description |
|---|---|---|---|
| **50%** | Cached Reads | `GET /api/faculty?scope=national` & `scope=global` | High-frequency browsing of faculty directory served by Redis / in-memory cache |
| **20%** | Telemetry & Health | `GET /api/health` | Client health polling, connection monitoring, and system metrics |
| **15%** | Async Job Queue | `POST /api/jobs` | Background task submission (CV parsing, paper deconstruction) with 202 Accepted |
| **10%** | Auth & Profile | `POST /api/auth/login`, `GET /api/auth/me` | Scholar authentication, token refresh, and profile retrieval |
| **5%** | AI Agent Synthesis | `POST /api/agents/paper-pitch`, `POST /api/voice/turn` | Compute-intensive AI reasoning and multilingual dialogue processing |

### Performance SLA Thresholds

| Metric | Target SLA | Enforced Action |
|---|---|---|
| **Error Rate** | `< 1.0%` | Hard benchmark failure if `>= 1.0%` |
| **Server Stability** | `0` unhandled process crashes | Process monitoring throughout test run |
| **Cached Reads (p95)** | `< 50 ms` | Verified by Redis caching with `X-Cache: HIT` |
| **API Requests (p95)** | `< 150 ms` | Core gateway routing budget |
| **AI Workloads (p95)** | `< 500 ms` | Fast async heuristic fallback / non-blocking bridge |
| **Overall Throughput** | `> 500 RPS` | Sustained request rate under 1,000 concurrent sockets |

---

## 5. Test Execution Runbook

### Prerequisites
Ensure the Express Gateway and Python AI Microservice are active:
```powershell
# Express Gateway (Port 5000)
cd server; node server.js

# Python FastAPI Microservice (Port 8000)
cd backend; uv run uvicorn app.main:app --port 8000
```

### Running Opaque-Box E2E Tests
Run the complete 4-tier E2E suite via Node's native test runner:
```powershell
# Run all E2E tiers sequentially
node --test tests/e2e/tier1_features.test.mjs
node --test tests/e2e/tier2_boundaries.test.mjs
node --test tests/e2e/tier3_interactions.test.mjs
node --test tests/e2e/tier4_realworld.test.mjs

# Or run entire suite in one command
node --test tests/e2e/*.test.mjs
```

### Running the 1,000-User Concurrency Load Benchmark
```powershell
# Standard 1,000-user benchmark run (15 seconds)
node tests/load/concurrency_benchmark_1000.cjs

# Customized benchmark with environment variables
$env:CONCURRENT_USERS="1000"; $env:DURATION="30"; $env:TARGET_URL="http://127.0.0.1:5000"; node tests/load/concurrency_benchmark_1000.cjs
```

---

## 6. Defect Escalation Protocol

As an autonomous QA/Test Writer operating in the E2E Testing Track:
1. **Implementation Code Immutability**: All files in `server/`, `backend/`, and `src/` are modified exclusively by implementing agents (M1–M4).
2. **Defect Identification**: When an E2E test fails due to unexpected behavior, error codes, unhandled exceptions, or connection pool exhaustion:
   - Capture exact request payload, HTTP status code, response body, and server logs.
   - Document root cause analysis with reference to `PROJECT.md` interface contracts.
   - Log issue in `handoff.md` and message the orchestrator (`parent`) for immediate assignment to the responsible milestone agent.
