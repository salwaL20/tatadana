import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/supabase/mockStore';
import { AiExecutionMode } from '@/types/database';

export async function GET() {
  return NextResponse.json({
    configs: mockStore.aiConfigs,
    currentMode: mockStore.aiConfigs[0]?.mode || 'failover',
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { mode, configs } = body;

    if (mode && ['single', 'failover', 'parallel'].includes(mode)) {
      mockStore.aiConfigs = mockStore.aiConfigs.map(c => ({
        ...c,
        mode: mode as AiExecutionMode,
      }));
    }

    if (Array.isArray(configs)) {
      mockStore.aiConfigs = configs;
    }

    mockStore.auditLogs.unshift({
      id: `aud-${Date.now()}`,
      admin_id: 'usr-admin-super',
      target_user_id: 'system_ai_config',
      action: 'update_ai_configuration',
      metadata: { mode, configsCount: mockStore.aiConfigs.length },
      ip_address: '127.0.0.1 (Internal Admin)',
      created_at: new Date().toISOString(),
    });

    mockStore.saveToFile();

    return NextResponse.json({
      success: true,
      configs: mockStore.aiConfigs,
      currentMode: mockStore.aiConfigs[0]?.mode || 'failover',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
