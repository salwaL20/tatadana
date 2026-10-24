import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/supabase/mockStore';
import { dataService } from '@/lib/supabase/client';

export async function GET(req: Request) {
  try {
    mockStore.loadFromFile();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'usr-salwa-001';

    let wallets = await dataService.getWallets(userId);
    if (wallets.length === 0) {
      wallets = await dataService.getWallets('usr-budi-12345');
    }

    return NextResponse.json(wallets);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newWallet = await dataService.addWallet(body);
    return NextResponse.json(newWallet);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
