import test from 'node:test';
import assert from 'node:assert';
import path from 'path';
import { fileURLToPath } from 'url';
import app from '../../server/server.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let gatewayServer;
let GATEWAY_URL = '';
const FASTAPI_URL = 'http://127.0.0.1:8000';

const ADVERSARIAL_ORIGINS = [
  'http://evil-attacker.com',
  'https://evil-attacker.com',
  'https://anusandhan.ai.evil-attacker.com',
  'https://anusandhan.ai.attacker.org',
  'http://evil.com:5173',
  'http://localhost:8080',
  'http://127.0.0.1:9999',
  'null'
];

const AUTHORIZED_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:3000',
  'https://anusandhan.ai'
];

test.before(async () => {
  // Start Express Gateway on ephemeral port
  await new Promise((resolve) => {
    gatewayServer = app.listen(0, () => {
      const port = gatewayServer.address().port;
      GATEWAY_URL = `http://127.0.0.1:${port}`;
      console.log(`[CORS Challenge] Gateway listening on ${GATEWAY_URL}`);
      resolve();
    });
  });
});

test.after(async () => {
  if (gatewayServer) {
    await new Promise((resolve) => gatewayServer.close(resolve));
  }
});

// -------------------------------------------------------------
// EXPRESS GATEWAY CORS CHALLENGE
// -------------------------------------------------------------

test('Express Gateway: Rejects unauthorized origins on GET requests', async () => {
  for (const evilOrigin of ADVERSARIAL_ORIGINS) {
    const res = await fetch(`${GATEWAY_URL}/api/health`, {
      method: 'GET',
      headers: { 'Origin': evilOrigin }
    });

    const allowOrigin = res.headers.get('access-control-allow-origin');
    assert.notStrictEqual(allowOrigin, '*', `Gateway must never return wildcard '*' for ${evilOrigin}`);
    assert.notStrictEqual(allowOrigin, evilOrigin, `Gateway must never reflect unauthorized origin ${evilOrigin}`);
    assert.strictEqual(allowOrigin, null, `Gateway should not set Access-Control-Allow-Origin for ${evilOrigin}`);
  }
});

test('Express Gateway: Rejects unauthorized origins on Preflight OPTIONS requests', async () => {
  for (const evilOrigin of ADVERSARIAL_ORIGINS) {
    const res = await fetch(`${GATEWAY_URL}/api/health`, {
      method: 'OPTIONS',
      headers: {
        'Origin': evilOrigin,
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization'
      }
    });

    const allowOrigin = res.headers.get('access-control-allow-origin');
    assert.notStrictEqual(allowOrigin, '*', `Preflight must never return wildcard '*' for ${evilOrigin}`);
    assert.notStrictEqual(allowOrigin, evilOrigin, `Preflight must never reflect unauthorized origin ${evilOrigin}`);
    assert.strictEqual(allowOrigin, null, `Preflight should not set Access-Control-Allow-Origin for ${evilOrigin}`);
  }
});

test('Express Gateway: Rejects unauthorized origins on Auth POST endpoints', async () => {
  for (const evilOrigin of ADVERSARIAL_ORIGINS) {
    const res = await fetch(`${GATEWAY_URL}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Origin': evilOrigin,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' })
    });

    const allowOrigin = res.headers.get('access-control-allow-origin');
    assert.notStrictEqual(allowOrigin, '*', `Auth endpoint must never return wildcard '*' for ${evilOrigin}`);
    assert.notStrictEqual(allowOrigin, evilOrigin, `Auth endpoint must never reflect unauthorized origin ${evilOrigin}`);
    assert.strictEqual(allowOrigin, null, `Auth endpoint should not set Access-Control-Allow-Origin for ${evilOrigin}`);
  }
});

test('Express Gateway: Allows authorized whitelisted origins with credentials', async () => {
  for (const validOrigin of AUTHORIZED_ORIGINS) {
    const res = await fetch(`${GATEWAY_URL}/api/health`, {
      method: 'GET',
      headers: { 'Origin': validOrigin }
    });

    assert.strictEqual(res.headers.get('access-control-allow-origin'), validOrigin);
    assert.strictEqual(res.headers.get('access-control-allow-credentials'), 'true');
  }
});

// -------------------------------------------------------------
// FASTAPI MICROSERVICE CORS CHALLENGE
// -------------------------------------------------------------

test('FastAPI Microservice: Rejects unauthorized origins on GET and OPTIONS', async () => {
  // Check if FastAPI is running
  let fastApiAvailable = false;
  try {
    const probe = await fetch(`${FASTAPI_URL}/`);
    if (probe.ok) fastApiAvailable = true;
  } catch {
    console.log('[Notice] FastAPI microservice not running on port 8000; skipping live FastAPI CORS check.');
  }

  if (fastApiAvailable) {
    for (const evilOrigin of ADVERSARIAL_ORIGINS) {
      // 1. GET check
      const getRes = await fetch(`${FASTAPI_URL}/api/v1/audit/status`, {
        method: 'GET',
        headers: { 'Origin': evilOrigin }
      });
      const getAllow = getRes.headers.get('access-control-allow-origin');
      assert.notStrictEqual(getAllow, '*', `FastAPI must never return '*' for ${evilOrigin}`);
      assert.notStrictEqual(getAllow, evilOrigin, `FastAPI must not reflect unauthorized ${evilOrigin}`);
      assert.strictEqual(getAllow, null, `FastAPI should not set Access-Control-Allow-Origin for ${evilOrigin}`);

      // 2. Preflight OPTIONS check
      const optRes = await fetch(`${FASTAPI_URL}/api/v1/audit/status`, {
        method: 'OPTIONS',
        headers: {
          'Origin': evilOrigin,
          'Access-Control-Request-Method': 'POST',
          'Access-Control-Request-Headers': 'Content-Type'
        }
      });
      const optAllow = optRes.headers.get('access-control-allow-origin');
      assert.notStrictEqual(optAllow, '*', `FastAPI preflight must never return '*' for ${evilOrigin}`);
      assert.notStrictEqual(optAllow, evilOrigin, `FastAPI preflight must not reflect unauthorized ${evilOrigin}`);
      assert.strictEqual(optAllow, null, `FastAPI preflight should not set Access-Control-Allow-Origin for ${evilOrigin}`);
    }

    // 3. Authorized origins check
    for (const validOrigin of AUTHORIZED_ORIGINS) {
      const getRes = await fetch(`${FASTAPI_URL}/api/v1/audit/status`, {
        method: 'GET',
        headers: { 'Origin': validOrigin }
      });
      assert.strictEqual(getRes.headers.get('access-control-allow-origin'), validOrigin);
      assert.strictEqual(getRes.headers.get('access-control-allow-credentials'), 'true');
    }
  }
});
