/**
 * Empirical Challenger Verification Harness - Milestone 1 Iteration 3
 * Tests Challenges 1, 2, and 3 adversarially with empirical evidence.
 */
import assert from 'node:assert';
import net from 'node:net';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import fs from 'node:fs';

const serverDir = path.resolve(process.cwd(), 'server');
const { default: jwt } = await import(pathToFileURL(path.join(serverDir, 'node_modules', 'jsonwebtoken', 'index.js')).href);
const { User } = await import(pathToFileURL(path.join(serverDir, 'models', 'User.js')).href);

const BASE_URL = process.env.TARGET_URL || 'http://127.0.0.1:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'researchintern_pro_production_secret_key_2026';

console.log('==============================================================================');
console.log('  CHALLENGER M1 R3: EMPIRICAL ADVERSARIAL VERIFICATION HARNESS');
console.log('  Target Gateway:', BASE_URL);
console.log('==============================================================================');

async function runAdversarialChallenges() {
  let passed = 0;
  let failed = 0;
  const findings = [];

  function recordPass(name, details = '') {
    passed++;
    console.log(`[PASS] ${name}${details ? ` -> ${details}` : ''}`);
  }

  function recordFail(name, error) {
    failed++;
    console.error(`[FAIL] ${name}:`, error.message || error);
    findings.push({ name, error: error.message || String(error) });
  }

  // ==========================================================================
  // CHALLENGE 1: Rate Limiting, IP Anti-Spoofing & Multi-Tenant Quota Isolation
  // ==========================================================================
  console.log('\n--- CHALLENGE 1: Rate Limiting & Anti-Spoofing Verification ---');

  // 1.1 Direct socket client rotating X-Forwarded-For headers
  try {
    const responses = [];
    for (let i = 0; i < 35; i++) {
      const res = await fetch(`${BASE_URL}/api/voice/turn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Forwarded-For': `198.51.100.${i + 1}`
        },
        body: JSON.stringify({ user_input: 'test spoof x-forwarded-for' })
      });
      responses.push(res.status);
    }
    const has429 = responses.some(s => s === 429);
    assert.ok(has429, `Server must enforce rate limits (HTTP 429) despite rotated X-Forwarded-For headers. Got: ${responses.slice(25).join(',')}`);
    const first429Index = responses.indexOf(429);
    recordPass('1.1 Direct client cannot bypass rate limit by rotating X-Forwarded-For', `Throttled at request #${first429Index + 1} (HTTP 429)`);
  } catch (err) {
    recordFail('1.1 Direct client cannot bypass rate limit by rotating X-Forwarded-For', err);
  }

  // 1.2 Direct socket client rotating X-Real-IP, CF-Connecting-IP, True-Client-IP
  try {
    const responses = [];
    for (let i = 0; i < 35; i++) {
      const res = await fetch(`${BASE_URL}/api/voice/turn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Real-IP': `203.0.113.${i + 1}`,
          'CF-Connecting-IP': `198.18.0.${i + 1}`,
          'True-Client-IP': `192.0.2.${i + 1}`
        },
        body: JSON.stringify({ user_input: 'test spoof multiple proxy headers' })
      });
      responses.push(res.status);
    }
    const has429 = responses.some(s => s === 429);
    assert.ok(has429, `Server must enforce rate limits despite rotated proxy headers. Got: ${responses.slice(25).join(',')}`);
    recordPass('1.2 Direct client cannot bypass rate limit by rotating X-Real-IP / CF-Connecting-IP / True-Client-IP', `HTTP 429 observed`);
  } catch (err) {
    recordFail('1.2 Direct client cannot bypass rate limit by rotating X-Real-IP / CF-Connecting-IP / True-Client-IP', err);
  }

  // 1.3 Raw TCP socket sending arbitrary headers directly
  try {
    const rawResponses = [];
    const targetUrl = new URL(BASE_URL);
    const host = targetUrl.hostname;
    const port = parseInt(targetUrl.port || '5000', 10);

    for (let i = 0; i < 5; i++) {
      const resp = await new Promise((resolve, reject) => {
        const socket = net.createConnection({ host, port }, () => {
          const bodyStr = JSON.stringify({ user_input: 'raw socket test' });
          const reqStr = `POST /api/voice/turn HTTP/1.1\r\n` +
            `Host: ${host}:${port}\r\n` +
            `Content-Type: application/json\r\n` +
            `X-Forwarded-For: 1.2.3.${i + 100}\r\n` +
            `Content-Length: ${Buffer.byteLength(bodyStr)}\r\n` +
            `Connection: close\r\n\r\n` +
            bodyStr;
          socket.write(reqStr);
        });

        let data = '';
        socket.on('data', chunk => { data += chunk.toString(); });
        socket.on('end', () => {
          const statusMatch = data.match(/^HTTP\/1\.[01] (\d{3})/);
          resolve(statusMatch ? parseInt(statusMatch[1], 10) : 0);
        });
        socket.on('error', reject);
      });
      rawResponses.push(resp);
    }
    // Because IP limit is already exhausted by tests 1.1/1.2 on this IP, raw TCP socket MUST receive 429!
    assert.ok(rawResponses.every(s => s === 429), `Raw TCP sockets from throttled IP must receive 429. Got: ${rawResponses.join(',')}`);
    recordPass('1.3 Raw TCP socket connection verified: physical socket address correctly identified and throttled', `Statuses: ${rawResponses.join(',')}`);
  } catch (err) {
    recordFail('1.3 Raw TCP socket connection verified', err);
  }

  // 1.4 Multi-Tenant Quota Isolation (User A throttled vs User B on same IP)
  try {
    const emailA = `multi.tenant.a.${Date.now()}@iisc.ac.in`;
    const regARes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailA, password: 'Password123!', fullName: 'Tenant A', university: 'IISc' })
    });
    assert.strictEqual(regARes.status, 201);
    const tokenA = (await regARes.json()).token;

    const emailB = `multi.tenant.b.${Date.now()}@iisc.ac.in`;
    const regBRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailB, password: 'Password123!', fullName: 'Tenant B', university: 'IISc' })
    });
    assert.strictEqual(regBRes.status, 201);
    const tokenB = (await regBRes.json()).token;

    // User A consumes their AI quota on /api/agents/mock-interview (limit 30 req/min)
    const responsesA = [];
    for (let i = 0; i < 32; i++) {
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
    assert.ok(aThrottled, `User A must be rate limited after 30 requests. Got: ${responsesA.slice(28).join(',')}`);

    // User B calls from the identical client IP with their own token
    const resB = await fetch(`${BASE_URL}/api/agents/mock-interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenB}`
      },
      body: JSON.stringify({ turn_index: 1 })
    });
    assert.strictEqual(resB.status, 200, `User B must NOT be throttled by User A's exhaustion on the same IP. Got: ${resB.status}`);
    recordPass('1.4 Multi-tenant quota isolation verified: User A throttled while User B succeeds on same IP', `User A status=429, User B status=${resB.status}`);
  } catch (err) {
    recordFail('1.4 Multi-tenant quota isolation verified', err);
  }

  // 1.5 Token Edge Cases (Malformed, Invalid, Expired)
  try {
    const expiredToken = jwt.sign(
      { id: 'usr_exp', email: 'exp@iisc.ac.in' },
      JWT_SECRET,
      { expiresIn: -10 }
    );
    const resExp = await fetch(`${BASE_URL}/api/students/me`, {
      headers: { 'Authorization': `Bearer ${expiredToken}` }
    });
    assert.strictEqual(resExp.status, 403, `Expired token on protected route must return 403 Forbidden. Got: ${resExp.status}`);

    const resGarbage = await fetch(`${BASE_URL}/api/students/me`, {
      headers: { 'Authorization': 'Bearer NOT_A_VALID_JWT_TOKEN_123' }
    });
    assert.strictEqual(resGarbage.status, 403, `Malformed token on protected route must return 403 Forbidden. Got: ${resGarbage.status}`);
    recordPass('1.5 Token edge cases handled securely without crash (expired -> 403, malformed -> 403)');
  } catch (err) {
    recordFail('1.5 Token edge cases handled securely', err);
  }

  // ==========================================================================
  // CHALLENGE 2: Institutional Verification Idempotency & Concurrency Races
  // ==========================================================================
  console.log('\n--- CHALLENGE 2: Institutional Verification Idempotency & Race Conditions ---');

  // 2.1 Sequential Replay Rejection
  try {
    const replayUserEmail = `replay.scholar.${Date.now()}@iisc.ac.in`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: replayUserEmail,
        password: 'Password123!',
        fullName: 'Replay Scholar',
        university: 'IISc'
      })
    });
    assert.strictEqual(regRes.status, 201);
    const regData = await regRes.json();
    const token = regData.token;
    assert.strictEqual(regData.user.creditsRemaining, 10, 'Initial credits must be 10');
    assert.strictEqual(regData.user.isInstitutionalVerified, false);

    // First Verification Attempt (Must Succeed)
    const verify1 = await fetch(`${BASE_URL}/api/auth/verify-institutional-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ institutionalEmail: 'scholar.lead@iisc.ac.in' })
    });
    assert.strictEqual(verify1.status, 200, `First verification must succeed with 200. Got: ${verify1.status}`);
    const v1Data = await verify1.json();
    assert.strictEqual(v1Data.verified, true);
    assert.strictEqual(v1Data.bonusCreditsAwarded, 10);

    // Check Profile after verify 1
    const me1 = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const me1Data = await me1.json();
    assert.strictEqual(me1Data.user.creditsRemaining, 20, 'Credits must be 20 after first verification');
    assert.strictEqual(me1Data.user.isInstitutionalVerified, true);

    // Second Verification Attempt (Sequential Replay Attack - Must Be Rejected)
    const verify2 = await fetch(`${BASE_URL}/api/auth/verify-institutional-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ institutionalEmail: 'scholar.lead@iisc.ac.in' })
    });
    assert.strictEqual(verify2.status, 400, `Second verification must be rejected with HTTP 400. Got: ${verify2.status}`);
    const v2Data = await verify2.json();
    assert.strictEqual(v2Data.verified, true);
    assert.strictEqual(v2Data.error, 'Institutional affiliation has already been verified for this account.');

    // Check Profile after replay attempt
    const me2 = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const me2Data = await me2.json();
    assert.strictEqual(me2Data.user.creditsRemaining, 20, 'Credits must remain exactly 20 after replay attempt (no double-spend)');
    recordPass('2.1 Sequential replay rejected with HTTP 400 and idempotent error contract', `creditsRemaining stayed at 20`);
  } catch (err) {
    recordFail('2.1 Sequential replay rejected with HTTP 400', err);
  }

  // 2.2 5-Way Concurrent Race Condition on Fresh Account
  try {
    const race5Email = `race5.${Date.now()}@iisc.ac.in`;
    const race5Reg = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: race5Email,
        password: 'Password123!',
        fullName: 'Race5 Scholar',
        university: 'IISc'
      })
    });
    assert.strictEqual(race5Reg.status, 201);
    const race5Token = (await race5Reg.json()).token;

    // Fire 5 concurrent requests simultaneously
    const promises5 = Array.from({ length: 5 }, () =>
      fetch(`${BASE_URL}/api/auth/verify-institutional-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${race5Token}`
        },
        body: JSON.stringify({ institutionalEmail: 'scholar5@iisc.ac.in' })
      }).then(async res => ({ status: res.status, body: await res.json() }))
    );

    const results5 = await Promise.all(promises5);
    const successCount = results5.filter(r => r.status === 200).length;
    const rejectCount = results5.filter(r => r.status === 400).length;

    assert.strictEqual(successCount, 1, `Exactly 1 request out of 5 concurrent must succeed. Got ${successCount} successes`);
    assert.strictEqual(rejectCount, 4, `Exactly 4 requests out of 5 concurrent must be rejected with HTTP 400. Got ${rejectCount}`);

    // Verify credits in profile
    const race5Me = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${race5Token}` }
    });
    const race5MeData = await race5Me.json();
    assert.strictEqual(race5MeData.user.creditsRemaining, 20, `Final credit balance must be exactly 20 (NOT 30, 40, 50, 60). Observed: ${race5MeData.user.creditsRemaining}`);
    recordPass('2.2 5-way concurrent race condition safely handled: 1 success (200), 4 rejections (400), credits = 20');
  } catch (err) {
    recordFail('2.2 5-way concurrent race condition safely handled', err);
  }

  // 2.3 10-Way Concurrent Race Condition Stress Test
  try {
    const race10Email = `race10.${Date.now()}@iisc.ac.in`;
    const race10Reg = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: race10Email,
        password: 'Password123!',
        fullName: 'Race10 Scholar',
        university: 'IISc'
      })
    });
    assert.strictEqual(race10Reg.status, 201);
    const race10Token = (await race10Reg.json()).token;

    // Fire 10 concurrent requests simultaneously
    const promises10 = Array.from({ length: 10 }, () =>
      fetch(`${BASE_URL}/api/auth/verify-institutional-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${race10Token}`
        },
        body: JSON.stringify({ institutionalEmail: 'scholar10@iisc.ac.in' })
      }).then(async res => ({ status: res.status, body: await res.json() }))
    );

    const results10 = await Promise.all(promises10);
    const successCount = results10.filter(r => r.status === 200).length;
    const rejectCount = results10.filter(r => r.status === 400).length;

    assert.strictEqual(successCount, 1, `Exactly 1 request out of 10 concurrent must succeed. Got ${successCount}`);
    assert.strictEqual(rejectCount, 9, `Exactly 9 requests out of 10 concurrent must be rejected. Got ${rejectCount}`);

    const race10Me = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${race10Token}` }
    });
    const race10MeData = await race10Me.json();
    assert.strictEqual(race10MeData.user.creditsRemaining, 20, `Final credit balance must be exactly 20. Observed: ${race10MeData.user.creditsRemaining}`);
    recordPass('2.3 10-way concurrent stress race condition verified: 1 success, 9 rejections, credits = 20');
  } catch (err) {
    recordFail('2.3 10-way concurrent stress race condition verified', err);
  }

  // ==========================================================================
  // CHALLENGE 3: Secrets & Proxy Configuration Audit
  // ==========================================================================
  console.log('\n--- CHALLENGE 3: Codebase Static Secrets & Proxy Configuration Audit ---');

  try {
    const serverJsContent = fs.readFileSync(path.join(serverDir, 'server.js'), 'utf8');
    const rateLimiterContent = fs.readFileSync(path.join(serverDir, 'middleware', 'rateLimiter.js'), 'utf8');

    const hardcodedSecret = 'researchintern_pro_production_secret_key_2026';
    assert.ok(!serverJsContent.includes(`'${hardcodedSecret}'`), 'server.js must not contain hardcoded secret fallback');
    assert.ok(!rateLimiterContent.includes(`'${hardcodedSecret}'`), 'rateLimiter.js must not contain hardcoded secret fallback');

    // Check proxy configuration default
    assert.ok(serverJsContent.includes("app.set('trust proxy', false)"), 'server.js must default trust proxy to false');

    recordPass('3.1 Zero occurrences of fallback secret in server.js and rateLimiter.js; trust proxy defaults strictly to false');
  } catch (err) {
    recordFail('3.1 Codebase secrets and proxy audit', err);
  }

  // ==========================================================================
  // Summary
  // ==========================================================================
  console.log('\n==============================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==============================================================================');
  if (findings.length > 0) {
    console.log('\nFINDINGS:');
    findings.forEach(f => console.log(`- ${f.name}: ${f.error}`));
  }

  return { passed, failed, findings };
}

runAdversarialChallenges().then(({ passed, failed }) => {
  process.exit(failed > 0 ? 1 : 0);
}).catch(err => {
  console.error('Fatal test runner error:', err);
  process.exit(1);
});
