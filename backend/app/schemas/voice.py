"""
Pydantic schemas for Voice Agent synthesis and multilingual dialog state.
"""
from typing import Optional, List
from pydantic import BaseModel

class VoiceTurnRequest(BaseModel):
    user_input: str
    preferred_language: str = "hi-IN"  # "hi-IN" (Hindi/Hinglish), "en-US", "ta-IN", "bn-IN"
    voice_engine: str = "sarvam_indic"  # "sarvam_indic" | "gemini_live" | "browser_tts"
    model: Optional[str] = "gemini-flash"
    student_context: Optional[dict] = None

class VoiceTurnResponse(BaseModel):
    agent_text_response: str
    detected_intent: str
    recommended_action: Optional[str] = None
    suggested_ui_filter: Optional[dict] = None
    opportunity_links: Optional[List[dict]] = None
    audio_base64: Optional[str] = None
    engine_used: str
    latency_ms: int
