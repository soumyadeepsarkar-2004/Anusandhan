process.env.NODE_ENV = 'test';
import test from 'node:test';
import assert from 'node:assert';
import app from '../server.js';

const BASE_URL = 'http://localhost:5000';
let server;
let sharedToken = '';

test.before(async () => {
  let isRunning = false;
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (res.ok) isRunning = true;
  } catch {}

  if (!isRunning) {
    await new Promise((resolve, reject) => {
      server = app.listen(5000, () => resolve());
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') resolve();
        else reject(err);
      });
    });
  }

  // Register a test user to obtain shared JWT token for protected routes
  const testEmail = `gateway.user.${Date.now()}@example.com`;
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'password123',
      fullName: 'Gateway Test User',
      university: 'IISc Bangalore'
    })
  });
  if (regRes.ok) {
    const data = await regRes.json();
    sharedToken = data.token;
  }

  // Trigger initial ingestion sweep so scraped postings and faculty are populated
  await fetch(`${BASE_URL}/api/ingest/refresh`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${sharedToken}`
    }
  });
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  try {
    const mongoose = await import('mongoose');
    if (mongoose.default && mongoose.default.connection) {
      await mongoose.default.disconnect();
    }
  } catch {}
  // Guarantee clean process termination for CI/CD test runners
  setTimeout(() => {
    process.exit(0);
  }, 300);
});

test('Express Gateway Health Check returns operational status', async () => {
  const res = await fetch(`${BASE_URL}/api/health`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'operational');
  assert.ok(data.services.redis_cache);
  assert.ok(data.concurrency_target.includes('1,000 - 2,000'));
});

test('Faculty API endpoint returns verified researchers with caching', async () => {
  const res = await fetch(`${BASE_URL}/api/faculty?scope=national`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data));
  assert.ok(data.length > 0);
  assert.ok(data.some(f => f.name.includes('Chiranjib')));
});

test('Fellowships API endpoint returns prestigious funded programs', async () => {
  const res = await fetch(`${BASE_URL}/api/fellowships`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data));
  assert.ok(data.length >= 8);
  assert.ok(data.some(f => f.id === 'iisc-srfp'));
  assert.ok(data.some(f => f.id === 'cern-summer'));
  // Verify direct application form URLs and dynamic lifecycle status are populated
  data.forEach(f => {
    assert.ok(f.applicationPortalUrl, `Fellowship ${f.id} must have direct applicationPortalUrl`);
    assert.ok(['active', 'upcoming', 'passed'].includes(f.status), `Fellowship ${f.id} has invalid status ${f.status}`);
  });
});

test('Fellowships API endpoint filters by lifecycle status (active, upcoming, passed)', async () => {
  // 1. Query active opportunities
  const activeRes = await fetch(`${BASE_URL}/api/fellowships?status=active`);
  assert.strictEqual(activeRes.status, 200);
  const activeData = await activeRes.json();
  assert.ok(Array.isArray(activeData));
  assert.ok(activeData.length > 0);
  assert.ok(activeData.every(f => f.status === 'active'));

  // 2. Query upcoming opportunities
  const upcomingRes = await fetch(`${BASE_URL}/api/fellowships?status=upcoming`);
  assert.strictEqual(upcomingRes.status, 200);
  const upcomingData = await upcomingRes.json();
  assert.ok(Array.isArray(upcomingData));
  assert.ok(upcomingData.length > 0);
  assert.ok(upcomingData.every(f => f.status === 'upcoming'));

  // 3. Query passed / archived opportunities
  const passedRes = await fetch(`${BASE_URL}/api/fellowships?status=passed`);
  assert.strictEqual(passedRes.status, 200);
  const passedData = await passedRes.json();
  assert.ok(Array.isArray(passedData));
  assert.ok(passedData.length > 0);
  assert.ok(passedData.every(f => f.status === 'passed'));
});

test('Asynchronous Job Queue accepts tasks with 202 Accepted', async () => {
  const res = await fetch(`${BASE_URL}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'cv_extraction',
      payload: { studentName: 'Test Student', rawText: 'B.Tech IIT Bombay 9.4 CGPA' }
    })
  });
  assert.strictEqual(res.status, 202);
  const data = await res.json();
  assert.ok(data.job);
  assert.ok(data.job.id);
  assert.strictEqual(data.job.type, 'cv_extraction');

  // Verify status lookup
  const statusRes = await fetch(`${BASE_URL}/api/jobs/${data.job.id}`);
  assert.strictEqual(statusRes.status, 200);
  const statusData = await statusRes.json();
  assert.strictEqual(statusData.id, data.job.id);
});

