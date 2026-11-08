"""
Mock Academic Interview Agent for Anusandhan (अनुसंधान).
Simulates a real PI viva / technical screening for research internships,
evaluating technical depth, code reproducibility, and methodology awareness.
"""
import json
import logging
from typing import Dict, Any, List, Optional
from app.agents.base_agent import BaseAcademicAgent

logger = logging.getLogger("agent.mock_interview")

class MockInterviewAgent(BaseAcademicAgent):
    def __init__(self):
        super().__init__(
            name="Mock Academic Interview Agent",
            role="Rigorous academic interviewer evaluating candidate technical rigor"
        )

    def evaluate_and_respond(self, professor_name: str, domain: str, current_question: str, student_answer: str, turn_index: int) -> Dict[str, Any]:
        """
        Evaluates student answer on technical depth, methodology, and honesty,
        then produces constructive feedback and the next viva question.
        """
        # 1. Try LLM evaluation if configured
        if self.client:
            llm_eval = self._evaluate_with_gemini(professor_name, domain, current_question, student_answer, turn_index)
            if llm_eval:
                return llm_eval

        # 2. Deterministic Academic Evaluation Heuristics
        ans_len = len(student_answer.split())
        has_technical_terms = any(t in student_answer.lower() for t in ["gradient", "loss", "convergence", "cuda", "latency", "benchmark", "ablation", "dataset", "overfitting", "precision", "recall", "memory", "cache"])
        mentions_limitations = any(l in student_answer.lower() for l in ["however", "limitation", "tradeoff", "trade-off", "future", "bottleneck", "assumption", "edge case"])

        # Score calculations
        technical_score = min(35, max(15, ans_len * 2 + (15 if has_technical_terms else 0)))
        depth_score = min(35, max(10, ans_len + (18 if has_technical_terms else 5)))
        honesty_score = 25 if mentions_limitations else 15
        total_score = technical_score + depth_score + honesty_score

        # Feedback generation
        strengths = []
        improvements = []
        if has_technical_terms:
            strengths.append("Strong usage of empirical domain terminology.")
        else:
            improvements.append("Incorporate specific mathematical formulas or computational metrics.")

        if mentions_limitations:
            strengths.append("Demonstrated academic honesty by noting engineering tradeoffs.")
        else:
            improvements.append("Proactively state experimental boundaries or assumptions of your method.")

        # Next question generation based on turn index and domain
        next_questions = {
            "Artificial Intelligence & ML": [
                "How would you evaluate your model's robustness under out-of-distribution domain shift?",
                "If we deploy this on edge devices with 4GB VRAM, how would you design the quantization pipeline without sacrificing mAP?",
                "Could you walk me through the ablation study you conducted to verify that each architectural component actually contributes to the score?"
            ],
            "Robotics & Autonomous Systems": [
                "How do you handle latency jitter between the vision perception loop and low-level motor torque controllers?",
                "What safety fallback mechanism does your controller employ when state estimation confidence drops below 60%?",
                "How did you calibrate the sim-to-real transfer gap when deploying on physical hardware?"
            ],
            "default": [
                "Could you explain the primary ablation study you would run to stress-test your core hypothesis?",
                "What was the most challenging debugging issue you encountered during implementation, and how did you isolate it?",
                "How does your proposed solution scale when data throughput increases by two orders of magnitude?"
            ]
        }

        domain_questions = next_questions.get(domain, next_questions["default"])
        next_q_index = min(turn_index, len(domain_questions) - 1)
        next_q = domain_questions[next_q_index]

        return {
            "evaluation": {
                "turn_index": turn_index,
                "overall_score": total_score,
                "technical_soundness_score": technical_score,
                "methodological_depth_score": depth_score,
                "scientific_honesty_score": honesty_score,
                "strengths": strengths or ["Clear and confident communication."],
                "improvements": improvements or ["Continue detailing quantitative benchmark results."],
                "interviewer_comment": f"Prof. {professor_name}'s perspective: A promising response with concrete project context."
            },
            "next_question": next_q,
            "interview_complete": turn_index >= 3
        }

    def _evaluate_with_gemini(self, professor_name: str, domain: str, question: str, answer: str, turn_index: int) -> Optional[Dict[str, Any]]:
        system_instruction = (
            f"You are Prof. {professor_name}, a distinguished principal investigator in {domain}. "
            "You are conducting a strict, fair, highly technical screening viva for a prospective summer research intern. "
            "Evaluate their answer rigorously. Output valid JSON with keys: 'evaluation' (overall_score 0-100, technical_soundness_score 0-35, methodological_depth_score 0-35, scientific_honesty_score 0-30, strengths list, improvements list, interviewer_comment), 'next_question', and 'interview_complete' (boolean, true if turn_index >= 3)."
        )
        prompt = (
            f"Question asked: {question}\n"
            f"Student's Answer: {answer}\n"
            f"Turn number: {turn_index}"
        )
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
            logger.warning(f"Failed to parse Gemini interview evaluation: {e}")
            return None

mock_interview_agent = MockInterviewAgent()
