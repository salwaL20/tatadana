import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/supabase/mockStore';
import { aiService } from '@/lib/ai/multiProvider';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const provider = url.searchParams.get('provider');
  const feature = url.searchParams.get('feature');
  const status = url.searchParams.get('status');

  let logs = mockStore.aiLogs;

  if (provider && provider !== 'all') {
    logs = logs.filter(l => l.provider.toLowerCase() === provider.toLowerCase());
  }
  if (feature && feature !== 'all') {
    logs = logs.filter(l => l.feature === feature);
  }
  if (status && status !== 'all') {
    logs = logs.filter(l => l.response_status === status);
  }

  return NextResponse.json({
    logs,
    telemetry: aiService.getTelemetryStats(),
  });
}

export async function DELETE() {
  mockStore.aiLogs = [];
  return NextResponse.json({
    success: true,
    message: 'AI logs cleared',
    telemetry: aiService.getTelemetryStats(),
  });
}
