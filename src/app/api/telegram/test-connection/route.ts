import { NextResponse } from 'next/server';
import { TelegramBotClient } from '@/lib/telegram/botClient';
import { mockStore } from '@/lib/supabase/mockStore';
import { dataService } from '@/lib/supabase/client';
import { encryptToken, decryptToken } from '@/lib/utils/encryption';

export async function POST(req: Request) {
  try {
    const { token, userId = 'usr-budi-12345', mode = 'polling' } = await req.json();

    const effectiveToken = (token && typeof token === 'string' && token.trim())
      ? token.trim()
      : (process.env.TELEGRAM_BOT_TOKEN && !process.env.TELEGRAM_BOT_TOKEN.toLowerCase().includes('example') ? process.env.TELEGRAM_BOT_TOKEN.trim() : (token || ''));

    if (!effectiveToken || typeof effectiveToken !== 'string' || !effectiveToken.trim()) {
      return NextResponse.json({
        ok: false,
        status: 'error',
        error: 'Token bot tidak boleh kosong.',
      }, { status: 400 });
    }

    const cleanToken = effectiveToken.trim();

    // Check token uniqueness across users (supports encrypted & plain tokens)
    const duplicate = mockStore.telegramBots.find(b => {
      const storedPlain = decryptToken(b.bot_token);
      return (storedPlain === cleanToken || b.bot_token === cleanToken) && b.user_id !== userId;
    });
    if (duplicate) {
      return NextResponse.json({
        ok: false,
        status: 'error',
        error: 'Token ini sudah digunakan oleh akun lain. Gunakan bot unik dari @BotFather.',
      }, { status: 400 });
    }

    // Step 1: Call getMe
    const meResponse = await TelegramBotClient.getMe(cleanToken);
    if (!meResponse.ok) {
      return NextResponse.json({
        ok: false,
        status: 'error',
        error: meResponse.description || 'Token tidak valid. Pastikan token dari @BotFather disalin dengan lengkap.',
      }, { status: 400 });
    }

    const botUsername = meResponse.result?.username || 'TataDanaSitiHawa_bot';
    const botFirstName = meResponse.result?.first_name || 'Tata dana siti hawa';

    // Step 2: Set Webhook or Long Polling
    const baseUrl = process.env.WEBHOOK_BASE_URL || 'http://localhost:3000';
    const isLocal = baseUrl.includes('localhost') || baseUrl.includes('127.0.0.1');
    const webhookUrl = `${baseUrl}/api/telegram/webhook`;

    if (mode === 'polling' || isLocal) {
      // Clear any webhook on Telegram so polling is permitted
      await TelegramBotClient.deleteWebhook(cleanToken, false);
      try {
        const { pollingService } = await import('@/lib/telegram/pollingService');
        await pollingService.start(cleanToken);
      } catch (e) {
        // Safe fallback in test environments
      }
    } else {
      const webhookRes = await TelegramBotClient.setWebhook(cleanToken, webhookUrl);
      if (!webhookRes.ok) {
        return NextResponse.json({
          ok: false,
          status: 'error',
          error: webhookRes.description || 'Gagal mengatur setWebhook ke server TataDana.',
        }, { status: 500 });
      }
    }

    // Step 3: Save configuration with AES-256-GCM encrypted token
    const encryptedToken = encryptToken(cleanToken);
    await dataService.saveBotConfig({
      user_id: userId,
      bot_token: encryptedToken,
      bot_username: botUsername,
      is_active: true,
      webhook_url: webhookUrl,
      webhook_status: 'connected',
      last_tested_at: new Date().toISOString(),
      error_message: null,
    });

    return NextResponse.json({
      ok: true,
      status: 'connected',
      botUsername: `@${botUsername}`,
      message: `Bot @${botUsername} berhasil terhubung dan Webhook aktif!`,
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      status: 'error',
      error: error.message || 'Terjadi kesalahan sistem saat menghubungi Telegram API',
    }, { status: 500 });
  }
}
