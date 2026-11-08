import os
import re

features = [
    ("Feature 1: Async Password Hashing", "server/utils/password.js", [r"crypto\.scrypt", r"util\.promisify"]),
    ("Feature 2: Anti-Abuse Rate Limiting", "server/middleware/rateLimiter.js", [r"rateLimit", r"trust proxy|ip|keyGenerator"]),
    ("Feature 3: HTTP Security Headers & Helmet", "server/server.js", [r"helmet\("]),
    ("Feature 4: CORS Hardening", "server/server.js", [r"cors\("]),
    ("Feature 4b: FastAPI CORS Hardening", "backend/app/main.py", [r"CORSMiddleware"]),
    ("Feature 5: Route Authentication Guard", "server/routes/studentRoutes.js", [r"authenticateToken"]),
    ("Feature 6: IDOR & Webhook Cryptography Fix", "server/routes/billingRoutes.js", [r"timingSafeEqual|crypto\.createHmac"]),
    ("Feature 7: Secure Secrets Management", "server/server.js", [r"JWT_SECRET"]),
    ("Feature 8: Multi-Tenant State Isolation", "server/routes/studentRoutes.js", [r"memoryStudents|req\.user\.id|userId"]),
    ("Feature 9: PostgreSQL Connection Pooling", "server/db/supabaseClient.js", [r"new Pool", r"pool\.on\('error'"]),
    ("Feature 9b: MongoDB Connection Pooling", "server/server.js", [r"maxPoolSize"]),
    ("Feature 10: Redis TCP & LRU Eviction", "server/services/redisCache.js", [r"createClient|redis://|LRU|maxKeys|5000"]),
    ("Feature 11: Job Queue Bounded Pruning", "server/queues/jobQueue.js", [r"prune|1000|maxJobs"]),
    ("Feature 12: FastAPI Lifespan & Pooled Client", "backend/app/main.py", [r"lifespan", r"httpx\.AsyncClient"]),
    ("Feature 13: FastAPI Async Concurrency", "backend/app/routers/agent_router.py", [r"async def", r"asyncio\.to_thread"]),
    ("Feature 14: Docker RPC URL Alignment", "docker-compose.prod.yml", [r"PYTHON_SERVICE_URL.*api/v1"]),
    ("Feature 15: Docker Compose Services", "docker-compose.prod.yml", [r"postgres:", r"mongo:", r"redis-cache:"]),
    ("Feature 16: Kubernetes Manifests", "k8s/00-namespace.yaml", [r"anusandhan"]),
    ("Feature 17: Environment Validation Script", "scripts/validate_environment.js", [r"validate|check"]),
    ("Feature 18: Production Health Checks", "server/server.js", [r"/api/health"]),
    ("Feature 19: Product Overview Docs", "docs/overview.md", [r"Anusandhan|Overview"]),
    ("Feature 20: Architecture Docs", "docs/architecture.md", [r"Architecture"]),
    ("Feature 21: API Reference Docs", "docs/api-reference.md", [r"API Reference|REST"]),
    ("Feature 22: Deployment Docs", "docs/deployment.md", [r"Deployment|Kubernetes"]),
    ("Feature 22b: Concurrency Docs", "docs/concurrency.md", [r"Concurrency|1,000"]),
    ("Feature 22c: Security Docs", "docs/security.md", [r"Security Audit"]),
    ("Feature 23: 1,000-User Concurrency Load Runner", "tests/load/concurrency_benchmark_1000.cjs", [r"CONCURRENT_USERS = 1000", r"keepAlive: true"]),
    ("Feature 24: E2E Tiers 1-4 Suites", "tests/e2e/tier1_features.test.mjs", [r"describe|test"]),
    ("Feature 25: Adversarial Test Suite", "server/tests/adversarial_m1.test.js", [r"test|describe"])
]

results = []
for name, filepath, patterns in features:
    full_path = os.path.join("c:/PROJECTS/ResearchIntern_Pro", filepath)
    if not os.path.exists(full_path):
        results.append((name, filepath, "MISSING_FILE", []))
        continue
    with open(full_path, "r", encoding="utf-8", errors="ignore") as f:
        content = f.read()
    matched = []
    for pat in patterns:
        m = re.findall(pat, content, re.IGNORECASE)
        matched.append((pat, len(m)))
    results.append((name, filepath, "EXISTS", matched))

for name, filepath, status, matches in results:
    print(f"[{status}] {name} ({filepath})")
    for pat, count in matches:
        print(f"    - Pattern '{pat}': {count} occurrences")
