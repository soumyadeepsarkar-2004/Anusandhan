"""
Faculty & Grant Radar Autonomous Scanner Agent for Anusandhan (अनुसंधान).
Tracks active multi-million dollar grants across national (DST, MeitY, CSIR) and global agencies (NSF, ERC),
evaluating student co-authorship ratios and lab hiring capacity.
"""
import logging
from typing import Dict, Any, List
from app.agents.base_agent import BaseAcademicAgent

logger = logging.getLogger("agent.grant_radar")

class GrantRadarAgent(BaseAcademicAgent):
    def __init__(self):
        super().__init__(
            name="Faculty & Grant Radar Agent",
            role="Autonomous grant telemetry monitor and lab capacity estimator"
        )

    def scan_lab_capacity(self, professor: Dict[str, Any]) -> Dict[str, Any]:
        """
        Calculates lab capacity, active funding health, and student mentorship quotient.
        """
        metrics = professor.get("metrics", {})
        h_index = metrics.get("hIndex", 35)
        citation_vel = metrics.get("citationVelocity", 1000)
        coauthor_ratio = metrics.get("studentCoAuthorshipRatio", 0.65)
        active_grant = metrics.get("activeGrant")

        # Calculated Mentor Score (0 - 100)
        mentor_score = min(99, int((coauthor_ratio * 40) + min(30, h_index * 0.6) + min(30, (citation_vel / 1500) * 30)))

        # Hiring capacity assessment
        has_grant = active_grant is not None
        if has_grant and coauthor_ratio >= 0.70:
            hiring_tier = "High Capacity (Actively Hiring Funded Interns)"
            capacity_score = 95
        elif has_grant:
            hiring_tier = "Moderate Capacity (Grant Funded)"
            capacity_score = 80
        else:
            hiring_tier = "Standard Capacity (Institution / Fellowship Supported)"
            capacity_score = 65

        scope = professor.get("scope", "national" if "india" in professor.get("country", "").lower() else "international")

        return {
            "professor_id": professor.get("id"),
            "professor_name": professor.get("name"),
            "institution": professor.get("university"),
            "scope": scope,
            "calculated_mentor_score": mentor_score,
            "hiring_capacity_score": capacity_score,
            "hiring_tier": hiring_tier,
            "has_active_grant": has_grant,
            "grant_details": active_grant,
            "student_first_author_ratio": f"{int(coauthor_ratio * 100)}%",
            "recommended_inquiry_angle": "Grant-supported summer fellowship" if has_grant else "Institutional / Fellowship-backed placement"
        }

grant_radar_agent = GrantRadarAgent()
