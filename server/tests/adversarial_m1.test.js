/**
 * Empirical Adversarial & Stress Testing Suite - Milestone 1 Security & Authentication
 * Executed by Teamwork Challenger (critic, specialist)
 * 
 * Verifies 5 Critical Attack Vectors:
 * 1. Rate Limiting Bypass Resistance (Spoofed X-Forwarded-For, CF-Connecting-IP, True-Client-IP)
 * 2. Password Hashing Concurrency & Main Thread Event Loop Non-Blocking (50 concurrent async scrypt)
 * 3. IDOR Exploit Resistance (Unauthorized cross-user invoice access with valid tokens)
 * 4. Webhook HMAC Cryptographic Fuzzing & Mutation (Truncated, lengthened, non-hex, tampered payloads)
 * 5. Strict 401 Unauthorized Enforcement Across All Protected Routes
 */

process.env.NODE_ENV = 'test';
import test from 'node:test';
import assert from 'node:assert';
import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import { performance } from 'node:perf_hooks';
import app from '../server.js';
import { cache } from '../services/redisCache.js';
import { hashPassword, verifyPassword } from '../utils/password.js';

let server;
let BASE_URL = '';
let userAToken = '';
let userAId = '';
let userBToken = '';
let userBId = '';
let testOrderId = '';

test.before(async () => {
  // Start server on an ephemeral random port to prevent port 5000 conflicts
  await new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      BASE_URL = `http://127.0.0.1:${port}`;
      resolve();
    });
  });

  // Flush rate limiter cache for clean testing slate
  cache.flush('rl');

  // Register User A (Victim Scholar)
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

  // Register User B (Attacker / Adversary Scholar)
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

  // Create order for User A to produce an invoice under User A's ownership
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
  assert.ok(testOrderId, 'User A orderId must be generated');
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
});

// ============================================================================
// CHALLENGE 1: Rate Limiting Bypass Attempts (Spoofed IP Headers)
// ============================================================================
test('CHALLENGE 1A: Forged CF-Connecting-IP cannot bypass rate limits', async () => {
  cache.flush('rl:ai');
  const endpoint = `${BASE_URL}/api/voice/turn`;

  // aiLimiter limit is 30 requests per 60s
  const responses = [];
  for (let i = 0; i < 35; i++) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Attacker attempts to rotate CF-Connecting-IP on every call to trick rate limiter
        'CF-Connecting-IP': `198.51.100.${i + 1}`
      },
      body: JSON.stringify({ user_input: 'Tell me about fellowships' })
    });
    responses.push(res.status);
  }

  // The first 30 requests should succeed (200), and requests 31-35 must be blocked with 429
  const successful = responses.slice(0, 30);
  const rateLimited = responses.slice(30);

  assert.ok(successful.every(s => s === 200), `First 30 requests should succeed, got: ${successful.join(',')}`);
  assert.ok(rateLimited.every(s => s === 429), `Requests exceeding limit must return 429 despite rotated CF-Connecting-IP, got: ${rateLimited.join(',')}`);
});

test('CHALLENGE 1B: Forged True-Client-IP cannot bypass rate limits', async () => {
  cache.flush('rl:ai');
  const endpoint = `${BASE_URL}/api/voice/turn`;

  const responses = [];
  for (let i = 0; i < 35; i++) {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Attacker attempts to rotate True-Client-IP on every call
        'True-Client-IP': `203.0.113.${i + 1}`
      },
      body: JSON.stringify({ user_input: 'fellowship deadlines' })
    });
    responses.push(res.status);
  }

  const rateLimited = responses.slice(30);
  assert.ok(rateLimited.every(s => s === 429), `Requests exceeding limit must return 429 despite rotated True-Client-IP, got: ${rateLimited.join(',')}`);
});

test('CHALLENGE 1C: Prepending forged IPs in X-Forwarded-For behind trusted reverse proxy cannot bypass rate limits', async () => {
  cache.flush('rl:ai');
  const endpoint = `${BASE_URL}/api/voice/turn`;

  // Behind a trusted proxy, the proxy appends client IP to rightmost position.
  // Attacker prepends forged IPs: "spoofed.ip, 192.0.2.88"
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
  assert.ok(rateLimited.every(s => s === 429), `Prepending forged IPs in X-Forwarded-For must NOT bypass rate limiter; expected 429, got: ${rateLimited.join(',')}`);
});