test('Live Academic Data Ingestion Engine reports operational status and telemetry', async () => {
  const res = await fetch(`${BASE_URL}/api/ingest/status`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'operational');
  assert.ok(data.trackedFacultyCount >= 4);
  assert.ok(data.trackedFellowshipsCount >= 8);
  assert.ok(data.lastSweepTimestamp !== undefined);
});

test('Billing & Monetization API returns 3 tiers with INR & USD pricing', async () => {
  const res = await fetch(`${BASE_URL}/api/billing/plans`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data.plans));
  assert.strictEqual(data.plans.length, 3);
  assert.ok(data.plans.some(p => p.id === 'free_scholar'));
  assert.ok(data.plans.some(p => p.id === 'pro_researcher'));
  assert.ok(data.plans.some(p => p.id === 'institutional_lab'));
});

test('Institutional Email Verification grants verified scholar status', async () => {
  // 1. Register a test student to obtain a valid JWT token
  const testEmail = `test.scholar.${Date.now()}@example.com`;
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'password123',
      fullName: 'Aarav Sharma',
      university: 'Indian Institute of Science'
    })
  });
  assert.strictEqual(regRes.status, 201);
  const regData = await regRes.json();
  const token = regData.token;
  assert.ok(token);

  // 2. Call verify-institutional-email with token
  const res = await fetch(`${BASE_URL}/api/auth/verify-institutional-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ institutionalEmail: 'aarav.sharma@iisc.ac.in' })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.verified, true);
  assert.strictEqual(data.bonusCreditsAwarded, 10);
  assert.strictEqual(data.domain, 'iisc.ac.in');
});

test('Outreach Google OAuth URL endpoint returns valid authorization parameters', async () => {
  const res = await fetch(`${BASE_URL}/api/outreach/oauth/google-url`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.authUrl);
  assert.ok(data.authUrl.includes('accounts.google.com'));
  assert.ok(data.authUrl.includes('gmail.send'));
});

test('Outreach Enqueue blocks automated dispatches without human confirmation', async () => {
  const res = await fetch(`${BASE_URL}/api/outreach/enqueue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sharedToken}`
    },
    body: JSON.stringify({
      draft_id: 'draft_test_101',
      professor_email: 'f.tian@tum.de',
      human_confirmed: false
    })
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.ok(data.error.includes('human confirmation'));
});

test('Outreach Enqueue accepts confirmed pitch with randomized jitter delay', async () => {
  const res = await fetch(`${BASE_URL}/api/outreach/enqueue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sharedToken}`
    },
    body: JSON.stringify({
      draft_id: 'draft_test_102',
      professor_email: 'f.tian@tum.de',
      human_confirmed: true
    })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'queued_with_jitter');
  assert.ok(data.jitter_delay_seconds >= 240); // 4-12 minutes jitter
});

test('Faculty API endpoint properly resolves international/global scope queries', async () => {
  const res = await fetch(`${BASE_URL}/api/faculty?scope=international`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data));
  assert.ok(data.length > 0);
  // Must return global researchers
  assert.ok(data.some(f => f.country?.toLowerCase() !== 'india' || f.scope === 'global' || f.scope === 'international'));
});

test('Voice Agent API endpoint handles fellowship status intent and returns opportunity links', async () => {
  const res = await fetch(`${BASE_URL}/api/voice/turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_input: 'What upcoming fellowships are there?',
      model: 'llama-3-70b',
      voice_engine: 'sarvam'
    })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.agent_text_response);
  assert.ok(data.engine_used.includes('llama-3-70b') || data.engine_used.includes('sarvam'));
  assert.ok(Array.isArray(data.opportunity_links));
  assert.ok(data.opportunity_links.length > 0);
  assert.ok(data.opportunity_links.some(l => l.status === 'upcoming'));
});

