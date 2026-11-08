"""
Voice Agent & Multilingual Router.
Orchestrates turn-by-turn spoken dialogue in Hindi, Hinglish, and English with UI command routing
and bidirectional streaming WebSockets.
"""
import json
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.schemas.voice import VoiceTurnRequest, VoiceTurnResponse
from app.agents.voice_mentor_agent import voice_mentor_agent

router = APIRouter(prefix="/voice", tags=["Multilingual Voice Agent"])

@router.post("/turn", response_model=VoiceTurnResponse)
async def process_voice_turn(req: VoiceTurnRequest):
    """
    Receives voice agent conversational turn, detects intent and slots,
    and generates multilingual response with synchronized UI actions.
    """
    return await voice_mentor_agent.process_turn(req)

@router.websocket("/ws")
async def voice_websocket_stream(websocket: WebSocket):
    """
    Bidirectional streaming WebSocket endpoint for real-time duplex voice interaction.
    Streams immediate processing state and turn responses without polling overhead.
    """
    await websocket.accept()
    try:
        while True:
            raw_text = await websocket.receive_text()
            payload = json.loads(raw_text)
            req = VoiceTurnRequest(**payload)
            await websocket.send_json({"status": "processing", "state": "thinking"})
            result = await voice_mentor_agent.process_turn(req)
            await websocket.send_json({
                "status": "complete",
                "state": "speaking",
                "response": result.model_dump()
            })
    except WebSocketDisconnect:
        pass
    except Exception as err:
        try:
            await websocket.send_json({"status": "error", "message": str(err)})
        except Exception:
            pass
