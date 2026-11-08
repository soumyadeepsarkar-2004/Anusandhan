# Security & Anti-Abuse Audit

## Security Architecture

Anusandhan enforces multi-layered defense-in-depth across the API gateway, microservice boundary, database pools, and third-party webhooks.

---

## 1. Network & Proxy Hardening

### Anti-Spoofing Client IP Resolution
Under reverse proxies (Cloudflare, AWS ALB, NGINX), attackers can forge the `X-Forwarded-For` header to bypass rate limits or attribute abuse to innocent users.

Anusandhan implements trusted proxy validation (`server.js`):
- In development/test: Defaults to safe loopback IP resolution.
- In production: Validates against explicitly whitelisted CIDR blocks or proxy hop counts via `TRUST_PROXY`.

### Helmet HTTP Security Headers
All responses automatically include strict HTTP headers:
- `Content-Security-Policy`: Default restrictive policy.
- `Strict-Transport-Security`: `max-age=31536000; includeSubDomains`.
- `X-Frame-Options`: `DENY` (prevents clickjacking attacks).
- `X-Content-Type-Options`: `nosniff` (prevents MIME sniffing).
- `X-XSS-Protection`: `1; mode=block`.

---

## 2. Authentication & Secrets Protection

### Asynchronous Password Hashing
To prevent blocking the Node.js event loop during sudden registration spikes, passwords are encrypted using asynchronous `crypto.scrypt` with a cryptographically generated 16-byte salt and constant-time buffer comparison (`crypto.timingSafeEqual`).

### Fail-Fast Production Secrets
The Gateway enforces immediate boot termination if `JWT_SECRET` is unset, defaulted, or shorter than 32 characters in production mode:
```javascript
if (!process.env.JWT_SECRET || !process.env.JWT_SECRET.trim()) {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('FATAL: JWT_SECRET environment variable is required in production.');
  }
}
```

---

## 3. Cryptographic Webhook Verification (Razorpay / Stripe)

To prevent financial fraud and forged payment notifications:
- Every Razorpay webhook payload is validated against `RAZORPAY_KEY_SECRET` using HMAC-SHA256.
- Signature length checks precede `crypto.timingSafeEqual` to avoid Node.js buffer length mismatch crashes.
- Webhooks must be verified before student credits or tier entitlements are updated.

---

## 4. SSRF & Payload Sanitization

### SSRF Domain Whitelist
The Python AI microservice restricts all external academic HTTP fetching to a strict whitelist of verified domains:
- `api.openalex.org`
- `export.arxiv.org`
- `api.semanticscholar.org`
- `scholar.google.com`
- `uniprot.org`

Any attempt to resolve loopback IPs (`127.0.0.1`), link-local metadata (`169.254.169.254`), or private subnets (`10.0.0.0/8`, `192.168.0.0/16`) is blocked immediately with HTTP 400 Bad Request.

### PDF Magic Byte Validation
All uploaded CV documents are verified for the standard `%PDF-` magic byte sequence. Files containing executable script tags (`/JavaScript`, `/JS`, `/Launch`, `/SubmitForm`) are rejected automatically.

---

## 5. DPDP Act 2023 & GDPR Statutory Compliance

Anusandhan strictly adheres to **Section 5 of the Digital Personal Data Protection Act, 2023 (DPDP Act 2023)**:
- **Data Fiduciary**: Anusandhan Technologies Pvt. Ltd.
- **Data Principal**: University student applicants / independent research scholars.
- **Purpose Limitation**: Student transcripts and CVs are utilized exclusively for matching and pitch calibration.
- **Right to Erasure**: Students can trigger permanent account deletion with immediate cascading purge across PostgreSQL and MongoDB stores.
- **Grievance Redressal**: Formal Data Protection Officer contact at `grievance@anusandhan.ai` with statutory 48-hour acknowledgment.
