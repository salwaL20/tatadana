import { NextResponse } from 'next/server';
import { TelegramBotClient } from '@/lib/telegram/botClient';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = body?.token;
    const baseUrl = process.env.WEBHOOK_BASE_URL || 'https://tatadana.app';
    const webhookUrl = body?.url || `${baseUrl}/api/telegram/webhook`;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({
        ok: false,
        error: 'Field token diperlukan dalam body JSON.',
      }, { status: 400 });
    }

    const res = await TelegramBotClient.setWebhook(token.trim(), webhookUrl);
    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        error: res.description || 'Gagal mengatur setWebhook Telegram.',
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      result: true,
      url: webhookUrl,
      description: res.description || 'Webhook berhasil diatur.',
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message || 'Gagal mengeksekusi setWebhook',
    }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');
    const baseUrl = process.env.WEBHOOK_BASE_URL || 'https://tatadana.app';
    const webhookUrl = searchParams.get('url') || `${baseUrl}/api/telegram/webhook`;

    if (!token) {
      return NextResponse.json({
        ok: false,
        error: 'Parameter token diperlukan dalam query URL (?token=...).',
      }, { status: 400 });
    }

    const res = await TelegramBotClient.setWebhook(token.trim(), webhookUrl);
    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        error: res.description || 'Gagal mengatur setWebhook Telegram.',
      }, { status: 500 });
    }

    return NextResponse.json({
      ok: true,
      result: true,
      url: webhookUrl,
      description: res.description || 'Webhook berhasil diatur.',
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message || 'Gagal mengeksekusi setWebhook',
    }, { status: 500 });
  }
}
