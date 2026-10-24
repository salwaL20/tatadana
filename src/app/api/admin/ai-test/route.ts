import { NextResponse } from 'next/server';
import { aiService } from '@/lib/ai/multiProvider';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt = 'beli kopi susu 25rb di Janji Jiwa', provider, mode } = body;

    const startTime = Date.now();
    const result = await aiService.execute({
      feature: 'nlp_parser',
      prompt,
      forceProvider: provider,
      forceMode: mode,
    });
    const latencyMs = Date.now() - startTime;

    return NextResponse.json({
      success: true,
      provider: provider || 'multi-provider',
      mode: mode || 'auto',
      latencyMs,
      prompt,
      result,
      telemetry: aiService.getTelemetryStats(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
