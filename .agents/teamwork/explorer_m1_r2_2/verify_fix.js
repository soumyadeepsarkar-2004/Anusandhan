/**
 * Empirical Verification Script for Explorer M1 R2 Instance 2
 * Tests the proposed fixes for Issue 1 (rate limiting ordering & user ID)
 * and Issue 2 (direct client X-Forwarded-For spoofing).
 */
import test from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import jwt from '../../../server/node_modules/jsonwebtoken/index.js';
import { performance } from 'node:perf_hooks';
import app from '../../../server/server.js';
import { cache } from '../../../server/services/redisCache.js';
import { hashPassword, verifyPassword } from '../../../server/utils/password.js';

// Apply proposed fix to app in-memory before running the tests:
// 1. Set trust proxy according to secure rule (false when TRUST_PROXY is not configured)
const trustProxyConfig = process.env.TRUST_PROXY || process.env.TRUSTED_PROXIES;
if (trustProxyConfig) {
  const parsed = trustProxyConfig.includes(',')
    ? trustProxyConfig.split(',').map(s => s.trim())
    : (trustProxyConfig === 'true' ? true : (trustProxyConfig === 'false' ? false : (!isNaN(Number(trustProxyConfig)) ? Number(trustProxyConfig) : trustProxyConfig)));
  app.set('trust proxy', parsed);
} else {
  app.set('trust proxy', false);
}

import Layer from '../../../server/node_modules/express/lib/router/layer.js';

const jwtLayer = new Layer('/', { sensitive: false, strict: false, end: false }, (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (authHeader && typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    const token = authHeader.slice(7).trim();
    const secret = process.env.JWT_SECRET || 'researchintern_pro_production_secret_key_2026';
    if (token && secret) {
      try {
        req.user = jwt.verify(token, secret);
      } catch {
        // Leave req.user undefined; downstream authenticateToken will enforce 401/403
      }
    }
  }
  next();
});

// Insert before the routes (index 2 is after helmet/cors or top)
app._router.stack.unshift(jwtLayer);

let server;
let BASE_URL = '';
let userAToken = '';
let userAId = '';
let userBToken = '';
let userBId = '';
let testOrderId = '';

test.before(async () => {
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      BASE_URL = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  cache.flush('rl');

  // Register User A
  const userAEmail = `victim.scholar.${Date.now()}@iisc.ac.in`;
  const regARes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userAEmail,
      password: 'SecurePassword123!',
      fullName: 'Dr. Scholar Victim',
      university: 'IISc Bangalore'
    })
  });
  assert.strictEqual(regARes.status, 201);
  const dataA = await regARes.json();
  userAToken = dataA.token;
  userAId = dataA.user.id;

  // Register User B
  const userBEmail = `adversary.scholar.${Date.now()}@attacker.org`;
  const regBRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: userBEmail,
      password: 'AdversarySecret456!',
      fullName: 'Adversary Infiltrator',
      university: 'Untrusted Academy'
    })
  });
  assert.strictEqual(regBRes.status, 201);
  const dataB = await regBRes.json();
  userBToken = dataB.token;
  userBId = dataB.user.id;

  // Create order for User A
  const orderRes = await fetch(`${BASE_URL}/api/billing/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${userAToken}`
    },
    body: JSON.stringify({ planId: 'pro_researcher', currency: 'INR' })
  });
  assert.strictEqual(orderRes.status, 200);
  const orderData = await orderRes.json();
  testOrderId = orderData.orderId;
  assert.ok(testOrderId);
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

// CHALLENGE 1A
test('CHALLENGE 1A: Forged CF-Connecting-IP cannot bypass rate limits', async () => {
  cache.flush('rl:ai');
  const endpoint = `${BASE_URL}/api/voice/turn`;
  const responses = [];
  for (let i = 0; i < 35; i++) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'CF-Connecting-IP': `198.51.100.${i + 1}`
      },
      body: JSON.stringify({ user_input: 'Tell me about fellowships' })
    });
    responses.push(res.status);
  }
  const successful = responses.slice(0, 30);
  const rateLimited = responses.slice(30);
  assert.ok(successful.every(s => s === 200));
  assert.ok(rateLimited.every(s => s === 429));
});

// CHALLENGE 1B
test('CHALLENGE 1B: Forged True-Client-IP cannot bypass rate limits', async () => {
  cache.flush('rl:ai');
  const endpoint = `${BASE_URL}/api/voice/turn`;
  const responses = [];
  for (let i = 0; i < 35; i++) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'True-Client-IP': `203.0.113.${i + 1}`
      },
      body: JSON.stringify({ user_input: 'fellowship deadlines' })
    });
    responses.push(res.status);
  }
  const rateLimited = responses.slice(30);
  assert.ok(rateLimited.every(s => s === 429));
});

