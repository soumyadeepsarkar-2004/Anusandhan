"""
CV Gap Diagnostic & Remediation Agent for Anusandhan (अनुसंधान).
Audits candidate profiles against strict professor auto-rejection triggers,
calculates calibrated RRS pillar scores, and generates actionable 14-day technical remediation plans.
"""
import json
import logging
from typing import Dict, Any, List, Optional
from app.agents.base_agent import BaseAcademicAgent

logger = logging.getLogger("agent.cv_diagnostic")

class CVDiagnosticAgent(BaseAcademicAgent):
    def __init__(self):
        super().__init__(
            name="CV Gap Diagnostic & Remediation Agent",
            role="Strict academic admissions auditor detecting cold email failure modes"
        )

    def audit_profile(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        """
        Performs thorough audit of the student's technical claims,
        detecting failure risks and generating a 14-day technical remediation roadmap.
        """
        # 1. Try LLM audit if configured
        if self.client:
            llm_result = self._audit_with_gemini(profile)
            if llm_result:
                return llm_result

        # 2. Deterministic Pillar Scoring & Gap Analysis
        has_github = bool(profile.get("linkedAccounts", {}).get("githubUrl"))
        has_orcid = bool(profile.get("linkedAccounts", {}).get("orcidId"))
        has_scholar = bool(profile.get("linkedAccounts", {}).get("googleScholarUrl"))
        cgpa = float(profile.get("cgpa", 8.0))
        skills = profile.get("skills", [])
        has_deep_tools = any(s.lower() in ["pytorch", "tensorflow", "cuda", "jax", "c++", "ros", "qiskit", "scikit-learn"] for s in skills)

        # RRS Pillar Scores
        code_score = 23 if (has_github and has_deep_tools) else 14 if has_github else 8
        methodology_score = 22 if has_scholar else 16
        foundation_score = min(20, int((cgpa / 10.0) * 20))
        tooling_score = 14 if has_deep_tools else 8
        professionalism_score = 14 if (has_github and has_orcid) else 10
        total_rrs = code_score + methodology_score + foundation_score + tooling_score + professionalism_score

        # Tier calculation
        if total_rrs >= 88:
            tier = "Lab-Ready Fellow"
        elif total_rrs >= 75:
            tier = "Junior Researcher"
        elif total_rrs >= 60:
            tier = "Scholar Apprentice"
        else:
            tier = "Explorer"

        # Failure risks detected
        failures = []
        if not has_github:
            failures.append({
                "id": "missing-repo",
                "risk_level": "CRITICAL",
                "penalty": -22,
                "title": "Missing 1-Click Reproducible Code Benchmark",
                "diagnosis": "Professors receive 50+ cold emails daily. Emails without a public GitHub reproduction repo are treated as unverified claims.",
                "remedy": "Publish a clean GitHub repository containing benchmark numbers, dataset scripts, and a 1-click Colab demo."
            })

        if not has_scholar and not has_orcid:
            failures.append({
                "id": "missing-scholar-footprint",
                "risk_level": "HIGH",
                "penalty": -14,
                "title": "Unverified Scholar Identity (No ORCID / Google Scholar)",
                "diagnosis": "Lack of verified academic footprint increases spam flag probability in university spam filters.",
                "remedy": "Create a free verified ORCID iD (orcid.org) and link your preprint or thesis manuscripts."
            })

        if not has_deep_tools:
            failures.append({
                "id": "shallow-tooling",
                "risk_level": "MODERATE",
                "penalty": -10,
                "title": "Generic Tooling Claims Without Empirical Benchmarking",
                "diagnosis": "Listing generic languages ('Python', 'HTML') without active framework benchmarking signals coursework-only exposure.",
                "remedy": "Add specific framework proficiencies (PyTorch 2.4, Triton, CUDA, or ROS2) backed by reproducible code."
            })

        # 14-Day Remediation Sprint
        remediation_sprint = [
            {"day": "Days 1-3", "task": "Code Packaging", "action": "Convert your strongest project into a public GitHub repo with clean README and requirements.txt."},
            {"day": "Days 4-7", "task": "Benchmark Profiling", "action": "Run baseline evaluation table comparing your accuracy / inference latency against standard benchmarks."},
            {"day": "Days 8-10", "task": "Literature Alignment", "action": "Read the target professor's latest 2024-2025 paper and identify 1 specific limitation your repo addresses."},
            {"day": "Days 11-14", "task": "Precision Outreach", "action": "Draft and dispatch a 146-word precision pitch embedding your benchmark numbers and repo link."}
        ]

        return {
            "rrs_score": total_rrs,
            "rrs_tier": tier,
            "pillars": {
                "code_execution": code_score,
                "research_methodology": methodology_score,
                "academic_foundations": foundation_score,
                "lab_tooling": tooling_score,
                "professionalism": professionalism_score
            },
            "detected_failures": failures,
            "remediation_sprint": remediation_sprint,
            "professor_reply_probability": f"{min(38, max(5, int(total_rrs * 0.35)))}%"
        }

    def _audit_with_gemini(self, profile: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        system_instruction = (
            "You are the CV Gap Diagnostic & Remediation Agent for the Anusandhan platform. "
            "Audit this student profile for faculty auto-rejection failure modes. "
            "Output valid JSON with keys: 'rrs_score' (0-100), 'rrs_tier', 'pillars' (dict with code_execution max 25, research_methodology max 25, academic_foundations max 20, lab_tooling max 15, professionalism max 15), 'detected_failures' (list), 'remediation_sprint' (list), 'professor_reply_probability'."
        )
        prompt = f"Profile to audit: {json.dumps(profile)}"
        raw = self.run_llm(prompt, system_instruction=system_instruction)
        if not raw:
            return None

        try:
            cleaned = raw.strip()
            if cleaned.startswith("```json"):
                cleaned = cleaned[7:]
            if cleaned.endswith("```"):
                cleaned = cleaned[:-3]
            return json.loads(cleaned.strip())
        except Exception as e:
            logger.warning(f"Failed to parse Gemini profile audit: {e}")
            return None

cv_diagnostic_agent = CVDiagnosticAgent()
