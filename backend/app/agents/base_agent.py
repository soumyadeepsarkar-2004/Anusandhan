"""
Base Agent Architecture for Anusandhan (अनुसंधान).
Provides unified LLM orchestration via google-genai (Gemini 3.8 Flash / 3.5 Flash-Lite)
with intelligent heuristic fallback when offline or running without API keys.
"""
import os
import json
import logging
from typing import Optional, Dict, Any, List

logger = logging.getLogger("agent.base")

class BaseAcademicAgent:
    def __init__(self, name: str, role: str):
        self.name = name
        self.role = role
        self.api_key = os.getenv("GEMINI_API_KEY", "")
        self.client = None
        
        if self.api_key:
            try:
                from google import genai
                self.client = genai.Client(api_key=self.api_key)
                logger.info(f"[{self.name}] Initialized with google-genai Client.")
            except Exception as e:
                logger.warning(f"[{self.name}] Failed to initialize google-genai: {e}. Using deterministic academic engine.")
                self.client = None
        else:
            logger.info(f"[{self.name}] GEMINI_API_KEY not detected. Operating with deterministic academic reasoning engine.")

    def run_llm(self, prompt: str, system_instruction: str = "", model: str = "gemini-3.8-flash") -> Optional[str]:
        """
        Executes generation using Gemini API via google-genai if client is configured.
        Returns None if client is unavailable or if call fails, triggering agent's deterministic fallback.
        """
        if not self.client:
            return None
            
        try:
            from google.genai import types
            config = types.GenerateContentConfig(
                system_instruction=system_instruction or f"You are {self.name}, {self.role} for the Anusandhan platform.",
                temperature=0.4,
                max_output_tokens=1024
            )
            response = self.client.models.generate_content(
                model=model,
                contents=prompt,
                config=config
            )
            if response and response.text:
                return response.text.strip()
        except Exception as e:
            logger.warning(f"[{self.name}] Gemini generation call error: {e}. Falling back.")
            return None
            
        return None