test('CHALLENGE 1D: Direct client sending forged X-Forwarded-For with rotated IP', async () => {
  cache.flush('rl:ai');
  const endpoint = `${BASE_URL}/api/voice/turn`;

  // Attacker connects directly and provides a single spoofed X-Forwarded-For IP per request
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
  // We check whether the rate limiter throttles them (429) or lets them bypass (200)
  const isBypassed = responses.every(s => s === 200);
  if (isBypassed) {
    console.warn('[VULNERABILITY CONFIRMED] Direct client spoofing X-Forwarded-For completely bypassed rate limiting due to trust proxy: 1 without proxy IP validation!');
  }
  // The system prompt demands: "Send forged X-Forwarded-For, CF-Connecting-IP, True-Client-IP headers to verify they CANNOT bypass rate limits."
  assert.ok(rateLimited.every(s => s === 429), `Direct client forged X-Forwarded-For must CANNOT bypass rate limits; got: ${rateLimited.join(',')}`);
});

test('CHALLENGE 1E: Authenticated user rate limiting cannot be bypassed by IP header rotation', async () => {
  cache.flush('rl:ai');
  const endpoint = `${BASE_URL}/api/agents/mock-interview`;

  // Authenticated requests must use req.user.id as the identifier (usr:<id>), immune to IP spoofing
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
  // If rateLimited is all 200, it means the rate limiter failed to throttle the user by user ID!
  assert.ok(
    rateLimited.every(s => s === 429),
    `Authenticated user must be throttled by user ID regardless of IP rotation, got: ${rateLimited.join(',')}`
  );
});

// ============================================================================
// CHALLENGE 2: Password Hashing Concurrency & Event Loop Unblocking
// ============================================================================
test('CHALLENGE 2A: 50 concurrent password hash and verify calls execute with bounded latency without stalling event loop', async () => {
  const CONCURRENT_OPS = 50;
  const passwords = Array.from({ length: CONCURRENT_OPS }, (_, i) => `SecureTestPassword_${i}_!@#$`);

  // Event Loop Latency Monitor: Measures event loop tick delay during the concurrent burst
  let maxLoopDelayMs = 0;
  let heartbeatCount = 0;
  const heartbeatInterval = 5; // check every 5ms
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

  // Fire 50 concurrent hash operations
  const hashPromises = passwords.map(pwd => hashPassword(pwd));
  const hashes = await Promise.all(hashPromises);

  const hashDuration = performance.now() - startTime;

  assert.strictEqual(hashes.length, CONCURRENT_OPS);
  hashes.forEach((h, idx) => {
    assert.ok(h.includes(':'), `Hash ${idx} must be properly formatted`);
    const [salt, key] = h.split(':');
    assert.strictEqual(salt.length, 32, 'Salt length must be 32 hex chars');
    assert.strictEqual(key.length, 128, 'Key length must be 128 hex chars');
  });

  // Fire 50 concurrent verify operations (mix of correct and wrong passwords)
  const verifyStartTime = performance.now();
  const verifyPromises = hashes.map((h, i) => {
    const isCorrect = (i % 2 === 0);
    const candidate = isCorrect ? passwords[i] : `WrongPassword_${i}`;
    return verifyPassword(candidate, h).then(res => ({ idx: i, expected: isCorrect, actual: res }));
  });

  const verifyResults = await Promise.all(verifyPromises);
  const verifyDuration = performance.now() - verifyStartTime;

  clearInterval(timer);

  verifyResults.forEach(({ idx, expected, actual }) => {
    assert.strictEqual(actual, expected, `Verification for op ${idx} failed`);
  });

  // Verify event loop health
  assert.ok(heartbeatCount > 5, `Event loop must have ticked multiple times (ticked ${heartbeatCount} times)`);
  
  // In a blocked synchronous scrypt setup, maxLoopDelayMs would be several seconds (> 2000ms).
  // With async libuv worker threads, max tick delay remains bounded (< 300ms even under heavy load).
  assert.ok(
    maxLoopDelayMs < 400,
    `Event loop stall time must remain bounded under 400ms. Measured max delay: ${maxLoopDelayMs.toFixed(2)}ms`
  );
});

test('CHALLENGE 2B: HTTP server responds immediately during heavy 50-operation password hashing burst', async () => {
  const pwd = 'HeavyBurstPassword2026!';
  let burstFinished = false;

  // Start 50 background hash operations
  const burstPromise = Promise.all(
    Array.from({ length: 50 }, () => hashPassword(pwd))
  ).then(() => {
    burstFinished = true;
  });

  // While scrypt operations are in flight, ping the HTTP server health check
  const pingStart = performance.now();
  const res = await fetch(`${BASE_URL}/api/health`);
  const pingDuration = performance.now() - pingStart;

  assert.strictEqual(res.status, 200);
  const healthData = await res.json();
  assert.strictEqual(healthData.status, 'operational');

  // Verify HTTP latency is low and not blocked by the scrypt operations
  assert.ok(
    pingDuration < 500,
    `HTTP response time during scrypt burst must be under 500ms; took ${pingDuration.toFixed(2)}ms`
  );

  await burstPromise;
  assert.strictEqual(burstFinished, true);
});

