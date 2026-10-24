import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/supabase/mockStore';
import { Profile, Wallet, Category } from '@/types/database';
import { normalizePhoneNumber } from '@/lib/utils/phone';

export async function POST(req: Request) {
  try {
    const { fullName, email, password, phoneNumber, otpCode } = await req.json();

    if (!fullName || typeof fullName !== 'string' || !fullName.trim()) {
      return NextResponse.json({ error: 'Nama lengkap wajib diisi' }, { status: 400 });
    }
    if (!phoneNumber || typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
      return NextResponse.json({ error: 'Nomor WhatsApp wajib diisi' }, { status: 400 });
    }
    const cleanPhone = normalizePhoneNumber(phoneNumber);
    const rawPhone = phoneNumber.trim();

    // OTP verification is eliminated as requested by user.
    // Users directly contact Admin via WhatsApp. If an OTP is optionally supplied, consume it cleanly.
    if (otpCode && typeof otpCode === 'string' && otpCode.trim()) {
      mockStore.otpStore.delete(cleanPhone);
      mockStore.otpStore.delete(rawPhone);
    }

    // Check if user already exists
    const existing = mockStore.profiles.find(
      p => (p.phone_number && (normalizePhoneNumber(p.phone_number) === cleanPhone || p.phone_number === rawPhone)) || 
           (email && p.email && p.email.toLowerCase() === email.trim().toLowerCase())
    );

    if (existing) {
      existing.phone_verified = false;
      existing.approval_status = 'pending';
      existing.approval_notes = 'Menunggu verifikasi WhatsApp ke Admin (08815703360)';
      existing.phone_number = cleanPhone;
      existing.full_name = fullName.trim();
      if (email) existing.email = email.trim().toLowerCase();
      existing.updated_at = new Date().toISOString();

      // Move to top of mockStore.profiles
      const exIdx = mockStore.profiles.findIndex(p => p.id === existing.id);
      if (exIdx > 0) {
        mockStore.profiles.splice(exIdx, 1);
        mockStore.profiles.unshift(existing);
      }
      mockStore.saveToFile();

      // Record audit log for Admin Inspection
      mockStore.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        admin_id: existing.id,
        target_user_id: existing.id,
        action: 'user_registered_whatsapp',
        metadata: {
          full_name: existing.full_name,
          email: existing.email,
          phone_number: existing.phone_number,
          whatsapp_verified: false,
          approval_status: 'pending',
          registered_at: existing.created_at,
          is_existing_updated: true,
        },
        ip_address: '127.0.0.1 (Web WhatsApp Registration)',
        created_at: new Date().toISOString(),
      });

      const adminWhatsAppNumber = '628815703360';
      const waMessage = `Halo Admin TataDana Salwa L, saya sudah mendaftar/memperbarui akun TataDana atas nama ${existing.full_name} (${existing.phone_number}). Mohon verifikasi akun saya.`;
      const whatsappAdminUrl = `https://wa.me/${adminWhatsAppNumber}?text=${encodeURIComponent(waMessage)}`;

      return NextResponse.json({
        success: true,
        message: 'Nomor WhatsApp berhasil didaftarkan! Silakan hubungi admin via WhatsApp (08815703360) untuk meminta verifikasi.',
        user: existing,
        approvalStatus: existing.approval_status,
        whatsappAdminUrl,
        adminPhone: '08815703360',
      });
    }

    const userId = `usr-${Date.now()}`;
    const newProfile: Profile = {
      id: userId,
      full_name: fullName.trim(),
      email: email && email.trim() ? email.trim().toLowerCase() : `${cleanPhone.replace(/[^0-9]/g, '')}@tatadana.id`,
      phone_number: cleanPhone,
      phone_verified: false, // Wajib meminta verifikasi ke WA Admin (08815703360)
      avatar_url: `https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150`,
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

    // Add to beginning of mockStore.profiles so it appears on top in Admin
    mockStore.profiles.unshift(newProfile);

    // Create default starter wallets
    const defaultWallets: Wallet[] = [
      {
        id: `wlt-${userId}-bca`,
        user_id: userId,
        name: 'BCA Tahapan',
        type: 'bank',
        balance: 5000000,
        is_default: true,
        color: '#3B82F6',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: `wlt-${userId}-gopay`,
        user_id: userId,
        name: 'GoPay Pocket',
        type: 'ewallet',
        balance: 500000,
        is_default: false,
        color: '#10B981',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: `wlt-${userId}-cash`,
        user_id: userId,
        name: 'Dompet Tunai',
        type: 'cash',
        balance: 300000,
        is_default: false,
        color: '#F59E0B',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
    mockStore.wallets.push(...defaultWallets);

    // Create initial categories
    const defaultCategories: Category[] = [
      {
        id: `cat-${userId}-01`,
        user_id: userId,
        name: 'Makanan & Minuman',
        emoji: '🍜',
        type: 'expense',
        color: '#F97316',
        monthly_budget: 1500000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: `cat-${userId}-02`,
        user_id: userId,
        name: 'Transportasi',
        emoji: '🚗',
        type: 'expense',
        color: '#10B981',
        monthly_budget: 750000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: `cat-${userId}-03`,
        user_id: userId,
        name: 'Tagihan & Wifi',
        emoji: '🏠',
        type: 'expense',
        color: '#EF4444',
        monthly_budget: 500000,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
      {
        id: `cat-${userId}-04`,
        user_id: userId,
        name: 'Gaji & Pendapatan',
        emoji: '💼',
        type: 'income',
        color: '#10B981',
        monthly_budget: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }
    ];
    mockStore.categories.push(...defaultCategories);

    // Record audit log for Admin Inspection
    mockStore.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      admin_id: userId,
      target_user_id: userId,
      action: 'user_registered_whatsapp',
      metadata: {
        full_name: newProfile.full_name,
        email: newProfile.email,
        phone_number: newProfile.phone_number,
        whatsapp_verified: true,
        registered_at: newProfile.created_at,
      },
      ip_address: '127.0.0.1 (Web WhatsApp Registration)',
      created_at: new Date().toISOString(),
    });

    const adminWhatsAppNumber = '628815703360';
    const waMessage = `Halo Admin Salwa L, saya baru saja mendaftar akun TataDana atas nama ${newProfile.full_name} (${newProfile.phone_number}). Mohon lakukan verifikasi dan approval akun saya agar bisa mulai menggunakan TataDana. Terima kasih!`;
    const whatsappAdminUrl = `https://wa.me/${adminWhatsAppNumber}?text=${encodeURIComponent(waMessage)}`;

    mockStore.saveToFile();

    return NextResponse.json({
      success: true,
      message: 'Pendaftaran berhasil! Silakan hubungi Admin via WhatsApp (08815703360) untuk meminta verifikasi akun.',
      user: newProfile,
      approvalStatus: newProfile.approval_status,
      whatsappAdminUrl,
      adminPhone: '08815703360',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal memproses pendaftaran' }, { status: 500 });
  }
}
