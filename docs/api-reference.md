# REST & Voice API Reference

The Anusandhan platform exposes two complementary API suites:
1. **Node.js Express Gateway API** (`http://localhost:5000/api`)
2. **Python FastAPI AI Microservice API** (`http://localhost:8000/api/v1`)

---

## Gateway API (`/api`)

### 1. Health & Telemetry
- **Endpoint**: `GET /api/health`
- **Authentication**: None
- **Response `200 OK`**:
```json
{
  "gateway": "Anusandhan Node.js / Express Gateway (MERN Stack)",
  "status": "operational",
  "timestamp": "2026-11-04T10:00:00.000Z",
  "concurrency_target": "1,000 - 2,000 Concurrent Active Users",
  "services": {
    "node_express_gateway": "active (Port 5000)",
    "database_pool": "Supabase PgBouncer (Port 6543)",
    "mongodb": "connected",
    "redis_cache": {
      "hits": 1240,
      "misses": 85,
      "hitRate": "93.6%",
      "backend": "In-Memory LRU"
    },
    "python_ai_microservice": {
      "status": "healthy"
    }
  }
}
```

---

### 2. Authentication
#### Register New Scholar
- **Endpoint**: `POST /api/auth/register`
- **Request Body**:
```json
{
  "email": "scholar@iisc.ac.in",
  "password": "SecurePassword123!",
  "fullName": "Aarav Sharma",
  "university": "IIT Bombay"
}
```
- **Response `201 Created`**:
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "usr_948271",
    "email": "scholar@iisc.ac.in",
    "fullName": "Aarav Sharma",
    "creditsRemaining": 10
  }
}
```

#### Institutional Email Verification (Idempotent)
- **Endpoint**: `POST /api/auth/verify-institutional-email`
- **Authentication**: Bearer Token
- **Request Body**:
```json
{
  "institutionalEmail": "aarav.sharma@cse.iitb.ac.in"
}
```
- **Response `200 OK`**:
```json
{
  "verified": true,
  "creditsRemaining": 20,
  "message": "Institutional identity confirmed. 10 bonus outreach credits awarded."
}
```

---

### 3. Faculty & Research Directory
#### Discover Matched Professors
- **Endpoint**: `GET /api/faculty`
- **Query Parameters**:
  - `scope`: `national` (IISc, IITs, TIFR) | `international` (MPI, CERN, MIT, ETH)
  - `q`: Search keyword (e.g. `robot`, `quantum`, `causal`)
  - `scraped`: `true` (filter only live crawled lab postings)
- **Response `200 OK`**:
```json
[
  {
    "id": "prof_chiranjib",
    "name": "Prof. Chiranjib Bhattacharyya",
    "university": "IISc Bangalore",
    "department": "Computer Science & Automation",
    "hIndex": 38,
    "hasActiveGrant": true,
    "activeGrantAmount": "₹2.4 Crores",
    "recentPaper": "ICML 2025: Faster Kernel Ridge Regression",
    "matchScore": 96
  }
]
```

---

### 4. Asynchronous Job Queue
#### Submit Heavy Background Job
- **Endpoint**: `POST /api/jobs`
- **Response `202 Accepted`**:
```json
{
  "jobId": "job_1793735912329_7cfb3f4b",
  "status": "queued",
  "type": "cv_extraction",
  "createdAt": "2026-11-04T10:00:00.000Z"
}
```

#### Poll Job Status
- **Endpoint**: `GET /api/jobs/:jobId`
- **Response `200 OK`**:
```json
{
  "jobId": "job_1793735912329_7cfb3f4b",
  "status": "completed",
  "progress": 100,
  "result": {
    "extracted_name": "Aarav Sharma",
    "rrs_score": 88,
    "rrs_tier": "Senior Researcher"
  }
}
```

---

### 5. Multilingual Voice Agent Dialog
- **Endpoint**: `POST /api/voice/turn`
- **Request Body**:
```json
{
  "user_input": "IISc me AI professors dikhao",
  "preferred_language": "hi-IN",
  "student_context": {}
}
```
- **Response `200 OK`**:
```json
{
  "agent_text_response": "IISc Bangalore ke Computer Science aur CDS department me active AI faculty index kar diye hain.",
  "detected_intent": "navigate_faculty_iisc",
  "recommended_action": "FILTER_LABS",
  "suggested_ui_filter": { "university": "IISc Bangalore" },
  "latency_ms": 16
}
```

---

## FastAPI AI Microservice API (`/api/v1`)

### 1. Paper Deconstruction & 146-Word Pitch
- **Endpoint**: `POST /api/v1/agents/paper-pitch`
- **Request Body**:
```json
{
  "paper": {
    "title": "Low-Rank Adaptation for Long-Context LLMs",
    "year": 2025,
    "authors": "Prof. Bernhard Schölkopf et al."
  },
  "student": {
    "name": "Aarav Sharma",
    "repo_url": "https://github.com/aarav/lora-flash-benchmark"
  },
  "professor": {
    "name": "Prof. Bernhard Schölkopf",
    "institution": "MPI Tübingen"
  }
}
```
- **Response `200 OK`**:
```json
{
  "deconstruction": {
    "core_contribution": "Sub-quadratic key-value cache compression",
    "experimental_limitation": "Degraded retrieval on multi-document reasoning benchmarks",
    "student_bridge_angle": "CUDA kernel ablation testing flash-attention memory bounds"
  },
  "pitch": {
    "word_count": 146,
    "subject": "Inquiry regarding ICML 2025 KV-cache ablation & proposed CUDA kernel",
    "body": "Dear Prof. Schölkopf, I read your recent paper on long-context adaptation..."
  }
}
```

### 2. Mock Interview Evaluation
- **Endpoint**: `POST /api/v1/agents/mock-interview`
- **Request Body**:
```json
{
  "professor_name": "Prof. Fei-Fei Tian",
  "domain": "Computer Vision & Robotics",
  "current_question": "How did you prevent gradient explosion during reinforcement learning fine-tuning?",
  "student_answer": "We implemented adaptive gradient clipping capped at 1.0 and tracked variance across rollouts.",
  "turn_index": 2
}
```
- **Response `200 OK`**:
```json
{
  "evaluation": {
    "technical_soundness_score": 92,
    "methodology_feedback": "Strong answer citing specific threshold and variance tracking."
  },
  "next_question": "What loss function penalty was applied to avoid policy collapse?",
  "interview_complete": false
}
```
