# Developer & Scholar Onboarding Guide

Welcome to **Anusandhan (अनुसंधान AI)** — the autonomous intelligence platform for global research internships and high-precision academic outreach. This document details both the **Developer Quickstart** for local engineering and container orchestration, and the **Scholar Onboarding Journey** from registration to ethical faculty communication.

---

## 1. Developer Quickstart

### 1.1 System Prerequisites

Before starting the development stack, ensure your local environment has:
- **Node.js**: v20.18.0 LTS or higher (`node -v`)
- **Python**: v3.12 or v3.14 (`python --version`)
- **uv**: Fast Python package installer and virtual environment runner (`uv --version`)
- **Docker & Docker Compose**: v2.24+ for containerized deployments (`docker compose version`)
- **Git**: v2.40+ (`git --version`)

### 1.2 Repository Topology

```
ResearchIntern_Pro/
├── backend/                  # FastAPI AI & Audio Microservice (Python 3.12 / uv)
│   ├── app/                  # Routers, extraction pipelines, voice agent, Gemini bridge
│   └── tests/                # Microservice Pytest suites
├── server/                   # Express.js API Gateway & BFF (Node.js 20+)
│   ├── routes/               # Auth, Faculty, Outreach, Ingestion, Billing, Agents
│   ├── services/             # Redis cache, Python bridge, Ingestion scheduler
│   ├── middleware/           # Rate limiters, JWT authentication, Security headers
│   └── tests/                # Gateway unit, adversarial, and offline sync tests
├── src/                      # React SPA Frontend (Vite, TailwindCSS, Framer Motion)
├── docs/                     # VitePress Documentation Portal
├── k8s/                      # Production Kubernetes deployment manifests
├── docker-compose.prod.yml   # Multi-service production stack
└── tests/                    # 4-tier E2E suites & 1,000-user concurrency benchmark
```

### 1.3 Local Development Setup

#### Step 1: Clone and Configure Environment
```bash
git clone https://github.com/anusandhan-ai/ResearchIntern_Pro.git
cd ResearchIntern_Pro

# Gateway environment
cp server/.env.example server/.env

# AI Microservice environment
cp backend/.env.example backend/.env
```

Ensure `server/.env` contains your development configuration:
```ini
PORT=5000
NODE_ENV=development
JWT_SECRET=development_ephemeral_jwt_secret_key_2026_safe
TRUST_PROXY=false
RATE_LIMIT_MAX_AUTH=120
RATE_LIMIT_MAX_PUBLIC=1200
```

#### Step 2: Install Node.js Dependencies
```bash
# Install root dependencies
npm install

# Install server dependencies
cd server
npm install
cd ..
```

#### Step 3: Set Up Python AI Microservice
```bash
cd backend
pip install -r requirements.txt   # no pyproject.toml — `uv sync` will fail here
cd ..
```

#### Step 4: Run the Development Servers
In separate terminal sessions or using a process manager:

1. **Express API Gateway**:
   ```bash
   cd server
   npm start
   # Server online on http://127.0.0.1:5000
   ```

2. **FastAPI AI Microservice**:
   ```bash
   cd backend
   uv run uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
   # Microservice online on http://127.0.0.1:8000
   ```

3. **React SPA Frontend**:
   ```bash
   npm run dev
   # Frontend accessible on http://localhost:5173
   ```

4. **VitePress Documentation**:
   ```bash
   npm run docs:dev
   # Docs accessible on http://localhost:5174
   ```

---

## 2. Production Docker Compose Deployment

For containerized single-host deployment serving up to 1,000 active concurrent scholars:

```bash
# 1. Pre-flight validation audit
node scripts/validate_environment.js

# 2. Build and launch all 6 containerized services
docker compose -f docker-compose.prod.yml up -d --build

# 3. Check service health
docker compose -f docker-compose.prod.yml ps
```

The stack orchestrates:
- **`frontend`**: Pre-built static SPA served via NGINX (Port 80)
- **`gateway`**: Express.js API Gateway (Port 5000)
- **`ai-microservice`**: FastAPI AI Engine (Port 8000)
- **`redis-cache`**: Redis 7 Alpine with LRU eviction cap (Port 6379)
- **`postgres-db`**: PostgreSQL 16 Alpine with PgBouncer tuning (Port 5432)
- **`mongo-db`**: MongoDB 7 Jammy (Port 27017)

---

## 3. Running Verification Suites

Anusandhan enforces strict regression testing across all tiers:

```bash
# 1. Express Gateway Unit Tests (24 tests)
cd server && npm test

# 2. Adversarial Security Hardening & Offline Sync (15 tests)
cd server && node --test --env-file=.env tests/adversarial_m1.test.js tests/offline_sync.test.js

# 3. FastAPI Microservice Tests (14 Pytest tests)
cd backend && uv run pytest

# 4. Production Pre-Flight Environment Validation (8/8 checks)
node scripts/validate_environment.js

# 5. 4-Tier Opaque-Box E2E Tests (42 tests)
node --test tests/e2e/tier1_features.test.mjs tests/e2e/tier2_boundaries.test.mjs tests/e2e/tier3_interactions.test.mjs tests/e2e/tier4_realworld.test.mjs

# 6. 1,000-User Concurrency Benchmark (0.00% error rate SLA)
node tests/load/concurrency_benchmark_1000.cjs

# 7. Documentation Build (Zero dead links)
npm run docs:build
```

