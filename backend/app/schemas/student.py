"""
Pydantic schemas for Student Profiles and CV Extraction.
"""
from typing import List, Optional
from pydantic import BaseModel, Field

class ExtractedProject(BaseModel):
    title: str
    description: str
    tech_stack: List[str] = []
    github_or_paper_url: Optional[str] = None

class RRSScoreBreakdown(BaseModel):
    total_score: int = Field(..., ge=0, le=100)
    publications_score: int
    hands_on_projects_score: int
    technical_depth_score: int
    academic_foundation_score: int
    readiness_tier: str  # "Elite Fellow", "Strong Candidate", "Developing Scholar"
    recommendations: List[str] = []

class StudentProfile(BaseModel):
    id: Optional[str] = "student_active"
    name: str = "Priya Sharma"
    email: str = "priya.sharma@iitd.ac.in"
    university: str = "IIT Delhi"
    major: str = "Computer Science & Engineering"
    graduation_year: int = 2027
    cgpa: float = Field(..., ge=0.0, le=10.0)
    domains: List[str] = []
    skills: List[str] = []
    projects: List[ExtractedProject] = []
    rrs: Optional[RRSScoreBreakdown] = None
    daily_emails_sent: int = 0
    max_daily_emails: int = 5

class CVParseResponse(BaseModel):
    extracted_name: Optional[str] = None
    extracted_email: Optional[str] = None
    detected_university: Optional[str] = None
    detected_degree: Optional[str] = None
    detected_cgpa: Optional[float] = None
    extracted_skills: List[str] = []
    detected_domains: List[str] = []
    extracted_projects: List[ExtractedProject] = []
    rrs_breakdown: RRSScoreBreakdown
    raw_character_count: int
