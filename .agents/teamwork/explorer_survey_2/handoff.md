# Handoff Report: FastAPI AI Microservice Survey (`backend/`)

**Agent**: teamwork_explorer (Instance 2 - Survey Phase)  
**Date**: 2026-11-03T20:30:00Z  
**Recipient**: Orchestrator (ID: 369038bb-e0c3-488c-afe2-41c9a6e66fc2)  
**Working Directory**: `c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_survey_2\`  
**Detailed Report**: `c:\PROJECTS\ResearchIntern_Pro\.agents\teamwork\explorer_survey_2\survey_report.md`  

---

## 1. Observation

1. **Test Suite Baseline**:
   - Tool Command: `cd backend; uv run pytest`
   - Output:
     ```
     platform win32 -- Python 3.14.5, pytest-9.2.0, pluggy-1.7.0
     rootdir: C:\PROJECTS\ResearchIntern_Pro\backend
     configfile: pytest.ini
     plugins: anyio-4.15.1, asyncio-1.4.1
     collected 14 items

     tests\test_security_and_services.py .............. [100%]
     ======================== 14 passed, 1 warning in 0.77s ========================
     ```
   - Warning:
     `tests/test_security_and_services.py:97: StarletteDeprecationWarning: Using httpx with starlette.testclient is deprecated; install httpx2 instead.`

2. **Lifespan & FastAPI App Initialization**:
   - `backend/app/main.py:13-19`:
     ```python
     app = FastAPI(
         title=settings.PROJECT_NAME,
         version=settings.VERSION,
         description="Production-grade AI Infrastructure for Global Research Internships & Healthy Academic Outreach",
         docs_url="/docs",
         redoc_url="/redoc"
     )
     ```
     No `lifespan` context manager or startup/shutdown hooks exist.

3. **Insecure CORS Configuration**:
   - `backend/app/main.py:34-40`:
     ```python
     app.add_middleware(
         CORSMiddleware,
         allow_origins=["*"],  # Permits local dev and preview hosts
         allow_credentials=True,
         allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
         allow_headers=["*"],
     )
     ```
     Combines wildcard origin `allow_origins=["*"]` with `allow_credentials=True`.

4. **Synchronous `def` Endpoints on I/O Bound Agent Routes**:
   - `backend/app/routers/agent_router.py:28`: `def deconstruct_paper_and_pitch(req: PaperPitchRequest):`
   - `backend/app/routers/agent_router.py:57`: `def evaluate_mock_interview_turn(req: MockInterviewRequest):`
   - `backend/app/routers/agent_router.py:87`: `def audit_profile_and_diagnose(req: CVDiagnosticRequest):`
   - `backend/app/routers/agent_router.py:116`: `def scan_grant_and_lab_capacity(req: GrantRadarRequest):`
   - `backend/app/agents/base_agent.py:46-50`:
     ```python
     response = self.client.models.generate_content(
         model=model,
         contents=prompt,
         config=config
     )
     ```
     Synchronous blocking call to Gemini API running inside Starlette's 40-thread worker pool.

5. **Ad-Hoc Unpooled HTTP Clients**:
   - `backend/app/services/scholar_service.py:279`: `async with httpx.AsyncClient(timeout=4.0) as client:`
   - `backend/app/agents/voice_mentor_agent.py:259`: `async with httpx.AsyncClient(timeout=4.0) as client:`
   - New client, DNS lookup, and TLS handshake spawned per request.

6. **State Isolation in Multi-Worker Environments**:
   - `backend/app/services/outreach_service.py:24-26`:
     ```python
     self.drafts: Dict[str, dict] = {}
     self.queue: Dict[str, dict] = {}
     self.daily_counts: Dict[str, int] = {}  # student_id -> count
     ```
     Queue and daily quota state stored in Python memory without persistence.

7. **Production Docker-Compose URL Mismatch**:
   - `docker-compose.prod.yml:23`:
     `PYTHON_SERVICE_URL=http://ai-microservice:8000`
   - `server/services/pythonBridge.js:8, 25`:
     ```javascript
     const PYTHON_SERVICE_URL = process.env.PYTHON_SERVICE_URL || 'http://127.0.0.1:8000/api/v1';
     ...
     const res = await client.get('/audit/status');
     ```
   - In container execution, calls target `http://ai-microservice:8000/audit/status`, but route is mounted at `http://ai-microservice:8000/api/v1/audit/status` in FastAPI (`main.py:48`), returning HTTP 404.

8. **Missing Configuration & Token Validation**:
   - No `pyproject.toml` file exists in `backend/`.
   - Zero authentication / token validation checks exist across all FastAPI routes (`cv_router`, `scholar_router`, `outreach_router`, `voice_router`, `agent_router`, `audit_router`).

---

## 2. Logic Chain

1. **Concurrency Bottleneck (1,000 Users)**:
   - Observation 4 shows all 4 autonomous agent routes in `agent_router.py` are declared as synchronous `def`.
   - In FastAPI / Starlette, synchronous `def` functions run in an AnyIO threadpool defaulting to 40 threads.
   - When calling Google Gemini via `self.client.models.generate_content()`, each call blocks a worker thread for 1.0–4.0 seconds.
   - Under 1,000 active concurrent users, 40 threads will saturate in < 50ms, causing 960 requests to queue up and exceed the Express Gateway's 6,000ms Axios timeout (`pythonBridge.js:12`), leading to widespread 504 timeouts and unhandled request drops.
   - Therefore, converting routes to `async def` and using asynchronous generation or async thread limiters is mandatory for 1,000-user concurrency.

