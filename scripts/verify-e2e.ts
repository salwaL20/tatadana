/**
 * End-to-End Live Verification Script for TataDana Telegram Long Polling & Webhook
 */

async function main() {
  console.log('====================================================');
  console.log('TATADANA — LIVE END-TO-END VERIFICATION');
  console.log('====================================================');

  // 1. Check Next.js dev server on http://localhost:3000
  console.log('\n[1/4] Checking Next.js dev server on http://localhost:3000...');
  try {
    const res = await fetch('http://localhost:3000', { method: 'GET' });
    console.log(`✓ Dev server responded with HTTP ${res.status}`);
  } catch (err: any) {
    console.error(`✗ Dev server not reachable: ${err.message}`);
    process.exit(1);
  }

  // 2. Check /api/telegram/polling GET
  console.log('\n[2/4] Checking Long Polling engine status (/api/telegram/polling)...');
  try {
    const pollRes = await fetch('http://localhost:3000/api/telegram/polling');
    const pollData = await pollRes.json();
    console.log(`✓ Polling API status:`, pollData);
    if (!pollData.ok) {
      console.error(`✗ Polling status returned error`);
      process.exit(1);
    }
  } catch (err: any) {
    console.error(`✗ Polling API request failed: ${err.message}`);
    process.exit(1);
  }

  // 3. Test sending "beli makan malam 15k tunai" into live webhook
  console.log('\n[3/4] Sending "beli makan malam 15k tunai" to live webhook (/api/telegram/webhook)...');
  const updateId = Math.floor(Date.now() / 1000);
  try {
    const hookRes = await fetch('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        update_id: updateId,
        message: {
          message_id: 1001,
          chat: { id: 123456789, first_name: 'Budi' },
          from: { id: 123456789, first_name: 'Budi', username: 'budipratama' },
          text: 'beli makan malam 15k tunai',
          date: Math.floor(Date.now() / 1000),
        },
      }),
    });
    const hookData = await hookRes.json();
    console.log(`✓ Webhook response status: ${hookRes.status}`, hookData);

    if (hookData.reply) {
      console.log('\n--- 🧾 Formatted Indonesian Receipt ---');
      console.log(hookData.reply);
      console.log('--------------------------------------');
    }

    if (!hookData.ok || hookData.status !== 'processed') {
      console.error('✗ Transaction not processed properly');
      process.exit(1);
    }
  } catch (err: any) {
    console.error(`✗ Webhook POST failed: ${err.message}`);
    process.exit(1);
  }

  // 4. Verify duplicate rejection (idempotency)
  console.log('\n[4/4] Verifying duplicate rejection (idempotency)...');
  try {
    const dupRes = await fetch('http://localhost:3000/api/telegram/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        update_id: updateId,
        message: {
          message_id: 1001,
          chat: { id: 123456789, first_name: 'Budi' },
          text: 'beli makan malam 15k tunai',
        },
      }),
    });
    const dupData = await dupRes.json();
    console.log(`✓ Duplicate retry response:`, dupData);
    if (dupData.status !== 'skipped_duplicate') {
      console.error('✗ Idempotency failed: duplicate was not skipped');
      process.exit(1);
    }
  } catch (err: any) {
    console.error(`✗ Duplicate test failed: ${err.message}`);
    process.exit(1);
  }

  console.log('\n====================================================');
  console.log('🎉 ALL END-TO-END VERIFICATIONS PASSED SUCCESSFULLY!');
  console.log('====================================================');
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
