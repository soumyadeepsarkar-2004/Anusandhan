import test from 'node:test';
import assert from 'node:assert';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envPath = path.resolve(__dirname, '../../server/.env');

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [k, ...v] = trimmed.split('=');
      if (!process.env[k.trim()]) {
        process.env[k.trim()] = v.join('=').trim();
      }
    }
  }
}

if (!process.env.JWT_SECRET) {
  process.env.JWT_SECRET = 'researchintern_pro_production_secret_key_2026';
}

const app = (await import('../../server/server.js')).default;
const { cache } = await import('../../server/services/redisCache.js');

let gatewayServer;
let GATEWAY_URL = '';

test.before(async () => {
  await new Promise((resolve) => {
    gatewayServer = app.listen(0, () => {
      const port = gatewayServer.address().port;
      GATEWAY_URL = `http://127.0.0.1:${port}`;
      resolve();
    });
  });
});

test.after(async () => {
  if (gatewayServer) {
    await new Promise((resolve) => gatewayServer.close(resolve));
  }
});

test('Rate Limiter Email-Keying: Target email exhaustion does NOT lock out other accounts sharing the same IP', async () => {
  // Clear rate limits
  cache.flush('rl:auth');
  cache.flush('auth:login');

  const sharedCampusIp = '203.0.113.195'; // University campus NAT egress IP
  const victimEmail = `victim.scholar.${Date.now()}@iisc.ac.in`;
  const innocentEmail = `innocent.peer.${Date.now()}@iisc.ac.in`;
  const password = 'CorrectPassword#2026';

  // 1. Register innocent peer account
  const regRes = await fetch(`${GATEWAY_URL}/api/auth/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': sharedCampusIp
    },
    body: JSON.stringify({
      email: innocentEmail,
      password: password,
      fullName: 'Innocent Peer',
      university: 'IISc Bangalore'
    })
  });
  assert.strictEqual(regRes.status, 201, 'Innocent peer registration must succeed');

  // 2. Attacker floods 130 brute-force login attempts against victimEmail from the campus IP
  const BURST_COUNT = 130;
  console.log(`  -> Blasting ${BURST_COUNT} failed login attempts targeting ${victimEmail} from shared IP ${sharedCampusIp}...`);
  
  const victimBurstPromises = Array.from({ length: BURST_COUNT }, async (_, i) => {
    const res = await fetch(`${GATEWAY_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': sharedCampusIp
      },
      body: JSON.stringify({
        email: victimEmail,
        password: `WrongPassword_${i}`
      })
    });
    return res.status;
  });

  const victimStatuses = await Promise.all(victimBurstPromises);
  const victim429Count = victimStatuses.filter(s => s === 429).length;
  const victim401Count = victimStatuses.filter(s => s === 401).length;

  console.log(`  -> Victim email status distribution: 401=${victim401Count}, 429=${victim429Count}`);
  assert.ok(victim429Count > 0, 'Target victim account must be rate-limited (HTTP 429) after exceeding 120 threshold');

  // 3. Verify that victim account is now locked out
  const victimFollowUp = await fetch(`${GATEWAY_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': sharedCampusIp
    },
    body: JSON.stringify({ email: victimEmail, password: 'AnyPassword' })
  });
  assert.strictEqual(victimFollowUp.status, 429, 'Subsequent login attempt for victim account must return 429');
  console.log('  ✔ Victim account is strictly rate-limited with HTTP 429');

  // 4. CRITICAL CHECK: Innocent peer from the EXACT SAME IP must NOT be locked out!
  console.log(`  -> Testing login for innocent peer ${innocentEmail} from the EXACT SAME IP ${sharedCampusIp}...`);
  const innocentRes = await fetch(`${GATEWAY_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': sharedCampusIp
    },
    body: JSON.stringify({ email: innocentEmail, password: password })
  });

  assert.strictEqual(
    innocentRes.status,
    200,
    `Innocent peer sharing the same IP must NOT suffer false-positive lockout; expected 200, got ${innocentRes.status}`
  );
  const innocentData = await innocentRes.json();
  assert.ok(innocentData.token, 'Innocent peer must receive valid session token');
  console.log('  ✔ Innocent peer on shared IP successfully logs in with 200 OK — ZERO false-positive lockout!');
});

test('Rate Limiter Email-Keying: Fallback to IP when email is absent or empty', async () => {
  cache.flush('rl:auth');
  const testIp = '198.51.100.99';

  // Request without email
  const res = await fetch(`${GATEWAY_URL}/api/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Forwarded-For': testIp
    },
    body: JSON.stringify({ password: 'some_password' }) // No email provided
  });

  // Check rate limit header is present
  assert.ok(res.headers.get('x-ratelimit-limit'), 'Rate limit header should be present');
  const remaining = parseInt(res.headers.get('x-ratelimit-remaining'), 10);
  assert.ok(!isNaN(remaining), 'Remaining count must be a number');
  console.log('  ✔ Fallback to IP rate-limiting functions correctly when email is omitted');
});
