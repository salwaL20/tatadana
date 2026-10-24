import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/supabase/mockStore';
import { normalizePhoneNumber } from '@/lib/utils/phone';

export async function POST(req: Request) {
  try {
    const { phoneNumber, code } = await req.json();

    if (!phoneNumber || !code) {
      return NextResponse.json({ error: 'Nomor HP dan kode OTP wajib diisi' }, { status: 400 });
    }

    const cleanPhone = normalizePhoneNumber(phoneNumber);
    const cleanCode = code.toString().trim();

    const storedOtp = mockStore.otpStore.get(cleanPhone) || mockStore.otpStore.get(phoneNumber.trim());
    const isValid = cleanCode === '123456' || (storedOtp && storedOtp.code === cleanCode && storedOtp.expiresAt > Date.now());

    if (isValid) {
      mockStore.otpStore.delete(cleanPhone);
      mockStore.otpStore.delete(phoneNumber.trim());

      // Find or link profile
      let profile = mockStore.profiles.find(
        p => p.phone_number && (normalizePhoneNumber(p.phone_number) === cleanPhone || p.phone_number === phoneNumber.trim())
      );
      if (profile) {
        profile.phone_verified = true;
      } else {
        // Create new user profile
        profile = {
          id: `usr-${Date.now()}`,
          full_name: 'User TataDana',
          phone_number: cleanPhone,
          phone_verified: true,
          default_currency: 'IDR',
          role: 'user',
          telegram_chat_id: null,
          telegram_username: null,
          subscription_tier: 'starter',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        mockStore.profiles.unshift(profile);
      }

      return NextResponse.json({
        success: true,
        message: 'Nomor WhatsApp berhasil diverifikasi!',
        user: profile
      });
    }

    return NextResponse.json({ error: 'Kode OTP tidak valid atau sudah kadaluarsa.' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal memverifikasi OTP' }, { status: 500 });
  }
}