// CHALLENGE 1C
test('CHALLENGE 1C: Prepending forged IPs in X-Forwarded-For behind trusted reverse proxy cannot bypass rate limits', async () => {
  cache.flush('rl:ai');
  const endpoint = `${BASE_URL}/api/voice/turn`;
  const proxyRealClientIp = '192.0.2.88';
  const responses = [];
  for (let i = 0; i < 35; i++) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': `10.99.${i}.1, ${proxyRealClientIp}`
      },
      body: JSON.stringify({ user_input: 'daad wise' })
    });
    responses.push(res.status);
  }
  const rateLimited = responses.slice(30);
  assert.ok(rateLimited.every(s => s === 429));
});

// CHALLENGE 1D
test('CHALLENGE 1D: Direct client sending forged X-Forwarded-For with rotated IP', async () => {
  cache.flush('rl:ai');
  const endpoint = `${BASE_URL}/api/voice/turn`;
  const responses = [];
  for (let i = 0; i < 35; i++) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': `185.220.101.${i + 1}`
      },
      body: JSON.stringify({ user_input: 'fellowship list' })
    });
    responses.push(res.status);
  }
  const rateLimited = responses.slice(30);
  assert.ok(rateLimited.every(s => s === 429), `Direct client forged X-Forwarded-For must CANNOT bypass rate limits; got: ${rateLimited.join(',')}`);
});

// CHALLENGE 1E
test('CHALLENGE 1E: Authenticated user rate limiting cannot be bypassed by IP header rotation', async () => {
  cache.flush('rl:ai');
  const endpoint = `${BASE_URL}/api/agents/mock-interview`;
  const responses = [];
  for (let i = 0; i < 35; i++) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userAToken}`,
        'X-Forwarded-For': `172.16.${i}.10`,
        'CF-Connecting-IP': `172.16.${i}.10`,
        'True-Client-IP': `172.16.${i}.10`
      },
      body: JSON.stringify({ turn_index: 1 })
    });
    responses.push(res.status);
  }
  const rateLimited = responses.slice(30);
  assert.ok(rateLimited.every(s => s === 429), `Authenticated user must be throttled by user ID regardless of IP rotation, got: ${rateLimited.join(',')}`);
});

// CHALLENGE 2: Password Hashing Concurrency & Event Loop Unblocking
test('CHALLENGE 2A: 50 concurrent password hash and verify calls execute with bounded latency without stalling event loop', async () => {
  const CONCURRENT_OPS = 50;
  const passwords = Array.from({ length: CONCURRENT_OPS }, (_, i) => `SecureTestPassword_${i}_!@#$`);
  let maxLoopDelayMs = 0;
  let heartbeatCount = 0;
  const heartbeatInterval = 5;
  let lastHeartbeat = performance.now();

  const timer = setInterval(() => {
    const now = performance.now();
    const delay = now - lastHeartbeat - heartbeatInterval;
    if (delay > maxLoopDelayMs) {
      maxLoopDelayMs = delay;
    }
    lastHeartbeat = now;
    heartbeatCount++;
  }, heartbeatInterval);

  const startTime = performance.now();
  const hashPromises = passwords.map(pwd => hashPassword(pwd));
  const hashes = await Promise.all(hashPromises);

  assert.strictEqual(hashes.length, CONCURRENT_OPS);
  hashes.forEach((h, idx) => {
    assert.ok(h.includes(':'), `Hash ${idx} must be properly formatted`);
    const [salt, key] = h.split(':');
    assert.strictEqual(salt.length, 32);
    assert.strictEqual(key.length, 128);
  });

  const verifyPromises = hashes.map((h, i) => {
    const isCorrect = (i % 2 === 0);
    const candidate = isCorrect ? passwords[i] : `WrongPassword_${i}`;
    return verifyPassword(candidate, h).then(res => ({ idx: i, expected: isCorrect, actual: res }));
  });

  const verifyResults = await Promise.all(verifyPromises);
  clearInterval(timer);

  verifyResults.forEach(({ idx, expected, actual }) => {
    assert.strictEqual(actual, expected);
  });

  assert.ok(heartbeatCount > 5);
  assert.ok(maxLoopDelayMs < 400);
});

