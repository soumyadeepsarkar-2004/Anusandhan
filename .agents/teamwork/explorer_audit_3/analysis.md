# Verification Resources, Concurrency Benchmarks, Test Suites, and Documentation Portal Analysis

**Audit Investigator**: `teamwork_explorer` (`explorer_audit_3`)  
**Date**: 2026-11-04  
**Target Repository**: `c:\PROJECTS\ResearchIntern_Pro`  
**Integrity Mode**: Production Hardening & 1,000 Concurrent Scholar Scalability  

---

## Executive Summary

This investigation conducted an in-depth empirical audit of the verification resources, concurrency benchmarks, documentation portal, test suites, and security posture for the **Anusandhan (अनुसंधान AI)** platform.

1. **1,000-User Concurrency Benchmark**:
   - `tests/load/concurrency_benchmark_1000.cjs` was empirically executed against the live gateway.
   - **Result**: Successfully executed **7,906 requests** across 1,000 virtual users over 12 seconds with **0.00% error rate** (0 failed requests), **597.6 req/sec** sustained throughput (6.90 MB/sec), median latency p50 of **604.5 ms**, and **zero unhandled server crashes**.
   - Socket pooling, HTTP keep-alive timeouts (`server.keepAliveTimeout = 65000` > `agent.keepAliveMsecs = 60000`), server connection backlog (`2048`), per-user JWT token generation, Node fallback bridges, and short-TTL health caching are the critical technical prerequisites enabling 0.00% error rate.

2. **Documentation Portal (`docs/`, `.vitepress/`)**:
   - `npm run docs:build` executed cleanly with exit code 0 (`build complete in 6.88s`).
   - Zero broken references, broken links, or missing images (`brand-emblem.png` properly present).
   - Content coverage covers Product (`overview.md`), Architecture (`architecture.md`), Concurrency (`concurrency.md`), Security (`security.md`), Deployment (`deployment.md`), and API Reference (`api-reference.md`).
   - **Gap Identified**: While Deployment and Product are documented, an explicit **Onboarding Guide** (`docs/onboarding.md`) detailing developer environment setup/quickstart and scholar onboarding journeys is currently missing from `docs/` and `.vitepress/config.mts`.

3. **Workspace Test Suite Inventory**:
   - Total of **95 automated tests** across 5 distinct test suites:
     - `server/tests/gateway.test.js`: 24/24 passing (100%).
     - `server/tests/adversarial_m1.test.js`: 13/13 passing (100%).
     - `server/tests/offline_sync.test.js`: 2/2 passing (100%).
     - `backend/tests/test_security_and_services.py`: 14/14 passing (100%).
     - `tests/e2e/tier*.test.mjs` (Tiers 1–4): 42/42 passing (100%).
   - **Adversarial Runner Finding**: In `tests/adversarial/run_all_adversarial.mjs`, Suite 4 (`auth_concurrency_stress.test.mjs`) fails when `TRUST_PROXY` is not set because 120 unauthenticated logins are throttled to `ip:127.0.0.1` after 120 registrations exhaust the 15-minute rate limit.

4. **Security Vulnerability Evaluation**:
   - `server/` (production API gateway): **0 vulnerabilities** (`found 0 vulnerabilities`).
   - `backend/` (FastAPI AI microservice): **0 vulnerabilities** across all Python packages.
   - Root `package.json`: 6 vulnerabilities in `devDependencies` (5 moderate, 1 high in `vite <=6.4.3` via `launch-editor`), with **zero exposure in production runtime** since frontend and documentation are pre-compiled into static artifacts.

---

## 1. Concurrency Benchmark & 1,000-User Scalability Assessment

### 1.1 Architecture of `concurrency_benchmark_1000.cjs`

The load benchmark script (`tests/load/concurrency_benchmark_1000.cjs`) is a custom high-performance Node.js load runner designed to model authentic academic scholar behaviors:

- **Socket Pooling & Reuse**:
  ```javascript
  const agent = new http.Agent({
    keepAlive: true,
    maxSockets: CONCURRENT_USERS,      // 1,000 sockets
    maxFreeSockets: CONCURRENT_USERS,  // 1,000 idle sockets kept open
    maxTotalSockets: CONCURRENT_USERS * 2, // 2,000 socket ceiling
    keepAliveMsecs: 60000,             // 60-second TCP keepalive
    timeout: REQUEST_TIMEOUT_MS        // 10,000ms socket timeout
  });
  ```
  This configuration prevents Windows ephemeral port exhaustion (`TIME_WAIT` socket buildup) by maintaining persistent TCP connections across the duration of the test.

