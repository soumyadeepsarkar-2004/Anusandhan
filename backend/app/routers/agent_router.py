"""
Autonomous Academic Agent Router for Anusandhan (अनुसंधान).
Exposes endpoints for Paper Deconstruction & 146w Pitching,
Mock PI Screening Interview, CV Gap Diagnostic, and Grant Capacity Radar.
"""
import asyncio
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from typing import Dict, Any, List, Optional

from app.agents.paper_deconstruction_agent import paper_deconstruction_agent
from app.agents.mock_interview_agent import mock_interview_agent
from app.agents.cv_diagnostic_agent import cv_diagnostic_agent
from app.agents.grant_radar_agent import grant_radar_agent

router = APIRouter(prefix="/agents", tags=["Autonomous Academic Agents"])

# 1. Paper Deconstruction & Pitch Schema
class PaperPitchRequest(BaseModel):
    paper: Dict[str, Any]
    student: Dict[str, Any]
    professor: Optional[Dict[str, Any]] = Field(default_factory=dict)

class PaperPitchResponse(BaseModel):
    deconstruction: Dict[str, Any]
    pitch: Dict[str, Any]

@router.post("/paper-pitch", response_model=PaperPitchResponse)
async def deconstruct_paper_and_pitch(req: PaperPitchRequest):
    """
    Deconstructs recent scientific literature (ArXiv/Nature/IEEE) into core limitations,
    and synthesizes a 146-word precision proof-of-work cold inquiry asynchronously.
    """
    try:
        return await asyncio.to_thread(
            paper_deconstruction_agent.deconstruct_and_pitch,
            paper=req.paper,
            student=req.student,
            professor=req.professor
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Paper deconstruction failed: {str(e)}")


# 2. Mock Interview Schema
class MockInterviewRequest(BaseModel):
    professor_name: str
    domain: str
    current_question: str
    student_answer: str
    turn_index: int = 1

class MockInterviewResponse(BaseModel):
    evaluation: Dict[str, Any]
    next_question: str
    interview_complete: bool

@router.post("/mock-interview", response_model=MockInterviewResponse)
async def evaluate_mock_interview_turn(req: MockInterviewRequest):
    """
    Simulates a PI technical screening viva asynchronously.
    """
    try:
        return await asyncio.to_thread(
            mock_interview_agent.evaluate_and_respond,
            professor_name=req.professor_name,
            domain=req.domain,
            current_question=req.current_question,
            student_answer=req.student_answer,
            turn_index=req.turn_index
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Mock interview evaluation failed: {str(e)}")


# 3. CV Gap Diagnostic Schema
class CVDiagnosticRequest(BaseModel):
    profile: Dict[str, Any]

class CVDiagnosticResponse(BaseModel):
    rrs_score: int
    rrs_tier: str
    pillars: Dict[str, int]
    detected_failures: List[Dict[str, Any]]
    remediation_sprint: List[Dict[str, Any]]
    professor_reply_probability: str

@router.post("/cv-diagnostic", response_model=CVDiagnosticResponse)
async def audit_profile_and_diagnose(req: CVDiagnosticRequest):
    """
    Audits profile against professor auto-rejection failure modes asynchronously.
    """
    try:
        return await asyncio.to_thread(
            cv_diagnostic_agent.audit_profile,
            profile=req.profile
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"CV diagnostic failed: {str(e)}")


# 4. Grant Radar Schema
class GrantRadarRequest(BaseModel):
    professor: Dict[str, Any]

class GrantRadarResponse(BaseModel):
    professor_id: Optional[str] = None
    professor_name: Optional[str] = None
    institution: Optional[str] = None
    scope: str
    calculated_mentor_score: int
    hiring_capacity_score: int
    hiring_tier: str
    has_active_grant: bool
    grant_details: Optional[Dict[str, Any]] = None
    student_first_author_ratio: str
    recommended_inquiry_angle: str

@router.post("/grant-radar", response_model=GrantRadarResponse)
async def scan_grant_and_lab_capacity(req: GrantRadarRequest):
    """
    Scans active grant telemetry across DST, MeitY, CSIR, NSF, ERC asynchronously.
    """
    try:
        return await asyncio.to_thread(
            grant_radar_agent.scan_lab_capacity,
            professor=req.professor
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Grant radar scan failed: {str(e)}")
