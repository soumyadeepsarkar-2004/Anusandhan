"""
Unit & Integration Tests for Security, SSRF Prevention, PDF Guard, and Core Services.
"""
import pytest
from fastapi import HTTPException
from app.core.security import validate_academic_url, validate_pdf_content, is_ip_private_or_restricted
from app.services.outreach_service import outreach_service
from app.schemas.outreach import OutreachDraftRequest, EnqueueOutreachRequest
from app.services.scholar_service import scholar_service
from app.services.voice_service import voice_agent_service
from app.schemas.voice import VoiceTurnRequest

# 1. Security Tests: SSRF & IP Restriction
def test_private_ip_detection():
    assert is_ip_private_or_restricted("127.0.0.1") is True
    assert is_ip_private_or_restricted("10.0.0.1") is True
    assert is_ip_private_or_restricted("192.168.1.1") is True
    assert is_ip_private_or_restricted("169.254.169.254") is True  # Cloud metadata
    assert is_ip_private_or_restricted("8.8.8.8") is False         # Public DNS

def test_validate_academic_url_rejects_insecure_or_internal():
    with pytest.raises(HTTPException):
        validate_academic_url("http://api.openalex.org")  # HTTP rejected
    with pytest.raises(HTTPException):
        validate_academic_url("https://169.254.169.254/latest/meta-data")  # Metadata rejected
    with pytest.raises(HTTPException):
        validate_academic_url("https://malicious-domain-unapproved.com")

def test_validate_academic_url_accepts_whitelisted():
    assert validate_academic_url("https://api.openalex.org/works") is True

# 2. PDF Security Tests
def test_pdf_validation_rejects_invalid_headers():
    fake_pdf = b"NOT_A_REAL_PDF"
    with pytest.raises(HTTPException):
        validate_pdf_content(fake_pdf)

def test_pdf_validation_rejects_embedded_scripts():
    malicious_pdf = b"%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Pages 2 0 R /Names << /JavaScript 3 0 R >> >>\nendobj"
    with pytest.raises(HTTPException):
        validate_pdf_content(malicious_pdf)

def test_pdf_validation_accepts_clean_pdf():
    clean_pdf = b"%PDF-1.5\n%Clean minimal binary payload for test\n"
    assert validate_pdf_content(clean_pdf) is True

def test_resume_validation_rejects_invoice_and_non_cv():
    from app.services.pdf_service import validate_is_resume
    invoice_text = "Tax Invoice\nBill To: John Doe\nAmount Due: $450.00\nPayment Receipt\nThank you for your business."
    with pytest.raises(HTTPException) as exc:
        validate_is_resume(invoice_text)
    assert exc.value.status_code == 422

    short_text = "Hello world this is not a CV."
    with pytest.raises(HTTPException) as exc2:
        validate_is_resume(short_text)
    assert exc2.value.status_code == 422

def test_resume_validation_accepts_valid_academic_cv():
    from app.services.pdf_service import validate_is_resume
    cv_text = """
    Aarav Sharma
    aarav.sharma@iisc.ac.in | github.com/aarav | Bengaluru, India
    
    Education:
    Indian Institute of Science (IISc), Bangalore
    Bachelor of Science in Research (Physics & Computer Science)
    CGPA: 9.4 / 10.0 (Class of 2026)
    
    Research Experience & Projects:
    - Distributed Attention Kernels for Diffusion Models: Developed custom CUDA primitives
      reducing memory footprint by 38% under high-concurrency benchmarks.
    - Vision-Language Grounding: Evaluated multimodal latent representations with PyTorch.
    
    Technical Skills:
    Python, C++, PyTorch, CUDA, Linux, Git, LaTeX, Distributed Systems.
    """
    # Should pass without raising HTTPException
    validate_is_resume(cv_text)

# 3. Outreach Word Count & Academic Standard
def test_outreach_draft_within_academic_guidelines():
    req = OutreachDraftRequest(
        professor_id="prof_tian",
        professor_name="Prof. Fei-Fei Tian",
        professor_institution="TUM",
        target_paper_title="Cross-Embodiment Visuomotor Policies via Spatial Token Distillation",
        student_name="Priya Sharma",
        student_university="IIT Delhi",
        student_cgpa=9.4,
        student_relevant_project="Accelerated Diffusion Inference Engine with custom CUDA kernels",
        student_relevant_skills=["PyTorch", "CUDA", "C++"],
        proposed_contribution="optimizing token distillation latency for resource-constrained manipulators"
    )
    draft = outreach_service.generate_academic_draft(req)
    assert 120 <= draft.word_count <= 190
    assert draft.requires_human_approval is True
    assert "Priya Sharma" in draft.body_text
    assert "Cross-Embodiment Visuomotor Policies" in draft.body_text

