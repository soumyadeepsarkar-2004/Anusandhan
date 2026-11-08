"""
Autonomous Agent Roster for Anusandhan (अनुसंधान).
"""
from app.agents.voice_mentor_agent import voice_mentor_agent, VoiceMentorAgent
from app.agents.paper_deconstruction_agent import paper_deconstruction_agent, PaperDeconstructionAgent
from app.agents.mock_interview_agent import mock_interview_agent, MockInterviewAgent
from app.agents.cv_diagnostic_agent import cv_diagnostic_agent, CVDiagnosticAgent
from app.agents.grant_radar_agent import grant_radar_agent, GrantRadarAgent

__all__ = [
    "voice_mentor_agent",
    "VoiceMentorAgent",
    "paper_deconstruction_agent",
    "PaperDeconstructionAgent",
    "mock_interview_agent",
    "MockInterviewAgent",
    "cv_diagnostic_agent",
    "CVDiagnosticAgent",
    "grant_radar_agent",
    "GrantRadarAgent"
]
