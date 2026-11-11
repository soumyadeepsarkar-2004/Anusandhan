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

let gatewayServer;
let GATEWAY_URL = '';
let unhandledRejections = [];
let uncaughtExceptions = [];

process.on('unhandledRejection', (reason) => {
  unhandledRejections.push(reason);
});

process.on('uncaughtException', (err) => {
  uncaughtExceptions.push(err);
});

test.before(async () => {
  await new Promise((resolve) => {
    gatewayServer = app.listen(0, () => {
      const port = gatewayServer.address().port;
      GATEWAY_URL = `http://127.0.0.1:${port}`;
      console.log(`[Auth Stress Challenge] Gateway listening on ${GATEWAY_URL}`);
      resolve();
    });
  });
});

test.after(async () => {
  if (gatewayServer) {
    await new Promise((resolve) => gatewayServer.close(resolve));
  }
  try {
    const mongoose = await import('mongoose');
    if (mongoose.default && mongoose.default.connection) {
      await mongoose.default.disconnect();
    }
  } catch {}
  // Guarantee clean process termination: mongoose + ingestion scheduler keep the event loop alive
  setTimeout(() => {
    process.exit(0);
  }, 300);
});

function calculatePercentiles(latencies) {
  if (!latencies.length) return { p50: 0, p95: 0, p99: 0, avg: 0 };
  const sorted = [...latencies].sort((a, b) => a - b);
  const p50 = sorted[Math.floor(sorted.length * 0.50)];
  const p95 = sorted[Math.floor(sorted.length * 0.95)];
  const p99 = sorted[Math.floor(sorted.length * 0.99)];
  const avg = Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length);
  return { p50, p95, p99, avg };
}

test('High-Concurrency Authentication Stress: 120 Concurrent Registrations Burst', async () => {
  const CONCURRENT_COUNT = 120;
  console.log(`\n  [Stress] Launching burst of ${CONCURRENT_COUNT} concurrent student registrations...`);
  
  const startHeap = process.memoryUsage().heapUsed;
  const accounts = Array.from({ length: CONCURRENT_COUNT }, (_, i) => ({
    email: `stress.student.${Date.now()}.${i}.${Math.random().toString(36).substring(7)}@iisc.ac.in`,
    password: `SecurePass#2026_${i}`,
    fullName: `Scholar Candidate ${i}`,
    university: 'Indian Institute of Science, Bangalore',
    fieldOfStudy: 'Artificial Intelligence & Robotics',
    degreeLevel: 'Master of Science',
    cgpa: (8.0 + (i % 20) / 10).toFixed(1)
  }));

  const startTime = Date.now();
  const registrationPromises = accounts.map(async (acc, index) => {
    const reqStart = Date.now();
    const clientIp = `10.200.${Math.floor(index / 250)}.${index % 250}`;
    const res = await fetch(`${GATEWAY_URL}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': clientIp
      },
      body: JSON.stringify(acc)
    });

    const elapsed = Date.now() - reqStart;
    const body = await res.json();
    return { status: res.status, body, elapsed, account: acc };
  });

  const results = await Promise.all(registrationPromises);
  const totalDuration = Date.now() - startTime;
  const endHeap = process.memoryUsage().heapUsed;

  const latencies = results.map(r => r.elapsed);
  const percentiles = calculatePercentiles(latencies);
  const successCount = results.filter(r => r.status === 201).length;
  const failureCount = results.filter(r => r.status !== 201).length;

  console.log(`  [Stress Metrics] Registrations completed in ${totalDuration}ms`);
  console.log(`  [Stress Metrics] Success: ${successCount}/${CONCURRENT_COUNT}, Failures: ${failureCount}`);
  console.log(`  [Stress Metrics] Latencies - Avg: ${percentiles.avg}ms, p50: ${percentiles.p50}ms, p95: ${percentiles.p95}ms, p99: ${percentiles.p99}ms`);
  console.log(`  [Stress Metrics] Heap Delta: ${Math.round((endHeap - startHeap) / (1024 * 1024))} MB`);

  assert.strictEqual(successCount, CONCURRENT_COUNT, `All ${CONCURRENT_COUNT} concurrent registrations must succeed`);
  assert.strictEqual(failureCount, 0, 'Zero registrations should fail under burst');
  assert.strictEqual(unhandledRejections.length, 0, 'Must have zero unhandled promise rejections');
  assert.strictEqual(uncaughtExceptions.length, 0, 'Must have zero uncaught exceptions');

  // Verify all responses returned valid tokens and user structures
  for (const r of results) {
    assert.ok(r.body.token, 'Token must be present in registration response');
    assert.strictEqual(r.body.success, true);
    assert.ok(r.body.user);
    assert.strictEqual(r.body.user.passwordHash, undefined, 'passwordHash must never be exposed');
  }

  // -----------------------------------------------------------
  // Phase 2: High-Concurrency Login Burst for all 120 accounts
  // -----------------------------------------------------------
  console.log(`\n  [Stress] Launching burst of ${CONCURRENT_COUNT} concurrent student logins...`);
  const loginStart = Date.now();
  const loginPromises = accounts.map(async (acc, index) => {
    const reqStart = Date.now();
    const clientIp = `10.200.${Math.floor(index / 250)}.${index % 250}`;
    const res = await fetch(`${GATEWAY_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': clientIp
      },
      body: JSON.stringify({ email: acc.email, password: acc.password })
    });

    const elapsed = Date.now() - reqStart;
    const body = await res.json();
    return { status: res.status, body, elapsed };
  });

  const loginResults = await Promise.all(loginPromises);
  const loginTotalDuration = Date.now() - loginStart;
  const loginLatencies = loginResults.map(r => r.elapsed);
  const loginPercentiles = calculatePercentiles(loginLatencies);
  const loginSuccessCount = loginResults.filter(r => r.status === 200).length;
  const loginFailureCount = loginResults.filter(r => r.status !== 200).length;

  console.log(`  [Stress Metrics] Logins completed in ${loginTotalDuration}ms`);
  console.log(`  [Stress Metrics] Success: ${loginSuccessCount}/${CONCURRENT_COUNT}, Failures: ${loginFailureCount}`);
  console.log(`  [Stress Metrics] Latencies - Avg: ${loginPercentiles.avg}ms, p50: ${loginPercentiles.p50}ms, p95: ${loginPercentiles.p95}ms, p99: ${loginPercentiles.p99}ms`);

  assert.strictEqual(loginSuccessCount, CONCURRENT_COUNT, `All ${CONCURRENT_COUNT} concurrent logins must succeed`);
  assert.strictEqual(loginFailureCount, 0, 'Zero logins should fail under burst');
  assert.strictEqual(unhandledRejections.length, 0, 'Must have zero unhandled promise rejections after logins');
  assert.strictEqual(uncaughtExceptions.length, 0, 'Must have zero uncaught exceptions after logins');

  for (const r of loginResults) {
    assert.ok(r.body.token, 'Token must be present in login response');
    assert.strictEqual(r.body.success, true);
    assert.ok(r.body.user);
  }
});

