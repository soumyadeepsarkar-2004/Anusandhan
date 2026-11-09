# Deployment & Operations Runbook

## Deployment Options

Anusandhan supports two primary production deployment topologies:
1. **Containerized Multi-Service Docker Compose** (Single VM or Bare-Metal, up to 1,000 active users)
2. **Kubernetes Cluster (`k8s/`)** (Multi-node elastic autoscaling, 1,000–10,000+ active users)

---

## 1. Pre-Flight Validation

Before starting any production containers or cluster pods, execute the automated pre-flight audit script to verify environment variables, secret keys, and database network sockets:

```bash
node scripts/validate_environment.js
```

### Exit Codes
- `0`: All required secrets, ports, URLs, and database fallbacks are verified and healthy.
- `1`: Fatal configuration error (e.g. missing `JWT_SECRET` in production mode, or malformed URL).

---

## 2. Docker Compose Deployment

The root `docker-compose.prod.yml` defines the complete stack:
- `frontend`: React SPA served over NGINX (Port 80)
- `gateway`: Express.js API Gateway (Port 5000)
- `ai-microservice`: FastAPI AI Microservice (Port 8000)
- `redis-cache`: Redis 7 Alpine with LRU eviction (Port 6379)
- `postgres-db`: PostgreSQL 16 Alpine with initialized schema (Port 5432)
- `mongo-db`: MongoDB 7 Jammy (Port 27017)

### Launching the Stack
```bash
# 1. Export production secrets
export JWT_SECRET="your_secure_32_char_production_jwt_key"
export GEMINI_API_KEY="your_google_gemini_api_key"

# 2. Build and launch all services with health checks
docker compose -f docker-compose.prod.yml up -d --build

# 3. Verify health across all containers
docker compose -f docker-compose.prod.yml ps
```

---

## 3. Kubernetes Deployment (`k8s/`)

For elastic horizontal scaling on Google Kubernetes Engine (GKE), Amazon EKS, or Azure AKS:

### Step 1: Create Namespace & Secrets
```bash
kubectl apply -f k8s/00-namespace.yaml
kubectl apply -f k8s/01-configmap.yaml
kubectl apply -f k8s/02-secrets.yaml
```

### Step 2: Deploy Database Storage Tier
```bash
kubectl apply -f k8s/03-databases.yaml
```

### Step 3: Deploy Application Tier
```bash
kubectl apply -f k8s/04-applications.yaml
```

### Step 4: Configure Ingress & Horizontal Pod Autoscalers
```bash
kubectl apply -f k8s/05-ingress-and-hpa.yaml
```

### Autoscaling Rules
- `gateway-hpa`: Scales Gateway replicas from 3 to 10 when average CPU exceeds 70% or memory exceeds 80%.
- `ai-microservice-hpa`: Scales AI Microservice replicas from 2 to 6 when average CPU exceeds 75%.

---

## 4. Operational Monitoring & Health Checks

| Service | Health Check URL | Expected Response |
| :--- | :--- | :--- |
| **Frontend** | `http://localhost:80/` | HTTP 200 (HTML) |
| **API Gateway** | `http://localhost:5000/api/health` | HTTP 200 (`status: "operational"`) |
| **AI Microservice** | `http://localhost:8000/health` | HTTP 200 (`status: "operational"`) |
| **AI Status Telemetry** | `http://localhost:8000/api/v1/audit/status` | HTTP 200 (`status: "operational"`) |

---

## 5. Load Verification Runbook

To execute the 1,000-user concurrency benchmark against your deployed target:
```bash
TARGET_URL=http://your-server-ip:5000 CONCURRENT_USERS=1000 DURATION=15 node tests/load/concurrency_benchmark_1000.cjs
```

---

## 6. Cloudflare Tunnel & Edge Pages Deployment

Anusandhan connects to Cloudflare edge networks via Cloudflare Tunnel (`cloudflared`) and Cloudflare Pages:

- **Live Tunnel Endpoint**: `https://anusandhan.trycloudflare.com`
- **VitePress Documentation**: `https://soumyadeepsarkar-2004.github.io/Anusandhan/`

### Starting the Cloudflare Tunnel
```bash
cloudflared tunnel --url http://127.0.0.1:5000
```
This proxies incoming requests securely through Cloudflare's global anycast network to the Anusandhan Gateway on port 5000 with DDoS mitigation, TLS termination, and rate limiting intact.
