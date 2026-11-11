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
  // Guarantee clean process termination: ingestion scheduler keeps the event loop alive
  setTimeout(() => {
    process.exit(0);
  }, 300);
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

test('System Design 4: Telemetry endpoint /api/system/metrics returns complete operational state', async () => {
  const res = await fetch(`${BASE_URL}/api/system/metrics`);
  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.strictEqual(data.status, 'healthy');
  assert.ok(data.process.heapUsedMB > 0);
  assert.ok(data.circuitBreakers.pythonMicroservice);
  assert.strictEqual(data.architecture.singleFlightCoalescing, 'enabled');
  assert.strictEqual(data.architecture.circuitBreakerFailFast, 'enabled');
});

test('System Design 5: Single-Flight cache prevents Thundering Herd stampedes', async () => {
  const { cache } = await import('../../server/services/redisCache.js');
  let dbFetchCount = 0;
  const slowDbFetch = async () => {
    dbFetchCount++;
    await new Promise((r) => setTimeout(r, 40));
    return { payload: 'heavy_computation_result' };
  };

  const key = `single_flight_test_${Date.now()}`;
  // Dispatch 10 concurrent requests for the exact same uncached key
  const results = await Promise.all(
    Array.from({ length: 10 }).map(() => cache.getOrSet(key, slowDbFetch, 60))
  );

  // Even with 10 concurrent calls, the heavy database fetcher MUST only execute ONCE
  assert.strictEqual(dbFetchCount, 1, `Fetcher must run exactly 1 time, but ran ${dbFetchCount} times`);
  assert.strictEqual(results.length, 10);
  results.forEach(r => assert.strictEqual(r.data.payload, 'heavy_computation_result'));
});

test('System Design 6: Circuit Breaker transitions to OPEN upon threshold failures', async () => {
  const { CircuitBreaker } = await import('../../server/utils/circuitBreaker.js');
  const breaker = new CircuitBreaker('TestBreaker', { failureThreshold: 3, recoveryTimeoutMs: 500 });

  assert.strictEqual(breaker.state, 'CLOSED');

  // Trigger 3 consecutive failures
  for (let i = 0; i < 3; i++) {
    try {
      await breaker.execute(async () => { throw new Error('simulated service failure'); });
    } catch {}
  }

  // Circuit breaker must now be OPEN
  assert.strictEqual(breaker.state, 'OPEN', 'Breaker must trip to OPEN after 3 failures');

  // Next call must fail-fast without executing the action
  let actionRan = false;
  try {
    await breaker.execute(async () => { actionRan = true; });
  } catch (err) {
    assert.ok(err.message.includes('is OPEN'));
  }
  assert.strictEqual(actionRan, false, 'Action must not run when breaker is OPEN');
});

test('AI Features 7: Paper-Pitch agent synthesizes grounded 146-word precision outreach', async () => {
  const res = await fetch(`${BASE_URL}/api/agents/paper-pitch`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testToken}`
    },
    body: JSON.stringify({
      paper: {
        title: 'Deep Residual Learning for Image Recognition',
        venue: 'CVPR 2026'
      },
      student: {
        fullName: 'Siddhartha Mukherjee',
        university: 'IIT Kharagpur',
        cgpa: 9.4
      },
      professor: {
        name: 'Prof. Kaiming He',
        university: 'MIT'
      }
    })
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.pitch, 'Pitch object must be returned');
  assert.ok(data.pitch.subject_line.includes('Deep Residual Learning'));
  assert.ok(data.pitch.body.includes('Prof. Kaiming He'));
  assert.ok(data.pitch.body.includes('Siddhartha Mukherjee'));
  assert.ok(data.pitch.target_word_limit <= 146);
});

test('AI Features 8: Mock Interview agent evaluates student answer and provides scoring', async () => {
  const res = await fetch(`${BASE_URL}/api/agents/mock-interview`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${testToken}`
    },
    body: JSON.stringify({
      turn_index: 1,
      user_response: 'I utilized PyTorch DDP with gradient accumulation across 4 A100 GPUs to eliminate GPU out-of-memory errors during training.'
    })
  });

  assert.strictEqual(res.status, 200);
  const data = await res.json();
  assert.ok(data.evaluation, 'Evaluation object must be returned');
  assert.ok(data.evaluation.overall_score >= 0);
  assert.ok(data.evaluation.interviewer_comment || data.evaluation.feedback, 'Comment or feedback must be present');
  assert.ok(data.next_question, 'Next question must be present');
});