test('Live Academic Scraper API endpoint returns scraped postings with verified schema', async () => {
  const res = await fetch(`${BASE_URL}/api/ingest/postings`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data));
  assert.ok(data.length > 0);
  data.forEach(p => {
    assert.ok(p.id, 'Posting must have id');
    assert.ok(p.name, 'Posting must have PI name');
    assert.strictEqual(p.isLiveScraped, true);
    assert.ok(p.recentPaper?.title, 'Posting must have recent paper title');
  });
});

test('Ingestion schedule API endpoint allows dynamic interval reconfiguration', async () => {
  const res = await fetch(`${BASE_URL}/api/ingest/schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sharedToken}`
    },
    body: JSON.stringify({ intervalMinutes: 45 })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.intervalMinutes, 45);
  assert.ok(data.nextSweepTimestamp);

  // Restore 30-minute interval
  await fetch(`${BASE_URL}/api/ingest/schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sharedToken}`
    },
    body: JSON.stringify({ intervalMinutes: 30 })
  });
});

test('Faculty API endpoint filters with scraped=true and returns only live scraped opportunities', async () => {
  const res = await fetch(`${BASE_URL}/api/faculty?scraped=true`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data));
  assert.ok(data.length > 0);
  assert.ok(data.every(f => f.isLiveScraped === true));
});