---

## 4. Scholar Onboarding Journeys

Anusandhan is built to guide scholars from cold-email frustration to structured, mathematically verified academic matchmaking.

### 4.1 Step 1: Account Creation & Institutional Verification

1. **Sign Up**: Navigate to the platform at `http://localhost:5173` and register using your university or institutional email.
2. **Institutional Domain Verification**:
   - Provide an accredited university email (e.g., `@iisc.ac.in`, `@iitd.ac.in`, `@stanford.edu`, `@ethz.ch`, `@ox.ac.uk`).
   - The platform verifies the institutional domain, marks the scholar profile as `isInstitutionalVerified: true`, and automatically awards **+10 bonus research credits**.
   - Idempotent race-condition protection guarantees that credit awards are granted exactly once per academic identity.

### 4.2 Step 2: CV Upload & Research Readiness Scoring (RRS™)

1. **Upload Resume**: Upload your academic CV in PDF format (`POST /api/jobs` with `type: cv_extraction`).
2. **PyPDF Microservice Deconstruction**:
   - The asynchronous worker pipeline inspects the document using `pypdf`, checking file magic bytes (`%PDF-`) to reject malformed or malicious binaries.
   - Extracts publication history, degree programs, GPA/CGPA, and technical capabilities.
3. **5-Pillar Score Calculation**:
   Your profile is scored against the 0–100 **Research Readiness Score**:
   - **Code Execution & Benchmarks** (25 pts): Verifiable GitHub repos with benchmarks.
   - **Research Methodology** (25 pts): Hypotheses formulation and academic rigor.
   - **Academic Foundations** (20 pts): Relevant coursework and CGPA.
   - **Lab Tooling & Frameworks** (15 pts): PyTorch, CUDA, JAX, or lab instrument tooling.
   - **Professionalism & Ethics** (15 pts): Structured communication style.
4. **Tier Placement**: Scholars are categorized into tiers: *Elite Global Fellow* (85+), *Competitive Candidate* (70–84), or *Explorer* (<70) with actionable gap analyses.

### 4.3 Step 3: Opportunity Explorer & Live Academic Ingestion

1. **National & Global Fellowships**:
   - Filter by fellowship programs: DAAD WISE, Mitacs Globalink, Charpak Lab, SN Bose Scholars, TIFR VSRP, and CERN Summer Student Program.
   - Filter by lifecycle stage: `active`, `upcoming`, or `passed`.
2. **Faculty Paper & Opportunity Search**:
   - Search across top faculty in Computer Science, Quantum Information, Bio-engineering, and Robotics.
   - The autonomous scraper continuously updates postings directly from ArXiv preprints and OpenAlex citation graphs with deterministic identifiers (`posting_arxiv_${paperKey}`).

### 4.4 Step 4: Voice Mentor & Viva Interaction

1. **Interactive Autonomous Assistant**:
   - Launch the floating `AutonomousAssistantWidget` in collapsed, expanded, or floating mode.
   - Speak or type questions regarding upcoming fellowship deadlines, lab fit, or paper prerequisites.
2. **Paper Deconstruction & Mock Interview**:
   - Request an instant deconstruction of any target professor's latest paper.
   - Engage in a turn-based simulated viva (`POST /api/agents/mock-interview`) where the AI mentor tests your understanding of baseline ablation experiments and dataset limitations before contacting faculty.

### 4.5 Step 5: 146-Word Proof-of-Work Outreach & Ethical Dispatch

1. **Draft Generation**:
   - Request an outreach draft (`POST /api/outreach/draft`). The platform constructs a tailored 146-word inquiry:
     - **Hook**: Cites an exact paper published by the lab (2024–2026).
     - **Limitation**: Identifies the primary bottleneck or open problem from the discussion section.
     - **Bridge**: Links the student's specific GitHub reproduction script or proposed methodology.
     - **Ask**: Suggests a 12-minute technical consultation.
2. **Mandatory Human Confirmation**:
   - Dispatches cannot be automated. The scholar must review the draft, verify technical accuracy, and click **Approve Dispatch**.
3. **Jittered Sending Queue**:
   - The system queues the email with a randomized 4–12 minute delay to preserve sender inbox reputation and SPF/DKIM alignment.
   - Enforces a strict daily cap of 5 cold outreach emails per 24 hours.
4. **CRM Pipeline Tracking**:
   - Track application status (`queued`, `sent`, `replied`, `interview_scheduled`) directly in your multi-tenant isolated dashboard.
