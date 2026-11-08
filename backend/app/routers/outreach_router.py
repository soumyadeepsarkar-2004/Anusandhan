"""
Academic Cold Outreach and Safe Dispatch Router.
Enforces the 140-180 word academic standard, 7-day polite bump, and anti-spam jitter queues.
"""
from typing import Dict, Any
from fastapi import APIRouter, Query, Header, HTTPException, status
from app.schemas.outreach import (
    OutreachDraftRequest,
    OutreachDraftResponse,
    EnqueueOutreachRequest,
    EnqueueOutreachResponse,
    FollowUpRequest,
    FollowUpResponse
)
from app.services.outreach_service import outreach_service

router = APIRouter(prefix="/outreach", tags=["Academic Outreach & Jitter Queue"])

@router.post("/draft", response_model=OutreachDraftResponse)
def create_academic_draft(req: OutreachDraftRequest):
    """
    Generates a personalized, concise 140-180 word academic draft bridging student skills to lab publications.
    """
    return outreach_service.generate_academic_draft(req)

@router.post("/enqueue", response_model=EnqueueOutreachResponse)
def queue_email_dispatch(
    req: EnqueueOutreachRequest,
    x_student_id: str = Header("student_demo", alias="X-Student-ID")
):
    """
    Queues the approved cold email with randomized jitter delay (4-12 minutes).
    Strictly checks that human_confirmed is true.
    """
    return outreach_service.enqueue_outreach(student_id=x_student_id, req=req)

@router.post("/follow-up", response_model=FollowUpResponse)
def schedule_polite_follow_up(req: FollowUpRequest):
    """
    Schedules a non-intrusive 7-day polite follow-up bump.
    """
    return outreach_service.schedule_7day_bump(req)

@router.get("/queue", response_model=Dict[str, Any])
def view_active_queue():
    """
    Returns current queued messages, jitter schedule timestamps, and status.
    """
    return {
        "active_items": list(outreach_service.queue.values()),
        "total_queued": len(outreach_service.queue)
    }
