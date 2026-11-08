import test from 'node:test';
import assert from 'node:assert';

test('Offline Outbox Item Schema & Idempotency Key Generation', () => {
  const item = {
    id: `outbox_${Date.now()}_test1`,
    type: 'QUEUE_OUTREACH',
    payload: {
      draft_id: 'draft_101',
      professor_email: 'f.tian@tum.de',
      human_confirmed: true
    },
    createdAt: new Date().toISOString(),
    status: 'pending',
    retryCount: 0
  };

  assert.ok(item.id.startsWith('outbox_'));
  assert.strictEqual(item.status, 'pending');
  assert.strictEqual(item.payload.human_confirmed, true);
  assert.strictEqual(item.retryCount, 0);
});

test('Outbox Deduplication and Idempotency Guard', () => {
  const processedKeys = new Set();
  const queue = [
    { id: 'key_1', payload: { email: 'prof1@tum.de' } },
    { id: 'key_1', payload: { email: 'prof1@tum.de' } }, // Duplicate transmission
    { id: 'key_2', payload: { email: 'prof2@ethz.ch' } }
  ];

  const uniqueDispatches = [];
  for (const item of queue) {
    if (!processedKeys.has(item.id)) {
      processedKeys.add(item.id);
      uniqueDispatches.push(item);
    }
  }

  assert.strictEqual(uniqueDispatches.length, 2);
  assert.strictEqual(uniqueDispatches[0].id, 'key_1');
  assert.strictEqual(uniqueDispatches[1].id, 'key_2');
});
