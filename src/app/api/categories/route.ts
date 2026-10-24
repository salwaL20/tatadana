import { NextResponse } from 'next/server';
import { dataService } from '@/lib/supabase/client';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'usr-salwa-001';

    let categories = await dataService.getCategories(userId);
    if (categories.length === 0) {
      categories = await dataService.getCategories('usr-budi-12345');
    }

    return NextResponse.json(categories);
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
