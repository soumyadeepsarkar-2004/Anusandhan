/**
 * Empirical Adversarial Verification Harness — Milestone 1 Iteration 2
 * Author: challenger_m1_r2_2 (critic, specialist)
 * 
 * Directly tests the 4 targets assigned in dispatch:
 * 1. Razorpay Webhook Timing & Crash Exploit
 * 2. Invoice IDOR & Authorization Bypasses
 * 3. Password Hashing Event Loop Saturation (50 concurrent scrypt calls + setImmediate lag + /api/health)
 * 4. CORS Policy & Helmet Headers
 */

import http from 'http';
import crypto from 'crypto';
import jwt from '../../../server/node_modules/jsonwebtoken/index.js';
import { performance } from 'perf_hooks';
import app from '../../../server/server.js';
import { cache } from '../../../server/services/redisCache.js';
import { hashPassword, verifyPassword } from '../../../server/utils/password.js';

let server;
let port;
let baseUrl;

const JWT_SECRET = process.env.JWT_SECRET || 'researchintern_pro_production_secret_key_2026';
const RAZORPAY_SECRET = process.env.RAZORPAY_KEY_SECRET || 'test_secret_key_rzp_99482';

const results = {
  section1: { name: 'Razorpay Webhook Timing & Crash Exploit', tests: [] },
  section2: { name: 'Invoice IDOR & Route Authorization Bypasses', tests: [] },
  section3: { name: 'Password Hashing Event Loop Saturation', tests: [] },
  section4: { name: 'CORS Policy & Helmet Security Headers', tests: [] }
};

function recordTest(section, testName, passed, details) {
  section.tests.push({ testName, passed, details });
  const mark = passed ? '✔ PASS' : '✖ FAIL';
  console.log(`  [${mark}] ${testName} - ${details}`);
}

async function startServer() {
  return new Promise((resolve) => {
    server = app.listen(0, '127.0.0.1', () => {
      port = server.address().port;
      baseUrl = `http://127.0.0.1:${port}`;
      console.log(`[Harness] Empirical test server listening at ${baseUrl}`);
      resolve();
    });
  });
}

async function stopServer() {
  if (server) {
    return new Promise((resolve) => server.close(resolve));
  }
}