test('CHALLENGE 2B: HTTP server responds immediately during heavy 50-operation password hashing burst', async () => {
  const pwd = 'HeavyBurstPassword2026!';
  let burstFinished = false;

  const burstPromise = Promise.all(
    Array.from({ length: 50 }, () => hashPassword(pwd))
  ).then(() => {
    burstFinished = true;
  });

  const pingStart = performance.now();
  const res = await fetch(`${BASE_URL}/api/health`);
  const pingDuration = performance.now() - pingStart;

  assert.strictEqual(res.status, 200);
  const healthData = await res.json();
  assert.strictEqual(healthData.status, 'operational');
  assert.ok(pingDuration < 500);

  await burstPromise;
  assert.strictEqual(burstFinished, true);
});

// CHALLENGE 3: IDOR
test('CHALLENGE 3A: User A can successfully access their own invoice', async () => {
  const res = await fetch(`${BASE_URL}/api/billing/invoice/${testOrderId}`, {
    headers: { 'Authorization': `Bearer ${userAToken}` }
  });
  assert.strictEqual(res.status, 200);
  const invoice = await res.json();
  assert.strictEqual(invoice.customer.userId, userAId);
  assert.strictEqual(invoice.status, 'PENDING');
});

test('CHALLENGE 3B: User B (valid JWT, different user ID) is strictly rejected with 403 Forbidden when accessing User A invoice', async () => {
  const res = await fetch(`${BASE_URL}/api/billing/invoice/${testOrderId}`, {
    headers: { 'Authorization': `Bearer ${userBToken}` }
  });
  assert.strictEqual(res.status, 403);
  const data = await res.json();
  assert.strictEqual(data.error, 'Access denied: unauthorized invoice retrieval');
});

test('CHALLENGE 3C: IDOR exploit with forged JWT token containing User A ID but signed with attacker key fails with 403', async () => {
  const forgedToken = jwt.sign(
    { id: userAId, email: 'fake@attacker.org', role: 'student' },
    'attacker_fake_secret_key_12345',
    { expiresIn: '1h' }
  );

  const res = await fetch(`${BASE_URL}/api/billing/invoice/${testOrderId}`, {
    headers: { 'Authorization': `Bearer ${forgedToken}` }
  });
  assert.strictEqual(res.status, 403);
  const data = await res.json();
  assert.strictEqual(data.error, 'Invalid or expired access token.');
});

test('CHALLENGE 3D: Administrator role is authorized to view invoice (RBAC sanity check)', async () => {
  const adminSecret = process.env.JWT_SECRET || 'researchintern_pro_production_secret_key_2026';
  const adminToken = jwt.sign(
    { id: 'admin_super_user_999', email: 'admin@anusandhan.ai', role: 'admin' },
    adminSecret,
    { expiresIn: '1h' }
  );

  const res = await fetch(`${BASE_URL}/api/billing/invoice/${testOrderId}`, {
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });
  assert.strictEqual(res.status, 200);
  const invoice = await res.json();
  assert.strictEqual(invoice.customer.userId, userAId);
});

