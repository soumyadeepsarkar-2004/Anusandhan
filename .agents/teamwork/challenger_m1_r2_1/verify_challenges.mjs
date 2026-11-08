/**
 * Empirical Challenger Verification Harness - Milestone 1 Iteration 2
 * Tests Challenges 1, 2, and 3 adversarially.
 */
import assert from 'node:assert';
import { pathToFileURL } from 'node:url';
import path from 'node:path';

// Import modules from server
const serverDir = path.resolve(process.cwd(), 'server');
const { default: jwt } = await import(pathToFileURL(path.join(serverDir, 'node_modules', 'jsonwebtoken', 'index.js')).href);
const { User } = await import(pathToFileURL(path.join(serverDir, 'models', 'User.js')).href);


const BASE_URL = process.env.TARGET_URL || 'http://127.0.0.1:5000';
const JWT_SECRET = process.env.JWT_SECRET || 'researchintern_pro_production_secret_key_2026';

console.log('==============================================================================');
console.log('  CHALLENGER M1 R2: EMPIRICAL ADVERSARIAL VERIFICATION');
console.log('  Target Gateway:', BASE_URL);
console.log('==============================================================================');

async function runTests() {
  let passed = 0;
  let failed = 0;
  const findings = [];

  function recordPass(name) {
    passed++;
    console.log(`[PASS] ${name}`);
  }

  function recordFail(name, error) {
    failed++;
    console.error(`[FAIL] ${name}:`, error);
    findings.push({ name, error: error.message || String(error) });
  }

  // --------------------------------------------------------------------------
  // CHALLENGE 1: IP Spoofing & Rate Limiter Ordering
  // --------------------------------------------------------------------------
  console.log('\n--- Running Challenge 1: IP Spoofing & Rate Limiter Ordering ---');

  // Test 1.1: Direct IP Spoofing via X-Forwarded-For rotation
  try {
    // Wait for voice limiter window or hit voice turn 35 times with different X-Forwarded-For
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
    assert.ok(has429, `Server must rate limit despite rotating X-Forwarded-For headers. Got responses: ${responses.slice(28).join(',')}`);
    recordPass('1.1 Direct client cannot bypass rate limit by rotating X-Forwarded-For');
  } catch (err) {
    recordFail('1.1 Direct client cannot bypass rate limit by rotating X-Forwarded-For', err);
  }

  // Test 1.2: Direct IP Spoofing via X-Real-IP rotation
  try {
    const responses = [];
    for (let i = 0; i < 35; i++) {
      const res = await fetch(`${BASE_URL}/api/voice/turn`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Real-IP': `203.0.113.${i + 1}`
        },
        body: JSON.stringify({ user_input: 'test spoof x-real-ip' })
      });
      responses.push(res.status);
    }
    const has429 = responses.some(s => s === 429);
    assert.ok(has429, `Server must rate limit despite rotating X-Real-IP headers. Got: ${responses.slice(28).join(',')}`);
    recordPass('1.2 Direct client cannot bypass rate limit by rotating X-Real-IP');
  } catch (err) {
    recordFail('1.2 Direct client cannot bypass rate limit by rotating X-Real-IP', err);
  }

  // Test 1.3: Invalid Bearer Token Fallback to IP Limiting Without Crash
  try {
    // When IP rate limiter is active or endpoint is called with invalid token,
    // it must not crash (no 500) and must fall back safely to IP rate limiting or route auth.
    const resPublicInvalid = await fetch(`${BASE_URL}/api/voice/turn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer invalid_garbage_token_12345'
      },
      body: JSON.stringify({ user_input: 'invalid token test' })
    });
    // On public voice turn, invalid token falls back to IP rate limiting (either 200 or 429 if IP throttled)
    assert.ok([200, 429].includes(resPublicInvalid.status), `Invalid token must return 200 or 429, not crash. Got status: ${resPublicInvalid.status}`);
    
    // On protected route with distinct limiter (students/me uses apiLimiter, max 600 req/min):
    const resProtectedInvalid = await fetch(`${BASE_URL}/api/students/me`, {
      headers: {
        'Authorization': 'Bearer invalid_garbage_token_12345'
      }
    });
    // Since IP is not throttled on apiLimiter, it passes rate limiter via IP fallback, and authenticateToken returns 403 Forbidden
    assert.strictEqual(resProtectedInvalid.status, 403, `Invalid token on unthrottled protected route must be rejected with 403 Forbidden without crash. Got: ${resProtectedInvalid.status}`);
    recordPass('1.3 Invalid Bearer token safely falls back to IP rate limiting without crashing (403 on protected route, 0 crashes)');
  } catch (err) {
    recordFail('1.3 Invalid Bearer token safely falls back to IP rate limiting without crashing', err);
  }

  // Test 1.4: Expired Bearer Token Fallback Without Crash
  try {
    const expiredToken = jwt.sign(
      { id: 'usr_expired_1', email: 'expired@iisc.ac.in', fullName: 'Expired User' },
      JWT_SECRET,
      { expiresIn: -10 } // Expired 10s ago
    );
    const resPublicExpired = await fetch(`${BASE_URL}/api/voice/turn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${expiredToken}`
      },
      body: JSON.stringify({ user_input: 'expired token test' })
    });
    assert.ok([200, 429].includes(resPublicExpired.status), `Expired token must return 200 or 429, not crash. Got status: ${resPublicExpired.status}`);

    const resProtectedExpired = await fetch(`${BASE_URL}/api/students/me`, {
      headers: {
        'Authorization': `Bearer ${expiredToken}`
      }
    });
    assert.strictEqual(resProtectedExpired.status, 403, `Expired token on unthrottled protected route must return 403 without crash. Got: ${resProtectedExpired.status}`);
    recordPass('1.4 Expired Bearer token safely falls back to IP rate limiting without crashing (403 on protected route, 0 crashes)');
  } catch (err) {
    recordFail('1.4 Expired Bearer token safely falls back to IP rate limiting without crashing', err);
  }

  // Test 1.5: Multi-User Quota Isolation Across Two Different Valid Users
  try {
    const emailA = `multiuser.a.${Date.now()}@iisc.ac.in`;
    const regARes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailA, password: 'Password123!', fullName: 'User A', university: 'IISc' })
    });
    assert.strictEqual(regARes.status, 201);
    const dataA = await regARes.json();
    const tokenA = dataA.token;

    const emailB = `multiuser.b.${Date.now()}@iisc.ac.in`;
    const regBRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: emailB, password: 'Password123!', fullName: 'User B', university: 'IISc' })
    });
    assert.strictEqual(regBRes.status, 201);
    const dataB = await regBRes.json();
    const tokenB = dataB.token;

    // Both users connect from the same IP (this test client).
    // User A consumes their AI quota on /api/agents/mock-interview (limit: 30 req/min)
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
    const aLimited = responsesA.slice(30).some(s => s === 429);
    assert.ok(aLimited, `User A should be rate limited after 30 requests. Got: ${responsesA.slice(28).join(',')}`);

    // Now User B makes a request from the exact same client IP.
    // User B should NOT be rate limited because quota is tracked by usr:userId!
    const resB = await fetch(`${BASE_URL}/api/agents/mock-interview`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${tokenB}`
      },
      body: JSON.stringify({ turn_index: 1 })
    });
    assert.strictEqual(resB.status, 200, `User B must NOT be blocked by User A's rate limit exhaustion. Got: ${resB.status}`);

    recordPass('1.5 Multi-user quota isolation: User B succeeds while User A is throttled on same IP');
  } catch (err) {
    recordFail('1.5 Multi-user quota isolation: User B succeeds while User A is throttled on same IP', err);
  }

  // --------------------------------------------------------------------------
  // CHALLENGE 2: Institutional Verification MongoDB & Memory State
  // --------------------------------------------------------------------------
  console.log('\n--- Running Challenge 2: Institutional Verification MongoDB & Memory State ---');

  // Test 2.1: Mongoose Schema Model Integrity
  try {
    const userSchema = User.schema;
    assert.ok(userSchema.paths.isInstitutionalVerified, 'User schema must have isInstitutionalVerified path');
    assert.strictEqual(userSchema.paths.isInstitutionalVerified.instance, 'Boolean');
    assert.strictEqual(userSchema.paths.isInstitutionalVerified.defaultValue, false);

    assert.ok(userSchema.paths.institutionalEmail, 'User schema must have institutionalEmail path');
    assert.strictEqual(userSchema.paths.institutionalEmail.instance, 'String');

    // Instantiate User document to verify no schema truncation occurs
    const doc = new User({
      email: 'schema.test@iisc.ac.in',
      passwordHash: 'dummyhash',
      fullName: 'Schema Test',
      isInstitutionalVerified: true,
      institutionalEmail: 'scholar@iisc.ac.in'
    });
    const obj = doc.toObject();
    assert.strictEqual(obj.isInstitutionalVerified, true, 'isInstitutionalVerified must be preserved in document');
    assert.strictEqual(obj.institutionalEmail, 'scholar@iisc.ac.in', 'institutionalEmail must be preserved in document');

    recordPass('2.1 Mongoose model schema correctly defines and retains isInstitutionalVerified and institutionalEmail without truncation');
  } catch (err) {
    recordFail('2.1 Mongoose model schema correctly defines and retains isInstitutionalVerified and institutionalEmail', err);
  }

  // Test 2.2: Institutional Verification Endpoint Flow & Credit Increment
  let testUserToken = '';
  let testUserEmail = '';
  try {
    testUserEmail = `inst.verify.${Date.now()}@iisc.ac.in`;
    const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testUserEmail,
        password: 'Password123!',
        fullName: 'Institutional Scholar',
        university: 'IISc'
      })
    });
    assert.strictEqual(regRes.status, 201);
    const regData = await regRes.json();
    testUserToken = regData.token;
    assert.strictEqual(regData.user.creditsRemaining, 10, 'Initial credits must be 10');
    assert.strictEqual(regData.user.isInstitutionalVerified, false, 'Initial isInstitutionalVerified must be false');

    // Call verify-institutional-email
    const verifyRes = await fetch(`${BASE_URL}/api/auth/verify-institutional-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUserToken}`
      },
      body: JSON.stringify({ institutionalEmail: 'scholar.lead@iisc.ac.in' })
    });
    assert.strictEqual(verifyRes.status, 200);
    const verifyData = await verifyRes.json();
    assert.strictEqual(verifyData.verified, true);
    assert.strictEqual(verifyData.bonusCreditsAwarded, 10);

    // Verify student profile shows updated credits and verification status via /api/auth/me
    const meRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${testUserToken}` }
    });
    assert.strictEqual(meRes.status, 200);
    const meData = await meRes.json();
    console.log('[DEBUG] meData after verify 1:', meData.user);
    assert.strictEqual(meData.user.creditsRemaining, 20, 'Credits must be incremented by 10 (10 -> 20)');
    assert.strictEqual(meData.user.isInstitutionalVerified, true, 'isInstitutionalVerified must be true');
    assert.strictEqual(meData.user.institutionalEmail, 'scholar.lead@iisc.ac.in', 'institutionalEmail must match');

    recordPass('2.2 Institutional verification endpoint accurately updates profile, persists fields, and increments credits by 10');
  } catch (err) {
    recordFail('2.2 Institutional verification endpoint updates profile and increments credits', err);
  }

  // Test 2.3: Race Condition / Replay Double-Spending Challenge
  // What happens if an already verified user calls verify-institutional-email again, or 5 concurrent calls are made?
  try {
    console.log('Testing double-spending and concurrent replay on verify-institutional-email...');
    // Sequential call 2
    const secondCallRes = await fetch(`${BASE_URL}/api/auth/verify-institutional-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${testUserToken}`
      },
      body: JSON.stringify({ institutionalEmail: 'scholar.lead@iisc.ac.in' })
    });
    const secondCallData = await secondCallRes.json();

    const meRes2 = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${testUserToken}` }
    });
    const meData2 = await meRes2.json();
    console.log(`After second verification call: status=${secondCallRes.status}, resp=${JSON.stringify(secondCallData)}, creditsRemaining=${meData2.user.creditsRemaining}`);

    // Concurrent burst of 5 calls on a fresh user
    const raceUserEmail = `race.user.${Date.now()}@iisc.ac.in`;
    const raceRegRes = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: raceUserEmail,
        password: 'Password123!',
        fullName: 'Race Tester',
        university: 'IISc'
      })
    });
    const raceToken = (await raceRegRes.json()).token;

    // Fire 5 concurrent requests
    const concurrentCalls = await Promise.all(
      Array.from({ length: 5 }, () =>
        fetch(`${BASE_URL}/api/auth/verify-institutional-email`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${raceToken}`
          },
          body: JSON.stringify({ institutionalEmail: 'race.scholar@iisc.ac.in' })
        }).then(r => r.json())
      )
    );

    const raceMeRes = await fetch(`${BASE_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${raceToken}` }
    });
    const raceMeData = await raceMeRes.json();
    console.log(`After 5 concurrent verification calls on fresh user: creditsRemaining=${raceMeData.user.creditsRemaining}`);

    // If creditsRemaining > 20, double-spending occurred!
    if (raceMeData.user.creditsRemaining > 20) {
      console.warn(`[DEFECT DETECTED] Race condition / replay double-spending: creditsRemaining is ${raceMeData.user.creditsRemaining} instead of 20!`);
      throw new Error(`Double-spending vulnerability: 5 concurrent verification calls resulted in ${raceMeData.user.creditsRemaining} credits (expected exactly 20 credits, single +10 award).`);
    }

    recordPass('2.3 Institutional verification does not allow double-spending or race condition credit inflation');
  } catch (err) {
    recordFail('2.3 Institutional verification does not allow double-spending or race condition credit inflation', err);
  }

  // --------------------------------------------------------------------------
  // Summary
  // --------------------------------------------------------------------------
  console.log('\n==============================================================================');
  console.log(`  VERIFICATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('==============================================================================');
  if (findings.length > 0) {
    console.log('\nFINDINGS:');
    findings.forEach(f => console.log(`- ${f.name}: ${f.error}`));
  }

  return { passed, failed, findings };
}

runTests().then(({ passed, failed }) => {
  process.exit(failed > 0 ? 1 : 0);
}).catch(err => {
  console.error('Fatal runner error:', err);
  process.exit(1);
});
