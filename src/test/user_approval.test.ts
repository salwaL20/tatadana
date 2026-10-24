import { mockStore } from '../lib/supabase/mockStore';
import { Profile } from '../types/database';
import { GET as approveGET, POST as approvePOST } from '../app/api/admin/users/approve/route';
import { POST as registerPOST } from '../app/api/auth/register/route';

export async function runUserApprovalTests(): Promise<{ passed: number; failed: number; errors: string[] }> {
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

  console.log('\n--- Running User Approval Feature Tests ---');

  // 1. Initial State Checks
  const salwa = mockStore.profiles.find(p => p.id === 'usr-salwa-001' || p.email?.toLowerCase() === 'salwal@gmail.com' || p.email?.toLowerCase() === 'salwal20@gmail.com');
  const pendingDemo = mockStore.profiles.find(p => p.id === 'usr-pending-001');
  if (pendingDemo) {
    pendingDemo.approval_status = 'pending';
  }

  assert(Boolean(salwa), 'Admin Salwa L exists in mockStore');
  assert(salwa?.approval_status === 'approved', 'Salwa L is pre-approved');
  assert(Boolean(pendingDemo), 'Pending demo user (usr-pending-001) exists in mockStore');
  assert(pendingDemo?.approval_status === 'pending', 'usr-pending-001 has initial pending approval status');

  // 2. GET /api/admin/users/approve (Stats & Pending List)
  const statsRes = await approveGET();
  const statsJson = await statsRes.json();
  assert(statsRes.status === 200, 'GET /api/admin/users/approve returns status 200');
  assert(statsJson.success === true, 'GET response includes success: true');
  assert(typeof statsJson.stats.total === 'number' && statsJson.stats.total > 0, 'Approval stats return total user count');
  assert(typeof statsJson.stats.pending === 'number' && statsJson.stats.pending >= 1, 'Approval stats return pending user count');
  assert(Array.isArray(statsJson.pendingUsers), 'Approval response contains pendingUsers array');
  assert(statsJson.pendingUsers.some((u: Profile) => u.id === 'usr-pending-001'), 'usr-pending-001 is included in pendingUsers list');

  // 3. New User Registration defaults to approval_status: 'pending'
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const testPhone = `+62812${randomSuffix}`;
  const regReq = new Request('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: `User Test Approval ${randomSuffix}`,
      phoneNumber: testPhone,
    }),
  });
  const regRes = await registerPOST(regReq);
  const regJson = await regRes.json();

  assert(regRes.status === 200 && regJson.success === true, 'Registration succeeds');
  assert(regJson.user.approval_status === 'pending', 'Newly registered user defaults to approval_status: pending');
  assert(regJson.approvalStatus === 'pending', 'Registration response explicitly returns approvalStatus: pending');

  const registeredUserId = regJson.user.id;

  // 4. Admin Salwa L verifies & approves the registered user (action: 'verify')
  const initialAuditCount = mockStore.auditLogs.length;
  const approveReq = new Request('http://localhost:3000/api/admin/users/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: registeredUserId,
      action: 'verify',
      notes: 'Nomor WhatsApp diverifikasi & disetujui langsung oleh Salwa L via WhatsApp',
      adminId: 'usr-salwa-001',
    }),
  });
  const approveRes = await approvePOST(approveReq);
  const approveJson = await approveRes.json();

  assert(approveRes.status === 200 && approveJson.success === true, 'POST verify returns status 200 and success');
  assert(approveJson.approvalStatus === 'approved', 'Response returns approvalStatus: approved');
  assert(approveJson.phoneVerified === true, 'Response returns phoneVerified: true');

  const approvedInStore = mockStore.profiles.find(p => p.id === registeredUserId);
  assert(approvedInStore?.approval_status === 'approved', 'User profile in mockStore is updated to approved');
  assert(approvedInStore?.phone_verified === true, 'User phone_verified in mockStore is updated to true upon verification');
  assert(Boolean(approvedInStore?.approved_at), 'approved_at timestamp is recorded');
  assert(approvedInStore?.approved_by === 'usr-salwa-001', "approved_by records 'usr-salwa-001'");
  assert(mockStore.auditLogs.length > initialAuditCount, 'Audit log is created for approval action');
  assert(mockStore.auditLogs[0].action === 'user_approval_approved', 'Audit log records user_approval_approved');

  // 5. Admin Salwa L rejects a user (action: 'reject')
  const rejectReq = new Request('http://localhost:3000/api/admin/users/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: registeredUserId,
      action: 'reject',
      notes: 'Nomor WhatsApp tidak aktif / pendaftaran palsu',
      adminId: 'usr-salwa-001',
    }),
  });
  const rejectRes = await approvePOST(rejectReq);
  const rejectJson = await rejectRes.json();

  assert(rejectRes.status === 200 && rejectJson.success === true, 'POST reject returns status 200');
  assert(rejectJson.approvalStatus === 'rejected', 'Response returns approvalStatus: rejected');
  assert(approvedInStore?.approval_status === 'rejected', 'User profile in mockStore is updated to rejected');
  assert(approvedInStore?.approval_notes?.includes('Nomor WhatsApp'), 'Rejection notes are stored');
  assert(mockStore.auditLogs[0].action === 'user_approval_rejected', 'Audit log records user_approval_rejected');

  // 6. Admin Salwa L resets a user back to pending (action: 'reset')
  const resetReq = new Request('http://localhost:3000/api/admin/users/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: registeredUserId,
      action: 'reset',
      notes: 'Pendaftaran ditinjau ulang',
      adminId: 'usr-salwa-001',
    }),
  });
  const resetRes = await approvePOST(resetReq);
  const resetJson = await resetRes.json();

  assert(resetRes.status === 200 && resetJson.success === true, 'POST reset returns status 200');
  assert(resetJson.approvalStatus === 'pending', 'Response returns approvalStatus: pending');
  assert(approvedInStore?.approval_status === 'pending', 'User in mockStore is reset back to pending');
  assert(mockStore.auditLogs[0].action === 'user_approval_reset', 'Audit log records user_approval_reset');

  // 7. Security: Non-admin user is BLOCKED from approving (403 Forbidden)
  const forbiddenReq = new Request('http://localhost:3000/api/admin/users/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: registeredUserId,
      action: 'approve',
      adminId: 'usr-budi-12345', // regular user
    }),
  });
  const forbiddenRes = await approvePOST(forbiddenReq);
  assert(forbiddenRes.status === 403, 'Regular user (Budi) is BLOCKED with 403 Forbidden from approving users');

  // 8. Validation: Invalid action / missing userId
  const invalidReq = new Request('http://localhost:3000/api/admin/users/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      userId: registeredUserId,
      action: 'invalid_action',
      adminId: 'usr-salwa-001',
    }),
  });
  const invalidRes = await approvePOST(invalidReq);
  assert(invalidRes.status === 400, 'Invalid action returns 400 Bad Request');

  const missingUserReq = new Request('http://localhost:3000/api/admin/users/approve', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      action: 'approve',
      adminId: 'usr-salwa-001',
    }),
  });
  const missingUserRes = await approvePOST(missingUserReq);
  assert(missingUserRes.status === 400, 'Missing userId returns 400 Bad Request');

  console.log(`Results: ${passed} passed, ${failed} failed\n`);
  return { passed, failed, errors };
}
