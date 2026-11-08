"""
Application configuration for Anusandhan (अनुसंधान).
Manages security parameters, allowed academic endpoints, and rate limits.
"""
from typing import List
from pydantic import BaseModel
import os

class Settings(BaseModel):
    PROJECT_NAME: str = "Anusandhan Backend"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    
    # Security & CORS
    ALLOWED_ORIGINS: List[str] = [
        origin.strip()
        for origin in os.getenv(
            "ALLOWED_ORIGINS",
            "http://localhost:5173,http://localhost:3000,http://127.0.0.1:5173,http://127.0.0.1:3000,https://anusandhan.ai"
        ).split(",")
        if origin.strip()
    ]
    
    # File Upload Limits
    MAX_UPLOAD_SIZE_BYTES: int = 5 * 1024 * 1024  # 5 MB strictly enforced
    ALLOWED_UPLOAD_TYPES: List[str] = ["application/pdf"]
    
    # SSRF Whitelist for Academic Endpoints
    ALLOWED_ACADEMIC_DOMAINS: List[str] = [
        "api.openalex.org",
        "api.semanticscholar.org",
        "export.arxiv.org",
        "api.reporter.nih.gov",
        "api.nsf.gov",
        "scholar.google.com",
        "uniprot.org",
        "www.uniprot.org"
    ]
    
    # Healthy Academic Outreach Rate Limits
    MAX_DAILY_OUTREACH_EMAILS: int = 5
    MIN_JITTER_DELAY_SECONDS: int = 240   # 4 minutes
    MAX_JITTER_DELAY_SECONDS: int = 720   # 12 minutes
    FOLLOW_UP_INTERVAL_DAYS: int = 7      # 7-day polite bump
    
    # API Keys (Optional fallbacks for local dev)
    SEMANTIC_SCHOLAR_API_KEY: str = os.getenv("SEMANTIC_SCHOLAR_API_KEY", "")
    OPENALEX_EMAIL: str = os.getenv("OPENALEX_EMAIL", "researcher@anusandhan.ai")
    SARVAM_API_KEY: str = os.getenv("SARVAM_API_KEY", "")
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

settings = Settings()
