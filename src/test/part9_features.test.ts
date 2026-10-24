import { dataService } from '../lib/supabase/client';
import { mockStore } from '../lib/supabase/mockStore';
import { handleBotCommand } from '../lib/telegram/commandHandlers';

export async function runPart9FeaturesTests(): Promise<{ passed: number; failed: number; errors: string[] }> {
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

  // 1. Multi-Wallet Manager & Transfer Tests
  const initialWallets = await dataService.getWallets('usr-budi-12345');
  assert(initialWallets.length >= 3, 'Initial wallets have multiple accounts');

  // Add new wallet with institution & initial balance
  const newWallet = await dataService.addWallet({
    user_id: 'usr-budi-12345',
    name: 'BRI Simpedes',
    type: 'bank',
    balance: 3500000,
    is_default: false,
    color: '#0369A1',
    institution: 'BRI',
  });
  assert(newWallet.name === 'BRI Simpedes' && newWallet.balance === 3500000, 'Add wallet with initial balance and institution');

  // Test set default Telegram wallet
  const updatedDefault = await dataService.updateWallet(newWallet.id, { is_default: true });
  assert(updatedDefault.is_default === true, 'Set wallet as default for Telegram');
  const allWalletsAfterDefault = await dataService.getWallets('usr-budi-12345');
  const otherDefaults = allWalletsAfterDefault.filter(w => w.id !== newWallet.id && w.is_default);
  assert(otherDefaults.length === 0, 'Only one wallet is marked as default for Telegram');

  // Test wallet-to-wallet transfer
  const sourceWallet = initialWallets[0]; // e.g. BCA
  const destWallet = initialWallets[1]; // e.g. GoPay
  const sourceBalanceBefore = sourceWallet.balance;
  const destBalanceBefore = destWallet.balance;
  const transferAmount = 250000;

  const transferResult = await dataService.transferBetweenWallets(
    'usr-budi-12345',
    sourceWallet.id,
    destWallet.id,
    transferAmount,
    'Top up GoPay dari BCA'
  );
  assert(transferResult.success === true, 'Wallet transfer executed successfully');
  assert(sourceWallet.balance === sourceBalanceBefore - transferAmount, 'Source wallet balance deducted');
  assert(destWallet.balance === destBalanceBefore + transferAmount, 'Destination wallet balance incremented');
  assert(transferResult.transaction.type === 'transfer', 'Transaction logged with type transfer');

  // Transfer failure on insufficient funds
  let threwError = false;
  try {
    await dataService.transferBetweenWallets('usr-budi-12345', sourceWallet.id, destWallet.id, 999999999);
  } catch (e) {
    threwError = true;
  }
  assert(threwError, 'Transfer rejected when source wallet balance is insufficient');

  // Transfer failure on non-existent wallet
  let nonExistentWalletError = false;
  try {
    await dataService.transferBetweenWallets('usr-budi-12345', 'wlt-invalid-999', destWallet.id, 50000);
  } catch (e) {
    nonExistentWalletError = true;
  }
  assert(nonExistentWalletError, 'Transfer rejected when source wallet does not exist');

  // Transfer failure on non-existent destination wallet
  let nonExistentDestError = false;
  try {
    await dataService.transferBetweenWallets('usr-budi-12345', sourceWallet.id, 'wlt-invalid-dest', 50000);
  } catch (e) {
    nonExistentDestError = true;
  }
  assert(nonExistentDestError, 'Transfer rejected when destination wallet does not exist');

  // Transfer failure on same source and destination wallet
  let sameWalletError = false;
  try {
    await dataService.transferBetweenWallets('usr-budi-12345', sourceWallet.id, sourceWallet.id, 50000);
  } catch (e: any) {
    sameWalletError = e.message.includes('sama');
  }
  assert(sameWalletError, 'Transfer rejected when source and destination wallet are the same');

  // Transfer failure on non-positive amount
  let zeroAmountError = false;
  try {
    await dataService.transferBetweenWallets('usr-budi-12345', sourceWallet.id, destWallet.id, 0);
  } catch (e: any) {
    zeroAmountError = e.message.includes('lebih dari 0');
  }
  assert(zeroAmountError, 'Transfer rejected when transfer amount is 0 or negative');

  // 2. Multi-Period Budgeting Tests
  const categories = await dataService.getCategories('usr-budi-12345');
  const foodCategory = categories.find(c => c.name.toLowerCase().includes('makan'));
  assert(!!foodCategory, 'Food category exists for multi-tier budgeting');
  assert((foodCategory?.daily_budget || 0) > 0, 'Daily budget target is configured');
  assert((foodCategory?.weekly_budget || 0) > 0, 'Weekly budget target is configured');
  assert((foodCategory?.monthly_budget || 0) > 0, 'Monthly budget target is configured');
  assert((foodCategory?.yearly_budget || 0) > 0, 'Yearly budget target is configured');

  // Multi-tier budget update test
  if (foodCategory) {
    const updatedCat = await dataService.updateCategory(foodCategory.id, {
      daily_budget: 85000,
      weekly_budget: 600000,
    });
    assert(updatedCat.daily_budget === 85000, 'Daily budget updated');
    assert(updatedCat.weekly_budget === 600000, 'Weekly budget updated');
  }

  // 3. Calendar & Recurring Bills Tests
  const recurringBills = await dataService.getRecurringBills('usr-budi-12345');
  assert(recurringBills.length >= 2, 'Recurring bills loaded successfully');
  const indihomeBill = recurringBills.find(b => b.name.includes('IndiHome'));
  assert(!!indihomeBill && indihomeBill.due_day === 15, 'Recurring bill has specific due_day');

  const newBill = await dataService.addRecurringBill({
    user_id: 'usr-budi-12345',
    name: 'Asuransi BPJS Kesehatan',
    amount: 150000,
    due_day: 10,
    is_active: true,
    frequency: 'monthly',
  });
  assert(newBill.name === 'Asuransi BPJS Kesehatan' && newBill.due_day === 10, 'Add new recurring bill agenda');

  // 4. Telegram Command Enhancements
  const kalenderReply = await handleBotCommand('/kalender', 'usr-budi-12345');
  assert(kalenderReply.includes('Kalender Keuangan'), '/kalender command responds with calendar link');
  assert(kalenderReply.includes('IndiHome'), '/kalender command lists upcoming recurring bills');

  const aiReply = await handleBotCommand('/tataai', 'usr-budi-12345');
  assert(aiReply.includes('Tata AI') && aiReply.includes('tata-ai'), '/tataai command returns Tata AI assistant link');

  const startReply = await handleBotCommand('/start', 'usr-budi-12345');
  assert(startReply.includes('/kalender') && startReply.includes('/tataai'), '/start command lists /kalender and /tataai');

  const bantuanReply = await handleBotCommand('/bantuan', 'usr-budi-12345');
  assert(bantuanReply.includes('/kalender') && bantuanReply.includes('/tataai'), '/bantuan command lists /kalender and /tataai');

  // 5. Tata AI API Route Tests (/api/ai/chat)
  const { POST: chatPOST } = await import('../app/api/ai/chat/route');
  const chatReq = new Request('http://localhost/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message: 'Berapa sisa uang makan minggu ini?', userId: 'usr-budi-12345' }),
    headers: { 'Content-Type': 'application/json' },
  });
  const chatRes = await chatPOST(chatReq);
  const chatData = await chatRes.json();
  assert(chatRes.status === 200 && chatData.success === true, 'Tata AI chat route responds with HTTP 200');
  assert(chatData.reply && chatData.reply.includes('Makanan'), 'Tata AI chat returns contextual response about food budget');
  assert(Array.isArray(chatData.suggestedActions) && chatData.suggestedActions.length > 0, 'Tata AI chat returns suggested actions');

  // Tata AI fallback/advisor query
  const advReq = new Request('http://localhost/api/ai/chat', {
    method: 'POST',
    body: JSON.stringify({ message: 'Bagaimana evaluasi keuangan saya?', userId: 'usr-budi-12345' }),
    headers: { 'Content-Type': 'application/json' },
  });
  const advRes = await chatPOST(advReq);
  const advData = await advRes.json();
  assert(advRes.status === 200 && Boolean(advData.reply), 'Tata AI general query returns multi-provider advisor analysis and advice');

  return { passed, failed, errors };
}