# 4. Mandatory Human-In-The-Loop Enforcement
def test_enqueue_requires_human_confirmation():
    req = EnqueueOutreachRequest(
        draft_id="draft_test",
        professor_email="prof@tum.de",
        human_confirmed=False  # Auto-bot attempt
    )
    with pytest.raises(HTTPException) as exc:
        outreach_service.enqueue_outreach("student_1", req)
    assert "Human review" in str(exc.value.detail) or "human" in str(exc.value.detail).lower()

# 5. Multilingual Voice Agent Intent Test
def test_voice_agent_status_intent():
    req = VoiceTurnRequest(
        user_input="Bhai mere applications ka status kya hai?",
        preferred_language="hi-IN"
    )
    res = voice_agent_service.process_turn(req)
    assert res.detected_intent == "check_status"
    assert "active" in res.agent_text_response.lower() or "applications" in res.agent_text_response.lower()

# 6. Faculty Search & Active Grants Test
@pytest.mark.asyncio
async def test_faculty_search_active_grants():
    results = await scholar_service.search_professors(has_active_grants=True)
    assert len(results) > 0
    for prof in results:
        assert prof.metrics.active_grants_total_usd > 0

def test_voice_websocket_stream():
    from starlette.testclient import TestClient
    from app.main import app
    client = TestClient(app)
    with client.websocket_connect("/api/v1/voice/ws") as websocket:
        websocket.send_json({
            "user_input": "Show me active grants",
            "preferred_language": "en"
        })
        ack = websocket.receive_json()
        assert ack["status"] == "processing"
        result = websocket.receive_json()
        assert result["status"] == "complete"
        assert "response" in result
        assert result["response"]["detected_intent"] != ""

# 7. Encrypted / Corrupt PDF Boundary Rejection Test
def test_encrypted_corrupt_pdf_rejection():
    from app.services.pdf_service import extract_text_from_pdf
    # Encrypted / malformed PDF bytes with header but unreadable stream
    corrupted_pdf = b"%PDF-1.4\ntrailer\n<< /Encrypt 1 0 R >>\n%%EOF"
    with pytest.raises(HTTPException) as exc_info:
        extract_text_from_pdf(corrupted_pdf)
    assert exc_info.value.status_code == 400
    assert "password" in str(exc_info.value.detail).lower() or "unreadable" in str(exc_info.value.detail).lower() or "malformed" in str(exc_info.value.detail).lower()

# 8. Upcoming Fellowship Intent & Opportunity Links Test
@pytest.mark.asyncio
async def test_voice_mentor_upcoming_fellowships():
    from app.agents.voice_mentor_agent import voice_mentor_agent
    req = VoiceTurnRequest(
        user_input="What upcoming fellowships are available?",
        preferred_language="en-US",
        model="llama-3-70b"
    )
    res = await voice_mentor_agent.process_turn(req)
    assert "upcoming" in res.detected_intent
    assert res.opportunity_links is not None
    assert len(res.opportunity_links) > 0
    assert any(l["status"] == "upcoming" for l in res.opportunity_links)
    assert "llama-3-70b" in res.engine_used

# 9. Scraped Postings Voice Navigation Intent Test
@pytest.mark.asyncio
async def test_voice_mentor_scraped_postings_intent():
    from app.agents.voice_mentor_agent import voice_mentor_agent
    req = VoiceTurnRequest(
        user_input="Bhai nayi research postings aur lab openings kya hain?",
        preferred_language="hi-IN",
        model="gemini-flash"
    )
    res = await voice_mentor_agent.process_turn(req)
    assert res.detected_intent == "navigate_postings_scraped"
    assert res.recommended_action == "FILTER_LABS"
    assert res.suggested_ui_filter["subTab"] == "scraped"
    assert res.opportunity_links is not None
    assert len(res.opportunity_links) > 0
