"""
Main FastAPI Application Entrypoint for Anusandhan (अनुसंधान).
"""
import time
from contextlib import asynccontextmanager
import httpx
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response

from app.core.config import settings
from app.routers import cv_router, scholar_router, outreach_router, voice_router, audit_router, agent_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize shared high-concurrency connection pool for outbound academic APIs
    limits = httpx.Limits(max_connections=100, max_keepalive_connections=50, keepalive_expiry=30.0)
    app.state.http_client = httpx.AsyncClient(limits=limits, timeout=10.0)
    yield
    await app.state.http_client.aclose()

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Production-grade AI Infrastructure for Global Research Internships & Healthy Academic Outreach",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# 1. Custom Security Headers Middleware
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains"
        return response

app.add_middleware(SecurityHeadersMiddleware)

# 2. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# 3. Mount API Routers
app.include_router(cv_router.router, prefix=settings.API_V1_PREFIX)
app.include_router(scholar_router.router, prefix=settings.API_V1_PREFIX)
app.include_router(outreach_router.router, prefix=settings.API_V1_PREFIX)
app.include_router(voice_router.router, prefix=settings.API_V1_PREFIX)
app.include_router(agent_router.router, prefix=settings.API_V1_PREFIX)
app.include_router(audit_router.router, prefix=settings.API_V1_PREFIX)

@app.get("/")
def root():
    return {
        "message": "Anusandhan (अनुसंधान) API is operational.",
        "version": settings.VERSION,
        "docs": "/docs",
        "health": f"{settings.API_V1_PREFIX}/audit/status"
    }

@app.get("/health")
def health_check():
    return {
        "status": "operational",
        "service": "Python FastAPI AI Microservice",
        "version": settings.VERSION
    }