- **Windows Loopback Compatibility**:
  The benchmark targets `http://127.0.0.1:5000` directly rather than `http://localhost:5000`. On Windows, resolving `localhost` alternates between IPv6 `::1` and IPv4 `127.0.0.1`, often triggering dual-stack resolution latency, intermittent `ECONNREFUSED`, and socket pool collisions. Using `127.0.0.1` ensures deterministic IPv4 loopback socket reuse.

- **Retry & Exponential Backoff**:
  The `executeRequestWithRetry` function intercepts transient transport errors (`ECONNREFUSED`, `ECONNRESET`, `ETIMEDOUT`, `EADDRINUSE`, or `timed out`) with up to 8 retries and randomized exponential backoff:
  ```javascript
  const backoffDelay = Math.floor(100 * Math.pow(1.5, 8 - retries) + Math.random() * 200);
  await new Promise((r) => setTimeout(r, backoffDelay));
  ```
  Crucially, HTTP application-level responses (200, 202, 401, 404, 429, 500) do NOT trigger retries; they are recorded directly, ensuring that rate limits or server errors are honestly captured.

- **Realistic Workload Distribution**:
  The benchmark models 5 concurrent academic traffic streams:
  1. **50% Cached Reads**: `GET /api/faculty?scope=national|global` (served via Redis / Memory LRU cache).
  2. **20% Telemetry & Health Checks**: `GET /api/health`.
  3. **15% Asynchronous Job Queue**: `POST /api/jobs` (202 Accepted).
  4. **10% Auth & Profile Operations**: `POST /api/auth/login`.
  5. **5% AI Agent & Voice Dialog Synthesis**: `POST /api/agents/paper-pitch` and `POST /api/voice/turn`.

### 1.2 Empirical Verification Execution Results

The benchmark was executed against the running Express Gateway (`http://127.0.0.1:5000`):
- **Command**: `node tests/load/concurrency_benchmark_1000.cjs`
- **Duration**: 12 seconds
- **Concurrent Users**: 1,000

| Metric | Benchmark SLA Requirement | Measured Result | Status |
|---|---|---|---|
| **Total Requests** | > 5,000 | **7,906** | PASS |
| **Successful Requests** | - | **7,906** | PASS |
| **Failed Requests** | - | **0** | PASS |
| **Overall Error Rate** | < 1.0% | **0.00%** | PASS (Flawless) |
| **Sustained Throughput** | > 400 req/sec | **597.6 req/sec** (6.90 MB/sec) | PASS |
| **Unhandled Server Crashes** | 0 | **0 crashes** | PASS |
| **p50 (Median Latency)** | < 800 ms | **604.5 ms** | PASS |
| **p90 Latency** | - | **1,122.1 ms** | PASS |
| **p95 Latency** | < 3,000 ms | **2,273.5 ms** | PASS |
| **p99 Latency** | < 6,000 ms | **4,541.7 ms** | PASS |

#### Workload Category Breakdown:
- **Cached Reads (50%)**: 3,890 requests | Error: 0.00% | p50: 593.4ms | p95: 2,547.8ms
- **Health Telemetry (20%)**: 1,599 requests | Error: 0.00% | p50: 625.9ms | p95: 1,831.6ms
- **Async Jobs (15%)**: 1,262 requests | Error: 0.00% | p50: 592.4ms | p95: 3,282.9ms
- **Auth & Profile (10%)**: 764 requests | Error: 0.00% | p50: 590.8ms | p95: 1,816.1ms
- **AI Agent Synthesis (5%)**: 391 requests | Error: 0.00% | p50: 1,217.7ms | p95: 2,359.6ms

### 1.3 Technical Requirements to Guarantee 0.00% Error Rate Under 1,000 Users

Through inspection of `server/server.js`, `server/middleware/rateLimiter.js`, `server/services/pythonBridge.js`, and `tests/load/concurrency_benchmark_1000.cjs`, the following requirements must be strictly met:

1. **Keep-Alive Timeout Hierarchy**:
   `server.keepAliveTimeout` (65,000ms) and `server.headersTimeout` (66,000ms) on the Express server MUST exceed client-side `keepAliveMsecs` (60,000ms). If server keep-alive is lower than client keep-alive, the server may close a socket just as the client initiates a request, producing intermittent `ECONNRESET` under load.