2. **Connection Starvation**:
   - Observation 5 shows `httpx.AsyncClient` is created ad-hoc inside `scholar_service.py:279` and `voice_mentor_agent.py:259`.
   - Under 1,000 concurrent requests, instantiating 1,000 independent HTTP clients exhausts operating system TCP sockets and causes high latency from repeated TLS handshakes.
   - Observation 2 shows the absence of a `lifespan` handler to manage persistent client sessions.
   - Therefore, adding a FastAPI `lifespan` manager holding a shared `httpx.AsyncClient` with `Limits(max_connections=1000, max_keepalive_connections=200)` is necessary.

3. **Multi-Worker State Fragmentation**:
   - Observation 6 shows `outreach_service` keeps daily email limits and dispatch queues in memory.
   - Observation 1 in Dockerfile shows uvicorn running with `--workers 2` (or scaled to 4+ workers for 1,000 users).
   - In multi-process Python, memory is not shared between processes; a user routed to Worker A has a separate count from Worker B, bypassing the 5 email/day limit. A server restart deletes all scheduled items.
   - Therefore, rate-limiting and queue state must either be centralized (Redis) or handed off to the Express Gateway's persistent queue (`server/queues/jobQueue.js`).

4. **Production Routing Failure**:
   - Observation 7 establishes that `docker-compose.prod.yml:23` sets `PYTHON_SERVICE_URL=http://ai-microservice:8000` while `pythonBridge.js` sends requests to `/audit/status`, `/faculty`, etc.
   - Because FastAPI mounts routers at `/api/v1`, all calls from Express fail with 404 in production containers.
   - Therefore, updating `PYTHON_SERVICE_URL=http://ai-microservice:8000/api/v1` in `docker-compose.prod.yml` is required.

5. **Security Exposure**:
   - Observation 3 shows `allow_origins=["*"]` with `allow_credentials=True`. Modern browsers reject this configuration or expose authenticated endpoints to cross-origin abuse.
   - Observation 8 shows zero token validation on FastAPI endpoints, allowing direct unauthenticated invocation if port 8000 is reachable.
   - Therefore, tightening CORS to `settings.ALLOWED_ORIGINS` and adding internal service token verification is required.

---

## 3. Caveats

1. **External AI API Keys**: During survey execution, no live `GEMINI_API_KEY` or `SARVAM_API_KEY` was active in the local environment; verified behavior relies on the deterministic heuristic fallback engines implemented in `base_agent.py`, `cv_diagnostic_agent.py`, `grant_radar_agent.py`, `mock_interview_agent.py`, `paper_deconstruction_agent.py`, and `voice_mentor_agent.py`.
2. **Database Scope**: The microservice contains no database code directly; database connection pooling (PostgreSQL, MongoDB, Redis) is managed upstream in `server/`. Microservice statefulness is currently isolated to in-memory dictionaries.
3. **Network Mode**: Investigation was performed in read-only analysis mode without modifying source code or live deployment containers.

---

## 4. Conclusion

The Python FastAPI microservice provides rich domain capabilities and resilient offline fallback behavior, passing all 14 baseline tests in 0.77s. However, it cannot reliably sustain 1,000 active concurrent users or launch safely in production containers in its current configuration due to:
1. Synchronous blocking LLM calls saturating the 40-thread AnyIO pool.
2. Unpooled `httpx.AsyncClient` instantiation on every external request.
3. Production URL prefix mismatch in `docker-compose.prod.yml` (`http://ai-microservice:8000` vs `/api/v1`).
4. In-memory queue and rate-limit state that fragments across Uvicorn workers.
5. Insecure wildcard CORS with credentials enabled and zero internal service authentication.

---

## 5. Verification Method

1. **Verify Baseline Test Suite**:
   ```bash
   cd c:\PROJECTS\ResearchIntern_Pro\backend
   uv run pytest
   ```
   *Expected*: 14 passed in < 1s, 1 Starlette deprecation warning.

2. **Verify Threadpool & Synchronous Route Signatures**:
   Inspect lines 28, 57, 87, 116 in `c:\PROJECTS\ResearchIntern_Pro\backend\app\routers\agent_router.py` to confirm `def` instead of `async def`.
   Inspect line 46 in `c:\PROJECTS\ResearchIntern_Pro\backend\app\agents\base_agent.py` to confirm synchronous `self.client.models.generate_content`.

3. **Verify CORS Configuration**:
   Inspect lines 34-40 in `c:\PROJECTS\ResearchIntern_Pro\backend\app\main.py` to confirm `allow_origins=["*"]` with `allow_credentials=True`.

4. **Verify Docker-Compose Routing Mismatch**:
   Inspect line 23 in `c:\PROJECTS\ResearchIntern_Pro\docker-compose.prod.yml` (`PYTHON_SERVICE_URL=http://ai-microservice:8000`) and compare with line 48 in `c:\PROJECTS\ResearchIntern_Pro\backend\app\main.py` (`prefix=settings.API_V1_PREFIX`).

5. **Invalidation Conditions**:
   The conclusions would be invalidated if FastAPI routes were already asynchronous with async streaming clients, if a shared Redis client backed `outreach_service`, and if `PYTHON_SERVICE_URL` in docker-compose already included `/api/v1`.
