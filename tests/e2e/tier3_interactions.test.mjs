/**
 * Tier 3: Cross-Feature Interactions (Pairwise User Flows)
 * Anusandhan (अनुसंधान AI) Dual-Track E2E Test Suite
 * 
 * Verifies state transitions and multi-step workflows spanning multiple subsystems:
 *   - Flow 1: Auth ↔ Attestation ↔ Credit Sync
 *   - Flow 2: Opportunity Search ↔ Pitch Synthesis ↔ Human-Guard Enqueue
 *   - Flow 3: Voice Dialogue ↔ Fellowship Opportunity Dynamic Alignment
 *   - Flow 4: Billing Order ↔ Webhook Fulfillment ↔ GST Invoice
 *   - Flow 5: Asynchronous Job Processing ↔ Polling ↔ CV Diagnostic
 * 
 * Run with:
 *   node --test tests/e2e/tier3_interactions.test.mjs
 */
import test from 'node:test';
import assert from 'node:assert';
import crypto from 'crypto';

const BASE_URL = process.env.TARGET_URL || 'http://127.0.0.1:5000';

// Helper ensuring each test run operates with isolated client IP rate limit window
function testFetch(url, options = {}) {
  const testIp = `192.168.${Math.floor(Math.random() * 200) + 1}.${Math.floor(Math.random() * 250) + 1}`;
  const headers = {
    'X-Forwarded-For': testIp,
    'CF-Connecting-IP': testIp,
    ...(options.headers || {})
  };
  return fetch(url, { ...options, headers });
}

test('Tier 3.1: Flow 1 — Registration → Institutional Attestation → Profile & Credit Sync', async () => {
  const email = `interaction.scholar.${Date.now()}@iisc.ac.in`;
  const password = 'SecurePassword2026!';

  // Step 1: Register account
  const regRes = await testFetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      fullName: 'Vikram Sarabhai Fellow',
      university: 'Indian Institute of Science'
    })
  });
  assert.strictEqual(regRes.status, 201);
  const regData = await regRes.json();
  const token = regData.token;
  assert.ok(token);
  assert.strictEqual(regData.user.creditsRemaining, 10, 'Initial credits must be 10');
  assert.strictEqual(regData.user.isVerified, false, 'Initial state must be unverified');

  // Step 2: Attest institutional affiliation (.ac.in domain)
  const attestRes = await testFetch(`${BASE_URL}/api/auth/verify-institutional-email`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ institutionalEmail: email })
  });
  assert.strictEqual(attestRes.status, 200);
  const attestData = await attestRes.json();
  assert.strictEqual(attestData.verified, true);
  assert.strictEqual(attestData.bonusCreditsAwarded, 10);

  // Step 3: Fetch updated profile and verify synced state
  const profileRes = await testFetch(`${BASE_URL}/api/auth/me`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  assert.strictEqual(profileRes.status, 200);
  const profileData = await profileRes.json();
  assert.strictEqual(profileData.user.isVerified, true, 'User must now be verified');
  assert.strictEqual(profileData.user.creditsRemaining, 20, 'Credits must increment to 20');
});

