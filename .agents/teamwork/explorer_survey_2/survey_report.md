# Comprehensive Architecture Survey Report: FastAPI AI Microservice (`backend/`)

**Target Service**: Anusandhan (अनुसंधान) Python FastAPI AI Microservice  
**Surveyed By**: teamwork_explorer instance 2 (Survey Phase)  
**Survey Date**: 2026-11-03T20:30:00Z  
**Integrity Mode**: Development / Production Hardening  
**Target Concurrency**: Up to 1,000 Active Concurrent University Scholars & Students  

---

## Executive Summary

The `backend/` directory hosts the Python FastAPI AI Microservice for the Anusandhan platform. It provides high-speed PDF CV parsing, Research Readiness Score (RRS) calculation, faculty bibliometric discovery with active grant scanning, 140–180 word academic outreach generation with anti-spam jitter buffers, multilingual voice mentoring (English, Hindi, Hinglish) with bidirectional WebSocket streaming, and four autonomous academic agents (Paper Deconstruction, Mock PI Screening Viva, CV Gap Diagnostic, and Grant Capacity Radar).

The service demonstrates clean modular design, high-quality domain schemas, resilient offline heuristic fallbacks for every agent, and strong initial input validation for PDF uploads and SSRF protection. However, to reliably support **1,000 active concurrent users**, significant hardening is required:
1. **Concurrency Bottlenecks**: Synchronous `def` endpoints on LLM and agent routes run inside Starlette's default 40-thread worker pool, causing immediate thread starvation under high concurrency.
2. **Lifespan & Connection Pooling**: The FastAPI app lacks a `lifespan` handler and shared `httpx.AsyncClient` connection pool, instantiating ad-hoc HTTP clients per request.
3. **State Isolation & Volatility**: Outreach queues and student rate-limiting counters are stored in in-memory Python dictionaries, which will fragment across multi-worker uvicorn processes and be lost on restart.
4. **Security & Deployment**: Wildcard CORS with `allow_credentials=True`, missing internal token validation between Express and FastAPI, and a URL prefix mismatch (`/api/v1`) in `docker-compose.prod.yml` that breaks microservice routing in production containers.
5. **Test Suite Baseline**: Current suite runs in 0.77s with 14 passed tests, but exercises zero router endpoints for the four autonomous agents or file upload pipelines.

---

## 1. FastAPI Architecture, Lifespan, Endpoints, Routers & Background Tasks

### 1.1 Application Entrypoint & Lifespan
- **File**: `backend/app/main.py:13-19`
- **Application Instance**:
  ```python
  app = FastAPI(
      title=settings.PROJECT_NAME,
      version=settings.VERSION,
      description="Production-grade AI Infrastructure for Global Research Internships & Healthy Academic Outreach",
      docs_url="/docs",
      redoc_url="/redoc"
  )
  ```
- **Lifespan Observation**: The application defines **NO lifespan context manager** (`@asynccontextmanager async def lifespan(app: FastAPI)` is absent).
- **Impact**: No central lifecycle hook exists to manage persistent resources (e.g. shared HTTP client pools, Redis clients, asynchronous background queue drainers).
- **Root Endpoints**:
  - `GET /` (`main.py:50-57`): Returns JSON operational status and version.
  - `GET /health` (`main.py:59-65`): Standard health probe returning `{"status": "operational", "service": "Python FastAPI AI Microservice", "version": "1.0.0"}`.

### 1.2 Middleware Pipeline
- **Security Headers Middleware** (`main.py:22-31`): Custom `BaseHTTPMiddleware` injecting:
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `X-XSS-Protection: 1; mode=block`
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains`
- **CORS Middleware** (`main.py:34-40`):
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["*"],
      allow_credentials=True,
      allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allow_headers=["*"],
  )
  ```
  *Vulnerability Note*: `allow_origins=["*"]` combined with `allow_credentials=True` violates standard CORS specifications and creates an insecure surface.

### 1.3 Router Hierarchy & Endpoint Inventory
All routers are mounted under `settings.API_V1_PREFIX = "/api/v1"` (`main.py:43-48`).

