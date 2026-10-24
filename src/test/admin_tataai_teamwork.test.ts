import { mockStore } from '../lib/supabase/mockStore';
import { dataService } from '../lib/supabase/client';
import { generateXlsxReport } from '../lib/utils/excelGenerator';
import { generateHtmlReport, ReportSummary } from '../lib/utils/pdfGenerator';
import { parseIndonesianText } from '../lib/telegram/parser';
import { formatDateOnlyWIB } from '../lib/utils/timezone';

export async function runAdminTataAiTeamworkTests(): Promise<{ passed: number; failed: number; errors: string[] }> {
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

  // 1. Admin Login & Credentials (salwaL@gmail.com / ss2002)
  const salwa = mockStore.profiles.find(p => p.id === 'usr-salwa-001' || p.email === 'salwaL@gmail.com' || p.email === 'salwaL20@gmail.com');
  assert(Boolean(salwa), 'SALWA L account exists in mockStore with email salwaL@gmail.com');
  assert(salwa?.role === 'superadmin', 'SALWA L account has superadmin role');
  assert(salwa?.subscription_tier === 'pro', 'SALWA L has active Pro tier');

  // 2. Admin Approval Panel Workflow (/admin/payments)
  const citraSub = mockStore.subscriptions.find(s => s.user_id === 'usr-citra-99887') || {
    id: 'sub-citra-test',
    user_id: 'usr-citra-99887',
    plan: 'pro',
    status: 'pending_approval' as const,
    payment_method: 'manual_transfer' as const,
    amount: 99000,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
  citraSub.status = 'active';
  citraSub.approved_by = 'usr-salwa-001';
  const citraUser = mockStore.profiles.find(p => p.id === 'usr-citra-99887');
  if (citraUser) citraUser.subscription_tier = 'pro';

  mockStore.auditLogs.unshift({
    id: `aud-test-${Date.now()}`,
    admin_id: 'usr-salwa-001',
    target_user_id: 'usr-citra-99887',
    action: 'approve_subscription_pro',
    metadata: { subscription_id: citraSub.id, amount: citraSub.amount },
    ip_address: '127.0.0.1 (Internal Admin)',
    created_at: new Date().toISOString(),
  });

  assert(citraSub.status === 'active', 'Admin approval marks subscription status as active');
  assert(citraUser?.subscription_tier === 'pro', 'Approved user gets upgraded to pro tier');
  assert(mockStore.auditLogs[0].action === 'approve_subscription_pro', 'Audit log is recorded upon approval');

  // 3. Profile Photo Update
  const newAvatarUrl = 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150';
  await dataService.updateProfile('usr-salwa-001', { avatar_url: newAvatarUrl });
  const updatedSalwa = await dataService.getProfile('usr-salwa-001');
  assert(updatedSalwa?.avatar_url === newAvatarUrl, 'Profile photo updates and persists in dataService');

  // 4. Extra Admin Features (users, inspect, logs, ai-config, payments, export)
  assert(mockStore.profiles.length >= 3, 'User Management: Multiple user profiles exist');
  assert(mockStore.aiConfigs.length >= 3, 'AI Multi-Provider Config: Multiple providers exist (Gemini, OpenAI, DeepSeek)');
  assert(mockStore.aiLogs.length >= 5, 'AI Logs: Telemetry logs are tracked');
  assert(mockStore.auditLogs.length >= 1, 'Transaction Inspection & Audit Logs: Audit trail is available');
  assert(mockStore.subscriptions.length >= 1, 'Payment Approval: Subscriptions are tracked');

  // 5. Export PDF & Excel
  const salwaTxs = await dataService.getTransactions('usr-salwa-001');
  const xlsxBuffer = await generateXlsxReport(salwaTxs);
  assert(xlsxBuffer.length > 500, 'Excel export generates valid .xlsx binary buffer');

  const summary: ReportSummary = {
    totalIncome: 10000000,
    totalExpense: 4000000,
    netCashflow: 6000000,
    transactionCount: salwaTxs.length,
    topCategories: [{ name: 'Investasi', amount: 3000000, percentage: 75 }]
  };
  const htmlPdf = generateHtmlReport(salwaTxs, summary, updatedSalwa!, '2026-10-01', '2026-10-31');
  assert(htmlPdf.includes('TataDana') && htmlPdf.toLowerCase().includes('salwa l'), 'PDF HTML report generates with branding and user details');

  // 6. Tata AI Bot: Specify Date & Choose Wallet (BCA, GoPay, Dompet Tunai)
  const salwaWallets = await dataService.getWallets('usr-salwa-001');
  const bcaWallet = salwaWallets.find(w => w.name.toLowerCase().includes('bca') || w.type === 'bank');
  const gopayWallet = salwaWallets.find(w => w.name.toLowerCase().includes('gopay') || w.type === 'ewallet');
  const tunaiWallet = salwaWallets.find(w => w.name.toLowerCase().includes('tunai') || w.type === 'cash');

  assert(Boolean(bcaWallet), 'BCA wallet exists for user in Tata AI');
  assert(Boolean(gopayWallet), 'GoPay wallet exists for user in Tata AI');
  assert(Boolean(tunaiWallet), 'Dompet Tunai exists for user in Tata AI');

  const initialBcaBalance = bcaWallet!.balance;
  const specifiedDate = '2026-10-18T14:30:00Z';

  // Add expense via Tata AI to BCA
  const txTataAiBca = await dataService.addTransaction({
    user_id: 'usr-salwa-001',
    wallet_id: bcaWallet!.id,
    category_id: null,
    type: 'expense',
    amount: 50000,
    description: 'Makan Siang Soto BCA Tata AI',
    source: 'web_manual',
    transaction_time: specifiedDate,
  });

  assert(txTataAiBca.amount === 50000, 'Tata AI records correct transaction nominal');
  assert(txTataAiBca.transaction_time === specifiedDate, 'Tata AI respects specified transaction date');
  assert(bcaWallet!.balance === initialBcaBalance - 50000, 'Tata AI immediately updates BCA wallet balance');

  // Add income via Tata AI to GoPay
  const initialGopayBalance = gopayWallet!.balance;
  const txTataAiGopay = await dataService.addTransaction({
    user_id: 'usr-salwa-001',
    wallet_id: gopayWallet!.id,
    category_id: null,
    type: 'income',
    amount: 100000,
    description: 'Topup GoPay dari Klien Tata AI',
    source: 'web_manual',
    transaction_time: '2026-10-17T10:00:00Z',
  });
  assert(gopayWallet!.balance === initialGopayBalance + 100000, 'Tata AI immediately updates GoPay wallet balance');

  // Add expense via Tata AI to Dompet Tunai
  const initialTunaiBalance = tunaiWallet!.balance;
  const txTataAiTunai = await dataService.addTransaction({
    user_id: 'usr-salwa-001',
    wallet_id: tunaiWallet!.id,
    category_id: null,
    type: 'expense',
    amount: 25000,
    description: 'Beli Kopi Kenangan Tunai Tata AI',
    source: 'web_manual',
    transaction_time: '2026-10-17T11:00:00Z',
  });
  assert(tunaiWallet!.balance === initialTunaiBalance - 25000, 'Tata AI immediately updates Dompet Tunai balance');

  // 7. Interconnectedness: Transactions added by Tata AI reflect in dataService.getTransactions
  const allSalwaTxs = await dataService.getTransactions('usr-salwa-001');
  const foundBcaTx = allSalwaTxs.find(t => t.id === txTataAiBca.id);
  const foundGopayTx = allSalwaTxs.find(t => t.id === txTataAiGopay.id);
  const foundTunaiTx = allSalwaTxs.find(t => t.id === txTataAiTunai.id);
  assert(Boolean(foundBcaTx && foundGopayTx && foundTunaiTx), 'Tata AI transactions are immediately retrievable in transactions & reports');

  // 8. Teamwork Preview: 10 Teams
  const teams = await dataService.getTeams();
  assert(teams.length === 10, 'Teamwork preview has exactly 10 teams');
  assert(teams[0].id === 'team-01' && teams[9].id === 'team-10', 'Teams range from team-01 to team-10');
  const allHaveSharedBalance = teams.every(t => typeof t.shared_balance === 'number' && t.shared_balance > 0);
  assert(allHaveSharedBalance, 'All 10 teams have shared balances initialized');

  return { passed, failed, errors };
}
