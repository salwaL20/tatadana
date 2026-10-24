import { NextResponse } from 'next/server';
import { pollingService } from '@/lib/telegram/pollingService';
import { mockStore } from '@/lib/supabase/mockStore';
import { encryptToken } from '@/lib/utils/encryption';
import { dataService } from '@/lib/supabase/client';

export async function GET(req: Request) {
  let autoStart = false;
  if (req && req.url) {
    try {
      const url = new URL(req.url);
      if (url.searchParams.get('autoStart') === 'true') {
        autoStart = true;
      }
    } catch (e) {}
  }

  let status = pollingService.getStatus();
  const isLocal = process.env.APP_URL?.includes('localhost') || 
                  process.env.APP_URL?.includes('127.0.0.1') || 
                  process.env.NODE_ENV !== 'production';

  if (!status.isRunning && autoStart && isLocal) {
    try {
      await pollingService.start();
      status = pollingService.getStatus();
    } catch (e) {}
  }

  let rawToken = pollingService.getActiveToken();

  // If active token is real (not demo/example), persist to .env.local
  if (rawToken && rawToken.includes(':') && !rawToken.toLowerCase().includes('example')) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const envPath = path.resolve(process.cwd(), '.env.local');
      if (fs.existsSync(envPath)) {
        let envContent = fs.readFileSync(envPath, 'utf8');
        if (envContent.includes('TELEGRAM_BOT_TOKEN=')) {
          envContent = envContent.replace(/TELEGRAM_BOT_TOKEN=.*/g, `TELEGRAM_BOT_TOKEN=${rawToken}`);
        } else {
          envContent += `\nTELEGRAM_BOT_TOKEN=${rawToken}\n`;
        }
        fs.writeFileSync(envPath, envContent, 'utf8');
        process.env.TELEGRAM_BOT_TOKEN = rawToken;
      }
    } catch (e) {}
  }

  return NextResponse.json({
    ok: true,
    data: status,
    rawToken: (req && req.url && new URL(req.url).searchParams.get('reveal') === '1') ? rawToken : undefined,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action = 'start', token, userId = 'usr-budi-12345' } = body;

    if (action === 'stop') {
      const result = pollingService.stop();
      return NextResponse.json({
        ok: true,
        message: result.message,
        status: pollingService.getStatus(),
      });
    }

    if (token && token.trim()) {
      // Save updated token to mockStore / database
      const cleanToken = token.trim();
      const encrypted = encryptToken(cleanToken);
      await dataService.saveBotConfig({
        user_id: userId,
        bot_token: encrypted,
        bot_username: 'TataDanaSitiHawa_bot',
        is_active: true,
        webhook_url: 'long_polling',
        webhook_status: 'connected',
        last_tested_at: new Date().toISOString(),
        error_message: null,
      });
    }

    const startResult = await pollingService.start(token);
    if (!startResult.ok) {
      return NextResponse.json({
        ok: false,
        error: startResult.error || 'Gagal memulai Long Polling',
        status: pollingService.getStatus(),
      }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      message: startResult.message,
      botUsername: startResult.botUsername,
      status: pollingService.getStatus(),
    });
  } catch (error: any) {
    return NextResponse.json({
      ok: false,
      error: error.message || 'Terjadi kesalahan sistem pada Telegram Polling',
    }, { status: 500 });
  }
}