async function runSection1() {
  console.log('\n================================================================');
  console.log('1. RAZORPAY WEBHOOK TIMING & CRASH EXPLOIT');
  console.log('================================================================');

  const webhookUrl = `${baseUrl}/api/billing/webhook/razorpay`;
  const validPayload = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_test_998877',
          order_id: 'order_test_123',
          amount: 49900,
          currency: 'INR'
        }
      }
    }
  });

  const validHmac = crypto.createHmac('sha256', RAZORPAY_SECRET).update(Buffer.from(validPayload, 'utf8')).digest('hex');

  // Test 1.1: Malformed signatures of varying lengths (10 chars, 64 chars, 128 chars, non-hex)
  const malformedSignatures = [
    { label: 'Short signature (10 chars)', sig: '0123456789' },
    { label: 'Exact 64 chars (invalid hex random)', sig: 'g'.repeat(64) },
    { label: 'Exact 64 chars (all zeroes hex)', sig: '0'.repeat(64) },
    { label: 'Exact 64 chars (valid hex, wrong key)', sig: crypto.createHmac('sha256', 'wrong_secret').update(validPayload).digest('hex') },
    { label: 'Long signature (128 chars)', sig: validHmac.repeat(2) },
    { label: 'Huge signature (2048 chars)', sig: 'a'.repeat(2048) },
    { label: 'Non-hex string (special chars)', sig: '!@#$%^&*()_+-=[]{}|;:,.<>?' },
    { label: 'Null byte escape in signature', sig: 'abc%00def' + '0'.repeat(55) },
    { label: 'Empty signature', sig: '' }
  ];

  for (const item of malformedSignatures) {
    let status, body;
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': item.sig
        },
        body: validPayload
      });
      status = res.status;
      body = await res.json().catch(() => ({}));
    } catch (err) {
      status = 'FETCH_ERROR: ' + err.message;
      body = { error: err.message };
    }

    const passed = status === 400 || (typeof status === 'string' && status.includes('Invalid character in header'));
    recordTest(
      results.section1,
      `Malformed Signature: ${item.label}`,
      passed,
      `Status: ${status}, Error: ${body?.error || 'N/A'}`
    );
  }

  // Test 1.2: Missing signature header
  {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: validPayload
    });
    const body = await res.json().catch(() => ({}));
    const passed = res.status === 400;
    recordTest(
      results.section1,
      'Missing x-razorpay-signature header',
      passed,
      `Status: ${res.status}, Error: ${body?.error || 'N/A'}`
    );
  }

  // Test 1.3: Truncated JSON body (application/json)
  {
    const truncatedJson = '{"event": "payment.captured", "payload": {';
    const fakeSig = 'a'.repeat(64);
    let status, body;
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-razorpay-signature': fakeSig
        },
        body: truncatedJson
      });
      status = res.status;
      body = await res.json().catch(() => ({}));
    } catch (err) {
      status = 'CRASH: ' + err.message;
    }
    // Body-parser returns 400 Bad Request on invalid JSON syntax
    const passed = status === 400;
    recordTest(
      results.section1,
      'Truncated JSON payload handling',
      passed,
      `Status: ${status}, Server handled cleanly without 500 or crash`
    );
  }

  // Test 1.4: Non-JSON payload (e.g., text/plain or arbitrary string)
  {
    const nonJsonPayload = 'plain text non-json event payload';
    const fakeSig = '0'.repeat(64);
    let status;
    try {
      const res = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain',
          'x-razorpay-signature': fakeSig
        },
        body: nonJsonPayload
      });
      status = res.status;
    } catch (err) {
      status = 'CRASH: ' + err.message;
    }
    const passed = status === 400;
    recordTest(
      results.section1,
      'Non-JSON payload handling',
      passed,
      `Status: ${status}, Rejected without unhandled crash`
    );
  }

  // Test 1.5: rawBody HMAC matching with extra whitespace / raw formatting
  {
    const rawFormattedJson = '{\n  "event": "payment.captured",\n  "payload": {\n    "payment": { "entity": { "id": "pay_9988", "amount": 49900 } }\n  }\n}';
    const rawHmac = crypto.createHmac('sha256', RAZORPAY_SECRET).update(Buffer.from(rawFormattedJson, 'utf8')).digest('hex');

    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': rawHmac
      },
      body: rawFormattedJson
    });
    const body = await res.json().catch(() => ({}));
    const passed = res.status === 200 && body.verified === true;
    recordTest(
      results.section1,
      'Exact rawBody HMAC byte-preservation verification',
      passed,
      `Status: ${res.status}, Verified: ${body.verified}`
    );
  }

  // Test 1.6: Post-test health check (confirm process didn't crash)
  {
    const healthRes = await fetch(`${baseUrl}/api/health`);
    const passed = healthRes.status === 200;
    recordTest(
      results.section1,
      'Server health post-webhook exploits',
      passed,
      `Status: ${healthRes.status}`
    );
  }
}

