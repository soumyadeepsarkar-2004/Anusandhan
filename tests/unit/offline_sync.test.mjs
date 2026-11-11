import test from 'node:test';
import assert from 'node:assert';
import app from '../../server/server.js';
import { sqliteDao } from '../../server/db/sqliteDb.js';

const BASE_URL = 'http://localhost:5000';
let server;
let testToken;
let testUserId;

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

  // Register fresh user for testing offline synchronization
  const email = `offline.scholar.${Date.now()}@example.com`;
  const regRes = await fetch(`${BASE_URL}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password: 'OfflineTestPassword123!',
      fullName: 'Siddhartha Mukherjee'
    })
  });
  const regData = await regRes.json();
  testToken = regData.token;
  testUserId = regData.user.id;
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
});

test('Offline Sync 1: Batch sync rejects requests without actions array', async () => {
  const res = await fetch(`${BASE_URL}/api/sync/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testToken}`
    },
    body: JSON.stringify({})
  });

  assert.strictEqual(res.status, 400);
  const data = await res.json();
  assert.ok(data.error.includes('actions array is required'));
});

test('Offline Sync 2: Enqueued outreach without human confirmation is strictly rejected', async () => {
  const res = await fetch(`${BASE_URL}/api/sync/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testToken}`
    },
    body: JSON.stringify({
      actions: [
        {
          id: 'outbox_test_01',
          type: 'QUEUE_OUTREACH',
          payload: {
            draft_id: 'draft_unconfirmed_01',
            professor_email: 'prof@cam.ac.uk',
            human_confirmed: false
          }
        }
      ]
    })
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.syncedCount, 0);
  assert.strictEqual(data.results[0].status, 'rejected');
  assert.ok(data.results[0].reason.includes('human confirmation'));
});

test('Offline Sync 3: Batch processes confirmed outreach, profile update, and CRM stage in one trip', async () => {
  const draftId = `draft_offline_${Date.now()}`;
  const res = await fetch(`${BASE_URL}/api/sync/batch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testToken}`
    },
    body: JSON.stringify({
      actions: [
        {
          id: 'action_outreach_1',
          type: 'QUEUE_OUTREACH',
          payload: {
            draft_id: draftId,
            professor_id: 'prof_turing_01',
            professor_name: 'Prof. Alan Turing',
            professor_email: 'turing@cambridge.ac.uk',
            university: 'University of Cambridge',
            subject_line: 'Proposal: Morphogenetic Pattern Simulation',
            body_text: 'Dear Prof. Turing, I evaluated your foundational morphogenesis equations and developed a numerical solver...',
            human_confirmed: true
          }
        },
        {
          id: 'action_profile_2',
          type: 'UPDATE_PROFILE',
          payload: {
            university: 'IIT Kharagpur',
            cgpa: 9.4,
            skills: ['Quantum Computing', 'Distributed Systems'],
            targetDomains: ['Theoretical Computer Science']
          }
        },
        {
          id: 'action_crm_3',
          type: 'UPDATE_CRM_STATUS',
          payload: {
            draft_id: draftId,
            status: 'Interview Scheduled'
          }
        }
      ]
    })
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.success, true);
  assert.strictEqual(data.totalReceived, 3);
  assert.strictEqual(data.syncedCount, 3);

  // Verify persistence in SQLite
  const userInSqlite = await sqliteDao.getUserById(testUserId);
  assert.strictEqual(userInSqlite.university, 'IIT Kharagpur');
  assert.strictEqual(userInSqlite.cgpa, 9.4);
});
