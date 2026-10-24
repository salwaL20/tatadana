import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/supabase/mockStore';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const targetUser = url.searchParams.get('userId');
  const action = url.searchParams.get('action');

  let logs = mockStore.auditLogs;
  if (targetUser) {
    logs = logs.filter(l => l.target_user_id === targetUser);
  }
  if (action) {
    logs = logs.filter(l => l.action.includes(action));
  }

  return NextResponse.json({
    logs,
    total: logs.length,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, targetUserId, metadata, adminId = 'usr-admin-super' } = body;

    const newLog = {
      id: `aud-${Date.now()}`,
      admin_id: adminId,
      target_user_id: targetUserId,
      action,
      metadata: metadata || {},
      ip_address: '127.0.0.1 (Admin Console)',
      created_at: new Date().toISOString(),
    };

    mockStore.auditLogs.unshift(newLog);

    return NextResponse.json({
      success: true,
      log: newLog,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
