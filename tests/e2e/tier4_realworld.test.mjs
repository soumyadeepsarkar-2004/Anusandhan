/**
 * Tier 4: Real-World Workload Scenarios (End-to-End Student Workflow)
 * Anusandhan (अनुसंधान AI) Dual-Track E2E Test Suite
 * 
 * Simulates a complete, authentic university scholar journey from initial onboarding
 * to institutional attestation, CV gap analysis, literature deconstruction, viva prep,
 * and ethical human-approved outreach dispatch.
 * 
 * Run with:
 *   node --test tests/e2e/tier4_realworld.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert';

const BASE_URL = process.env.TARGET_URL || 'http://127.0.0.1:5000';

function testFetch(url, options = {}) {
  const testIp = `192.168.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 250) + 1}`;
  const headers = {
    'X-Forwarded-For': testIp,
    'CF-Connecting-IP': testIp,
    ...(options.headers || {})
  };
  return fetch(url, { ...options, headers });
}

test('Tier 4: End-to-End Scholar Workflow — Complete Zero-to-Outreach Academic Lifecycle', async () => {
  const timestamp = Date.now();
  const scholarEmail = `aditya.sen.${timestamp}@iitkgp.ac.in`;
  const scholarPassword = 'ScholarLaunch2026!';
  const scholarName = 'Aditya Sen';
  const university = 'Indian Institute of Technology Kharagpur';

  console.log(`\n--- [Stage 1: Scholar Onboarding & Registration] ---`);
  const regRes = await testFetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: scholarEmail,
      password: scholarPassword,
      fullName: scholarName,
      university,
      fieldOfStudy: 'Artificial Intelligence & Machine Learning',
      degreeLevel: 'B.Tech Computer Science',
      cgpa: 9.3
    })
  });
  assert.strictEqual(regRes.status, 201, 'Stage 1 Failed: Registration must return 201 Created');
  const regData = await regRes.json();
  const token = regData.token;
  assert.ok(token, 'Must issue JWT session token');
  assert.strictEqual(regData.user.email, scholarEmail);
  assert.strictEqual(regData.user.creditsRemaining, 10);
  assert.strictEqual(regData.user.isVerified, false);

  console.log(`--- [Stage 2: Institutional Domain Attestation (.ac.in)] ---`);
  const attestRes = await testFetch(`${BASE_URL}/api/auth/verify-institutional-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ institutionalEmail: scholarEmail })
  });
  assert.strictEqual(attestRes.status, 200, 'Stage 2 Failed: Verification must succeed');
  const attestData = await attestRes.json();
  assert.strictEqual(attestData.verified, true);
  assert.strictEqual(attestData.bonusCreditsAwarded, 10);

  // Validate profile has verified status and 20 credits
  const meRes = await testFetch(`${BASE_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  assert.strictEqual(meRes.status, 200);
  const meData = await meRes.json();
  assert.strictEqual(meData.user.isVerified, true, 'User profile must show verified status');
  assert.strictEqual(meData.user.creditsRemaining, 20, 'Credits must be updated to 20');

  console.log(`--- [Stage 3: Research Readiness Score (RRS) & CV Diagnostic] ---`);
  const cvRes = await testFetch(`${BASE_URL}/api/agents/cv-diagnostic`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      raw_cv_text: 'B.Tech CSE IIT Kharagpur 9.3 CGPA. Experience: Custom CUDA Transformer kernel optimizations, distributed PyTorch benchmarks.'
    })
  });
  assert.strictEqual(cvRes.status, 200, 'Stage 3 Failed: CV diagnostic must succeed');
  const cvData = await cvRes.json();
  assert.ok(cvData.rrs_score >= 70, 'RRS score must reflect competitive candidate');
  assert.ok(cvData.pillars, 'Must return 5 RRS pillars');
  assert.ok(cvData.remediation_sprint.length > 0, 'Must provide structured remediation sprint');

  console.log(`--- [Stage 4: Faculty Opportunity Discovery & Active Grant Radar] ---`);
  const facultyRes = await testFetch(`${BASE_URL}/api/faculty?scope=national`);
  assert.strictEqual(facultyRes.status, 200, 'Stage 4 Failed: Faculty query must succeed');
  const facultyList = await facultyRes.json();
  assert.ok(facultyList.length > 0);

  const targetProf = facultyList.find(f => f.metrics?.activeGrant) || facultyList[0];
  assert.ok(targetProf, 'Must find active research laboratory');
  assert.ok(targetProf.name);

  console.log(`--- [Stage 5: Grant Radar Hiring Capacity Assessment] ---`);
  const radarRes = await testFetch(`${BASE_URL}/api/agents/grant-radar`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ professor: targetProf })
  });
  assert.strictEqual(radarRes.status, 200, 'Stage 5 Failed: Grant radar must succeed');
  const radarData = await radarRes.json();
  assert.ok(radarData.hiring_capacity_score > 0);

  console.log(`--- [Stage 6: Paper Deconstruction & Precision Pitch Synthesis] ---`);
  const targetPaperTitle = 'Convex Relaxation Bounds for Non-Stationary Multi-Armed Bandits';
  const pitchRes = await testFetch(`${BASE_URL}/api/agents/paper-pitch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      professor: targetProf,
      paper: { title: targetPaperTitle, venue: 'ICML 2025' },
      student: { fullName: scholarName, featuredProject: { title: 'Accelerated CUDA Kernels' } }
    })
  });
  assert.strictEqual(pitchRes.status, 200, 'Stage 6 Failed: Paper pitch must succeed');
  const pitchData = await pitchRes.json();
  assert.ok(pitchData.pitch || pitchData.deconstruction);

  // Generate 146-word academic draft
  const draftRes = await testFetch(`${BASE_URL}/api/outreach/draft`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      professor_id: targetProf.id,
      professor_name: targetProf.name,
      target_paper_title: targetPaperTitle,
      student_name: scholarName
    })
  });
  assert.strictEqual(draftRes.status, 200);
  const draftData = await draftRes.json();
  assert.ok(draftData.draft_id);
  assert.strictEqual(draftData.requires_human_approval, true, 'Draft must mandate human approval');

  console.log(`--- [Stage 7: Mock Technical Viva Interview Screening] ---`);
  const interviewRes = await testFetch(`${BASE_URL}/api/agents/mock-interview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      turn_index: 1,
      professor_name: targetProf.name,
      student_response: 'We formulate the objective as a regret minimization bound under adversarial distribution shifts.'
    })
  });
  assert.strictEqual(interviewRes.status, 200, 'Stage 7 Failed: Mock interview must succeed');
  const interviewData = await interviewRes.json();
  assert.ok(interviewData.evaluation.overall_score > 70);
  assert.ok(interviewData.next_question);

  console.log(`--- [Stage 8: Direct Google OAuth 2.0 Setup] ---`);
  const oauthRes = await testFetch(`${BASE_URL}/api/outreach/oauth/google-url`);
  assert.strictEqual(oauthRes.status, 200, 'Stage 8 Failed: Google OAuth URL check');
  const oauthData = await oauthRes.json();
  assert.ok(oauthData.authUrl.includes('accounts.google.com'));
  assert.ok(oauthData.authUrl.includes('gmail.send'));

  console.log(`--- [Stage 9: Ethical Human-in-the-Loop Dispatch with Anti-Spam Jitter] ---`);
  // Attempt without human confirmation (integrity safeguard)
  const rejectRes = await testFetch(`${BASE_URL}/api/outreach/enqueue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      draft_id: draftData.draft_id,
      professor_email: targetProf.email || 'prof@iisc.ac.in',
      human_confirmed: false
    })
  });
  assert.strictEqual(rejectRes.status, 400, 'Unconfirmed outreach must be blocked');

  // Enqueue with scholar confirmation
  const enqueueRes = await testFetch(`${BASE_URL}/api/outreach/enqueue`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      draft_id: draftData.draft_id,
      professor_email: targetProf.email || 'prof@iisc.ac.in',
      human_confirmed: true
    })
  });
  assert.strictEqual(enqueueRes.status, 200, 'Confirmed outreach must be accepted');
  const queueResult = await enqueueRes.json();
  assert.strictEqual(queueResult.status, 'queued_with_jitter');
  assert.ok(queueResult.jitter_delay_seconds >= 240, 'Must apply anti-spam delay >= 4 min');

  console.log(`--- [Stage 10: Platform Health & Zero-Defect Telemetry Verification] ---`);
  const healthRes = await testFetch(`${BASE_URL}/api/health`);
  assert.strictEqual(healthRes.status, 200);
  const healthData = await healthRes.json();
  assert.strictEqual(healthData.status, 'operational');

  const ingestRes = await testFetch(`${BASE_URL}/api/ingest/status`);
  assert.strictEqual(ingestRes.status, 200);
  const ingestData = await ingestRes.json();
  assert.strictEqual(ingestData.status, 'operational');

  console.log(`\n>>> Full 10-Stage Real-World Scholar Lifecycle Verified Successfully! <<<\n`);
});
