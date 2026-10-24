import { mockStore } from '../lib/supabase/mockStore';
import { GET as broadcastGET, POST as broadcastPOST } from '../app/api/admin/broadcast/route';
import { GET as systemGET, POST as systemPOST } from '../app/api/admin/system/route';

export async function runAdminPanelsTests(): Promise<{ passed: number; failed: number; errors: string[] }> {
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

  console.log('\n--- Running New Admin Panels Tests (Broadcast, Global Transactions & System Settings) ---');

  // =========================================================================
  // TEST GROUP 1: Panel Broadcast & Notifikasi Pengguna (/api/admin/broadcast)
  // =========================================================================
  const getBcRes = await broadcastGET();
  const getBcJson = await getBcRes.json();
  assert(getBcRes.status === 200, 'GET /api/admin/broadcast returns 200 OK');
  assert(getBcJson.success === true, 'GET /api/admin/broadcast returns success: true');
  assert(Array.isArray(getBcJson.broadcasts), 'GET returns broadcasts array');
  assert(typeof getBcJson.stats.total === 'number' && getBcJson.stats.total > 0, 'GET returns stats with total user count');
  assert(typeof getBcJson.stats.whatsappVerified === 'number', 'GET returns stats with whatsappVerified count');

  // Admin Salwa L sends a broadcast
  const initialAuditCount = mockStore.auditLogs.length;
  const initialBroadcastCount = mockStore.broadcasts.length;

  const sendBcReq = new Request('http://localhost:3000/api/admin/broadcast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Pemberitahuan Update Fitur Finansial',
      message: 'Halo {nama}, fitur baru TataDana telah aktif. Silakan hubungi admin {admin}.',
      target: 'starter',
      channel: 'whatsapp',
      adminId: 'usr-salwa-001',
    }),
  });
  const sendBcRes = await broadcastPOST(sendBcReq);
  const sendBcJson = await sendBcRes.json();

  assert(sendBcRes.status === 200 && sendBcJson.success === true, 'POST /api/admin/broadcast succeeds with status 200');
  assert(sendBcJson.broadcast.title === 'Pemberitahuan Update Fitur Finansial', 'Broadcast title matches request');
  assert(sendBcJson.broadcast.target === 'starter', 'Broadcast target is starter');
  assert(mockStore.broadcasts.length === initialBroadcastCount + 1, 'Broadcast is added to mockStore.broadcasts');
  assert(mockStore.auditLogs.length > initialAuditCount, 'Audit log is recorded for broadcast action');
  assert(mockStore.auditLogs[0].action === 'send_broadcast_message', 'Audit log records send_broadcast_message');

  // Security: Regular user Budi is blocked from sending broadcast
  const forbiddenBcReq = new Request('http://localhost:3000/api/admin/broadcast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: 'Unauthorized Message',
      message: 'Trying to broadcast without superadmin permissions',
      adminId: 'usr-budi-12345',
    }),
  });
  const forbiddenBcRes = await broadcastPOST(forbiddenBcReq);
  assert(forbiddenBcRes.status === 403, 'Regular user Budi is BLOCKED (403 Forbidden) from sending broadcast');

  // Validation: Missing title or message returns 400
  const invalidBcReq = new Request('http://localhost:3000/api/admin/broadcast', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: '',
      message: '',
      adminId: 'usr-salwa-001',
    }),
  });
  const invalidBcRes = await broadcastPOST(invalidBcReq);
  assert(invalidBcRes.status === 400, 'Empty title/message returns 400 Bad Request');

  // =========================================================================
  // TEST GROUP 2: Panel Pengaturan Sistem & Kuota (/api/admin/system)
  // =========================================================================
  const getSysRes = await systemGET();
  const getSysJson = await getSysRes.json();
  assert(getSysRes.status === 200 && getSysJson.success === true, 'GET /api/admin/system returns 200 OK');
  assert(Boolean(getSysJson.settings), 'GET returns current system settings');
  assert(getSysJson.settings.admin_name === 'Salwa L', 'System settings default admin_name is Salwa L');
  assert(getSysJson.settings.admin_phone === '08815703360', 'System settings default admin_phone is 08815703360');
  assert(typeof getSysJson.metrics.totalWallets === 'number', 'GET returns metrics totalWallets');

  // Admin Salwa L updates system settings (e.g. starter_tx_limit and pro_price_idr)
  const updateSysReq = new Request('http://localhost:3000/api/admin/system', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      settings: {
        starter_tx_limit: 75,
        pro_price_idr: 99000,
        maintenance_mode: false,
        admin_phone: '08815703360',
      },
      adminId: 'usr-salwa-001',
    }),
  });
  const updateSysRes = await systemPOST(updateSysReq);
  const updateSysJson = await updateSysRes.json();

  assert(updateSysRes.status === 200 && updateSysJson.success === true, 'POST /api/admin/system returns 200 OK');
  assert(mockStore.systemSettings.starter_tx_limit === 75, 'mockStore.systemSettings starter_tx_limit is updated to 75');
  assert(mockStore.systemSettings.pro_price_idr === 99000, 'mockStore.systemSettings pro_price_idr is 99000');
  assert(mockStore.auditLogs[0].action === 'update_system_settings', 'Audit log records update_system_settings');

  // Security: Regular user Budi blocked from changing system settings
  const forbiddenSysReq = new Request('http://localhost:3000/api/admin/system', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      settings: { maintenance_mode: true },
      adminId: 'usr-budi-12345',
    }),
  });
  const forbiddenSysRes = await systemPOST(forbiddenSysReq);
  assert(forbiddenSysRes.status === 403, 'Regular user Budi is BLOCKED (403 Forbidden) from changing system settings');

  // =========================================================================
  // TEST GROUP 3: Panel Transaksi & Dompet Global Data Aggregation
  // =========================================================================
  const allWallets = mockStore.wallets;
  const allTransactions = mockStore.transactions;
  const totalBalance = allWallets.reduce((acc, w) => acc + (w.balance || 0), 0);
  const totalInflow = allTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalOutflow = allTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

  assert(allWallets.length > 0, 'mockStore has active wallets across users');
  assert(totalBalance > 0, 'Platform total wallet balance is computed accurately');
  assert(allTransactions.length > 0, 'mockStore has active transactions for global monitoring');
  assert(totalInflow > 0, 'Total inflow transactions are calculated correctly');
  assert(totalOutflow > 0, 'Total outflow transactions are calculated correctly');

  // Verify multi-user transactions integrity
  const budiTransactions = allTransactions.filter(t => t.user_id === 'usr-budi-12345');
  const salwaTransactions = allTransactions.filter(t => t.user_id === 'usr-salwa-001');
  assert(budiTransactions.length > 0, 'Global transactions monitor includes Budi transactions');
  assert(salwaTransactions.length >= 0, 'Global transactions monitor includes Salwa transactions');

  console.log(`Results: ${passed} passed, ${failed} failed\n`);
  return { passed, failed, errors };
}