| HTTP Method | Route | Handler File & Line | Signature Type | Purpose |
|---|---|---|---|---|
| `GET` | `/` | `app/main.py:50` | `def root()` | Service meta & docs index |
| `GET` | `/health` | `app/main.py:59` | `def health_check()` | Orchestrator health check |
| `GET` | `/api/v1/audit/status` | `app/routers/audit_router.py:10` | `def get_system_security_status()` | Telemetry & rate limit transparency |
| `POST` | `/api/v1/cv/upload` | `app/routers/cv_router.py:11` | `async def upload_and_parse_cv()` | PDF CV parsing & 5-pillar RRS scoring |
| `POST` | `/api/v1/cv/manual` | `app/routers/cv_router.py:26` | `async def submit_manual_profile()` | Manual form profile submission |
| `GET` | `/api/v1/faculty` | `app/routers/scholar_router.py:12` | `async def list_professors()` | Filter faculty by domain, grants, co-authorship |
| `GET` | `/api/v1/faculty/{prof_id}` | `app/routers/scholar_router.py:32` | `async def get_professor_details()` | Retrieve full professor dossier |
| `POST` | `/api/v1/outreach/draft` | `app/routers/outreach_router.py:19` | `def create_academic_draft()` | Generate 140–180 word academic cold pitch |
| `POST` | `/api/v1/outreach/enqueue` | `app/routers/outreach_router.py:26` | `def queue_email_dispatch()` | Enqueue approved pitch with 4-12 min jitter |
| `POST` | `/api/v1/outreach/follow-up` | `app/routers/outreach_router.py:37` | `def schedule_polite_follow_up()` | Schedule 7-day polite bump follow-up |
| `GET` | `/api/v1/outreach/queue` | `app/routers/outreach_router.py:44` | `def view_active_queue()` | View in-memory queued email dispatches |
| `POST` | `/api/v1/voice/turn` | `app/routers/voice_router.py:13` | `async def process_voice_turn()` | Conversational voice turn & UI actions |
| `WEBSOCKET` | `/api/v1/voice/ws` | `app/routers/voice_router.py:21` | `async def voice_websocket_stream()` | Real-time duplex voice streaming WebSocket |
| `POST` | `/api/v1/agents/paper-pitch` | `app/routers/agent_router.py:27` | `def deconstruct_paper_and_pitch()` | Paper deconstruction & 146-word pitch |
| `POST` | `/api/v1/agents/mock-interview` | `app/routers/agent_router.py:56` | `def evaluate_mock_interview_turn()` | Simulate PI viva screening & scoring |
| `POST` | `/api/v1/agents/cv-diagnostic` | `app/routers/agent_router.py:86` | `def audit_profile_and_diagnose()` | 5-pillar RRS gap audit & 14-day sprint |
| `POST` | `/api/v1/agents/grant-radar` | `app/routers/agent_router.py:115` | `def scan_grant_and_lab_capacity()` | Lab hiring capacity & active grant radar |

### 1.4 Background Tasks & Queue Management
- **Current Observation**: In `app/services/outreach_service.py:115`, `enqueue_outreach()` assigns a `queue_id` and records the job into `self.queue[queue_id]`.
- **Finding**: There is **no background worker** (neither FastAPI `BackgroundTasks`, an `asyncio` task loop, nor Celery/Redis) polling `self.queue` or executing actual dispatches.
- **Architectural Division**: Real-world job execution is handled by the Express gateway via BullMQ/in-memory queue (`server/queues/jobQueue.js`). The Python service currently serves as a compute/rules microservice.

---

## 2. Database Connections, Async Pooling & External AI Services

### 2.1 Database Connectivity
- **Direct Database Connections**: The Python microservice has **zero direct database drivers** installed (no `asyncpg`, `psycopg2`, `motor`, `pymongo`, or `redis` in `requirements.txt`).
- **Data Persistence Architecture**:
  - The PostgreSQL (Supabase/PgBouncer), MongoDB, and Redis databases are managed entirely by the Express API Gateway (`server/server.js:42-48` and `server/db/supabaseClient.js`).
  - The Python service is designed as a stateless AI computation and NLP engine.
  - **Identified Flaw**: Because Python is currently stateful regarding `outreach_service.daily_counts` and `outreach_service.queue`, running multiple Uvicorn workers causes state fragmentation. A shared Redis connection or delegating state persistence to Express is required for multi-worker 1,000-user deployments.

