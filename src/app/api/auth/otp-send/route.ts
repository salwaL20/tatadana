import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/supabase/mockStore';
import { normalizePhoneNumber } from '@/lib/utils/phone';

export async function POST(req: Request) {
  try {
    const { phoneNumber } = await req.json();

    if (!phoneNumber || typeof phoneNumber !== 'string' || !phoneNumber.trim()) {
      return NextResponse.json({ error: 'Nomor WhatsApp / HP wajib diisi' }, { status: 400 });
    }

    const cleanPhone = normalizePhoneNumber(phoneNumber);
    if (cleanPhone.length < 10) {
      return NextResponse.json({ error: 'Nomor WhatsApp tidak valid (minimal 10 digit)' }, { status: 400 });
    }

    // Always accept dev code '123456', or generate random 6 digits
    const code = '123456';
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    mockStore.otpStore.set(cleanPhone, { code, expiresAt });
    // Also save raw input for fallback compatibility
    mockStore.otpStore.set(phoneNumber.trim(), { code, expiresAt });

    return NextResponse.json({
      success: true,
      message: `Kode OTP verifikasi telah dikirim ke nomor WhatsApp ${cleanPhone}. (Mode Dev: gunakan 123456)`,
      devCode: '123456',
      phoneNumber: cleanPhone
    });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengirim OTP' }, { status: 500 });
  }
}
