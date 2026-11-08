"""
Pydantic schemas for Academic Researchers, Bibliometrics, and Grant Data.
"""
from typing import List, Optional
from pydantic import BaseModel, Field

class AcademicPaper(BaseModel):
    title: str
    year: int
    venue: Optional[str] = None
    citations: int = 0
    doi: Optional[str] = None
    pdf_url: Optional[str] = None

class ActiveGrant(BaseModel):
    grant_id: str
    agency: str  # "NSF", "NIH", "ERC", "Horizon Europe", "SERB"
    title: str
    amount_usd: int
    start_year: int
    end_year: int
    hiring_target: str  # e.g., "Postdoc + Graduate Intern"

class ScholarMetrics(BaseModel):
    h_index: int = Field(..., ge=0)
    total_citations: int = Field(..., ge=0)
    citation_velocity_2y: int = Field(..., ge=0)
    student_coauthor_ratio: float = Field(..., ge=0.0, le=1.0)
    active_grants_total_usd: int = 0
    mentor_reputation_tier: str  # "Outstanding Mentor (Tier-1)", "Prolific Researcher", "Emerging PI"
    calculated_mentor_score: int = Field(..., ge=0, le=100)

class Professor(BaseModel):
    id: str
    name: str
    title: str
    department: str
    institution: str
    country: str
    email: str
    lab_name: Optional[str] = None
    lab_url: Optional[str] = None
    research_domains: List[str] = []
    top_keywords: List[str] = []
    recent_papers: List[AcademicPaper] = []
    active_grants: List[ActiveGrant] = []
    metrics: ScholarMetrics
    accepting_interns: bool = True
    match_compatibility_score: Optional[int] = None
    match_reason: Optional[str] = None

class ProfessorSearchQuery(BaseModel):
    query: Optional[str] = None
    domains: List[str] = []
    country: Optional[str] = None
    min_student_coauthor_ratio: Optional[float] = None
    has_active_grants_only: bool = False
    limit: int = 20