### 2.2 External AI Inference & Model Service Integration
The service integrates with two external AI services and provides resilient deterministic fallbacks:
1. **Google Gemini API (`google-genai` SDK v2.34.0)**:
   - **File**: `backend/app/agents/base_agent.py:13-57`
   - **Initialization**: `self.client = genai.Client(api_key=self.api_key)`
   - **Models Used**: `gemini-3.8-flash` (default) or `gemini-3.5-flash-lite`
   - **Inference Method**: `self.client.models.generate_content(...)`
   - **CRITICAL OBSERVATION**: `self.client.models.generate_content()` is a **synchronous blocking HTTP/gRPC call**. When called from synchronous endpoints in `agent_router.py`, it blocks the worker thread for the entire network roundtrip (1.0–4.0 seconds).
   - **Remediation**: Use `client.aio.models.generate_content(...)` via an asynchronous execution path.
2. **Sarvam AI Text-to-Speech (Indic TTS)**:
   - **File**: `backend/app/agents/voice_mentor_agent.py:255-282`
   - **Endpoint**: `https://api.sarvam.ai/text-to-speech`
   - **Model**: `bulbul:v4-flash`
   - **Voices**: `shubh_enhi_ads` (Hindi, Indian English, Tamil, Bengali)
   - **Invocation**: `async with httpx.AsyncClient(timeout=4.0) as client:`
3. **OpenAlex Academic Bibliometrics API**:
   - **File**: `backend/app/services/scholar_service.py:271-297`
   - **Endpoint**: `https://api.openalex.org/works?search={query}&per-page=3`
   - **Header**: Polite mail header `Anusandhan/1.0 (mailto:{settings.OPENALEX_EMAIL})`
   - **SSRF Guard**: Validated through `validate_academic_url()` before dispatch.

### 2.3 Resilient Offline / Zero-Key Heuristic Engine
Every agent and service has a built-in deterministic heuristic engine:
- If `GEMINI_API_KEY` is empty or external calls fail, agents immediately switch to deterministic rules:
  - `cv_diagnostic_agent.py:31-110`: Deterministic RRS calculation and risk checks.
  - `grant_radar_agent.py:19-58`: Deterministic mentor score and hiring tier calculation.
  - `mock_interview_agent.py:31-91`: Heuristic answer scoring and domain question routing.
  - `paper_deconstruction_agent.py:40-73`: Deterministic 146-word precision pitch generator.
  - `voice_mentor_agent.py:162-253`: 10-intent semantic slot resolver for Hindi, Hinglish, and English.
- **Latency**: Deterministic execution completes in < 2ms, providing a high-availability fallback.

---

## 3. Concurrency Limits & Scaling for 1,000 Active Concurrent Users

### 3.1 Worker Process & Threadpool Analysis
1. **Dockerfile Worker Bottleneck**:
   - `backend/Dockerfile:38`: `CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]`
   - 2 workers are configured. Under 1,000 active concurrent users, 2 single-process event loops are severely under-provisioned.
2. **Synchronous Endpoint Threadpool Exhaustion**:
   - Starlette and FastAPI execute synchronous `def` endpoints on an internal AnyIO thread pool.
   - The default AnyIO threadpool limit is **40 worker threads**.
   - Routers `agent_router.py`, `outreach_router.py`, and `audit_router.py` use synchronous `def`.
   - If 1,000 concurrent scholars submit mock interviews, paper pitches, or CV diagnostics, the 40 threads saturate within ~40ms if calling external LLMs, or within ~200ms under heavy CPU parsing.
   - The remaining 960 requests queue up or hit the Express Gateway's 6,000ms timeout (`server/services/pythonBridge.js:12`), generating 504 Gateway Timeouts.
3. **Connection Pooling Bottleneck**:
   - `scholar_service.py:279` and `voice_mentor_agent.py:259` create an ad-hoc `httpx.AsyncClient` on every request.
   - Under 1,000 concurrent requests, creating 1,000 separate `AsyncClient` instances causes TCP socket starvation and high connection latency.
   - **Solution**: A singleton `httpx.AsyncClient` managed in `app.state.http_client` with `Limits(max_connections=1000, max_keepalive_connections=200)`.
