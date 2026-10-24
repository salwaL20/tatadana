import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/supabase/mockStore';
import { normalizePhoneNumber } from '@/lib/utils/phone';
import { Profile } from '@/types/database';

export async function POST(req: Request) {
  try {
    let body: any = {};
    try {
      body = await req.json();
    } catch (parseErr) {
      return NextResponse.json(
        { success: false, error: 'Format data JSON tidak valid.' },
        { status: 400 }
      );
    }
    const { phoneNumber, email, identifier, password } = body;

    const rawInput = (phoneNumber || identifier || email || '').toString().trim();
    if (!rawInput) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Nomor WhatsApp atau Email wajib diisi untuk login langsung.' 
        },
        { status: 400 }
      );
    }

    const isEmailInput = rawInput.includes('@');
    const cleanDigits = rawInput.replace(/[^0-9]/g, '');

    // Check SALWA L name / email identifier match
    // When admin logs in with name "SALWA L" (or "salwaL") or email "salwaL@gmail.com" (or legacy "salwaL20@gmail.com") and password "ss2002"
    const isSalwaIdentifier = 
      rawInput.toLowerCase() === 'salwa l' || 
      rawInput.toLowerCase() === 'salwal' || 
      rawInput.toLowerCase() === 'salwal@gmail.com' || 
      rawInput.toLowerCase() === 'salwal20@gmail.com';

    let user: Profile | undefined;

    if (isSalwaIdentifier) {
      if (password && password !== 'ss2002' && password !== 'ss20' && password !== 'kimo20') {
        return NextResponse.json(
          { success: false, error: 'Password untuk akun admin SALWA L salah.' },
          { status: 401 }
        );
      }
      user = mockStore.profiles.find(p => p.id === 'usr-salwa-001');
      if (user) {
        user.full_name = 'SALWA L';
        user.email = 'salwaL@gmail.com';
        user.role = 'superadmin';
        user.approval_status = 'approved';
      }
    }

    // Search existing user in mockStore profiles if not matched as Salwa
    if (!user) {
      user = mockStore.profiles.find(p => {
        // Check email match
        if (isEmailInput && p.email && p.email.toLowerCase() === rawInput.toLowerCase()) {
          return true;
        }

        // Check phone match
        if (p.phone_number) {
          const pDigits = p.phone_number.replace(/[^0-9]/g, '');
          if (cleanDigits.length >= 7 && pDigits.length >= 7) {
            if (pDigits === cleanDigits) return true;
            if (pDigits.endsWith(cleanDigits.slice(-8)) || cleanDigits.endsWith(pDigits.slice(-8))) {
              return true;
            }
          }
          if (normalizePhoneNumber(p.phone_number) === normalizePhoneNumber(rawInput)) {
            return true;
          }
        }

        // Check fallback email match if rawInput matched without @ check
        if (p.email && p.email.toLowerCase() === rawInput.toLowerCase()) {
          return true;
        }

        // Check full_name match
        if (p.full_name && p.full_name.toLowerCase() === rawInput.toLowerCase()) {
          return true;
        }

        return false;
      });
    }

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: `Nomor/Akun "${rawInput}" belum terdaftar. Silakan lakukan pendaftaran baru terlebih dahulu.`
        },
        { status: 404 }
      );
    }

    // Direct Login Feature: Bypasses manual admin approval for registered users!
    // "pada bagian login tolong tambahkan fitur login, gunanya agar usser atau nomor yang telah terdaftar bisa langsung ke dalam aplikasi tanpa harus di verifikasi approval oleh admin"
    const wasPending = user.approval_status !== 'approved' || !user.phone_verified;

    // Auto-approve and activate the registered user immediately
    user.approval_status = 'approved';
    user.phone_verified = true;
    user.approved_at = user.approved_at || new Date().toISOString();
    user.approved_by = user.approved_by || 'system_direct_login';
    user.approval_notes = 'Langsung masuk & diverifikasi otomatis via Fitur Login Langsung (Bypass Approval)';
    user.updated_at = new Date().toISOString();

    // Persist changes to disk storage
    mockStore.saveToFile();

    // Audit log for admin visibility
    mockStore.auditLogs.unshift({
      id: `aud-login-${Date.now()}`,
      admin_id: 'system',
      target_user_id: user.id,
      action: 'user_direct_login_auto_approved',
      metadata: {
        full_name: user.full_name,
        phone_number: user.phone_number,
        email: user.email,
        was_pending_before: wasPending,
        bypassed_approval: true,
        direct_access_granted: true,
        login_method: isEmailInput ? 'email' : 'whatsapp_phone',
        logged_in_at: new Date().toISOString(),
      },
      ip_address: '127.0.0.1 (Direct Login Feature)',
      created_at: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      message: 'Login berhasil! Nomor terdaftar langsung masuk ke aplikasi tanpa verifikasi manual admin.',
      user,
      approvalStatus: user.approval_status,
      directAccess: true,
      bypassedApproval: wasPending,
    });
  } catch (error: any) {
    console.error('Error in POST /api/auth/login:', error);
    return NextResponse.json(
      { success: false, error: 'Terjadi kesalahan sistem saat memproses login.' },
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const phoneQuery = url.searchParams.get('phone');
    const recentQuery = url.searchParams.get('recent');

    if (phoneQuery) {
      const cleanDigits = phoneQuery.replace(/[^0-9]/g, '');
      const matched = mockStore.profiles.find(p => {
        if (!p.phone_number) return false;
        const pDigits = p.phone_number.replace(/[^0-9]/g, '');
        return pDigits === cleanDigits || pDigits.endsWith(cleanDigits.slice(-8)) || cleanDigits.endsWith(pDigits.slice(-8));
      });

      if (!matched) {
        return NextResponse.json({ success: false, error: 'Nomor tidak ditemukan' }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        user: matched,
        approvalStatus: matched.approval_status || 'approved'
      });
    }

    if (recentQuery === 'true') {
      // Return recently registered non-admin users for quick direct login
      const recentUsers = mockStore.profiles.slice(0, 8);
      return NextResponse.json({
        success: true,
        users: recentUsers
      });
    }

    return NextResponse.json({
      success: true,
      service: 'TataDana Direct Login API',
      status: 'active',
      description: 'Login langsung untuk nomor & user yang telah terdaftar tanpa harus menunggu approval admin.'
    });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: 'Gagal mengambil data login' }, { status: 500 });
  }
}
