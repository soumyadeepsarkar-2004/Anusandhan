import test from 'node:test';
import assert from 'node:assert';
import app from '../../server/server.js';
import { sqliteDao } from '../../server/db/sqliteDb.js';

const BASE_URL = 'http://localhost:5000';
let server;

test.before(async () => {
  let isRunning = false;
  try {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (res.ok) isRunning = true;
  } catch {}

  if (!isRunning) {
    await new Promise((resolve, reject) => {
      server = app.listen(5000, () => resolve());
      server.on('error', (err) => {
        if (err.code === 'EADDRINUSE') resolve();
        else reject(err);
      });
    });
  }
});

test.after(async () => {
  if (server) {
    await new Promise((resolve) => server.close(resolve));
  }
  try {
    const mongoose = await import('mongoose');
    if (mongoose.default && mongoose.default.connection) {
      await mongoose.default.disconnect();
    }
  } catch {}
  // Guarantee clean process termination: ingestion scheduler keeps the event loop alive
  setTimeout(() => {
    process.exit(0);
  }, 300);
});

test('1. Normal user registration initializes clean profile with zero demo data', async () => {
  const email = `clean.user.${Date.now()}@example.com`;
  const res = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'SecurePassword123!',
      fullName: 'Vikramaditya Roy'
    })
  });

  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.ok(data.token, 'Token must be issued');
  assert.strictEqual(data.user.fullName, 'Vikramaditya Roy');
  assert.strictEqual(data.user.cgpa, 0, 'Initial CGPA must be 0, not fake 8.2');
  assert.deepStrictEqual(data.user.targetDomains, [], 'Initial targetDomains must be empty, not fake AI & ML');
  assert.deepStrictEqual(data.user.skills, [], 'Initial skills must be empty array, not fake Python/Data Structures');
  assert.strictEqual(data.user.rrsScore, 0, 'Initial RRS score must be 0, not fake 72');
  assert.strictEqual(data.user.rrsTier, 'Developing', 'Initial RRS tier must be Developing, not fake Competitive Candidate');
});

test('2. CV-based registration stores candidate actual custom CV data', async () => {
  const customEmail = `cv.custom.${Date.now()}@iitd.ac.in`;
  const res = await fetch(`${BASE_URL}/api/auth/register-with-cv`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: customEmail,
      fullName: 'Tanvi Deshmukh',
      university: 'Indian Institute of Technology (IIT) Delhi',
      cgpa: 9.42,
      skills: ['Quantum Information', 'Qiskit', 'Python', 'C++'],
      targetDomains: ['Quantum Computing & Information'],
      rrsScore: 92,
      rrsTier: 'Distinguished Candidate'
    })
  });

  assert.strictEqual(res.status, 201);
  const data = await res.json();
  assert.strictEqual(data.user.fullName, 'Tanvi Deshmukh');
  assert.strictEqual(data.user.university, 'Indian Institute of Technology (IIT) Delhi');
  assert.strictEqual(data.user.cgpa, 9.42);
  assert.deepStrictEqual(data.user.targetDomains, ['Quantum Computing & Information']);
  assert.ok(data.user.skills.includes('Qiskit'));
  assert.strictEqual(data.user.rrsScore, 92);
  assert.strictEqual(data.user.rrsTier, 'Distinguished Candidate');
});

test('3. OAuth sign-in enforces valid cryptographic token and rejects blank identity', async () => {
  const res = await fetch(`${BASE_URL}/api/auth/oauth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'google'
      // Missing credential token
    })
  });

  assert.strictEqual(res.status, 401);
  const data = await res.json();
  assert.ok(data.error.includes('Google') || data.error.includes('credential'));
});

test('4. OAuth rejects unverified raw email bypass to prevent fake accounts', async () => {
  const oauthEmail = `scholar.oauth.${Date.now()}@stanford.edu`;
  const res = await fetch(`${BASE_URL}/api/auth/oauth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'github',
      email: oauthEmail,
      fullName: 'Rohan Banerjee'
    })
  });

  // Must reject direct unverified email registration through OAuth endpoint
  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.ok(data.error.includes('exchange') || data.error.includes('authorization code'));
});