4. **WebSocket Concurrency**:
   - `voice_router.py:21-46` supports duplex streaming over WebSockets.
   - 1,000 concurrent WebSocket connections require sufficient OS file descriptors (`ulimit -n 65535` in Docker) and lightweight coroutine management without blocking synchronous code in the event loop.

---

## 4. Test Suite Baseline, Dependencies & Configuration

### 4.1 Test Execution & Baseline
- **Execution Command**: `cd backend && uv run pytest`
- **Results**:
  ```
  platform win32 -- Python 3.14.5, pytest-9.2.0, pluggy-1.7.0
  rootdir: C:\PROJECTS\ResearchIntern_Pro\backend
  configfile: pytest.ini
  plugins: anyio-4.15.1, asyncio-1.4.1
  collected 14 items

  tests\test_security_and_services.py .............. [100%]
  ======================== 14 passed, 1 warning in 0.77s ========================
  ```
- **Warning Detected**:
  `StarletteDeprecationWarning: Using httpx with starlette.testclient is deprecated; install httpx2 instead.` at line 97 of `tests/test_security_and_services.py`.
- **Baseline Quality**: All 14 tests pass cleanly in 0.77s.

### 4.2 Existing Test Coverage
| Test Name | File & Lines | Validates |
|---|---|---|
| `test_private_ip_detection` | `tests/test_security_and_services.py:14-19` | Private, loopback, and cloud metadata (169.254.169.254) IP rejection |
| `test_validate_academic_url_rejects_insecure_or_internal` | `tests/test_security_and_services.py:21-27` | HTTP rejection, cloud metadata rejection, unapproved domain rejection |
| `test_validate_academic_url_accepts_whitelisted` | `tests/test_security_and_services.py:29-30` | Approved academic host (`api.openalex.org`) acceptance |
| `test_pdf_validation_rejects_invalid_headers` | `tests/test_security_and_services.py:33-36` | Rejection of non-PDF bytes lacking `%PDF-` magic header |
| `test_pdf_validation_rejects_embedded_scripts` | `tests/test_security_and_services.py:38-41` | Rejection of malicious stream keywords (`/JavaScript`, `/JS`, `/Launch`) |
| `test_pdf_validation_accepts_clean_pdf` | `tests/test_security_and_services.py:43-45` | Clean PDF acceptance |
| `test_outreach_draft_within_academic_guidelines` | `tests/test_security_and_services.py:48-66` | 140–180 word email draft, human approval flag, academic grounding |
| `test_enqueue_requires_human_confirmation` | `tests/test_security_and_services.py:68-76` | Human-in-the-loop validation (`human_confirmed=False` raises 400) |
| `test_voice_agent_status_intent` | `tests/test_security_and_services.py:79-86` | Hinglish status query intent detection |
| `test_faculty_search_active_grants` | `tests/test_security_and_services.py:89-94` | Faculty search with active grant filter |
| `test_voice_websocket_stream` | `tests/test_security_and_services.py:96-110` | Real-time WebSocket connection, message receipt, turn completion |
| `test_encrypted_corrupt_pdf_rejection` | `tests/test_security_and_services.py:113-120` | Rejection of password-protected or corrupt PDF structures |
| `test_voice_mentor_upcoming_fellowships` | `tests/test_security_and_services.py:123-136` | Intent resolution for upcoming fellowship opportunities |
| `test_voice_mentor_scraped_postings_intent` | `tests/test_security_and_services.py:139-153` | Scraped lab opening query intent resolution |

### 4.3 Test Gaps & Missing Test Cases
1. Zero automated tests for the four autonomous agent endpoints in `agent_router.py`:
   - `POST /api/v1/agents/paper-pitch`
   - `POST /api/v1/agents/mock-interview`
   - `POST /api/v1/agents/cv-diagnostic`
   - `POST /api/v1/agents/grant-radar`
2. Zero automated tests for `POST /api/v1/cv/upload` and `POST /api/v1/cv/manual` HTTP endpoints in `cv_router.py`.
3. Zero automated tests for `POST /api/v1/outreach/follow-up` and `GET /api/v1/outreach/queue`.
4. Zero automated tests for `GET /api/v1/faculty/{prof_id}` 404 path.
5. Zero automated tests for daily quota exhaustion (attempting >5 outreach emails per student).
6. Zero automated tests for file uploads exceeding `MAX_UPLOAD_SIZE_BYTES` (5MB).

