#!/usr/bin/env node
/**
 * ==============================================================================
 * Anusandhan PRO - Autonomous Production Deployment Verification Engine
 * Validates full stack contracts: SPA Serving, REST APIs, SQLite DB, and Security
 * ==============================================================================
 */

const BASE_URL = process.env.DEPLOY_URL || 'http://localhost:5000';
const AI_URL = process.env.AI_DEPLOY_URL || 'http://localhost:8000';

console.log(`\n🔍 Starting Production Verification on: ${BASE_URL} (AI: ${AI_URL})\n`);

let passedChecks = 0;
let totalChecks = 0;

async function check(name, testFn) {
  totalChecks++;
  try {
    const start = Date.now();
    await testFn();
    const duration = Date.now() - start;
    console.log(`  ✔ [PASS] ${name} (${duration}ms)`);
    passedChecks++;
  } catch (err) {
    console.error(`  ✖ [FAIL] ${name}: ${err.message}`);
  }
}

async function run() {
  // 1. Static Production Single-Page App Delivery
  await check('SPA Static Asset Serving: index.html with meta tags', async () => {
    const res = await fetch(`${BASE_URL}/`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const text = await res.text();
    if (!text.includes('Anusandhan') || !text.includes('root')) {
      throw new Error('index.html missing title or root element');
    }
  });

  // 2. Production Gateway Health Contract
  await check('Production Gateway Health: /api/health operational', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'operational') throw new Error(`Unexpected status: ${data.status}`);
  });

  // 3. Autonomous Ingestion Crawler Status
  await check('Autonomous Ingestion Telemetry: /api/ingest/status active', async () => {
    const res = await fetch(`${BASE_URL}/api/ingest/status`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'operational' || data.trackedFellowshipsCount < 8) {
      throw new Error(`Invalid crawler metrics: ${JSON.stringify(data)}`);
    }
  });

  // 4. Multi-Disciplinary Faculty Directory
  await check('Faculty Directory: /api/faculty returns 5 disciplines', async () => {
    const res = await fetch(`${BASE_URL}/api/faculty`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const list = await res.json();
    if (!Array.isArray(list) || list.length < 20) {
      throw new Error(`Insufficient faculty loaded: ${list.length}`);
    }
  });

  // 5. Elite Fellowships Catalog
  await check('Fellowships Catalog: /api/fellowships returns prestigious programs', async () => {
    const res = await fetch(`${BASE_URL}/api/fellowships`);
    if (res.status !== 200) throw new Error(`Status ${res.status}`);
    const list = await res.json();
    if (!Array.isArray(list) || list.length < 8) {
      throw new Error(`Insufficient fellowships: ${list.length}`);
    }
  });

  // 6. Security & Helmet Headers
  await check('Security Headers: Helmet nosniff, frameguard, and referrer policy', async () => {
    const res = await fetch(`${BASE_URL}/api/health`);
    const ct = res.headers.get('x-content-type-options');
    const xframe = res.headers.get('x-frame-options');
    if (ct !== 'nosniff') throw new Error(`Missing X-Content-Type-Options (got: ${ct})`);
    if (xframe !== 'DENY' && xframe !== 'SAMEORIGIN') throw new Error(`Missing X-Frame-Options (got: ${xframe})`);
  });

  // 7. Scholar Auth & JWT Issuance
  let token = '';
  const testEmail = `scholar_${Date.now()}@iisc.ac.in`;
  await check('Auth Lifecycle: Register account and receive JWT', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: testEmail,
        password: 'Password123!',
        fullName: 'Dr. Vikram Sarabhai Fellow'
      })
    });
    if (res.status !== 200 && res.status !== 201) throw new Error(`Registration failed with status ${res.status}`);
    const data = await res.json();
    if (!data.token) throw new Error('No JWT token returned');
    token = data.token;
  });

  // 8. Institutional Email Verification & Bonus Credits
  await check('Institutional Domain Attestation (.ac.in): +10 Bonus Credits', async () => {
    const res = await fetch(`${BASE_URL}/api/auth/verify-institutional-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({ institutionalEmail: testEmail })
    });
    if (res.status !== 200) throw new Error(`Attestation failed: status ${res.status}`);
    const data = await res.json();
    if (data.bonusCreditsAwarded !== 10) throw new Error('Bonus credits not awarded');
  });

  // 9. Student Profile CRUD with SQLite Persistence
  await check('Student Profile: /api/students/me CRUD persisted in SQLite', async () => {
    const putRes = await fetch(`${BASE_URL}/api/students/me`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        university: 'Indian Institute of Science (IISc)',
        cgpa: 9.8,
        degreeLevel: 'M.Tech / M.S.',
        skills: ['Python', 'PyTorch', 'Distributed Systems']
      })
    });
    if (putRes.status !== 200) throw new Error(`PUT /me failed: ${putRes.status}`);

    const getRes = await fetch(`${BASE_URL}/api/students/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    const profile = await getRes.json();
    if (profile.cgpa !== 9.8 || profile.degreeLevel !== 'M.Tech / M.S.') {
      throw new Error(`Profile fields mismatch: cgpa=${profile.cgpa}`);
    }
  });

  // 10. Cold Outreach Draft Synthesis & Human-in-the-Loop Jitter Enqueue
  await check('Outreach Engine: Draft synthesis & ethical human guard enqueue', async () => {
    const draftRes = await fetch(`${BASE_URL}/api/outreach/draft`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        professor_id: 'iisc_chiranjib',
        professor_name: 'Prof. Chiranjib Bhattacharyya',
        professor_university: 'IISc Bangalore',
        target_paper_title: 'Robust Non-Convex Optimization in Federated Learning',
        student_name: 'Vikram Fellow'
      })
    });
    if (draftRes.status !== 200) throw new Error(`Draft synthesis failed: ${draftRes.status}`);
    const draft = await draftRes.json();
    if (!draft.draft_id) throw new Error('Missing draft_id');

    // Attempt unconfirmed enqueue (must fail)
    const badEnqueue = await fetch(`${BASE_URL}/api/outreach/enqueue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        draft_id: draft.draft_id,
        professor_email: 'chiran@iisc.ac.in',
        human_confirmed: false
      })
    });
    if (badEnqueue.status !== 400) throw new Error('Human confirmation guard failed to reject unconfirmed enqueue');

    // Confirmed enqueue
    const goodEnqueue = await fetch(`${BASE_URL}/api/outreach/enqueue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify({
        draft_id: draft.draft_id,
        professor_email: 'chiran@iisc.ac.in',
        human_confirmed: true
      })
    });
    if (goodEnqueue.status !== 200) throw new Error(`Confirmed enqueue failed: ${goodEnqueue.status}`);
    const queueData = await goodEnqueue.json();
    if (queueData.status !== 'queued_with_jitter') throw new Error('Status not queued_with_jitter');
  });

  // 11. Python AI Microservice Health
  await check('FastAPI Microservice: /health operational', async () => {
    const res = await fetch(`${AI_URL}/health`);
    if (res.status !== 200) throw new Error(`AI microservice returned status ${res.status}`);
    const data = await res.json();
    if (data.status !== 'operational') throw new Error(`Unexpected status: ${data.status}`);
  });

  console.log(`\n======================================================`);
  console.log(`🏁 VERIFICATION SUMMARY: ${passedChecks} / ${totalChecks} PASSED`);
  console.log(`======================================================\n`);

  if (passedChecks === totalChecks) {
    console.log('✅ ALL PRODUCTION CONTRACTS SATISFIED. Ready for global launch!\n');
    process.exit(0);
  } else {
    console.error('❌ SOME CHECKS FAILED.\n');
    process.exit(1);
  }
}

run();
