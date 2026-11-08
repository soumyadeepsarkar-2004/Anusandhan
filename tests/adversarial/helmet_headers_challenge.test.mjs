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
const FASTAPI_URL = 'http://127.0.0.1:8000';

test.before(async () => {
  await new Promise((resolve) => {
    gatewayServer = app.listen(0, () => {
      const port = gatewayServer.address().port;
      GATEWAY_URL = `http://127.0.0.1:${port}`;
      console.log(`[Helmet Challenge] Gateway listening on ${GATEWAY_URL}`);
      resolve();
    });
  });
});

test.after(async () => {
  if (gatewayServer) {
    await new Promise((resolve) => gatewayServer.close(resolve));
  }
});

function verifyHelmetHeaders(res, label) {
  // 1. Content-Security-Policy
  const csp = res.headers.get('content-security-policy');
  assert.ok(csp, `[${label}] CSP header must be present`);
  assert.ok(
    csp.includes("default-src 'self'") || csp.includes("default-src 'none'"),
    `[${label}] CSP must restrict default-src (got: ${csp})`
  );

  // 2. Strict-Transport-Security (HSTS)
  const hsts = res.headers.get('strict-transport-security');
  assert.ok(hsts, `[${label}] HSTS header must be present`);
  assert.ok(hsts.includes('max-age=31536000'), `[${label}] HSTS max-age must be 1 year (31536000)`);
  assert.ok(hsts.includes('includeSubDomains'), `[${label}] HSTS must includeSubDomains`);
  assert.ok(hsts.includes('preload'), `[${label}] HSTS must include preload`);

  // 3. X-Frame-Options
  const xfo = res.headers.get('x-frame-options');
  assert.strictEqual(xfo, 'DENY', `[${label}] X-Frame-Options must be DENY`);

  // 4. X-Content-Type-Options
  const xcto = res.headers.get('x-content-type-options');
  assert.strictEqual(xcto, 'nosniff', `[${label}] X-Content-Type-Options must be nosniff`);

  // 5. Cross-Origin-Resource-Policy
  const corp = res.headers.get('cross-origin-resource-policy');
  assert.strictEqual(corp, 'cross-origin', `[${label}] Cross-Origin-Resource-Policy must be cross-origin`);
}

test('Helmet Headers: 200 OK responses (health, faculty, root)', async () => {
  const routes = ['/api/health', '/api/faculty', '/'];
  for (const route of routes) {
    const res = await fetch(`${GATEWAY_URL}${route}`);
    assert.strictEqual(res.status, 200, `Expected 200 for ${route}`);
    verifyHelmetHeaders(res, `200 ${route}`);
  }
});

test('Helmet Headers: 401 Unauthorized responses (protected student, outreach, agent routes)', async () => {
  const protectedRoutes = [
    { path: '/api/students/me', method: 'GET' },
    { path: '/api/outreach/draft', method: 'POST', body: JSON.stringify({}) },
    { path: '/api/agents/paper-pitch', method: 'POST', body: JSON.stringify({}) },
    { path: '/api/ingest/refresh', method: 'POST' }
  ];

  for (const r of protectedRoutes) {
    const res = await fetch(`${GATEWAY_URL}${r.path}`, {
      method: r.method,
      headers: { 'Content-Type': 'application/json' },
      body: r.body
    });
    assert.strictEqual(res.status, 401, `Expected 401 for unauthenticated ${r.path}`);
    verifyHelmetHeaders(res, `401 ${r.path}`);
  }
});

test('Helmet Headers: 400 Bad Request responses (invalid registration payloads)', async () => {
  const res = await fetch(`${GATEWAY_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({})
  });
  assert.strictEqual(res.status, 400);
  verifyHelmetHeaders(res, '400 Bad Request');
});

test('Helmet Headers: 404 Not Found responses (unmatched routes)', async () => {
  const res = await fetch(`${GATEWAY_URL}/api/completely/unknown/endpoint/404`);
  assert.strictEqual(res.status, 404);
  verifyHelmetHeaders(res, '404 Not Found');
});

test('FastAPI Microservice: Security headers presence (nosniff, DENY, HSTS)', async () => {
  let fastApiAvailable = false;
  try {
    const probe = await fetch(`${FASTAPI_URL}/`);
    if (probe.ok) fastApiAvailable = true;
  } catch {}

  if (fastApiAvailable) {
    const res = await fetch(`${FASTAPI_URL}/api/v1/audit/status`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers.get('x-content-type-options'), 'nosniff');
    assert.strictEqual(res.headers.get('x-frame-options'), 'DENY');
    assert.ok(res.headers.get('strict-transport-security')?.includes('max-age=31536000'));
  }
});