### 4.4 Dependencies Analysis (`requirements.txt`)
- `fastapi>=0.162.0`: Modern ASGI framework.
- `uvicorn[standard]>=0.54.0`: ASGI server with `uvloop` and `httptools`.
- `pydantic>=2.14.2`: High-speed V2 data validation and schema serialization.
- `pypdf>=6.21.4`: Pure-python PDF extraction with page limit caps.
- `google-genai>=2.34.0`: Official Google GenAI SDK for Gemini 3.8 / 3.5.
- `python-dotenv>=1.2.4`: Environment variable loader.
- `python-multipart>=0.0.33`: Multipart form-data parser for file uploads.
- `httpx>=0.28.1`: Asynchronous HTTP client for OpenAlex and Sarvam APIs.
- `websockets>=17.4`: WebSocket protocol support.
- `pytest>=9.2.0`, `pytest-asyncio>=1.4.1`: Asynchronous test framework.
- **Missing Configuration**: No `pyproject.toml` file exists in `backend/`. Adding one provides standardized packaging and configuration for `uv`.

---

## 5. Security Analysis, Boundaries & Vulnerabilities

### 5.1 Token Validation & Internal Microservice Authentication
- **Finding**: The FastAPI microservice currently performs **zero authentication or token verification** on incoming requests.
- **Risk**: In `docker-compose.prod.yml:45-46`, port `8000:8000` is exposed publicly. Any malicious user can bypass Express JWT authentication and call expensive AI endpoints (`/api/v1/agents/mock-interview`, `/api/v1/cv/upload`, `/api/v1/voice/turn`) directly on port 8000.
- **Remediation**:
  1. Bind microservice port only to internal Docker bridge (`127.0.0.1:8000:8000` or omit host port binding in compose).
  2. Implement an internal shared secret header verification dependency (`X-Internal-Service-Key` or `Authorization: Bearer <service_token>`) for inter-service communication from Express.

### 5.2 CORS Configuration Insecurity
- **File**: `backend/app/main.py:34-40`
- **Code**:
  ```python
  app.add_middleware(
      CORSMiddleware,
      allow_origins=["*"],
      allow_credentials=True,
      allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allow_headers=["*"],
  )
  ```
- **Vulnerability**: Specifying `allow_origins=["*"]` with `allow_credentials=True` is disallowed by modern browser security standards and allows unauthorized cross-origin requests.
- **Remediation**: Use `settings.ALLOWED_ORIGINS` (which already defines allowed frontend ports: `http://localhost:5173`, `http://localhost:3000`, etc.) and support environment-driven origins via `os.getenv("ALLOWED_ORIGINS")`.

### 5.3 SSRF Protection & DNS Rebinding
- **File**: `backend/app/core/security.py:30-77` (`validate_academic_url`)
- **Strengths**: Validates HTTPS scheme, restricts hosts to `settings.ALLOWED_ACADEMIC_DOMAINS` or academic TLDs (`.edu`, `.ac.uk`, `.ac.in`), and resolves IP via `socket.gethostbyname` to reject private/loopback/cloud metadata (`169.254.169.254`).
- **Residual Risk (DNS Rebinding)**: `socket.gethostbyname` resolves the domain at validation time, but `httpx.get()` in `scholar_service.py:280` resolves it a second time during the actual connection. An attacker with a dynamic DNS record could pass validation on IP #1 and connect to internal metadata on IP #2.

### 5.4 PDF Magic Bytes & Executable Stream Defense
- **File**: `backend/app/core/security.py:79-112` (`validate_pdf_content`)
- **Strengths**: Strictly enforces `MAX_UPLOAD_SIZE_BYTES` (5MB), checks `%PDF-` header signature, and scans structural catalog for `/JavaScript`, `/JS`, `/Launch`, `/SubmitForm`.
- **Finding**: In `cv_router.py:23`, `file_bytes = await file.read()` loads the entire uploaded file into memory before `validate_pdf_content()` checks `len(file_bytes)`. A client sending a multi-gigabyte upload could induce high RAM consumption before the 413 error is thrown. Streaming chunk size checks resolve this.

