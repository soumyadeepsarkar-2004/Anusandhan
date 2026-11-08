"""
Pydantic schemas for Academic Outreach generation, Jitter Queue, and 7-day Bump logic.
"""
from typing import Optional, List
from enum import Enum
from pydantic import BaseModel, Field

class OutreachStatus(str, Enum):
    DRAFTED = "drafted"
    QUEUED_WITH_JITTER = "queued_with_jitter"
    SENT = "sent"
    REPLIED = "replied"
    FOLLOW_UP_SCHEDULED = "follow_up_scheduled"
    FOLLOW_UP_SENT = "follow_up_sent"
    CLOSED = "closed"

class OutreachDraftRequest(BaseModel):
    professor_id: str
    professor_name: str
    professor_institution: str
    lab_name: Optional[str] = None
    target_paper_title: str
    student_name: str
    student_university: str
    student_cgpa: float
    student_relevant_project: str
    student_relevant_skills: List[str]
    proposed_contribution: str
    funding_context: Optional[str] = "Self-funded via DAAD/Mitacs or seeking lab fellowship"

class OutreachDraftResponse(BaseModel):
    draft_id: str
    professor_id: str
    subject_line: str
    body_text: str
    word_count: int
    is_word_count_optimal: bool  # 140 to 180 words ideal
    targeted_paper: str
    bridge_explanation: str
    anti_spam_score: int = Field(100, ge=0, le=100)
    requires_human_approval: bool = True

class EnqueueOutreachRequest(BaseModel):
    draft_id: str
    professor_email: str
    human_confirmed: bool = Field(..., description="Must be True. Automated mass mailing without human confirmation is strictly forbidden.")
    jitter_delay_minutes: Optional[int] = None  # Random 4 to 12 mins if not specified

class EnqueueOutreachResponse(BaseModel):
    queue_id: str
    draft_id: str
    target_email: str
    status: OutreachStatus
    scheduled_send_time: str
    jitter_delay_seconds: int
    daily_quota_remaining: int
    security_notice: str

class FollowUpRequest(BaseModel):
    outreach_id: str
    bump_after_days: int = 7
    human_confirmed: bool = True
    custom_bump_note: Optional[str] = None

class FollowUpResponse(BaseModel):
    follow_up_id: str
    original_outreach_id: str
    subject_line: str
    body_text: str
    scheduled_for_date: str
    status: OutreachStatus
