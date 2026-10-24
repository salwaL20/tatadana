import { mockStore } from '../lib/supabase/mockStore';

export async function runIdempotencyTests(): Promise<{ passed: number; failed: number; errors: string[] }> {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
    } else {
      failed++;
      errors.push(`FAIL: ${testName}`);
    }
  }

  const testUpdateId = 987654321;

  // Clear any existing test update
  mockStore.telegramUpdates = mockStore.telegramUpdates.filter(u => u.update_id !== testUpdateId);

  // First execution: should be processed
  const isDuplicate1 = mockStore.telegramUpdates.some(u => u.update_id === testUpdateId);
  assert(!isDuplicate1, 'First update_id arrival is not a duplicate');

  mockStore.telegramUpdates.push({
    update_id: testUpdateId,
    chat_id: 123456,
    message_text: 'beli bakso 15rb',
    message_type: 'text',
    status: 'processed',
    processed_at: new Date().toISOString(),
  });

  // Second execution (Telegram retry): must be detected as duplicate!
  const isDuplicate2 = mockStore.telegramUpdates.some(u => u.update_id === testUpdateId);
  assert(isDuplicate2, 'Second update_id retry is strictly caught as duplicate');

  // End-to-end test against real Webhook POST Route Handler
  const { POST } = await import('../app/api/telegram/webhook/route');

  // Test 3: Invalid payload check (missing update_id)
  const invalidReq = new Request('http://localhost/api/telegram/webhook', {
    method: 'POST',
    body: JSON.stringify({ message: { text: 'test' } }),
    headers: { 'Content-Type': 'application/json' },
  });
  const invalidRes = await POST(invalidReq);
  assert(invalidRes.status === 400, 'Webhook rejects missing update_id with 400 Bad Request');

  // Test 4: First delivery via HTTP POST handler
  const routeUpdateId = 887766554;
  mockStore.telegramUpdates = mockStore.telegramUpdates.filter(u => u.update_id !== routeUpdateId);

  const req1 = new Request('http://localhost/api/telegram/webhook', {
    method: 'POST',
    body: JSON.stringify({
      update_id: routeUpdateId,
      message: {
        chat: { id: 123456789 },
        text: 'beli bakso 15rb',
        from: { username: 'budipratama' },
      },
    }),
    headers: { 'Content-Type': 'application/json' },
  });
  const res1 = await POST(req1);
  const data1 = await res1.json();
  assert(res1.status === 200, 'First webhook POST returns HTTP 200');
  assert(data1.status === 'processed', 'First webhook POST processes update');

  // Test 5: Second delivery (Telegram retry) via HTTP POST handler with exact same update_id
  const req2 = new Request('http://localhost/api/telegram/webhook', {
    method: 'POST',
    body: JSON.stringify({
      update_id: routeUpdateId,
      message: {
        chat: { id: 123456789 },
        text: 'beli bakso 15rb',
        from: { username: 'budipratama' },
      },
    }),
    headers: { 'Content-Type': 'application/json' },
  });
  const res2 = await POST(req2);
  const data2 = await res2.json();
  assert(res2.status === 200, 'Second webhook POST retry returns HTTP 200');
  assert(data2.status === 'skipped_duplicate', 'Second webhook POST retry returns status: skipped_duplicate');

  // Verify only 1 update record stored
  const matchingUpdates = mockStore.telegramUpdates.filter(u => u.update_id === routeUpdateId);
  assert(matchingUpdates.length === 1, 'Only one record stored in telegramUpdates table for the update_id');

  return { passed, failed, errors };
}