### 5.5 Production Docker-Compose Service URL Mismatch
- **File 1**: `docker-compose.prod.yml:23`: `PYTHON_SERVICE_URL=http://ai-microservice:8000`
- **File 2**: `server/services/pythonBridge.js:8`: `const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000/api/v1'`
- **File 3**: `server/services/pythonBridge.js:25`: `const res = await client.get('/audit/status')`
- **Vulnerability / Broken Production Integration**:
  In `docker-compose.prod.yml`, `PYTHON_SERVICE_URL` is set to `http://ai-microservice:8000` (without `/api/v1`).
  When Axios makes requests like `client.get('/audit/status')` or `client.get('/faculty')`, the request resolves to `http://ai-microservice:8000/audit/status`.
  However, in `main.py`, routers are mounted with `prefix=settings.API_V1_PREFIX` (`/api/v1`), so the FastAPI route is `http://ai-microservice:8000/api/v1/audit/status`!
  This causes all Express-to-Python bridge calls in Docker to fail with **404 Not Found**.

---

## 6. Complete Feature Inventory

| ID | Feature Name | Description | Key Modules / Files | Dependencies | Concurrency & Scalability Notes |
|---|---|---|---|---|---|
| **F-01** | **CV PDF Parser & Extraction** | Extracts text, emails, CGPA, detected skills, detected domains, and universities from academic CVs. | `app/routers/cv_router.py`, `app/services/pdf_service.py` | `pypdf`, `re`, `python-multipart` | CPU-bound regex and PDF text parsing. Should stream chunk size to prevent memory spikes. |
| **F-02** | **Multi-Factor RRS Scorer** | Computes Research Readiness Score (0–100) across 5 pillars (Publications, Projects, Technical Depth, Academic Foundation, Professionalism). | `app/services/pdf_service.py`, `app/schemas/student.py` | `pydantic` | Lightweight in-memory arithmetic. Highly scalable (>5,000 req/s). |
| **F-03** | **Manual Profile Ingestion** | Alternative profile submission form for students preferring manual input over uploading a CV. | `app/routers/cv_router.py`, `app/schemas/student.py` | `fastapi.Form`, `pydantic` | Lightweight form processing. |
| **F-04** | **Faculty Discovery & Filtering** | Searches curated faculty database with multi-dimensional filtering by domain, country, co-authorship ratio, and active grant status. | `app/routers/scholar_router.py`, `app/services/scholar_service.py` | `pydantic`, `httpx` | Fast in-memory filtering. High read throughput. |
| **F-05** | **Live OpenAlex Bibliometrics** | Queries OpenAlex API for recent works with SSRF protection and polite mail headers. | `app/services/scholar_service.py` | `httpx`, `app.core.security` | Network I/O bound. Requires singleton HTTP connection pool. |
| **F-06** | **Academic Outreach Draft Generator** | Generates strictly calibrated 140–180 word cold emails connecting student project code to professor publications. | `app/routers/outreach_router.py`, `app/services/outreach_service.py` | `uuid`, `pydantic` | Template-based generation executes in <1ms. |
| **F-07** | **Anti-Spam Jitter Queue** | Schedules outreach dispatches with randomized 4–12 minute jitter intervals and enforces daily quotas (max 5/day). | `app/routers/outreach_router.py`, `app/services/outreach_service.py` | `datetime`, `random` | State is currently in-memory dict. Requires Redis backing for multi-worker uvicorn. |
| **F-08** | **7-Day Polite Bump Follow-Up** | Schedules polite, non-intrusive follow-up messages after a 7-day interval. | `app/routers/outreach_router.py`, `app/services/outreach_service.py` | `datetime`, `pydantic` | In-memory scheduling. |
| **F-09** | **Multilingual Voice Mentor** | Turn-by-turn dialogue processing in English, Hindi, and Hinglish with intent detection and UI command routing. | `app/routers/voice_router.py`, `app/agents/voice_mentor_agent.py` | `google-genai` (optional), `httpx` | Fallback semantic slot resolution executes in <2ms. External Sarvam TTS is I/O bound. |
| **F-10** | **Duplex Voice WebSocket** | Bidirectional streaming WebSocket endpoint for continuous conversational turns without polling. | `app/routers/voice_router.py` | `fastapi.WebSocket`, `websockets` | Long-lived connections. Requires proper OS file descriptor limits and async message loops. |
| **F-11** | **Paper Deconstruction & Pitch Agent** | Autonomous agent that extracts limitations from 2024–2025 papers and generates 146-word precision proof-of-work pitches. | `app/routers/agent_router.py`, `app/agents/paper_deconstruction_agent.py` | `google-genai` (optional) | Synchronous `def` endpoint blocks worker thread during LLM generation. |
| **F-12** | **Mock PI Screening Viva Agent** | Simulates PI viva technical screening, evaluating answers on technical soundness, depth, and honesty with domain-specific questions. | `app/routers/agent_router.py`, `app/agents/mock_interview_agent.py` | `google-genai` (optional) | Synchronous `def` endpoint blocks worker thread during LLM generation. |
| **F-13** | **CV Gap Diagnostic & Sprint Agent** | Audits profiles against auto-rejection triggers and outputs a 14-day technical remediation sprint. | `app/routers/agent_router.py`, `app/agents/cv_diagnostic_agent.py` | `google-genai` (optional) | Synchronous `def` endpoint blocks worker thread during LLM generation. |
| **F-14** | **Faculty Grant Capacity Radar Agent** | Tracks active multi-million dollar grants across national (DST, MeitY) and international (NSF, ERC) agencies. | `app/routers/agent_router.py`, `app/agents/grant_radar_agent.py` | `pydantic` | Arithmetic telemetry calculation executes in <1ms. |
| **F-15** | **Security & Compliance Telemetry** | Transparency endpoint reporting active SSRF guards, PDF security filters, and outreach rate limits. | `app/routers/audit_router.py` | `pydantic` | Zero-overhead telemetry endpoint. |

