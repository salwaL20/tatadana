import { NextResponse } from 'next/server';
import { TelegramBotClient } from '@/lib/telegram/botClient';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json({
        ok: false,
        error: 'Parameter token diperlukan dalam query URL (?token=...).',
      }, { status: 400 });
    }

    const res = await TelegramBotClient.getMe(token.trim());
    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        error: res.description || 'Token bot Telegram tidak valid.',
      }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      result: res.result,
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message || 'Gagal memverifikasi getMe',
    }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const token = body?.token;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({
        ok: false,
        error: 'Field token diperlukan dalam body JSON.',
      }, { status: 400 });
    }

    const res = await TelegramBotClient.getMe(token.trim());
    if (!res.ok) {
      return NextResponse.json({
        ok: false,
        error: res.description || 'Token bot Telegram tidak valid.',
      }, { status: 400 });
    }

    return NextResponse.json({
      ok: true,
      result: res.result,
    });
  } catch (err: any) {
    return NextResponse.json({
      ok: false,
      error: err.message || 'Gagal memverifikasi getMe',
    }, { status: 500 });
  }
}