test('Tier 3.2: Flow 2 — Search → Pitch Synthesis → Human Guard → Enqueue with Jitter', async () => {
  // Step 0: Register scholar session to authorize agent & outreach endpoints
  const email = `maya.${Date.now()}@iisc.ac.in`;
  const regRes = await testFetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password123!', fullName: 'Maya Krishnan' })
  });
  const { token } = await regRes.json();

  // Step 1: Query verified researchers
  const facultyRes = await testFetch(`${BASE_URL}/api/faculty?scope=national`);
  assert.strictEqual(facultyRes.status, 200);
  const facultyList = await facultyRes.json();
  assert.ok(facultyList.length > 0);
  const targetProf = facultyList[0];

  // Step 2: Request paper deconstruction pitch
  const pitchRes = await testFetch(`${BASE_URL}/api/agents/paper-pitch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      professor: targetProf,
      paper: { title: 'Scalable Neural Architecture Search', venue: 'ICLR 2025' },
      student: { fullName: 'Maya Krishnan' }
    })
  });
  assert.strictEqual(pitchRes.status, 200);
  const pitchData = await pitchRes.json();
  assert.ok(pitchData.pitch || pitchData.deconstruction);

  // Step 3: Synthesize precision cold draft
  const draftRes = await testFetch(`${BASE_URL}/api/outreach/draft`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({
      professor_id: targetProf.id,
      professor_name: targetProf.name,
      target_paper_title: 'Scalable Neural Architecture Search',
      student_name: 'Maya Krishnan'
    })
  });
  assert.strictEqual(draftRes.status, 200);
  const draftData = await draftRes.json();
  assert.ok(draftData.draft_id);
  assert.strictEqual(draftData.requires_human_approval, true);

  // Step 4: Attempt unconfirmed dispatch (must be rejected)
  const unconfirmedRes = await testFetch(`${BASE_URL}/api/outreach/enqueue`, {
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
  assert.strictEqual(unconfirmedRes.status, 400);

  // Step 5: Approved dispatch with randomized anti-spam jitter delay
  const confirmedRes = await testFetch(`${BASE_URL}/api/outreach/enqueue`, {
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
  assert.strictEqual(confirmedRes.status, 200);
  const queueData = await confirmedRes.json();
  assert.strictEqual(queueData.status, 'queued_with_jitter');
  assert.ok(queueData.jitter_delay_seconds >= 240, 'Jitter must be at least 4 minutes');
});

test('Tier 3.3: Flow 3 — Multilingual Voice Dialogue ↔ Dynamic Fellowship Catalog Alignment', async () => {
  // Step 1: Send query to voice agent requesting upcoming opportunities
  const voiceRes = await testFetch(`${BASE_URL}/api/voice/turn`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      user_input: 'Bhai upcoming fellowships kaunsi hain?',
      voice_engine: 'sarvam'
    })
  });
  assert.strictEqual(voiceRes.status, 200);
  const voiceData = await voiceRes.json();
  assert.ok(voiceData.agent_text_response);
  assert.ok(Array.isArray(voiceData.opportunity_links));
  assert.ok(voiceData.opportunity_links.length > 0);

  // Step 2: Fetch actual upcoming fellowships from catalog
  const catalogRes = await testFetch(`${BASE_URL}/api/fellowships?status=upcoming`);
  assert.strictEqual(catalogRes.status, 200);
  const catalogItems = await catalogRes.json();
  assert.ok(catalogItems.length > 0);

  // Step 3: Validate cross-alignment — links from voice must match actual catalog URLs
  const catalogUrls = new Set(catalogItems.map(c => c.applicationPortalUrl || c.officialUrl));
  const hasMatchedLink = voiceData.opportunity_links.some(link => catalogUrls.has(link.url));
  assert.ok(hasMatchedLink, 'Voice assistant must return URLs matching the live catalog');
});

test('Tier 3.4: Flow 4 — Plan Selection → Order Creation → Webhook Fulfillment → GST Invoice', async () => {
  // Step 1: Register scholar
  const email = `pro.subscriber.${Date.now()}@iitb.ac.in`;
  const regRes = await testFetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password123!', fullName: 'Pro Scholar' })
  });
  const { token } = await regRes.json();

  // Step 2: Create checkout order for Scholar Pro
  const orderRes = await testFetch(`${BASE_URL}/api/billing/create-order`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ planId: 'pro_researcher', currency: 'INR' })
  });
  assert.strictEqual(orderRes.status, 200);
  const orderData = await orderRes.json();
  assert.ok(orderData.orderId);
  assert.strictEqual(orderData.amount, 49900); // ₹499 in paise

  // Step 3: Webhook payment capture event
  const webhookPayload = {
    event: 'order.paid',
    payload: {
      order: { entity: { id: orderData.orderId } },
      payment: { entity: { id: `pay_${Date.now()}` } }
    }
  };

  const secret = process.env.RAZORPAY_KEY_SECRET || 'test_secret_key_rzp_99482';
  const bodyString = JSON.stringify(webhookPayload);
  const signature = crypto.createHmac('sha256', secret).update(bodyString).digest('hex');

  const webhookRes = await testFetch(`${BASE_URL}/api/billing/webhook/razorpay`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': signature
    },
    body: bodyString
  });
  assert.strictEqual(webhookRes.status, 200);

  // Step 4: Verify GST-compliant invoice is accessible and paid
  const invoiceRes = await testFetch(`${BASE_URL}/api/billing/invoice/${orderData.orderId}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  assert.strictEqual(invoiceRes.status, 200);
  const invoiceData = await invoiceRes.json();
  assert.ok(invoiceData.invoiceNumber.startsWith('INV-'));
  assert.strictEqual(invoiceData.status, 'PAID');
  assert.strictEqual(invoiceData.company.sacCode, '998431');
  assert.strictEqual(invoiceData.customer.email, email);
  assert.ok(invoiceData.items.length > 0);
  assert.ok(invoiceData.items[0].cgst > 0);
  assert.ok(invoiceData.items[0].sgst > 0);
});

test('Tier 3.5: Flow 5 — Asynchronous Task Submission → Status Polling → CV Diagnostic', async () => {
  // Register student for authorized CV diagnostic
  const email = `flow5.${Date.now()}@iitm.ac.in`;
  const regRes = await testFetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password: 'Password123!', fullName: 'Flow5 Scholar' })
  });
  const { token } = await regRes.json();

  // Step 1: Submit background CV processing task
  const submitRes = await testFetch(`${BASE_URL}/api/jobs`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'cv_extraction',
      payload: {
        studentId: 'scholar_tier3_flow5',
        rawText: 'B.Tech IIT Madras 9.6 CGPA, Distributed Systems, Rust, C++, Kubernetes'
      }
    })
  });
  assert.strictEqual(submitRes.status, 202);
  const { job } = await submitRes.json();
  assert.ok(job.id);

  // Step 2: Poll job status
  const pollRes = await testFetch(`${BASE_URL}/api/jobs/${job.id}`);
  assert.strictEqual(pollRes.status, 200);
  const pollData = await pollRes.json();
  assert.strictEqual(pollData.id, job.id);

  // Step 3: Run comprehensive CV gap diagnosis using extracted credentials
  const diagRes = await testFetch(`${BASE_URL}/api/agents/cv-diagnostic`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ raw_cv_text: job.payload?.rawText })
  });
  assert.strictEqual(diagRes.status, 200);
  const diagData = await diagRes.json();
  assert.ok(diagData.rrs_score >= 0);
  assert.ok(diagData.pillars);
  assert.ok(diagData.remediation_sprint.length > 0);
});