2. **Listen Socket Backlog Depth**:
   In `server/server.js` line 281: `app.listen(PORT, '0.0.0.0', 2048, ...)`. The TCP backlog queue MUST be set to at least 1,024 (set to 2,048 here) so that the operating system socket accept queue does not drop incoming TCP SYN packets during the initial 5-second ramp-up of 1,000 concurrent sockets.
3. **Per-User Rate-Limiter Throttling Keys**:
   In `server/middleware/rateLimiter.js`:
   `identifier = userId ? 'usr:' + userId : 'ip:' + ip;`
   In `concurrency_benchmark_1000.cjs`, each virtual user generates their own distinct token (`usr_bench_${userId}`). Because each user submits `Authorization: Bearer <token>`, the server isolates quotas per virtual student (`usr:usr_bench_X`). If all 1,000 users were treated under a single loopback IP (`ip:127.0.0.1`), the `publicReadLimiter` (1,200 requests/min) and `aiLimiter` (30 requests/min) would immediately throttle requests with HTTP 429.
4. **Short-TTL Telemetry Caching**:
   `server/server.js` lines 203–232 implement a 3-second TTL cache (`PYTHON_HEALTH_CACHE_TTL_MS = 3000`) for Python microservice health probes. During 1,599 `/api/health` probes, the gateway does not spawn 1,599 loopback HTTP requests to FastAPI (which would cause ephemeral port starvation on Windows), but shares the cached health status.
5. **Node.js Fallback Handlers for AI/Voice Endpoints**:
   `server/routes/agentRoutes.js` and `server/routes/voiceRoutes.js` feature in-process heuristic fallbacks when `PythonBridge` returns null or times out. This prevents AI-intensive calls (`/api/agents/paper-pitch`, `/api/voice/turn`) from stalling the gateway event loop or returning 504/500 errors if the Python service is under heavy CPU load.

---

## 2. Documentation Portal Assessment

### 2.1 Build Status
- **Build Command**: `npm run docs:build` (`vitepress build docs`)
- **Execution Time**: 6.88 seconds
- **Exit Code**: `0`
- **Result Output**:
  ```
  vitepress v1.6.4
  ✓ building client + server bundles...
  ✓ rendering pages...
  build complete in 6.88s.
  ```

### 2.2 Navigation & Sidebar Configuration
Inspection of `docs/.vitepress/config.mts` reveals:
- **Navbar Links**:
  - `/overview` -> `docs/overview.md` (Valid)
  - `/architecture` -> `docs/architecture.md` (Valid)
  - `/concurrency` -> `docs/concurrency.md` (Valid)
  - `/security` -> `docs/security.md` (Valid)
  - `/api-reference` -> `docs/api-reference.md` (Valid)
  - `/deployment` -> `docs/deployment.md` (Valid)
- **Sidebar Groups**:
  - `Getting Started`: Platform Overview (`/overview`), System Architecture (`/architecture`)
  - `Production Engineering`: 1,000-User Concurrency (`/concurrency`), Security & Anti-Abuse Audit (`/security`), Deployment & Orchestration (`/deployment`)
  - `API Reference`: REST & Voice API Reference (`/api-reference`)
- **Assets**: Favicon and logo link to `/brand-emblem.png`, verified present in `public/brand-emblem.png` and `dist/brand-emblem.png`.
- **Search**: Built-in local search index is configured and functional.

### 2.3 Broken Links and Missing References
- **Internal Cross-References**: Checked all links across `docs/*.md`. All link targets (`/architecture`, `/api-reference`, `/concurrency`) resolve cleanly to existing pages.
- **Dead References**: None detected.
- **External Links**: OpenAlex, ArXiv, and Gemini endpoints cited in documentation are valid.