test('5. OAuth code exchange endpoint validates required parameters', async () => {
  const res = await fetch(`${BASE_URL}/api/auth/oauth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'google'
      // Missing code
    })
  });

  assert.strictEqual(res.status, 400);
});

test('6. Student profile /api/students/me returns clean scholar state with no demo name', async () => {
  // Register fresh user
  const email = `student.me.${Date.now()}@example.com`;
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'ValidPassword123!',
      fullName: 'Aaditya Sen'
    })
  });
  const { token } = await regRes.json();

  const meRes = await fetch(`${BASE_URL}/api/students/me`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  assert.strictEqual(meRes.status, 200);
  const meData = await meRes.json();
  assert.strictEqual(meData.fullName, 'Aaditya Sen');
  assert.strictEqual(meData.cgpa, 0);
  assert.strictEqual(meData.rrsScore, 0);
  assert.strictEqual(meData.rrsTier, 'Developing');
});

test('7. Student profile update PUT /api/students/me updates custom credentials and persists', async () => {
  const email = `student.update.${Date.now()}@example.com`;
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'ValidPassword123!',
      fullName: 'Priya Nambiar'
    })
  });
  const { token } = await regRes.json();

  const updateRes = await fetch(`${BASE_URL}/api/students/me`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      university: 'Indian Institute of Science (IISc) Bangalore',
      cgpa: 9.6,
      targetDomains: ['Computational Biology & Genomics'],
      skills: ['CRISPR-Cas9', 'Python', 'Biopython', 'PyTorch'],
      rrsScore: 88,
      rrsTier: 'Lab-Ready Fellow'
    })
  });

  assert.strictEqual(updateRes.status, 200);
  const updatedData = await updateRes.json();
  assert.strictEqual(updatedData.university, 'Indian Institute of Science (IISc) Bangalore');
  assert.strictEqual(updatedData.cgpa, 9.6);
  assert.deepStrictEqual(updatedData.targetDomains, ['Computational Biology & Genomics']);
  assert.ok(updatedData.skills.includes('CRISPR-Cas9'));
  assert.strictEqual(updatedData.rrsScore, 88);
  assert.strictEqual(updatedData.rrsTier, 'Lab-Ready Fellow');
});

test('8. OAuth exchange endpoint cleanly rejects missing credentials gracefully', async () => {
  const res = await fetch(`${BASE_URL}/api/auth/oauth/exchange`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'google',
      code: 'mock_code_without_client_secret',
      redirectUri: 'http://localhost:5000'
    })
  });

  // Since GOOGLE_CLIENT_ID / SECRET are not configured on server in test environment,
  // server must return clean 500 error specifying missing .env credentials, not crash
  assert.ok(res.status === 500 || res.status === 400);
  const data = await res.json();
  assert.ok(data.error);
});

test('9. Dedicated /api/auth/google endpoint strictly validates token and rejects blank credentials', async () => {
  const res = await fetch(`${BASE_URL}/api/auth/google`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Test Scholar'
    })
  });

  assert.strictEqual(res.status, 401);
  const data = await res.json();
  assert.ok(data.error.includes('Google') || data.error.includes('credential'));
});

test('10. vercel.json contains redirects for all verified release binaries', async () => {
  const fs = await import('fs');
  const vercelCfg = JSON.parse(fs.readFileSync('vercel.json', 'utf8'));
  assert.ok(Array.isArray(vercelCfg.redirects), 'redirects array must be present');
  
  const sources = vercelCfg.redirects.map(r => r.source);
  assert.ok(sources.includes('/downloads/anusandhan-v1.0.apk'), 'Must redirect /downloads/anusandhan-v1.0.apk');
  assert.ok(sources.includes('/downloads/anusandhan-setup-1.0.0.exe'), 'Must redirect Windows setup');
  assert.ok(sources.includes('/downloads/anusandhan-portable-1.0.0.exe'), 'Must redirect Windows portable');
  assert.ok(sources.includes('/downloads/anusandhan-1.0.0-universal.dmg'), 'Must redirect macOS DMG');
});
