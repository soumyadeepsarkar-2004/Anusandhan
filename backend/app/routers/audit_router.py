"""
System Security and Compliance Telemetry Router.
Provides transparency on rate limits, SSRF protection filters, and safe academic communication policies.
"""
from fastapi import APIRouter
from app.core.config import settings

router = APIRouter(prefix="/audit", tags=["Security & Compliance Telemetry"])

@router.get("/status")
def get_system_security_status():
    return {
        "status": "operational",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "security_enforcements": {
            "ssrf_protection": "Active (Host whitelist & private IP resolution ban)",
            "file_upload_guard": {
                "max_size_mb": settings.MAX_UPLOAD_SIZE_BYTES // (1024 * 1024),
                "disallowed_payloads": ["/JavaScript", "/JS", "/Launch", "/SubmitForm"],
                "magic_byte_check": "Active (%PDF-)"
            },
            "academic_reputation_guard": {
                "max_daily_outreach_per_student": settings.MAX_DAILY_OUTREACH_EMAILS,
                "jitter_delay_range_seconds": f"{settings.MIN_JITTER_DELAY_SECONDS}-{settings.MAX_JITTER_DELAY_SECONDS}",
                "follow_up_cadence_days": settings.FOLLOW_UP_INTERVAL_DAYS,
                "human_in_the_loop_mandatory": True
            },
            "whitelisted_academic_domains": settings.ALLOWED_ACADEMIC_DOMAINS
        }
    }