### 2.4 Content Coverage & Gap Analysis
| Content Domain | Documentation File | Coverage Scope | Status |
|---|---|---|---|
| **Product** | `docs/overview.md` | Academic cold-email problem statement, 5 pillars of RRS (Research Readiness Score), 146-word precision proof-of-work standard, ethical outreach guardrails (5/day quota, jitter, human-in-the-loop, 7-day cadence). | **Complete** |
| **Architecture** | `docs/architecture.md` | System topology blueprint, React client tier, Express gateway/BFF, FastAPI AI microservice, Supabase PgBouncer (20 sockets), MongoDB Mongoose (10–50 sockets), Redis multi-tier cache, BullMQ async queue. | **Complete** |
| **API Reference** | `docs/api-reference.md` | Complete request/response schemas for Gateway (`/api/health`, `/api/auth/*`, `/api/faculty`, `/api/jobs/*`, `/api/voice/turn`) and FastAPI (`/api/v1/agents/paper-pitch`, `/api/v1/agents/mock-interview`). | **Complete** |
| **Deployment / Runbook** | `docs/deployment.md` | Pre-flight validation script (`validate_environment.js`), Docker Compose multi-service topology, Kubernetes manifests (`k8s/`), HPA autoscaling policies, operational health URLs. | **Complete** |
| **Concurrency** | `docs/concurrency.md` | Keep-alive socket reuse, PgBouncer pool multiplexing, MongoDB connection caps, in-memory LRU eviction (5,000 keys), verified benchmark table. | **Complete** |
| **Security** | `docs/security.md` | Reverse-proxy anti-spoofing, scrypt password hashing, production secrets fail-fast, HMAC-SHA256 Razorpay webhook verification, SSRF domain whitelist, PDF magic byte checks, DPDP Act 2023 / GDPR compliance. | **Complete** |
| **Onboarding** | *None* | Currently missing a dedicated developer quickstart guide (`docs/onboarding.md`) detailing local environment setup (Node.js 20+, `uv`, Python 3.12), running the backend stack, seeding demo faculty data, and the scholar user journey. | **Missing Page** |

**Recommendation for Documentation**:
Create `docs/onboarding.md` covering:
1. **Developer Quickstart**: Prerequisites, cloning, `.env` setup, starting the Node gateway (`npm start` in `server/`), running the FastAPI service (`uv run uvicorn app.main:app` in `backend/`), running Vite (`npm run dev`), and running test suites.
2. **Scholar Journey Onboarding**: Account creation, institutional email verification (`.ac.in` / `.edu`) for bonus credits, uploading CV for RRS audit, filtering faculty, and sending ethical outreach.
3. Update `docs/.vitepress/config.mts` sidebar under `Getting Started` to include `{ text: 'Developer & Scholar Onboarding', link: '/onboarding' }`.

---

## 3. Workspace Test Suite Inventory and Execution Analysis

### 3.1 Comprehensive Test Suite Inventory

| Test Suite File | Subsystem | Test Type | Total Tests | Pass Status | Real / Mock Dependencies | Execution Command |
|---|---|---|---|---|---|---|
| `server/tests/gateway.test.js` | Express Gateway & BFF | Unit / Interface Contracts | 24 | **24 / 24 Passed (100%)** | Zero external daemons required. In-memory database & cache fallback. | `cd server; npm test` (or `node --test --env-file=.env tests/gateway.test.js`) |
| `server/tests/adversarial_m1.test.js` | Security Hardening | Security / Adversarial Challenges | 13 | **13 / 13 Passed (100%)** | In-memory server instance. Tests IP spoofing, secrets, IDOR, webhooks. | `cd server; node --test --env-file=.env tests/adversarial_m1.test.js` |
| `server/tests/offline_sync.test.js` | Offline Outbox | Unit / Idempotency | 2 | **2 / 2 Passed (100%)** | Zero dependencies. Verifies client outbox deduplication keys. | `cd server; node --test --env-file=.env tests/offline_sync.test.js` |
| `backend/tests/test_security_and_services.py` | FastAPI Microservice | Unit / Integration | 14 | **14 / 14 Passed (100%)** | In-process Starlette `TestClient`. Tests SSRF whitelist, PyPDF parser, Gemini fallback, voice turns. | `cd backend; uv run pytest` |
| `tests/e2e/tier1_features.test.mjs` | Full Stack | E2E Isolation Contracts | 22 | **22 / 22 Passed (100%)** | Requires running Express Gateway on port 5000. | `node --test tests/e2e/tier1_features.test.mjs` |
| `tests/e2e/tier2_boundaries.test.mjs` | Full Stack | E2E Security & Boundaries | 14 | **14 / 14 Passed (100%)** | Requires running Express Gateway on port 5000. | `node --test tests/e2e/tier2_boundaries.test.mjs` |
| `tests/e2e/tier3_interactions.test.mjs` | Full Stack | E2E Pairwise Workflows | 5 | **5 / 5 Passed (100%)** | Requires running Express Gateway on port 5000. | `node --test tests/e2e/tier3_interactions.test.mjs` |
| `tests/e2e/tier4_realworld.test.mjs` | Full Stack | E2E 10-Stage Scholar Journey | 1 | **1 / 1 Passed (100%)** | Requires running Express Gateway on port 5000. | `node --test tests/e2e/tier4_realworld.test.mjs` |
| `tests/adversarial/run_all_adversarial.mjs` | Full Stack | Adversarial Penetration | 4 suites | **3 / 4 Passed** (Suite 4 fails on login burst if `TRUST_PROXY` unset) | Ephemeral port bindings. | `node tests/adversarial/run_all_adversarial.mjs` |
| `tests/load/concurrency_benchmark_1000.cjs` | Load & Scalability | 1,000-User Async Benchmark | 1 | **PASSED (0.00% error rate)** | Requires running Express Gateway on port 5000. | `node tests/load/concurrency_benchmark_1000.cjs` |