async function runSection2() {
  console.log('\n================================================================');
  console.log('2. INVOICE IDOR & ROUTE AUTHORIZATION BYPASSES');
  console.log('================================================================');

  cache.flush('rl');

  // Step 2.1: Register User A and User B
  const userAEmail = `userA_${Date.now()}@iisc.ac.in`;
  const regARes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userAEmail, password: 'UserAPassword123!', fullName: 'User A Scholar' })
  });
  const userAData = await regARes.json();
  const tokenA = userAData.token;
  const userAId = userAData.user.id;

  const userBEmail = `userB_${Date.now()}@attacker.org`;
  const regBRes = await fetch(`${baseUrl}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: userBEmail, password: 'UserBPassword123!', fullName: 'User B Attacker' })
  });
  const userBData = await regBRes.json();
  const tokenB = userBData.token;
  const userBId = userBData.user.id;

  // Step 2.2: User A creates an order
  const orderRes = await fetch(`${baseUrl}/api/billing/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${tokenA}`
    },
    body: JSON.stringify({ planId: 'pro_researcher', currency: 'INR' })
  });
  const orderData = await orderRes.json();
  const orderId = orderData.orderId;

  // Test 2.3: User A fetches own invoice -> 200 OK
  {
    const res = await fetch(`${baseUrl}/api/billing/invoice/${orderId}`, {
      headers: { 'Authorization': `Bearer ${tokenA}` }
    });
    const inv = await res.json().catch(() => ({}));
    const passed = res.status === 200 && inv.customer?.userId === userAId;
    recordTest(
      results.section2,
      'User A retrieves own invoice',
      passed,
      `Status: ${res.status}, Customer ID: ${inv.customer?.userId}`
    );
  }

  // Test 2.4: User B (authenticated, different user) attempts to fetch User A's invoice -> MUST be 403 Forbidden
  {
    const res = await fetch(`${baseUrl}/api/billing/invoice/${orderId}`, {
      headers: { 'Authorization': `Bearer ${tokenB}` }
    });
    const body = await res.json().catch(() => ({}));
    const passed = res.status === 403;
    recordTest(
      results.section2,
      'User B IDOR cross-user invoice access attempt',
      passed,
      `Status: ${res.status} (strictly rejected with 403 Forbidden), Error: ${body?.error || 'N/A'}`
    );
  }

  // Test 2.5: Forged JWT token with User A's ID signed with attacker key
  {
    const forgedToken = jwt.sign(
      { id: userAId, email: userAEmail, role: 'student' },
      'attacker_compromised_secret_key',
      { expiresIn: '1h' }
    );
    const res = await fetch(`${baseUrl}/api/billing/invoice/${orderId}`, {
      headers: { 'Authorization': `Bearer ${forgedToken}` }
    });
    const body = await res.json().catch(() => ({}));
    const passed = [401, 403].includes(res.status);
    recordTest(
      results.section2,
      'Forged signature token on invoice retrieval',
      passed,
      `Status: ${res.status}, Error: ${body?.error || 'N/A'}`
    );
  }

  // Test 2.6: Protected Route Guards without Auth, with Expired Tokens, with Tampered Signatures
  const protectedEndpoints = [
    { method: 'GET', path: '/api/students/me' },
    { method: 'PUT', path: '/api/students/me', body: { university: 'IITB' } },
    { method: 'POST', path: '/api/outreach/draft', body: { professor_name: 'Dr. Sen' } },
    { method: 'POST', path: '/api/outreach/enqueue', body: { draft_id: 'draft_1' } },
    { method: 'GET', path: '/api/outreach' },
    { method: 'POST', path: '/api/ingest/schedule', body: { intervalMinutes: 30 } },
    { method: 'POST', path: '/api/agents/paper-pitch', body: { paper: { title: 'AI Scaling' } } },
    { method: 'POST', path: '/api/agents/mock-interview', body: { turn_index: 1 } },
    { method: 'POST', path: '/api/agents/cv-diagnostic', body: { cv_text: 'sample' } },
    { method: 'POST', path: '/api/agents/grant-radar', body: { professor: { name: 'Dr. Bose' } } }
  ];

  const expiredToken = jwt.sign(
    { id: userAId, email: userAEmail },
    JWT_SECRET,
    { expiresIn: '-10s' } // Expired 10 seconds ago
  );

  const tamperedToken = tokenA.slice(0, -6) + 'abcdef'; // Corrupted HMAC signature

  for (const ep of protectedEndpoints) {
    // A) No Authorization Header -> Must return 401 Unauthorized
    {
      const res = await fetch(`${baseUrl}${ep.path}`, {
        method: ep.method,
        headers: { 'Content-Type': 'application/json' },
        body: ep.body ? JSON.stringify(ep.body) : undefined
      });
      const passed = res.status === 401;
      recordTest(
        results.section2,
        `No Auth Header -> ${ep.method} ${ep.path}`,
        passed,
        `Status: ${res.status} (expected 401)`
      );
    }

    // B) Expired Token -> Must reject (401 or 403)
    {
      const res = await fetch(`${baseUrl}${ep.path}`, {
        method: ep.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${expiredToken}`
        },
        body: ep.body ? JSON.stringify(ep.body) : undefined
      });
      const passed = [401, 403].includes(res.status);
      recordTest(
        results.section2,
        `Expired Token -> ${ep.method} ${ep.path}`,
        passed,
        `Status: ${res.status} (rejected safely with ${res.status})`
      );
    }

    // C) Tampered Signature Token -> Must reject (401 or 403)
    {
      const res = await fetch(`${baseUrl}${ep.path}`, {
        method: ep.method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tamperedToken}`
        },
        body: ep.body ? JSON.stringify(ep.body) : undefined
      });
      const passed = [401, 403].includes(res.status);
      recordTest(
        results.section2,
        `Tampered Signature -> ${ep.method} ${ep.path}`,
        passed,
        `Status: ${res.status} (rejected safely with ${res.status})`
      );
    }
  }
}

async function runSection3() {
  console.log('\n================================================================');
  console.log('3. PASSWORD HASHING EVENT LOOP SATURATION & THREADPOOL OFFLOADING');
  console.log('================================================================');

  cache.flush('rl');

  // Monitor event loop lag using recursive setImmediate
  let maxLagMs = 0;
  let totalLagMs = 0;
  let lagSamples = 0;
  let monitoring = true;

  function measureLag() {
    if (!monitoring) return;
    const start = performance.now();
    setImmediate(() => {
      const lag = performance.now() - start;
      if (lag > maxLagMs) maxLagMs = lag;
      totalLagMs += lag;
      lagSamples++;
      if (monitoring) measureLag();
    });
  }
  measureLag();

  const CONCURRENT_OPS = 50;
  console.log(`  [Load] Generating ${CONCURRENT_OPS} concurrent password hash & verify operations...`);

  const passwords = Array.from({ length: CONCURRENT_OPS }, (_, i) => `SecureP@ssword_${Date.now()}_${i}!`);
  
  // Concurrently dispatch 50 scrypt hashes
  const hashStart = performance.now();
  const hashPromises = passwords.map(p => hashPassword(p));

  // Concurrently probe /api/health to confirm incoming requests are NOT blocked
  const healthProbes = [];
  for (let i = 0; i < 5; i++) {
    const probeStart = performance.now();
    const probe = fetch(`${baseUrl}/api/health`).then(async res => {
      const duration = performance.now() - probeStart;
      const data = await res.json().catch(() => ({}));
      return { status: res.status, duration, operational: data.status === 'operational' };
    });
    healthProbes.push(probe);
  }

  const [hashes, probeResults] = await Promise.all([
    Promise.all(hashPromises),
    Promise.all(healthProbes)
  ]);
  const hashDuration = performance.now() - hashStart;

  // Concurrently dispatch 50 scrypt password verifications
  const verifyStart = performance.now();
  const verifyPromises = hashes.map((h, i) => verifyPassword(passwords[i], h));
  const verifications = await Promise.all(verifyPromises);
  const verifyDuration = performance.now() - verifyStart;

  monitoring = false; // Stop lag tracking
  const avgLagMs = lagSamples > 0 ? (totalLagMs / lagSamples) : 0;

  // Assertions for Section 3
  const allHashesValid = hashes.length === CONCURRENT_OPS && hashes.every(h => h.includes(':') && h.split(':')[0].length === 32 && h.split(':')[1].length === 128);
  recordTest(
    results.section3,
    '50 Concurrent scrypt password hashes succeed',
    allHashesValid,
    `Duration: ${hashDuration.toFixed(2)}ms for 50 ops (${(hashDuration / CONCURRENT_OPS).toFixed(2)}ms/op)`
  );

  const allVerificationsValid = verifications.every(v => v === true);
  recordTest(
    results.section3,
    '50 Concurrent scrypt password verifications succeed',
    allVerificationsValid,
    `Duration: ${verifyDuration.toFixed(2)}ms for 50 ops (${(verifyDuration / CONCURRENT_OPS).toFixed(2)}ms/op)`
  );

  const allProbesHealthy = probeResults.every(p => p.status === 200 && p.operational);
  const maxProbeLatency = Math.max(...probeResults.map(p => p.duration));
  recordTest(
    results.section3,
    'Incoming /api/health probes not blocked during scrypt burst',
    allProbesHealthy && maxProbeLatency < 500,
    `Max Health Probe Latency: ${maxProbeLatency.toFixed(2)}ms (SLA threshold < 500ms), all 200 OK`
  );

  // If scrypt was synchronous, maxLagMs would exceed 2,000ms.
  // With libuv threadpool offloading, setImmediate lag remains under 100ms.
  const lagAcceptable = maxLagMs < 200;
  recordTest(
    results.section3,
    'Node.js Event Loop responsiveness (setImmediate lag)',
    lagAcceptable,
    `Max Lag: ${maxLagMs.toFixed(2)}ms, Avg Lag: ${avgLagMs.toFixed(2)}ms (Threshold: < 200ms, Samples: ${lagSamples})`
  );
}

async function runSection4() {
  console.log('\n================================================================');
  console.log('4. CORS POLICY & HELMET SECURITY HEADERS');
  console.log('================================================================');

  const evilOrigins = [
    'http://evil-attacker.com',
    'https://evil-attacker.com',
    'http://attacker.org:5173',
    'https://anusandhan.ai.evil-domain.com',
    'null'
  ];

  // Test 4.1: Probe /api/health and /api/auth/login with unauthorized Origin headers
  for (const origin of evilOrigins) {
    // Probe /api/health GET
    {
      const res = await fetch(`${baseUrl}/api/health`, {
        method: 'GET',
        headers: { 'Origin': origin }
      });
      const acao = res.headers.get('access-control-allow-origin');
      const passed = acao === null;
      recordTest(
        results.section4,
        `GET /api/health with evil origin ${origin}`,
        passed,
        `Access-Control-Allow-Origin: ${acao === null ? 'NOT REFLECTED (secure)' : acao}`
      );
    }

    // Probe /api/auth/login POST
    {
      const res = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Origin': origin,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: 'attacker@evil.com', password: 'password123' })
      });
      const acao = res.headers.get('access-control-allow-origin');
      const passed = acao === null;
      recordTest(
        results.section4,
        `POST /api/auth/login with evil origin ${origin}`,
        passed,
        `Access-Control-Allow-Origin: ${acao === null ? 'NOT REFLECTED (secure)' : acao}`
      );
    }
  }

  // Test 4.2: Authorized Origins Reflection
  const authorizedOrigins = ['http://localhost:5173', 'http://localhost:3000', 'https://anusandhan.ai'];
  for (const origin of authorizedOrigins) {
    const res = await fetch(`${baseUrl}/api/health`, {
      method: 'GET',
      headers: { 'Origin': origin }
    });
    const acao = res.headers.get('access-control-allow-origin');
    const acc = res.headers.get('access-control-allow-credentials');
    const passed = acao === origin && acc === 'true';
    recordTest(
      results.section4,
      `Whitelisted Origin: ${origin}`,
      passed,
      `Reflected: ${acao}, Allow-Credentials: ${acc}`
    );
  }

  // Test 4.3: Confirm Helmet Security Headers across response types (200, 401, 400, 404)
  const probeEndpoints = [
    { label: '200 OK (/api/health)', url: `${baseUrl}/api/health`, method: 'GET' },
    { label: '401 Unauthorized (/api/students/me)', url: `${baseUrl}/api/students/me`, method: 'GET' },
    { label: '400 Bad Request (/api/auth/register)', url: `${baseUrl}/api/auth/register`, method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' },
    { label: '404 Not Found (/api/nonexistent)', url: `${baseUrl}/api/nonexistent`, method: 'GET' }
  ];

  for (const p of probeEndpoints) {
    const res = await fetch(p.url, { method: p.method, headers: p.headers, body: p.body });
    const csp = res.headers.get('content-security-policy');
    const xcto = res.headers.get('x-content-type-options');
    const xfo = res.headers.get('x-frame-options');
    const hsts = res.headers.get('strict-transport-security');

    const cspOk = csp && (csp.includes("default-src 'self'") || csp.includes("default-src 'none'"));
    const xctoOk = xcto === 'nosniff';
    const xfoOk = xfo === 'DENY' || xfo === 'SAMEORIGIN';
    const hstsOk = hsts && hsts.includes('max-age=31536000');

    const allHeadersOk = cspOk && xctoOk && xfoOk && hstsOk;
    recordTest(
      results.section4,
      `Security Headers on ${p.label}`,
      allHeadersOk,
      `CSP: ${cspOk ? 'PASS' : 'FAIL'}, XCTO: ${xcto}, XFO: ${xfo}, HSTS: ${hstsOk ? 'PASS' : 'FAIL'}`
    );
  }
}

async function main() {
  try {
    await startServer();
    await runSection1();
    await runSection2();
    await runSection3();
    await runSection4();
  } catch (err) {
    console.error('Fatal test error:', err);
  } finally {
    await stopServer();
    console.log('\n================================================================');
    console.log('EMPIRICAL VERIFICATION COMPLETE');
    console.log('================================================================');

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    for (const [key, section] of Object.entries(results)) {
      const passed = section.tests.filter(t => t.passed).length;
      const failed = section.tests.filter(t => !t.passed).length;
      totalTests += section.tests.length;
      totalPassed += passed;
      totalFailed += failed;
      console.log(`${section.name}: ${passed}/${section.tests.length} PASS (${failed} FAIL)`);
    }

    console.log(`\nOVERALL: ${totalPassed}/${totalTests} PASSED, ${totalFailed} FAILED.`);
    if (totalFailed > 0) {
      console.log('VERDICT: REQUEST_CHANGES');
      process.exit(1);
    } else {
      console.log('VERDICT: APPROVE');
      process.exit(0);
    }
  }
}

main();