test('Faculty API endpoint preserves scraped opportunities when querying keywords (q=robot)', async () => {
  const res = await fetch(`${BASE_URL}/api/faculty?q=robot`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(Array.isArray(data));
  assert.ok(data.length > 0);
  assert.ok(data.some(f => f.isLiveScraped === true));
});

test('Voice Agent API endpoint handles scraped postings intent and routes to scraped subTab', async () => {
  const res = await fetch(`${BASE_URL}/api/voice/turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_input: 'Bhai nayi research postings aur lab openings kya hain?',
      model: 'gemini-flash',
      voice_engine: 'sarvam'
    })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.agent_text_response);
  assert.strictEqual(data.detected_intent, 'navigate_postings_scraped');
  assert.strictEqual(data.suggested_ui_filter?.subTab, 'scraped');
  assert.ok(Array.isArray(data.opportunity_links));
  assert.ok(data.opportunity_links.length > 0);
});

// ==========================================
// Milestone 1: Security Hardening Test Suite
// ==========================================

test('Security M1: Helmet security headers are present on all responses', async () => {
  const res = await fetch(`${BASE_URL}/api/health`);
  assert.strictEqual(res.status, 200);
  assert.ok(res.headers.get('content-security-policy'), 'CSP header must be present');
  // Server configures helmet frameguard { action: 'sameorigin' } (server.js), which matches
  // the CSP frameAncestors ['self'] directive. Keep this expectation in sync with server config.
  assert.strictEqual(res.headers.get('x-frame-options'), 'SAMEORIGIN');
  assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
  assert.strictEqual(res.headers.get('cross-origin-resource-policy'), 'cross-origin');
  assert.ok(res.headers.get('strict-transport-security'), 'HSTS header must be present');
});

test('Security M1: CORS policy allows whitelisted origins and blocks untrusted origins', async () => {
  // Allowed origin
  const allowedRes = await fetch(`${BASE_URL}/api/health`, {
    headers: { 'Origin': 'http://localhost:5173' }
  });
  assert.strictEqual(allowedRes.headers.get('access-control-allow-origin'), 'http://localhost:5173');

  // Disallowed origin
  const disallowedRes = await fetch(`${BASE_URL}/api/health`, {
    headers: { 'Origin': 'http://untrusted-attacker.com' }
  });
  assert.strictEqual(disallowedRes.headers.get('access-control-allow-origin'), null);
});

test('Security M1: Route guards block unauthenticated access with 401 Unauthorized', async () => {
  // 1. Student Profile
  const studentRes = await fetch(`${BASE_URL}/api/students/me`);
  assert.strictEqual(studentRes.status, 401);

  // 2. Outreach Draft
  const draftRes = await fetch(`${BASE_URL}/api/outreach/draft`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ professor_id: 'test' })
  });
  assert.strictEqual(draftRes.status, 401);

  // 3. Ingestion Refresh
  const ingestRes = await fetch(`${BASE_URL}/api/ingest/refresh`, {
    method: 'POST'
  });
  assert.strictEqual(ingestRes.status, 401);

  // 4. Agent Paper Pitch
  const agentRes = await fetch(`${BASE_URL}/api/agents/paper-pitch`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  assert.strictEqual(agentRes.status, 401);
});

test('Security M1: Billing IDOR guard rejects invoice access for non-owner', async () => {
  // 1. Create order for User A (using sharedToken)
  const orderRes = await fetch(`${BASE_URL}/api/billing/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${sharedToken}`
    },
    body: JSON.stringify({ planId: 'pro_researcher' })
  });
  assert.strictEqual(orderRes.status, 200);
  const orderData = await orderRes.json();
  assert.ok(orderData.orderId);

  // 2. Owner can view invoice
  const ownerInvoiceRes = await fetch(`${BASE_URL}/api/billing/invoice/${orderData.orderId}`, {
    headers: { 'Authorization': `Bearer ${sharedToken}` }
  });
  assert.strictEqual(ownerInvoiceRes.status, 200);

  // 3. Register User B
  const userBEmail = `userb.${Date.now()}@example.com`;
  const regB = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userBEmail,
      password: 'password123',
      fullName: 'User B',
      university: 'IIT Bombay'
    })
  });
  const userBData = await regB.json();
  const tokenB = userBData.token;

  // 4. User B attempts to access User A invoice -> Expect 403 Forbidden
  const idorRes = await fetch(`${BASE_URL}/api/billing/invoice/${orderData.orderId}`, {
    headers: { 'Authorization': `Bearer ${tokenB}` }
  });
  assert.strictEqual(idorRes.status, 403);
  const idorData = await idorRes.json();
  assert.strictEqual(idorData.error, 'Access denied: unauthorized invoice retrieval');
});

test('Security M1: Razorpay webhook validates HMAC signature and guards buffer length against crash', async () => {
  // 1. Missing signature header -> 400
  const missingSigRes = await fetch(`${BASE_URL}/api/billing/webhook/razorpay`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ event: 'payment.captured' })
  });
  assert.strictEqual(missingSigRes.status, 400);

  // 2. Malformed / short signature (length mismatch) -> 400 without crashing (no RangeError 500)
  const shortSigRes = await fetch(`${BASE_URL}/api/billing/webhook/razorpay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': 'too_short'
    },
    body: JSON.stringify({ event: 'payment.captured' })
  });
  assert.strictEqual(shortSigRes.status, 400);

  // 3. Valid HMAC signature -> 200
  const crypto = await import('crypto');
  const payloadStr = JSON.stringify({ event: 'payment.captured', payload: {} });
  const validSig = crypto.default
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || 'test_secret_key_rzp_99482')
    .update(Buffer.from(payloadStr, 'utf8'))
    .digest('hex');

  const validSigRes = await fetch(`${BASE_URL}/api/billing/webhook/razorpay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': validSig
    },
    body: payloadStr
  });
  assert.strictEqual(validSigRes.status, 200);
  const validData = await validSigRes.json();
  assert.strictEqual(validData.verified, true);
});

test('Security M1: Async password hashing and defensive verification', async () => {
  const { hashPassword, verifyPassword } = await import('../utils/password.js');
  const pwd = 'TestSuperSecretPassword2026!';
  const hash = await hashPassword(pwd);

  assert.ok(hash.includes(':'), 'Hash format must be salt:key');
  const [salt, key] = hash.split(':');
  assert.strictEqual(salt.length, 32, 'Salt must be 16 bytes hex (32 chars)');
  assert.strictEqual(key.length, 128, 'Derived key must be 64 bytes hex (128 chars)');

  assert.strictEqual(await verifyPassword(pwd, hash), true, 'Correct password must match');
  assert.strictEqual(await verifyPassword('wrongpassword', hash), false, 'Incorrect password must reject');
  assert.strictEqual(await verifyPassword(pwd, 'invalid-hash-string'), false, 'Malformed hash must safely reject');
  assert.strictEqual(await verifyPassword(pwd, null), false, 'Null hash must safely reject');
  assert.strictEqual(await verifyPassword(pwd, 'salt:shortkey'), false, 'Length-mismatched key must safely reject without throwing RangeError');
});