### 3.2 Root Cause Analysis of Suite 4 Failure in `run_all_adversarial.mjs`

When executing `node tests/adversarial/run_all_adversarial.mjs`, Suite 4 (`tests/adversarial/auth_concurrency_stress.test.mjs`) encountered:
```
AssertionError [ERR_ASSERTION]: All 120 concurrent logins must succeed
0 !== 120
```

**Root Cause**:
1. In `server/server.js`, `trust proxy` defaults to `false` when `TRUST_PROXY` is not defined in the environment. This was deliberately added as part of Milestone 1 security hardening to prevent direct client IP spoofing via forged `X-Forwarded-For` headers.
2. In `auth_concurrency_stress.test.mjs`, Phase 1 executes 120 rapid student registrations with synthetic header `X-Forwarded-For: 10.200.x.y`. Because `trust proxy` is false, Express ignores `X-Forwarded-For` and attributes all 120 registrations to the loopback physical socket `127.0.0.1`.
3. In `server/middleware/rateLimiter.js`, `authLimiter` has `maxRequests: 120` per 15-minute window (`windowSeconds: 900`). Phase 1 exhausts exactly 120 requests for `ip:127.0.0.1`.
4. Phase 2 then attempts 120 logins without an `Authorization` bearer token (since the user is not authenticated yet). `rateLimiter.js` looks up `ip:127.0.0.1`, observes `entry.count = 121 > 120`, and immediately returns `429 Too Many Requests` for all 120 logins.
5. **Remediation**: In test environments or when running behind a proxy simulation, setting `$env:TRUST_PROXY="true"` allows Express to honor distinct client IPs (`10.200.x.y`), or `RATE_LIMIT_MAX_AUTH="500"` provides sufficient headroom for high-burst registration+login test runs.

---

## 4. Security Vulnerability Audit

### 4.1 Dependency Audit by Subsystem

#### 1. Express API Gateway (`server/package.json`):
- **Command**: `cd server; npm audit`
- **Result**: `found 0 vulnerabilities` (Clean)
- **Runtime Dependencies**:
  - `express`: `4.21.2` (Patched against prototype pollution and routing bypasses)
  - `helmet`: `8.3.0` (Full HTTP security header suite: CSP, HSTS, X-Frame-Options DENY, nosniff)
  - `jsonwebtoken`: `9.0.2` (Modern JWT library with strong signature algorithm enforcement)
  - `axios`: `1.7.9` (Patched against SSRF and prototype pollution)
  - `mongoose`: `8.9.5` (Current stable MongoDB ODM)
  - `pg`: `8.23.1` (Current node-postgres client)
  - `dotenv`: `16.4.7`
  - `morgan`: `1.10.0`
- **Assessment**: Zero runtime vulnerabilities in the primary API gateway.

#### 2. Python FastAPI Microservice (`backend/requirements.txt`):
- **Environment**: Python 3.14 / uv virtualenv
- **Packages**:
  - `fastapi`: `0.162.0` (Current high-performance ASGI framework)
  - `uvicorn`: `0.54.0`
  - `pydantic`: `2.14.2` (Strict schema validation preventing type confusion)
  - `pypdf`: `6.21.4` (Current PDF reader, hardened against infinite recursion in malformed trees)
  - `httpx`: `0.28.1`
  - `websockets`: `17.4`
  - `cryptography`: `50.0.2`
  - `urllib3`: `2.8.0`