---

## 7. Concrete Hardening Recommendations for 1,000 Concurrent Users

1. **Convert Synchronous `def` Endpoints to `async def` on LLM / Agent Routers**:
   - In `backend/app/routers/agent_router.py`, convert `deconstruct_paper_and_pitch`, `evaluate_mock_interview_turn`, `audit_profile_and_diagnose`, and `scan_grant_and_lab_capacity` to `async def`.
   - In `backend/app/agents/base_agent.py`, update `BaseAcademicAgent` to use `client.aio.models.generate_content(...)` via an asynchronous call, or offload synchronous calls to an explicitly sized thread limiter (`anyio.to_thread.run_sync`).
2. **Implement FastAPI Lifespan & Singleton HTTP Connection Pool**:
   - Implement `@asynccontextmanager async def lifespan(app: FastAPI)` in `main.py`.
   - Initialize a shared `httpx.AsyncClient(limits=httpx.Limits(max_connections=1000, max_keepalive_connections=200), timeout=httpx.Timeout(6.0, connect=3.0))` in `app.state.http_client`.
   - Pass this client to `scholar_service` and `voice_mentor_agent`.
3. **Fix CORS Configuration**:
   - Replace `allow_origins=["*"]` with `settings.ALLOWED_ORIGINS` in `backend/app/main.py`.
   - Allow dynamic configuration via `os.getenv("ALLOWED_ORIGINS")`.
4. **Fix Production Docker-Compose Service URL Mismatch**:
   - In `docker-compose.prod.yml:23`, update `PYTHON_SERVICE_URL` to `http://ai-microservice:8000/api/v1` (matching `pythonBridge.js`).
5. **Add Inter-Service Authentication Dependency**:
   - Add a lightweight API key dependency `verify_internal_token(x_internal_key: str = Header(...))` to `backend/app/core/security.py`.
   - Enforce it on sensitive routes (`/cv/*`, `/agents/*`, `/outreach/*`).
6. **Tune Uvicorn Workers & Concurrency Settings**:
   - In `backend/Dockerfile:38`, update worker count or make it configurable via `WEB_CONCURRENCY`: `CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4", "--limit-concurrency", "2000"]`.
7. **Expand Test Suite Coverage**:
   - Add integration tests for all 4 agent endpoints, file upload endpoints, quota limits, and error boundaries in `backend/tests/`.
8. **Add `pyproject.toml`**:
   - Create a clean `pyproject.toml` in `backend/` specifying project metadata, dependencies, and `pytest` configuration.
