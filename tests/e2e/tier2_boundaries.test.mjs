/**
 * Tier 2: Boundary & Corner Cases (Limits, Inputs, Security)
 * Anusandhan (अनुसंधान AI) Dual-Track E2E Test Suite
 * 
 * Verifies system robustness against malformed payloads, injection vectors,
 * missing authentication credentials, boundary limits, and edge conditions.
 * 
 * Run with:
 *   node --test tests/e2e/tier2_boundaries.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert';

const BASE_URL = process.env.TARGET_URL || 'http://127.0.0.1:5000';

function testFetch(url, options = {}) {
  const testIp = `192.168.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 250) + 1}`;
  const headers = {
    'X-Forwarded-For': testIp,
    'CF-Connecting-IP': testIp,
    ...(options.headers || {})
  };
  return fetch(url, { ...options, headers });
}

test('Tier 2.1: Auth Boundary — Registration rejects missing mandatory fields', async () => {
  // Missing email
  const resNoEmail = await testFetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password: 'Password123', fullName: 'Scholar' })
  });
  assert.strictEqual(resNoEmail.status, 400);

  // Missing password
  const resNoPass = await testFetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'scholar@iit.ac.in', fullName: 'Scholar' })
  });
  assert.strictEqual(resNoPass.status, 400);

  // Missing fullName
  const resNoName = await testFetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'scholar@iit.ac.in', password: 'Password123' })
  });
  assert.strictEqual(resNoName.status, 400);
});

test('Tier 2.2: Auth Boundary — Registration enforces minimum password length (>= 6 chars)', async () => {
  const res = await testFetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: `shortpass.${Date.now()}@iisc.ac.in`,
      password: '123',
      fullName: 'Short Pass User'
    })
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.ok(data.error.includes('6 characters'));
});

test('Tier 2.3: Auth Boundary — Duplicate registration returns 409 Conflict', async () => {
  const email = `duplicate.${Date.now()}@iitd.ac.in`;
  const payload = {
    email,
    password: 'Password123!',
    fullName: 'Duplicate Tester'
  };

  // First registration succeeds
  const res1 = await testFetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  assert.strictEqual(res1.status, 201);

  // Second registration with identical email returns 409 Conflict
  const res2 = await testFetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });
  assert.strictEqual(res2.status, 409);
  const data2 = await res2.json();
  assert.ok(data2.error.includes('already exists'));
});

test('Tier 2.4: Auth Boundary — Login rejects invalid credentials', async () => {
  // Non-existent email
  const resNotFound = await testFetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'nonexistent.user.random@xyz.ac.in',
      password: 'SomePassword123'
    })
  });
  assert.strictEqual(resNotFound.status, 401);

  // Wrong password on existing user
  const email = `wrongpass.${Date.now()}@iitm.ac.in`;
  await testFetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'CorrectPassword123', fullName: 'Tester' })
  });

  const resWrongPass = await testFetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'IncorrectPassword999' })
  });
  assert.strictEqual(resWrongPass.status, 401);
});

test('Tier 2.5: Security Boundary — Guarded routes reject unauthenticated access', async () => {
  // /api/auth/me without token -> 401
  const resNoAuth = await testFetch(`${BASE_URL}/api/auth/me`);
  assert.strictEqual(resNoAuth.status, 401);

  // /api/billing/create-order without token -> 401
  const resBillingNoAuth = await testFetch(`${BASE_URL}/api/billing/create-order`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId: 'pro_researcher' })
  });
  assert.strictEqual(resBillingNoAuth.status, 401);
});

test('Tier 2.6: Security Boundary — Guarded routes reject invalid or malformed tokens', async () => {
  const resBadToken = await testFetch(`${BASE_URL}/api/auth/me`, {
    headers: { 'Authorization': 'Bearer totally.invalid.malformed.jwt.token' }
  });
  assert.strictEqual(resBadToken.status, 403);
});

test('Tier 2.7: Institutional Attestation — Rejects non-accredited public email domains', async () => {
  // Register student to get token
  const email = `student.public.${Date.now()}@example.com`;
  const regRes = await testFetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password123!', fullName: 'Public Domain User' })
  });
  const { token } = await regRes.json();

  // Attempt verification with public consumer domains
  for (const publicEmail of ['student@gmail.com', 'student@yahoo.co.in', 'student@hotmail.com']) {
    const res = await testFetch(`${BASE_URL}/api/auth/verify-institutional-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ institutionalEmail: publicEmail })
    });
    assert.strictEqual(res.status, 400);
    const data = await res.json();
    assert.strictEqual(data.verified, false);
    assert.ok(data.message.includes('not recognized'));
  }
});

test('Tier 2.8: Job Queue Boundary — Rejects submission with missing type', async () => {
  const res = await testFetch(`${BASE_URL}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload: { data: 'test' } }) // missing 'type'
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.ok(data.error.includes('type is required'));
});

test('Tier 2.9: Job Queue Boundary — Querying non-existent jobId returns 404', async () => {
  const res = await testFetch(`${BASE_URL}/api/jobs/job_nonexistent_99999`);
  assert.strictEqual(res.status, 404);
  const data = await res.json();
  assert.ok(data.error.includes('Job not found'));
});

test('Tier 2.10: Outreach Boundary — Rejects automated dispatches without explicit human confirmation', async () => {
  // Register student to obtain valid token so payload validation boundary is tested
  const email = `outreach.bound.${Date.now()}@iisc.ac.in`;
  const regRes = await testFetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password123!', fullName: 'Outreach Boundary Tester' })
  });
  const { token } = await regRes.json();

  const res = await testFetch(`${BASE_URL}/api/outreach/enqueue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      draft_id: 'draft_bot_attempt',
      professor_email: 'prof@tum.de'
      // human_confirmed omitted / falsy
    })
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.ok(data.error.toLowerCase().includes('human confirmation'));
});

test('Tier 2.11: Billing Boundary — Rejects order creation for invalid plan ID', async () => {
  // Register to get token
  const email = `billing.bound.${Date.now()}@iitk.ac.in`;
  const regRes = await testFetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password123', fullName: 'Billing Tester' })
  });
  const { token } = await regRes.json();

  const res = await testFetch(`${BASE_URL}/api/billing/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ planId: 'super_fake_plan_999' })
  });
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.ok(data.error.includes('Invalid plan'));
});

test('Tier 2.12: Billing Boundary — Non-existent order invoice returns 404', async () => {
  const email = `invoice.bound.${Date.now()}@iitk.ac.in`;
  const regRes = await testFetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password123', fullName: 'Invoice Tester' })
  });
  const { token } = await regRes.json();

  const res = await testFetch(`${BASE_URL}/api/billing/invoice/order_nonexistent_12345`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  assert.strictEqual(res.status, 404);
  const data = await res.json();
  assert.ok(data.error.includes('Invoice not found'));
});

test('Tier 2.13: Query Fuzzing & SQL/NoSQL Injection Resilience', async () => {
  const attackPayloads = [
    "' OR '1'='1",
    "'; DROP TABLE faculty; --",
    '{"$gt": ""}',
    '<script>alert("xss")</script>',
    '../../etc/passwd',
    '%00%00%00'
  ];

  for (const q of attackPayloads) {
    const res = await testFetch(`${BASE_URL}/api/faculty?q=${encodeURIComponent(q)}`);
    assert.strictEqual(res.status, 200, `Search query "${q}" must not crash the server`);
    const data = await res.json();
    assert.ok(Array.isArray(data), 'Response must remain a safe JSON array');
  }
});

test('Tier 2.14: Endpoint 404 Handling — Root and unknown endpoints return safe JSON without crashes', async () => {
  const res = await testFetch(`${BASE_URL}/api/non_existent_endpoint_${Date.now()}`);
  assert.strictEqual(res.status, 404);
});
