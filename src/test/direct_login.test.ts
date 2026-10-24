import { mockStore } from '../lib/supabase/mockStore';
import { POST as loginPOST, GET as loginGET } from '../app/api/auth/login/route';
import { POST as registerPOST } from '../app/api/auth/register/route';
import { Profile } from '../types/database';

export async function runDirectLoginTests(): Promise<{ passed: number; failed: number; errors: string[] }> {
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

  console.log('\n--- Running Direct Login & Approval Bypass Tests ---');

  // 1. Validation: Empty input returns 400 Bad Request
  const emptyReq = new Request('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({}),
  });
  const emptyRes = await loginPOST(emptyReq);
  const emptyJson = await emptyRes.json();
  assert(emptyRes.status === 400, 'Empty login input returns 400 Bad Request');
  assert(emptyJson.success === false, 'Empty login response has success: false');

  // 2. Unregistered phone number returns 404 Not Found
  const unregPhone = '+6289999999999';
  const unregReq = new Request('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber: unregPhone }),
  });
  const unregRes = await loginPOST(unregReq);
  const unregJson = await unregRes.json();
  assert(unregRes.status === 404, 'Unregistered phone returns 404 Not Found');
  assert(unregJson.error.includes('belum terdaftar'), 'Unregistered phone returns clear error message');

  // 3. Register a new user with pending status
  const randomSuffix = Math.floor(100000 + Math.random() * 900000);
  const testPhone = `+628877${randomSuffix}`;
  const regReq = new Request('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: `User Direct Login Test ${randomSuffix}`,
      phoneNumber: testPhone,
    }),
  });
  const regRes = await registerPOST(regReq);
  const regJson = await regRes.json();
  assert(regRes.status === 200 && regJson.success === true, 'New user registered successfully');
  assert(regJson.user.approval_status === 'pending', 'User initially has pending approval status');

  const registeredUserId = regJson.user.id;

  // 4. User logs in via Direct Login with phoneNumber (+628877...)
  // Should bypass approval and automatically grant approved status!
  const loginReq1 = new Request('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber: testPhone }),
  });
  const loginRes1 = await loginPOST(loginReq1);
  const loginJson1 = await loginRes1.json();

  assert(loginRes1.status === 200, 'Direct login returns status 200');
  assert(loginJson1.success === true, 'Direct login response has success: true');
  assert(loginJson1.user.id === registeredUserId, 'Direct login returns the correct registered user');
  assert(loginJson1.user.approval_status === 'approved', 'User approval_status is automatically set to approved upon direct login');
  assert(loginJson1.user.phone_verified === true, 'User phone_verified is automatically set to true');
  assert(loginJson1.directAccess === true, 'Response flags directAccess: true');
  assert(loginJson1.bypassedApproval === true, 'Response flags bypassedApproval: true');

  // Verify in mockStore profiles
  const inStore = mockStore.profiles.find(p => p.id === registeredUserId);
  assert(inStore?.approval_status === 'approved', 'User profile in mockStore is updated to approved');
  assert(inStore?.phone_verified === true, 'User profile phone_verified is updated to true');

  // Verify audit log
  const audit = mockStore.auditLogs.find(a => a.target_user_id === registeredUserId && a.action === 'user_direct_login_auto_approved');
  assert(Boolean(audit), 'Audit log records user_direct_login_auto_approved action');

  // 5. User logs in using local Indonesian format (08877...)
  const localFormatPhone = testPhone.replace('+62', '0');
  const loginReq2 = new Request('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber: localFormatPhone }),
  });
  const loginRes2 = await loginPOST(loginReq2);
  const loginJson2 = await loginRes2.json();

  assert(loginRes2.status === 200, 'Login using local 08... format returns 200');
  assert(loginJson2.user.id === registeredUserId, 'Login matches the user regardless of +62 vs 08 format');

  // 6. Direct Login using Email
  const demoEmailUser = mockStore.profiles.find(p => p.id === 'usr-budi-12345');
  const emailLoginReq = new Request('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'budi@example.com' }),
  });
  const emailLoginRes = await loginPOST(emailLoginReq);
  const emailLoginJson = await emailLoginRes.json();

  assert(emailLoginRes.status === 200, 'Direct login via email returns 200');
  assert(emailLoginJson.user.email === 'budi@example.com', 'Returns correct profile for Budi Pratama');
  assert(emailLoginJson.user.approval_status === 'approved', 'Budi profile is approved');

  // 7. Admin SALWA L login with name "SALWA L" and password "ss2002"
  const salwaNameReq = new Request('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'SALWA L', password: 'ss2002' }),
  });
  const salwaNameRes = await loginPOST(salwaNameReq);
  const salwaNameJson = await salwaNameRes.json();
  assert(salwaNameRes.status === 200, 'Admin login with name "SALWA L" returns 200');
  assert(salwaNameJson.user.role === 'superadmin', 'Admin login assigns superadmin role');
  assert(salwaNameJson.user.id === 'usr-salwa-001', 'Admin login returns usr-salwa-001 profile');

  // 8. Admin SALWA L login with email "salwaL@gmail.com" and password "ss2002"
  const salwaEmailReq = new Request('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'salwaL@gmail.com', password: 'ss2002' }),
  });
  const salwaEmailRes = await loginPOST(salwaEmailReq);
  const salwaEmailJson = await salwaEmailRes.json();
  assert(salwaEmailRes.status === 200, 'Admin login with email "salwaL@gmail.com" returns 200');
  assert(salwaEmailJson.user.email === 'salwaL@gmail.com', 'Returns Salwa updated email salwaL@gmail.com');
  assert(salwaEmailJson.user.role === 'superadmin', 'Returns superadmin role');

  // 9. Admin SALWA L login with wrong password returns 401
  const salwaWrongReq = new Request('http://localhost:3000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ identifier: 'SALWA L', password: 'wrongpassword' }),
  });
  const salwaWrongRes = await loginPOST(salwaWrongReq);
  assert(salwaWrongRes.status === 401, 'Admin login with wrong password returns 401 Unauthorized');

  // 10. GET /api/auth/login (Health & status check)
  const healthRes = await loginGET(new Request('http://localhost:3000/api/auth/login'));
  const healthJson = await healthRes.json();
  assert(healthRes.status === 200, 'GET /api/auth/login returns status 200');
  assert(healthJson.service.includes('Direct Login API'), 'GET returns service description');

  // 8. GET /api/auth/login?recent=true
  const recentRes = await loginGET(new Request('http://localhost:3000/api/auth/login?recent=true'));
  const recentJson = await recentRes.json();
  assert(recentRes.status === 200, 'GET recent users returns 200');
  assert(Array.isArray(recentJson.users) && recentJson.users.length > 0, 'GET returns array of registered users');

  console.log(`Results: ${passed} passed, ${failed} failed\n`);
  return { passed, failed, errors };
}
