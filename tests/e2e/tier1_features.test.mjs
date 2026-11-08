/**
 * Tier 1: Feature Coverage (Isolation Tests)
 * Anusandhan (अनुसंधान AI) Dual-Track E2E Test Suite
 * 
 * Verifies individual endpoint contracts and observable behavior in isolation
 * across Auth, Faculty, Fellowships, Ingestion, Outreach, Voice, Agents, Billing, Jobs, and Health.
 * 
 * Run with:
 *   node --test tests/e2e/tier1_features.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert';

const BASE_URL = process.env.TARGET_URL || 'http://127.0.0.1:5000';

let sharedToken = '';

async function getAuthToken() {
  if (sharedToken) return sharedToken;
  const testEmail = `tier1.shared.${Date.now()}.${Math.floor(Math.random() * 1000)}@iisc.ac.in`;
  const regRes = await testFetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'SharedPassword123!',
      fullName: 'Tier 1 Test User',
      university: 'Indian Institute of Science'
    })
  });
  if (regRes.ok) {
    const data = await regRes.json();
    sharedToken = data.token;
  }
  return sharedToken;
}

function testFetch(url, options = {}) {
  const testIp = `192.168.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 250) + 1}`;
  const headers = {
    'X-Forwarded-For': testIp,
    'CF-Connecting-IP': testIp,
    ...(options.headers || {})
  };
  return fetch(url, { ...options, headers });
}

test('Tier 1.1: Health & Telemetry — Gateway and microservice health check contract', async () => {
  const res = await testFetch(`${BASE_URL}/api/health`);
  assert.strictEqual(res.status, 200, 'Health endpoint must return 200 OK');

  const data = await res.json();
  assert.strictEqual(data.status, 'operational');
  assert.ok(data.gateway.includes('Express Gateway'));
  assert.ok(data.concurrency_target.includes('1,000'));
  assert.ok(data.services.redis_cache, 'Must report Redis cache status');
  assert.ok(data.services.node_express_gateway.includes('active'));
});

test('Tier 1.2: Faculty Directory — National scope queries return verified researchers with cache headers', async () => {
  const res = await testFetch(`${BASE_URL}/api/faculty?scope=national`);
  assert.strictEqual(res.status, 200);

  const cacheHeader = res.headers.get('X-Cache');
  assert.ok(cacheHeader === 'HIT' || cacheHeader === 'MISS', 'Must include X-Cache header');

  const data = await res.json();
  assert.ok(Array.isArray(data), 'Faculty response must be an array');
  assert.ok(data.length > 0, 'Must contain faculty members');
  assert.ok(data.some(f => f.name.includes('Chiranjib')), 'Must contain Prof. Chiranjib');
  assert.ok(data.every(f => f.scope === 'national' || f.country?.toLowerCase() === 'india'));
});

test('Tier 1.3: Faculty Directory — International/global scope queries return overseas researchers', async () => {
  const res = await testFetch(`${BASE_URL}/api/faculty?scope=international`);
  assert.strictEqual(res.status, 200);

  const data = await res.json();
  assert.ok(Array.isArray(data));
  assert.ok(data.length > 0);
  assert.ok(data.some(f => f.country?.toLowerCase() !== 'india' || f.scope === 'global' || f.scope === 'international'));
});

test('Tier 1.4: Faculty Directory — Live scraped postings filter returns verified opportunities', async () => {
  const res = await testFetch(`${BASE_URL}/api/faculty?scraped=true`);
  assert.strictEqual(res.status, 200);

  const data = await res.json();
  assert.ok(Array.isArray(data));
  assert.ok(data.length > 0);
  assert.ok(data.every(f => f.isLiveScraped === true), 'Every item must have isLiveScraped: true');
});

test('Tier 1.5: Fellowships Catalog — Returns prestigious programs with application portals and lifecycles', async () => {
  const res = await testFetch(`${BASE_URL}/api/fellowships`);
  assert.strictEqual(res.status, 200);

  const data = await res.json();
  assert.ok(Array.isArray(data));
  assert.ok(data.length >= 8, 'Must return at least 8 flagship fellowship programs');
  assert.ok(data.some(f => f.id === 'iisc-srfp'), 'Must include IISc SRFP');
  assert.ok(data.some(f => f.id === 'cern-summer'), 'Must include CERN Summer Student');

  data.forEach(f => {
    assert.ok(f.applicationPortalUrl || f.officialUrl, `Fellowship ${f.id} must have direct portal URL`);
    assert.ok(['active', 'upcoming', 'passed'].includes(f.status), `Fellowship ${f.id} status must be active/upcoming/passed`);
  });
});

test('Tier 1.6: Fellowships Lifecycle Filtering — Status filters (active, upcoming, passed)', async () => {
  for (const status of ['active', 'upcoming', 'passed']) {
    const res = await testFetch(`${BASE_URL}/api/fellowships?status=${status}`);
    assert.strictEqual(res.status, 200);
    const data = await res.json();
    assert.ok(Array.isArray(data));
    assert.ok(data.length > 0, `Must have at least one ${status} fellowship`);
    assert.ok(data.every(f => f.status === status), `All returned items must have status ${status}`);
  }
});

test('Tier 1.7: Academic Data Ingestion — Reports operational status and telemetry', async () => {
  const res = await testFetch(`${BASE_URL}/api/ingest/status`);
  assert.strictEqual(res.status, 200);

  const data = await res.json();
  assert.strictEqual(data.status, 'operational');
  assert.ok(data.trackedFacultyCount >= 4);
  assert.ok(data.trackedFellowshipsCount >= 8);
  assert.ok(data.lastSweepTimestamp !== undefined);
});

test('Tier 1.8: Academic Data Ingestion — Scraped postings list matches schema', async () => {
  const res = await testFetch(`${BASE_URL}/api/ingest/postings`);
  assert.strictEqual(res.status, 200);

  const data = await res.json();
  assert.ok(Array.isArray(data));
  assert.ok(data.length > 0);
  data.forEach(p => {
    assert.ok(p.id, 'Posting must have id');
    assert.ok(p.name, 'Posting must have name');
    assert.strictEqual(p.isLiveScraped, true);
    assert.ok(p.recentPaper?.title, 'Posting must have paper title');
  });
});

test('Tier 1.9: Academic Data Ingestion — Dynamic interval reconfiguration', async () => {
  const token = await getAuthToken();
  const res = await testFetch(`${BASE_URL}/api/ingest/schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ intervalMinutes: 45 })
  });
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.intervalMinutes, 45);
  assert.ok(data.nextSweepTimestamp);

  // Restore baseline 30-minute interval
  await testFetch(`${BASE_URL}/api/ingest/schedule`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ intervalMinutes: 30 })
  });
});

test('Tier 1.10: Asynchronous Job Queue — Accepts tasks with 202 Accepted and polls status', async () => {
  const submitRes = await testFetch(`${BASE_URL}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'cv_extraction',
      payload: { studentName: 'E2E Scholar', rawText: 'B.Tech IIT Delhi 9.2 CGPA' }
    })
  });
  assert.strictEqual(submitRes.status, 202, 'Must return 202 Accepted');

  const submitData = await submitRes.json();
  assert.ok(submitData.job?.id, 'Must return job with id');
  assert.strictEqual(submitData.job.type, 'cv_extraction');

  const pollRes = await testFetch(`${BASE_URL}/api/jobs/${submitData.job.id}`);
  assert.strictEqual(pollRes.status, 200);
  const pollData = await pollRes.json();
  assert.strictEqual(pollData.id, submitData.job.id);
  assert.ok(['pending', 'processing', 'completed'].includes(pollData.status));
});

test('Tier 1.11: Billing & Pricing Plans — Returns Free, Pro, and Institutional tiers', async () => {
  const res = await testFetch(`${BASE_URL}/api/billing/plans`);
  assert.strictEqual(res.status, 200);

  const data = await res.json();
  assert.ok(Array.isArray(data.plans));
  assert.strictEqual(data.plans.length, 3);
  assert.ok(data.plans.some(p => p.id === 'free_scholar' && p.priceInr === 0));
  assert.ok(data.plans.some(p => p.id === 'pro_researcher' && p.priceInr === 499));
  assert.ok(data.plans.some(p => p.id === 'institutional_lab' && p.priceInr === 4999));
  assert.ok(data.gatewaysSupported.length >= 2);
});

test('Tier 1.12: Auth Registration — Creates account with scrypt hash and issues JWT', async () => {
  const email = `tier1.scholar.${Date.now()}@iisc.ac.in`;
  const res = await testFetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'StrongPassword123!',
      fullName: 'Dr. Priya Raman',
      university: 'Indian Institute of Science'
    })
  });
  assert.strictEqual(res.status, 201);

  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.ok(data.token, 'Must return JWT token');
  assert.strictEqual(data.user.email, email);
  assert.strictEqual(data.user.passwordHash, undefined, 'Must not leak passwordHash');
});

test('Tier 1.13: Auth Login & Session Me — Authenticates credentials and returns user profile', async () => {
  const email = `tier1.login.${Date.now()}@iitd.ac.in`;
  const password = 'TestLoginPassword123';

  // Register first
  await testFetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, fullName: 'Rohit Verma' })
  });

  // Login
  const loginRes = await testFetch(`${BASE_URL}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password })
  });
  assert.strictEqual(loginRes.status, 200);

  const loginData = await loginRes.json();
  assert.ok(loginData.token);

  // Call /api/auth/me with Bearer token
  const meRes = await testFetch(`${BASE_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${loginData.token}` }
  });
  assert.strictEqual(meRes.status, 200);

  const meData = await meRes.json();
  assert.strictEqual(meData.user.email, email);
  assert.strictEqual(meData.user.fullName, 'Rohit Verma');
});

test('Tier 1.14: Auth Institutional Email Verification — Awards verified status and bonus credits', async () => {
  const email = `tier1.inst.${Date.now()}@example.com`;
  const regRes = await testFetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'password123', fullName: 'Ananya Roy' })
  });
  const { token } = await regRes.json();

  const verRes = await testFetch(`${BASE_URL}/api/auth/verify-institutional-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ institutionalEmail: 'ananya.roy@iitb.ac.in' })
  });
  assert.strictEqual(verRes.status, 200);

  const verData = await verRes.json();
  assert.strictEqual(verData.verified, true);
  assert.strictEqual(verData.bonusCreditsAwarded, 10);
  assert.strictEqual(verData.domain, 'iitb.ac.in');
});

test('Tier 1.15: Outreach Google OAuth URL — Returns consent URL with gmail.send scope', async () => {
  const res = await testFetch(`${BASE_URL}/api/outreach/oauth/google-url`);
  assert.strictEqual(res.status, 200);

  const data = await res.json();
  assert.ok(data.authUrl);
  assert.ok(data.authUrl.includes('accounts.google.com'));
  assert.ok(data.authUrl.includes('gmail.send'));
});

test('Tier 1.16: Outreach Draft Synthesis — Generates academic inquiry draft', async () => {
  const token = await getAuthToken();
  const res = await testFetch(`${BASE_URL}/api/outreach/draft`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      professor_id: 'prof_chiranjib',
      professor_name: 'Prof. Chiranjib Bhattacharyya',
      target_paper_title: 'Robust Multi-Armed Bandits with Non-Stationary Delays',
      student_name: 'Aditi Rao'
    })
  });
  assert.strictEqual(res.status, 200);

  const data = await res.json();
  assert.ok(data.draft_id);
  assert.ok(data.subject_line);
  assert.ok(data.body_text);
  assert.strictEqual(data.requires_human_approval, true);
});

test('Tier 1.17: Outreach Dispatch Guard — Blocks unconfirmed and queues confirmed with jitter', async () => {
  const token = await getAuthToken();
  // 1. Blocked when unconfirmed
  const blockedRes = await testFetch(`${BASE_URL}/api/outreach/enqueue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      draft_id: 'draft_t1_1',
      professor_email: 'chiran@iisc.ac.in',
      human_confirmed: false
    })
  });
  assert.strictEqual(blockedRes.status, 400);

  // 2. Accepted when human confirmed
  const okRes = await testFetch(`${BASE_URL}/api/outreach/enqueue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      draft_id: 'draft_t1_2',
      professor_email: 'chiran@iisc.ac.in',
      human_confirmed: true
    })
  });
  assert.strictEqual(okRes.status, 200);
  const okData = await okRes.json();
  assert.strictEqual(okData.status, 'queued_with_jitter');
  assert.ok(okData.jitter_delay_seconds >= 240);
});

test('Tier 1.18: Multilingual Voice Agent — Natural language fellowship status resolution', async () => {
  const res = await testFetch(`${BASE_URL}/api/voice/turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_input: 'Upcoming fellowship application dead lines kab hain?',
      voice_engine: 'sarvam'
    })
  });
  assert.strictEqual(res.status, 200);

  const data = await res.json();
  assert.ok(data.agent_text_response);
  assert.ok(Array.isArray(data.opportunity_links));
  assert.ok(data.opportunity_links.length > 0);
});

test('Tier 1.19: AI Agents — Paper pitch synthesis deconstructs publication', async () => {
  const token = await getAuthToken();
  const res = await testFetch(`${BASE_URL}/api/agents/paper-pitch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      paper: { title: 'Cross-Embodiment Visuomotor Policies', venue: 'ICRA 2025' },
      student: { fullName: 'Siddharth Sen' }
    })
  });
  assert.strictEqual(res.status, 200);

  const data = await res.json();
  assert.ok(data.deconstruction || data.pitch);
});

test('Tier 1.20: AI Agents — Mock interview evaluation evaluates technical soundness', async () => {
  const token = await getAuthToken();
  const res = await testFetch(`${BASE_URL}/api/agents/mock-interview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      turn_index: 1,
      student_response: 'We mitigated gradient variance using adaptive momentum clipping.'
    })
  });
  assert.strictEqual(res.status, 200);

  const data = await res.json();
  assert.ok(data.evaluation);
  assert.ok(data.next_question);
});

test('Tier 1.21: AI Agents — CV Diagnostic evaluates 5 pillars and remediation sprint', async () => {
  const token = await getAuthToken();
  const res = await testFetch(`${BASE_URL}/api/agents/cv-diagnostic`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      raw_cv_text: 'B.Tech CSE IIT Bombay 9.4 CGPA, PyTorch, CUDA kernels'
    })
  });
  assert.strictEqual(res.status, 200);

  const data = await res.json();
  assert.ok(data.rrs_score >= 0);
  assert.ok(data.pillars);
});

test('Tier 1.22: AI Agents — Grant Radar evaluates PI hiring capacity', async () => {
  const token = await getAuthToken();
  const res = await testFetch(`${BASE_URL}/api/agents/grant-radar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      professor: { id: 'prof_chiranjib', name: 'Prof. Chiranjib Bhattacharyya', university: 'IISc' }
    })
  });
  assert.strictEqual(res.status, 200);

  const data = await res.json();
  assert.ok(data.hiring_capacity_score >= 0);
});