// ============================================================================
// CHALLENGE 3: IDOR Exploit Tests (Cross-User Invoice Access Rejection)
// ============================================================================
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

// ============================================================================
// CHALLENGE 4: Webhook HMAC Cryptographic Mutation & Fuzzing
// ============================================================================
test('CHALLENGE 4: Webhook HMAC mutation/fuzzing produces zero 500 errors and zero crashes', async () => {
  const webhookUrl = `${BASE_URL}/api/billing/webhook/razorpay`;
  const validPayload = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_test_123456',
          order_id: testOrderId,
          amount: 49900,
          currency: 'INR'
        }
      }
    }
  });

  const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_secret_key_rzp_99482';
  const validSig = crypto
    .createHmac('sha256', RAZORPAY_SECRET)
    .update(Buffer.from(validPayload, 'utf8'))
    .digest('hex');

  // Exhaustive adversarial fuzzing test cases
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

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: validPayload
    });

    // Zero 500 Internal Server Errors permitted! Must reject safely with 400
    assert.strictEqual(
      res.status,
      tc.status,
      `Case '${tc.name}' failed: expected status ${tc.status}, got ${res.status}`
    );
    const body = await res.json();
    assert.ok(body.error, `Case '${tc.name}' must return error message in JSON`);
  }

  // Fuzz with tampered payload using a valid signature for original payload
  const tamperedPayload = JSON.stringify({
    event: 'payment.captured',
    payload: { payment: { entity: { id: 'tampered_payment', amount: 1 } } }
  });

  const tamperedRes = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': validSig
    },
    body: tamperedPayload
  });
  assert.strictEqual(tamperedRes.status, 400, 'Tampered payload with valid original signature must return 400');

  // Verify that legitimate pristine signature and payload succeeds with 200
  const validRes = await fetch(webhookUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': validSig
    },
    body: validPayload
  });
  assert.strictEqual(validRes.status, 200, 'Valid signature with untampered payload must succeed with 200');
  const validData = await validRes.json();
  assert.strictEqual(validData.verified, true);

  // Post-fuzzing server health check: Confirm process is alive and unaffected
  const healthRes = await fetch(`${BASE_URL}/api/health`);
  assert.strictEqual(healthRes.status, 200, 'Server must remain 100% operational after adversarial fuzzing');
});

// ============================================================================
// CHALLENGE 5: Unauthenticated Access Rejection on All Protected Routes
// ============================================================================
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
    // 1. Missing Authorization header -> Strict 401
    const noAuthRes = await fetch(`${BASE_URL}${route.path}`, {
      method: route.method,
      headers: { 'Content-Type': 'application/json' },
      body: route.body ? JSON.stringify(route.body) : undefined
    });
    assert.strictEqual(
      noAuthRes.status,
      401,
      `Unauthenticated ${route.method} ${route.path} must return 401, got ${noAuthRes.status}`
    );
    const noAuthBody = await noAuthRes.json();
    assert.strictEqual(noAuthBody.error, 'Access token required.');

    // 2. Empty Authorization header -> Strict 401
    const emptyAuthRes = await fetch(`${BASE_URL}${route.path}`, {
      method: route.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': ''
      },
      body: route.body ? JSON.stringify(route.body) : undefined
    });
    assert.strictEqual(
      emptyAuthRes.status,
      401,
      `Empty Authorization header on ${route.method} ${route.path} must return 401`
    );

    // 3. Bearer with empty token -> Strict 401
    const emptyBearerRes = await fetch(`${BASE_URL}${route.path}`, {
      method: route.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer '
      },
      body: route.body ? JSON.stringify(route.body) : undefined
    });
    assert.strictEqual(
      emptyBearerRes.status,
      401,
      `Empty Bearer token on ${route.method} ${route.path} must return 401`
    );

    // 4. Non-Bearer schema (e.g. Basic auth) -> Strict 401
    const basicAuthRes = await fetch(`${BASE_URL}${route.path}`, {
      method: route.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic dXNlcjpwYXNz'
      },
      body: route.body ? JSON.stringify(route.body) : undefined
    });
    // In authMiddleware.js: authHeader.split(' ')[1] yields 'dXNlcjpwYXNz', jwt.verify fails with 403 Invalid token
    assert.ok(
      [401, 403].includes(basicAuthRes.status),
      `Invalid auth scheme on ${route.method} ${route.path} must return 401/403, got ${basicAuthRes.status}`
    );

    // 5. Corrupted/tampered JWT -> Strict 403 Forbidden
    const tamperedJwtRes = await fetch(`${BASE_URL}${route.path}`, {
      method: route.method,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalid.signature'
      },
      body: route.body ? JSON.stringify(route.body) : undefined
    });
    assert.strictEqual(
      tamperedJwtRes.status,
      403,
      `Tampered JWT on ${route.method} ${route.path} must return 403 Forbidden`
    );
  }
});