- **Assessment**: Zero unmitigated CVEs in the AI microservice.

#### 3. Root Workspace & Frontend Tooling (`package.json`):
- **Command**: `npm audit`
- **Result**: 6 vulnerabilities (5 moderate, 1 high, 0 critical)
  - **Vulnerability Breakdown**:
    - `vite` (`<=6.4.3`) — High severity (`GHSA-587h-7wmj-h5pm`): `launch-editor` Windows path check bypass.
    - `esbuild` (`<=0.24.2`) — Moderate severity (`GHSA-67mh-4wv8-2f99`): dev server website request reading.
    - `minimatch` (`<11.0.1`) — Moderate severity (`GHSA-g3hv-75wg-m249`): globparts amplification DoS.
    - `glob` (`3.0.0 - 14.0.1`) — Moderate severity (`GHSA-3g3m-2fjr-6pw4`): traversal bypass via AbortSignal.
    - `rimraf` (`4.2.0 - 6.1.3`) — Moderate (transitively via glob).
    - `vitepress` (`<=1.6.4`) — Moderate (transitively via vite).
  - **Risk Assessment & Production Exposure**:
    - **Production Risk: NONE**.
    - All 6 vulnerabilities reside strictly within build-time `devDependencies` (`vite`, `vitepress`, `esbuild`, `electron-builder`).
    - The production deployment topology utilizes multi-stage Docker builds (`Dockerfile` and `docker-compose.prod.yml`). The frontend is pre-compiled via `npm run build` into static assets (`dist/`), which are served statically via NGINX on port 80. The `vite` development server and `launch-editor` middleware are never executed or exposed to network traffic in production.
    - VitePress documentation is similarly compiled via `npm run docs:build` into static files in `docs/.vitepress/dist/`.
  - **Mitigation Recommendations**:
    1. Execute `npm audit fix` to bump `minimatch` and `glob` to non-vulnerable versions.
    2. Maintain multi-stage Docker builds ensuring that `devDependencies` are excluded from runtime images (`npm prune --production`).
    3. Monitor VitePress releases for an upstream upgrade bundling Vite >= 6.4.4.

---

## 5. Synthesis & Prioritized Recommendations

| Item | Priority | Component | Recommendation |
|---|---|---|---|
| **1. Create Onboarding Documentation** | **High** | `docs/` | Author `docs/onboarding.md` covering Developer Quickstart (Node, uv, starting services, running tests) and Scholar Onboarding (registration, `.ac.in` domain attestation, RRS scoring, outreach). Add to `.vitepress/config.mts` sidebar under "Getting Started". |
| **2. Auth Concurrency Stress Rate Limit Tuning** | **Medium** | `tests/adversarial/` | In `tests/adversarial/auth_concurrency_stress.test.mjs`, configure `process.env.RATE_LIMIT_MAX_AUTH = '500'` or `process.env.TRUST_PROXY = 'true'` in the `test.before` setup hook so that 120 registrations + 120 logins do not trip the default 120-request threshold for loopback IP. |
| **3. Update Glob/Minimatch Dependencies** | **Low** | Root `package.json` | Run `npm audit fix` to upgrade `minimatch` and `glob` in root devDependencies. |
| **4. Starlette Deprecation Warning Cleanup** | **Low** | `backend/tests/` | In `backend/tests/test_security_and_services.py` line 97, replace deprecated `starlette.testclient` import or install `httpx2` to silence pytest warning. |

---

## Verification Commands Reference

```powershell
# 1. 1,000-User Concurrency Benchmark
node tests/load/concurrency_benchmark_1000.cjs

# 2. VitePress Documentation Build
npm run docs:build

# 3. Server Unit & Contract Tests
cd server; npm test

# 4. Server Adversarial Tests
cd server; node --test --env-file=.env tests/adversarial_m1.test.js

# 5. Server Offline Sync Tests
cd server; node --test --env-file=.env tests/offline_sync.test.js

# 6. Python AI Microservice Tests
cd backend; uv run pytest

# 7. Complete Opaque-Box E2E Suite (Tiers 1–4)
node --test tests/e2e/tier1_features.test.mjs tests/e2e/tier2_boundaries.test.mjs tests/e2e/tier3_interactions.test.mjs tests/e2e/tier4_realworld.test.mjs

# 8. Production Pre-Flight Environment Validation
node scripts/validate_environment.js
```
