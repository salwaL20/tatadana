import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/supabase/mockStore';
import { dataService } from '@/lib/supabase/client';

export async function GET(req: Request) {
  try {
    mockStore.loadFromFile();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'usr-salwa-001';

    let txs = await dataService.getTransactions(userId);

    // If active user is Salwa L, also include transactions that might be linked
    if (userId === 'usr-salwa-001' && txs.length === 0) {
      txs = await dataService.getTransactions('usr-budi-12345');
    }

    return NextResponse.json(txs);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const newTx = await dataService.addTransaction(body);
    return NextResponse.json(newTx);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
