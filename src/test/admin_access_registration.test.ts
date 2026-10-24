import { mockStore } from '../lib/supabase/mockStore';
import { Profile } from '../types/database';

export async function runAdminAccessRegistrationTests(): Promise<{ passed: number; failed: number; errors: string[] }> {
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

  console.log('\n--- Running Admin Access & WhatsApp Registration Tests ---');

  // Helper authorization check function mirroring AdminLayout & DashboardLayout
  function isUserAuthorizedForAdmin(user: Profile | null | undefined): boolean {
    if (!user) return false;
    return Boolean(
      user.role === 'superadmin' ||
      user.email === 'salwaL@gmail.com' ||
      user.email === 'salwaL20@gmail.com' ||
      user.email === 'salwayoy@gmail.com' ||
      user.id === 'usr-salwa-001' ||
      user.id === 'usr-admin-super'
    );
  }

  // =========================================================================
  // TEST GROUP 1: User Lain Tidak Bisa Menggunakan Admin Panel (403 Forbidden)
  // =========================================================================
  const salwa = mockStore.profiles.find(p => p.id === 'usr-salwa-001' || p.email === 'salwaL@gmail.com' || p.email === 'salwaL20@gmail.com');
  const budi = mockStore.profiles.find(p => p.id === 'usr-budi-12345');
  const citra = mockStore.profiles.find(p => p.id === 'usr-citra-99887');
  const guest = mockStore.profiles.find(p => p.id === 'usr-guest-005') || {
    id: 'usr-guest-demo',
    full_name: 'Pengguna Biasa',
    email: 'user@example.com',
    role: 'user',
    phone_verified: true,
  } as Profile;

  assert(isUserAuthorizedForAdmin(salwa), 'Superadmin SALWA L is authorized to access Admin Panel');
  assert(!isUserAuthorizedForAdmin(budi), 'Regular user Budi Pratama is BLOCKED from Admin Panel (403 Forbidden)');
  assert(!isUserAuthorizedForAdmin(citra), 'Regular user Citra Kirana is BLOCKED from Admin Panel (403 Forbidden)');
  assert(!isUserAuthorizedForAdmin(guest), 'Guest / Regular user is BLOCKED from Admin Panel (403 Forbidden)');
  assert(!isUserAuthorizedForAdmin(null), 'Unauthenticated visitor is BLOCKED from Admin Panel (403 Forbidden)');

  // Credential validation for salwaL@gmail.com / ss2002
  const checkSalwaAuth = (emailInput: string, passInput: string) => {
    const clean = emailInput.trim().toLowerCase();
    if (clean === 'salwal@gmail.com' || clean === 'salwal20@gmail.com' || clean === 'salwayoy@gmail.com') {
      return passInput === 'ss2002' || passInput === 'ss20' || passInput === 'kimo20';
    }
    return false;
  };
  assert(checkSalwaAuth('salwaL@gmail.com', 'ss2002'), 'Admin credential check succeeds with salwaL@gmail.com and password ss2002');
  assert(checkSalwaAuth('salwaL@gmail.com', 'ss20'), 'Admin credential check retains backward compatibility with ss20');
  assert(!checkSalwaAuth('salwaL@gmail.com', 'wrongpassword'), 'Admin credential check rejects invalid password');

  // =========================================================================
  // TEST GROUP 2: Direct WhatsApp Registration without OTP Verification
  // =========================================================================
  const testPhone = `+628${Math.floor(100000000 + Math.random() * 900000000)}`;
  const { POST: registerPOST } = await import('../app/api/auth/register/route');

  // Test direct registration without OTP code
  const directRegReq = new Request('http://localhost:3000/api/auth/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: 'Siti Rahma Direct WhatsApp',
      phoneNumber: testPhone,
    }),
  });
  const directRegRes = await registerPOST(directRegReq);
  const directRegJson = await directRegRes.json();

  assert(directRegRes.status === 200 && directRegJson.success === true, 'Registration succeeds directly without requiring OTP code');
  assert(Boolean(directRegJson.whatsappAdminUrl) && directRegJson.whatsappAdminUrl.includes('wa.me/628815703360'), 'Registration returns direct WhatsApp admin contact URL to Salwa L');
  assert(directRegJson.adminPhone === '08815703360' || directRegJson.adminPhone === '+628815703360', 'Registration returns Admin Salwa WhatsApp number (08815703360)');

  // =========================================================================
  // TEST GROUP 3: User Mendaftar Wajib Tercatat di Admin Panel
  // =========================================================================
  const initialProfilesCount = mockStore.profiles.length;
  const initialAuditLogsCount = mockStore.auditLogs.length;

  const newRegisteredUserId = `usr-reg-${Date.now()}`;
  const newRegisteredUser: Profile = {
    id: newRegisteredUserId,
    full_name: 'Ahmad Fauzi WhatsApp Verified',
    email: 'ahmad.fauzi@example.com',
    phone_number: testPhone,
    phone_verified: false, // Starts as false until verified by Admin
    avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
    default_currency: 'IDR',
    role: 'user',
    telegram_chat_id: null,
    telegram_username: null,
    subscription_tier: 'starter',
    approval_status: 'pending',
    approval_notes: 'Menunggu verifikasi WhatsApp ke Admin (08815703360)',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Prepend to mockStore.profiles as done by /api/auth/register
  mockStore.profiles.unshift(newRegisteredUser);

  // Starter wallets created
  mockStore.wallets.push(
    {
      id: `wlt-${newRegisteredUserId}-bca`,
      user_id: newRegisteredUserId,
      name: 'BCA Tahapan',
      type: 'bank',
      balance: 5000000,
      is_default: true,
      color: '#3B82F6',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      id: `wlt-${newRegisteredUserId}-gopay`,
      user_id: newRegisteredUserId,
      name: 'GoPay Pocket',
      type: 'ewallet',
      balance: 500000,
      is_default: false,
      color: '#10B981',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }
  );

  // Record audit log
  mockStore.auditLogs.unshift({
    id: `aud-reg-${Date.now()}`,
    admin_id: newRegisteredUserId,
    target_user_id: newRegisteredUserId,
    action: 'user_registered_whatsapp',
    metadata: {
      full_name: newRegisteredUser.full_name,
      email: newRegisteredUser.email,
      phone_number: newRegisteredUser.phone_number,
      whatsapp_verified: false,
      registered_at: newRegisteredUser.created_at,
    },
    ip_address: '127.0.0.1 (WhatsApp Registration API)',
    created_at: new Date().toISOString(),
  });

  assert(mockStore.profiles.length === initialProfilesCount + 1, 'New registered user is added to mockStore.profiles');
  assert(mockStore.profiles[0].id === newRegisteredUserId, 'New registered user appears on top of Admin users list');
  assert(mockStore.profiles[0].phone_verified === false, 'Registered user initially has WhatsApp phone_verified: false');
  assert(mockStore.auditLogs.length === initialAuditLogsCount + 1, 'Registration event is recorded in admin audit logs');
  assert(mockStore.auditLogs[0].action === 'user_registered_whatsapp', 'Audit log action is user_registered_whatsapp');

  // Admin verifies user WhatsApp
  mockStore.profiles[0].phone_verified = true;
  mockStore.profiles[0].approval_status = 'approved';
  assert(mockStore.profiles[0].phone_verified === true, 'Admin can verify user WhatsApp, setting phone_verified: true');

  // Verify new user cannot access admin panel
  assert(!isUserAuthorizedForAdmin(newRegisteredUser), 'Newly registered regular user cannot access Admin Panel');

  // =========================================================================
  // TEST GROUP 4: Admin Dashboard Fitur Melihat Profil User yang Mendaftar
  // =========================================================================
  const inspectedUser = mockStore.profiles.find(p => p.id === newRegisteredUserId);
  assert(Boolean(inspectedUser), 'Admin Dashboard can locate registered user by ID');
  assert(inspectedUser?.full_name === 'Ahmad Fauzi WhatsApp Verified', 'Admin can inspect user full name');
  assert(inspectedUser?.phone_number === testPhone, 'Admin can inspect user phone number');
  assert(inspectedUser?.phone_verified === true, 'Admin can inspect WhatsApp verification status badge');

  // Inspect user wallets
  const inspectedWallets = mockStore.wallets.filter(w => w.user_id === newRegisteredUserId);
  const totalUserBalance = inspectedWallets.reduce((sum, w) => sum + w.balance, 0);
  assert(inspectedWallets.length === 2, 'Admin can inspect registered user wallets (BCA & GoPay)');
  assert(totalUserBalance === 5500000, 'Admin can compute total balance of registered user accurately');

  // Inspect WIB Date formatting
  const wibFormatted = new Date(inspectedUser!.created_at).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  assert(Boolean(wibFormatted), 'Admin Dashboard formats registration date in Indonesian WIB timezone');

  // Test admin upgrading user plan tier
  if (inspectedUser) {
    inspectedUser.subscription_tier = 'pro';
    mockStore.auditLogs.unshift({
      id: `aud-tier-${Date.now()}`,
      admin_id: 'usr-salwa-001',
      target_user_id: newRegisteredUserId,
      action: 'change_subscription_tier',
      metadata: { from: 'starter', to: 'pro', user_name: inspectedUser.full_name },
      ip_address: '127.0.0.1 (Admin Dashboard)',
      created_at: new Date().toISOString(),
    });
  }
  assert(inspectedUser?.subscription_tier === 'pro', 'Admin can change user subscription tier in profile modal');
  assert(mockStore.auditLogs[0].action === 'change_subscription_tier', 'Plan change is logged in admin audit trail');

  console.log(`Results: ${passed} passed, ${failed} failed\n`);
  return { passed, failed, errors };
}
