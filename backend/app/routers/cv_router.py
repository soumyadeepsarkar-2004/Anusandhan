"""
CV Ingestion and Profile Router.
Supports both secure PDF upload and manual profile submission.
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.services.pdf_service import parse_student_cv, calculate_rrs_score, extract_skills_and_domains
from app.schemas.student import CVParseResponse, StudentProfile, ExtractedProject, RRSScoreBreakdown

router = APIRouter(prefix="/cv", tags=["CV & Student Profile"])

@router.post("/upload", response_model=CVParseResponse)
async def upload_and_parse_cv(file: UploadFile = File(...)):
    """
    Accepts student PDF CV, executes security validation (magic bytes, size <= 5MB, safe streams),
    and computes the multi-factor Research Readiness Score (RRS).
    """
    if file.content_type != "application/pdf":
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail="Only PDF files (.pdf) are supported."
        )

    file_bytes = await file.read()
    return parse_student_cv(file_bytes)

@router.post("/manual", response_model=StudentProfile)
async def submit_manual_profile(
    name: str = Form(...),
    email: str = Form(...),
    university: str = Form(...),
    cgpa: float = Form(...),
    interests: str = Form(...),
    skills_raw: str = Form(...)
):
    """
    Alternative route when students prefer manual input instead of uploading a CV document.
    """
    skills_list = [s.strip() for s in skills_raw.split(",") if s.strip()]
    domains_list = [d.strip() for d in interests.split(",") if d.strip()]
    
    rrs = calculate_rrs_score(f"{interests} {skills_raw}", skills_list, cgpa)
    
    return StudentProfile(
        name=name,
        email=email,
        university=university,
        cgpa=cgpa,
        domains=domains_list,
        skills=skills_list,
        projects=[
            ExtractedProject(
                title="Specialized Laboratory Project",
                description=f"Developed technical solutions using {', '.join(skills_list[:3])}.",
                tech_stack=skills_list[:3]
            )
        ],
        rrs=rrs
    )
