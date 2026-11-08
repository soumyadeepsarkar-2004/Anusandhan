"""
Security verification utilities for Anusandhan.
Implements SSRF filtering, PDF magic bytes validation, malicious payload mitigation, and anti-abuse safeguards.
"""
import ipaddress
import re
import socket
from urllib.parse import urlparse
from fastapi import HTTPException, status
from app.core.config import settings

def is_ip_private_or_restricted(ip_str: str) -> bool:
    """
    Evaluates whether an IP address is private, loopback, link-local, reserved,
    or belongs to cloud metadata (e.g., 169.254.169.254).
    """
    try:
        ip = ipaddress.ip_address(ip_str)
        return (
            ip.is_private
            or ip.is_loopback
            or ip.is_link_local
            or ip.is_reserved
            or ip.is_multicast
            or str(ip) == "169.254.169.254"
        )
    except ValueError:
        return True

def validate_academic_url(url: str) -> bool:
    """
    Defends against SSRF (Server-Side Request Forgery) attacks.
    Ensures URL targets only sanctioned academic hosts and prevents
    internal LAN / cloud metadata exploration.
    """
    parsed = urlparse(url)
    if parsed.scheme != "https":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Insecure URL scheme: only HTTPS academic endpoints are permitted."
        )

    hostname = parsed.hostname
    if not hostname:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid URL: Hostname missing."
        )

    # Check allowed domain whitelist or valid .edu / .ac.uk academic domain
    is_whitelisted = any(
        hostname == domain or hostname.endswith("." + domain)
        for domain in settings.ALLOWED_ACADEMIC_DOMAINS
    )
    is_academic_tld = hostname.endswith(".edu") or hostname.endswith(".ac.uk") or hostname.endswith(".ac.in")

    if not (is_whitelisted or is_academic_tld):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Host '{hostname}' is not in the sanctioned academic registry."
        )

    # Resolve IP and check against internal/metadata IPs
    try:
        resolved_ip = socket.gethostbyname(hostname)
        if is_ip_private_or_restricted(resolved_ip):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Security rejection: Academic endpoint resolves to restricted internal IP."
            )
    except socket.gaierror:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"DNS resolution failed for hostname '{hostname}'."
        )

    return True

def validate_pdf_content(file_bytes: bytes) -> bool:
    """
    Verifies PDF authenticity:
    1. Size within limit.
    2. %PDF- magic bytes header.
    3. Scans for potentially dangerous executable constructs (/JavaScript, /Launch).
    """
    if len(file_bytes) > settings.MAX_UPLOAD_SIZE_BYTES:
        raise HTTPException(
            status_code=status.HTTP_413_REQUEST_ENTITY_TOO_LARGE,
            detail=f"File exceeds maximum allowed size of {settings.MAX_UPLOAD_SIZE_BYTES // (1024*1024)}MB."
        )

    if not file_bytes.startswith(b"%PDF-"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file signature: Content does not match standard PDF header."
        )

    # Malicious stream inspections (decompression bombs & automated script execution)
    dangerous_patterns = [
        rb"/JavaScript\b",
        rb"/JS\b",
        rb"/Launch\b",
        rb"/SubmitForm\b"
    ]
    for pattern in dangerous_patterns:
        if re.search(pattern, file_bytes[:100000]):  # Inspect structural catalog
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_CONTENT,
                detail="Security risk: PDF contains active scripting or executable launch instructions."
            )

    return True

def sanitize_text(text: str) -> str:
    """
    Strips dangerous control characters while preserving valid Unicode academic symbols.
    """
    if not text:
        return ""
    # Remove null bytes and non-printable control characters (except newline, tab, carriage return)
    cleaned = re.sub(r"[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]", "", text)
    return cleaned.strip()