// CHALLENGE 4: Webhook HMAC mutation
test('CHALLENGE 4: Webhook HMAC mutation/fuzzing produces zero 500 errors and zero crashes', async () => {
  const webhookUrl = `${BASE_URL}/api/billing/webhook/razorpay`;
  const validPayload = JSON.stringify({
    event: 'payment.captured',
    payload: { payment: { entity: { id: 'pay_test_123456', order_id: testOrderId, amount: 49900, currency: 'INR' } } }
  });

  const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_secret_key_rzp_99482';
  const validSig = crypto
    .createHmac('sha256', RAZORPAY_SECRET)
    .update(Buffer.from(validPayload, 'utf8'))
    .digest('hex');

  const fuzzCases = [
    { name: 'Missing signature header', sig: undefined, status: 400 },
    { name: 'Empty signature string', sig: '', status: 400 },
    { name: 'Truncated 1 char', sig: 'a', status: 400 },
    { name: 'Truncated 8 chars', sig: '01234567', status: 400 },
    { name: 'Truncated 32 chars', sig: validSig.slice(0, 32), status: 400 },
    { name: 'Truncated 63 chars (off-by-one under)', sig: validSig.slice(0, 63), status: 400 },
    { name: 'Lengthened 65 chars (off-by-one over)', sig: validSig + 'a', status: 400 },
    { name: 'Oversized 128 chars', sig: validSig.repeat(2), status: 400 },
    { name: 'Huge 5000-char signature string', sig: 'f'.repeat(5000), status: 400 },
    { name: 'Exact 64 chars, 1st character bit-flipped', sig: (validSig[0] === 'a' ? 'b' : 'a') + validSig.slice(1), status: 400 },
    { name: 'Exact 64 chars, last character bit-flipped', sig: validSig.slice(0, 63) + (validSig[63] === 'a' ? 'b' : 'a'), status: 400 },
    { name: 'Exact 64 chars, middle character bit-flipped', sig: validSig.slice(0, 31) + (validSig[31] === 'a' ? 'b' : 'a') + validSig.slice(32), status: 400 },
    { name: 'Exact 64 non-hex characters', sig: 'z'.repeat(64), status: 400 },
    { name: 'Exact 64 characters of zeroes', sig: '0'.repeat(64), status: 400 },
    { name: 'Null byte escape in signature', sig: 'abc%00def' + '0'.repeat(55), status: 400 },
    { name: 'SQL injection string in signature', sig: "' OR '1'='1' --", status: 400 },
    { name: 'Tab-spaced signature', sig: 'abc\tdef', status: 400 },
    { name: 'Special punctuation characters in signature', sig: '!@#$%^&*()_+~`|}{[]:;?><,./-', status: 400 }
  ];

  for (const tc of fuzzCases) {
    const headers = { 'Content-Type': 'application/json' };
    if (tc.sig !== undefined) {
      headers['x-razorpay-signature'] = tc.sig;
    }
    const res = await fetch(webhookUrl, { method: 'POST', headers, body: validPayload });
    assert.strictEqual(res.status, tc.status);
    const body = await res.json();
    assert.ok(body.error);
  }

  // Tampered payload with valid original signature
  const tamperedPayload = JSON.stringify({
    event: 'payment.captured',
    payload: { payment: { entity: { id: 'tampered_payment', amount: 1 } } }
  });
  const tamperedRes = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': validSig },
    body: tamperedPayload
  });
  assert.strictEqual(tamperedRes.status, 400);

  // Valid signature
  const validRes = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': validSig },
    body: validPayload
  });
  assert.strictEqual(validRes.status, 200);
  const validData = await validRes.json();
  assert.strictEqual(validData.verified, true);
});

// CHALLENGE 5: Strict 401 on protected routes
test('CHALLENGE 5: Strict 401 Unauthorized rejection on all protected routes', async () => {
  const protectedRoutes = [
    { method: 'GET', path: '/api/students/me' },
    { method: 'PUT', path: '/api/students/me', body: { university: 'IIT Delhi' } },
    { method: 'POST', path: '/api/outreach/draft', body: { professor_name: 'Dr. Rao' } },
    { method: 'POST', path: '/api/outreach/enqueue', body: { draft_id: 'draft_1' } },
    { method: 'GET', path: '/api/outreach' },
    { method: 'PUT', path: '/api/outreach/test_crm_id/status', body: { status: 'replied' } },
    { method: 'POST', path: '/api/ingest/refresh' },
    { method: 'POST', path: '/api/ingest/schedule', body: { intervalMinutes: 60 } },
    { method: 'POST', path: '/api/agents/paper-pitch', body: { paper: { title: 'Test Paper' } } },
    { method: 'POST', path: '/api/agents/mock-interview', body: { turn_index: 1 } },
    { method: 'POST', path: '/api/agents/cv-diagnostic', body: { cv_text: 'sample' } },
    { method: 'POST', path: '/api/agents/grant-radar', body: { professor: { name: 'Dr. Test' } } },
    { method: 'POST', path: '/api/billing/create-order', body: { planId: 'pro_researcher' } },
    { method: 'GET', path: `/api/billing/invoice/${testOrderId}` }
  ];

  for (const route of protectedRoutes) {
    const noAuthRes = await fetch(`${BASE_URL}${route.path}`, {
      method: route.method,
      headers: { 'Content-Type': 'application/json' },
      body: route.body ? JSON.stringify(route.body) : undefined
    });
    assert.strictEqual(noAuthRes.status, 401, `Unauthenticated ${route.method} ${route.path} must return 401, got ${noAuthRes.status}`);

    const emptyAuthRes = await fetch(`${BASE_URL}${route.path}`, {
      method: route.method,
      headers: { 'Content-Type': 'application/json', 'Authorization': '' },
      body: route.body ? JSON.stringify(route.body) : undefined
    });
    assert.strictEqual(emptyAuthRes.status, 401);

    const emptyBearerRes = await fetch(`${BASE_URL}${route.path}`, {
      method: route.method,
      headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' },
      body: route.body ? JSON.stringify(route.body) : undefined
    });
    assert.strictEqual(emptyBearerRes.status, 401);

    const tamperedJwtRes = await fetch(`${BASE_URL}${route.path}`, {
      method: route.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'
      },
      body: route.body ? JSON.stringify(route.body) : undefined
    });
    assert.strictEqual(tamperedJwtRes.status, 403);
  }
});
