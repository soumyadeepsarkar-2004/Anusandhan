/**
 * Challenger M1 R3 Independent Adversarial Verification Harness
 * Tests all defects identified in Milestone 1 Iteration 2:
 * 1. Rate Limiting Anti-Spoofing & Multi-Tenant Isolation
 * 2. Institutional Verification Idempotency & Concurrency Race Condition
 * 3. Secrets Hygiene & Fail-Fast Verification
 */
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const serverDir = path.resolve(process.cwd(), 'server');
const { default: jwt } = await import(pathToFileURL(path.join(serverDir, 'node_modules', 'jsonwebtoken', 'index.js')).href);

const BASE_URL = process.env.TARGET_URL || 'http://127.0.0.1:5000';

console.log('='.repeat(80));
console.log('  CHALLENGER M1 R3: INDEPENDENT ADVERSARIAL VERIFICATION HARNESS');
console.log('  Target Base URL:', BASE_URL);
console.log('='.repeat(80));

async function runAdversarialSuite() {
  let passed = 0;
  let failed = 0;
  const failureDetails = [];

  function recordPass(testName) {
    passed++;
    console.log(`[PASS] ${testName}`);
  }

  function recordFail(testName, err) {
    failed++;
    console.error(`[FAIL] ${testName}:`, err?.message || err);
    failureDetails.push({ testName, error: err?.message || String(err) });
  }

  // =========================================================================
  // Challenge 1: Rate Limiting & Anti-Spoofing
  // =========================================================================
  console.log('\n--- Challenge 1: Rate Limiting & Anti-Spoofing ---');

  // Test 1.1: X-Forwarded-For rotation cannot bypass rate limit (target: /api/voice/turn, limit: 30 req/min)
  try {
    const statuses = [];
    for (let i = 0; i < 35; i++) {
      const res = await fetch(`${BASE_URL}/api/voice/turn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': `203.0.113.${i + 1}, 10.0.0.1`
        },
        body: JSON.stringify({ user_input: `adversarial spoof test xff ${i}` })
      });
      statuses.push(res.status);
    }
    const has429 = statuses.some(s => s === 429);
    assert.ok(has429, `Server must trigger HTTP 429 despite rotating X-Forwarded-For. Statuses: ${statuses.slice(28).join(', ')}`);
    recordPass('1.1 Direct client cannot bypass rate limit via X-Forwarded-For rotation');
  } catch (err) {
    recordFail('1.1 Direct client cannot bypass rate limit via X-Forwarded-For rotation', err);
  }

  // Test 1.2: X-Real-IP rotation cannot bypass rate limit
  try {
    // Wait for voice turn limiter or hit with different X-Real-IP
    const statuses = [];
    for (let i = 0; i < 35; i++) {
      const res = await fetch(`${BASE_URL}/api/voice/turn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Real-IP': `198.51.100.${i + 1}`
        },
        body: JSON.stringify({ user_input: `adversarial spoof test x-real-ip ${i}` })
      });
      statuses.push(res.status);
    }
    const has429 = statuses.some(s => s === 429);
    assert.ok(has429, `Server must trigger HTTP 429 despite rotating X-Real-IP. Statuses: ${statuses.slice(28).join(', ')}`);
    recordPass('1.2 Direct client cannot bypass rate limit via X-Real-IP rotation');
  } catch (err) {
    recordFail('1.2 Direct client cannot bypass rate limit via X-Real-IP rotation', err);
  }

  // Test 1.3: Multi-tenant quota isolation on same physical IP
  try {
    const timestamp = Date.now();
    const emailA = `tenant.a.${timestamp}@iisc.ac.in`;
    const regARes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailA, password: 'Password123!', fullName: 'Tenant A', university: 'IISc' })
    });
    assert.strictEqual(regARes.status, 201, `Tenant A registration failed: ${regARes.status}`);
    const tokenA = (await regARes.json()).token;

    const emailB = `tenant.b.${timestamp}@iisc.ac.in`;
    const regBRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailB, password: 'Password123!', fullName: 'Tenant B', university: 'IISc' })
    });
    assert.strictEqual(regBRes.status, 201, `Tenant B registration failed: ${regBRes.status}`);
    const tokenB = (await regBRes.json()).token;

    // Tenant A exhausts their AI quota on /api/agents/mock-interview (limit 30)
    const responsesA = [];
    for (let i = 0; i < 33; i++) {
      const res = await fetch(`${BASE_URL}/api/agents/mock-interview`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${tokenA}`
        },
        body: JSON.stringify({ turn_index: 1 })
      });
      responsesA.push(res.status);
    }
    const aThrottled = responsesA.slice(30).some(s => s === 429);
    assert.ok(aThrottled, `Tenant A must be throttled with HTTP 429. Got: ${responsesA.slice(28).join(', ')}`);

    // Tenant B from the same IP must NOT be throttled
    const resB = await fetch(`${BASE_URL}/api/agents/mock-interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenB}`
      },
      body: JSON.stringify({ turn_index: 1 })
    });
    assert.strictEqual(resB.status, 200, `Tenant B should succeed with 200 OK on same IP. Got: ${resB.status}`);

    recordPass('1.3 Multi-tenant quota isolation: Tenant A is throttled while Tenant B succeeds on same IP');
  } catch (err) {
    recordFail('1.3 Multi-tenant quota isolation: Tenant A is throttled while Tenant B succeeds on same IP', err);
  }

  // =========================================================================
  // Challenge 2: Institutional Verification Idempotency & Concurrency Race
  // =========================================================================
  console.log('\n--- Challenge 2: Institutional Verification Idempotency & Concurrency Race ---');

  // Test 2.1: Sequential Replay Rejection
  try {
    const timestamp = Date.now();
    const emailReplay = `replay.user.${timestamp}@iisc.ac.in`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailReplay, password: 'Password123!', fullName: 'Replay Tester', university: 'IISc' })
    });
    assert.strictEqual(regRes.status, 201);
    const tokenReplay = (await regRes.json()).token;

    // Check initial credits
    const initialMe = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${tokenReplay}` }
    });
    const initialData = await initialMe.json();
    assert.strictEqual(initialData.user.creditsRemaining, 10, 'Initial credits must be 10');
    assert.strictEqual(initialData.user.isInstitutionalVerified, false, 'Initial verified must be false');

    // First attempt: Must succeed with 200 OK and +10 bonus
    const firstVerify = await fetch(`${BASE_URL}/api/auth/verify-institutional-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenReplay}`
      },
      body: JSON.stringify({ institutionalEmail: 'scholar.verified@iisc.ac.in' })
    });
    assert.strictEqual(firstVerify.status, 200, `First verification attempt must succeed with 200. Got: ${firstVerify.status}`);
    const firstVerifyData = await firstVerify.json();
    assert.strictEqual(firstVerifyData.verified, true);
    assert.strictEqual(firstVerifyData.bonusCreditsAwarded, 10);

    // Verify credits became 20
    const postFirstMe = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${tokenReplay}` }
    });
    const postFirstData = await postFirstMe.json();
    assert.strictEqual(postFirstData.user.creditsRemaining, 20, 'Credits must be 20 after first verification');
    assert.strictEqual(postFirstData.user.isInstitutionalVerified, true);

    // Second attempt: Sequential replay must be rejected with 400 Bad Request
    const secondVerify = await fetch(`${BASE_URL}/api/auth/verify-institutional-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenReplay}`
      },
      body: JSON.stringify({ institutionalEmail: 'scholar.verified@iisc.ac.in' })
    });
    assert.strictEqual(secondVerify.status, 400, `Second verification must be rejected with 400 Bad Request. Got: ${secondVerify.status}`);
    const secondVerifyData = await secondVerify.json();
    assert.strictEqual(secondVerifyData.verified, true);
    assert.strictEqual(secondVerifyData.error, 'Institutional affiliation has already been verified for this account.');

    // Verify credits remained exactly 20
    const postSecondMe = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${tokenReplay}` }
    });
    const postSecondData = await postSecondMe.json();
    assert.strictEqual(postSecondData.user.creditsRemaining, 20, 'Credits must NOT increase on replay attempt');

    recordPass('2.1 Sequential replay rejected with HTTP 400 and exact error message, credits unchanged at 20');
  } catch (err) {
    recordFail('2.1 Sequential replay rejected with HTTP 400 and exact error message', err);
  }

  // Test 2.2: Concurrent Burst of 5 Requests on Fresh User (Double-Spending Race Condition)
  try {
    const timestamp = Date.now();
    const emailBurst = `burst.user.${timestamp}@iisc.ac.in`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailBurst, password: 'Password123!', fullName: 'Burst Tester', university: 'IISc' })
    });
    assert.strictEqual(regRes.status, 201);
    const tokenBurst = (await regRes.json()).token;

    // Fire 5 concurrent requests simultaneously
    const results = await Promise.all(
      Array.from({ length: 5 }, async () => {
        const res = await fetch(`${BASE_URL}/api/auth/verify-institutional-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenBurst}`
          },
          body: JSON.stringify({ institutionalEmail: 'burst.scholar@iisc.ac.in' })
        });
        const body = await res.json();
        return { status: res.status, body };
      })
    );

    const successCount = results.filter(r => r.status === 200).length;
    const rejectedCount = results.filter(r => r.status === 400).length;

    console.log(`Concurrent 5-request burst results: ${successCount}x 200 OK, ${rejectedCount}x 400 Bad Request`);
    assert.strictEqual(successCount, 1, `Exactly 1 concurrent request must succeed with 200 OK. Got: ${successCount}`);
    assert.strictEqual(rejectedCount, 4, `Exactly 4 concurrent requests must be rejected with 400 Bad Request. Got: ${rejectedCount}`);

    // Check final credit balance
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${tokenBurst}` }
    });
    const meData = await meRes.json();
    assert.strictEqual(
      meData.user.creditsRemaining,
      20,
      `Double-spending detected: final credits must be exactly 20, observed: ${meData.user.creditsRemaining}`
    );

    recordPass('2.2 Concurrent burst of 5 requests awards exactly +10 credits once (final credits = 20, 1x200, 4x400)');
  } catch (err) {
    recordFail('2.2 Concurrent burst of 5 requests awards exactly +10 credits once', err);
  }

  // =========================================================================
  // Challenge 3: Hardcoded Fallback Secret Eradication
  // =========================================================================
  console.log('\n--- Challenge 3: Hardcoded Fallback Secret Eradication ---');
  try {
    const serverJsContent = fs.readFileSync(path.join(serverDir, 'server.js'), 'utf8');
    const rateLimiterContent = fs.readFileSync(path.join(serverDir, 'middleware', 'rateLimiter.js'), 'utf8');

    const forbiddenString = 'researchintern_pro_production_secret_key_2026';
    assert.ok(!serverJsContent.includes(forbiddenString), 'server.js must NOT contain hardcoded secret fallback string');
    assert.ok(!rateLimiterContent.includes(forbiddenString), 'rateLimiter.js must NOT contain hardcoded secret fallback string');

    // Verify fail-fast logic in server.js
    assert.ok(serverJsContent.includes("FATAL: JWT_SECRET environment variable is required in production"), 'server.js must fail-fast in production');

    recordPass('3.1 Hardcoded JWT secret string completely eradicated from server.js and rateLimiter.js with fail-fast enforcement');
  } catch (err) {
    recordFail('3.1 Hardcoded JWT secret string completely eradicated', err);
  }

  // =========================================================================
  // Summary
  // =========================================================================
  console.log('\n' + '='.repeat(80));
  console.log(`  ADVERSARIAL HARNESS RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('='.repeat(80));

  if (failureDetails.length > 0) {
    console.error('\nFAILURE DETAILS:');
    failureDetails.forEach(f => console.error(`- ${f.testName}: ${f.error}`));
  }

  return { passed, failed, failureDetails };
}

runAdversarialSuite().then(({ passed, failed }) => {
  process.exit(failed > 0 ? 1 : 0);
}).catch(err => {
  console.error('Fatal runner crash:', err);
  process.exit(1);
});
