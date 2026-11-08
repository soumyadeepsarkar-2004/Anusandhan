# System Architecture

## Architectural Blueprint

Anusandhan is built on a hybrid, multi-tier microservice architecture engineered for high throughput, sub-50ms read latencies, and horizontal scaling to support 1,000+ concurrent researchers:

```
[ Web / Mobile / Desktop Client ]
        │
        ▼ (HTTPS / TLS 1.3)
[ NGINX Ingress / Reverse Proxy ]
        │
        ├──▶ [ React SPA Frontend (Port 80) ]
        │
        └──▶ [ Express.js API Gateway / BFF (Port 5000) ]
                    │
                    ├──▶ Supabase PostgreSQL (PgBouncer Pool: 20 Sockets)
                    ├──▶ MongoDB Cluster (Mongoose Pool: 10–50 Sockets)
                    ├──▶ Redis Multi-Tier Cache (Upstash REST / TCP / Memory LRU)
                    └──▶ Asynchronous Job Queue (BullMQ / In-Memory Worker)
                                │
                                ▼ (Internal HTTP Keep-Alive Pool)
                    [ FastAPI AI & Literature Microservice (Port 8000) ]
                                │
                                ├──▶ Google Gemini 3.8 Flash SDK
                                ├──▶ Sarvam AI Multilingual Indic Speech
                                └──▶ OpenAlex & ArXiv Literature Harvester
```

---

## Service Responsibilities

### 1. Client Tier (`src/`)
- **Technology**: React 18, TypeScript, Tailwind CSS, Vite 5, Framer Motion.
- **Cross-Platform Target**:
  - Web: High-speed responsive SPA.
  - Mobile: Android & iOS compiled via Capacitor 8 with native push notification support.
  - Desktop: Windows, macOS, Linux desktop app packaged with Electron.
- **Offline Outbox Engine**: IndexedDB outbox queue that catches drafts and status changes during intermittent campus Wi-Fi drops and synchronizes them with cryptographic idempotency keys upon reconnection.

### 2. Express API Gateway & BFF (`server/`)
- **Technology**: Node.js 20, Express 4.21, Helmet 8.3, JSON Web Tokens.
- **Responsibilities**:
  - Scholar session & JWT authentication (14-day token lifecycle, async scrypt hashing).
  - Reverse-proxy client IP verification and trusted proxy headers.
  - Anti-abuse token-aware sliding window rate limiters.
  - Multi-tenant student profile isolation.
  - Billing & Razorpay/Stripe webhook verification with HMAC-SHA256 constant-time comparison.
  - Autonomous academic data scraper scheduling (runs every 30 minutes in background).

### 3. FastAPI AI Microservice (`backend/`)
- **Technology**: Python 3.12, FastAPI 0.162, Starlette, Pydantic v2.
- **Responsibilities**:
  - PyPDF parsing & deep CV text extraction.
  - Paper deconstruction & 146-word precision pitch synthesis.
  - Mock PI interview simulator with automated viva scoring.
  - Faculty grant radar tracking (DST, MeitY, CSIR, NSF, ERC).
  - Multilingual voice agent dialog synthesis in English, Hindi, and Hinglish.

### 4. Database & Storage Layer
- **PostgreSQL**: Stores relational tables for users, institutions, verified research grants, and billing audit ledgers using Supabase with PgBouncer connection pooling.
- **MongoDB**: Stores semi-structured student portfolios, CV gap histories, and outreach pipeline records.
- **Redis Multi-Tier Cache**: Caches high-frequency faculty listings, active fellowships, and background job tokens with automatic LRU capacity eviction.