test('High-Concurrency Authentication Stress: Rate Limit Exhaustion & Stability Under Overload', async () => {
  // Burst of 140 requests from a single IP to exceed the default 120 auth limit
  const BURST_COUNT = 140;
  console.log(`\n  [Stress] Launching burst of ${BURST_COUNT} requests from a single client IP (testing 429 threshold & resilience)...`);

  const singleIp = '198.51.100.42';
  const startHeap = process.memoryUsage().heapUsed;

  const overloadPromises = Array.from({ length: BURST_COUNT }, async (_, i) => {
    const res = await fetch(`${GATEWAY_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Forwarded-For': singleIp
      },
      body: JSON.stringify({ email: 'overload_target@example.com', password: 'some_password' })
    });
    const body = await res.json().catch(() => ({}));
    return { status: res.status, body, retryAfter: res.headers.get('retry-after') };
  });

  const overloadResults = await Promise.all(overloadPromises);
  const endHeap = process.memoryUsage().heapUsed;

  const statusCounts = {};
  for (const r of overloadResults) {
    statusCounts[r.status] = (statusCounts[r.status] || 0) + 1;
  }

  console.log(`  [Stress Metrics] Overload Status Counts:`, statusCounts);
  console.log(`  [Stress Metrics] Heap Delta: ${Math.round((endHeap - startHeap) / (1024 * 1024))} MB`);

  // Assert that 429 rate limiting kicked in when exceeding threshold
  assert.ok(statusCounts[429] > 0, 'Rate limiter must enforce HTTP 429 when threshold exceeded');
  assert.strictEqual(statusCounts[500] || 0, 0, 'No HTTP 500 errors should occur under rate-limiting burst');
  assert.strictEqual(unhandledRejections.length, 0, 'Zero unhandled promise rejections during overload');
  assert.strictEqual(uncaughtExceptions.length, 0, 'Zero uncaught exceptions during overload');

  // Verify that subsequent health check succeeds immediately
  const healthRes = await fetch(`${GATEWAY_URL}/api/health`);
  assert.strictEqual(healthRes.status, 200, 'Gateway must remain responsive after burst');
  const healthData = await healthRes.json();
  assert.strictEqual(healthData.status, 'operational');
  console.log('  ✔ Gateway is fully healthy and operational following rate limit burst');
});
