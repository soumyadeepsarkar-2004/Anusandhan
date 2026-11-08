"""
Faculty Discovery and Bibliometrics Router.
Provides filtered academic endpoints with mentor rating, citation velocity, and active grant status.
"""
from typing import List, Optional
from fastapi import APIRouter, Query, HTTPException, status
from app.schemas.scholar import Professor
from app.services.scholar_service import scholar_service

router = APIRouter(prefix="/faculty", tags=["Faculty & Scholar Database"])

@router.get("", response_model=List[Professor])
async def list_professors(
    q: Optional[str] = Query(None, description="Search query by name, topic, or institution"),
    domain: Optional[str] = Query(None, description="Domain filter (e.g., Robotics, AI, Computational Biology)"),
    country: Optional[str] = Query(None, description="Country filter"),
    min_coauthor_ratio: Optional[float] = Query(None, ge=0.0, le=1.0, description="Minimum student co-authorship ratio"),
    has_active_grants_only: bool = Query(False, description="Filter for professors with verified active funding")
):
    """
    Returns faculty matched against criteria, including mentor score and active grant allocation.
    """
    domains = [domain] if domain else []
    return await scholar_service.search_professors(
        query=q,
        domains=domains,
        country=country,
        min_coauthor_ratio=min_coauthor_ratio,
        has_active_grants=has_active_grants_only
    )

@router.get("/{prof_id}", response_model=Professor)
async def get_professor_details(prof_id: str):
    """
    Retrieves full profile for a specific professor including recent papers and grant details.
    """
    for prof in scholar_service.cached_professors:
        if prof.id == prof_id:
            return prof
    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Faculty member with ID '{prof_id}' not found."
    )
