import { mockStore } from '../supabase/mockStore';
import { parseIndonesianText, ParseResult } from '../telegram/parser';
import { ReceiptData, AiExecutionMode } from '@/types/database';

export interface AiRequestOptions {
  feature: 'nlp_parser' | 'voice_stt' | 'receipt_ocr' | 'advisor' | 'onboarding_category';
  prompt: string;
  fileBuffer?: Buffer;
  mimeType?: string;
  userId?: string;
  forceProvider?: string;
  forceMode?: AiExecutionMode;
  simulateFailureFor?: string[];
}

export interface TelemetryStats {
  totalCalls: number;
  successCount: number;
  failedCount: number;
  successRate: number;
  avgLatencyMs: number;
  totalTokens: number;
  providerStats: Record<string, { calls: number; success: number; avgLatency: number; tokens: number }>;
}

export class MultiProviderAiService {
  /**
   * Dispatches request to active provider with Single, Failover, or Parallel mode
   */
  async execute(options: AiRequestOptions): Promise<any> {
    const startTime = Date.now();
    let activeConfigs = mockStore.aiConfigs
      .filter(c => c.is_active)
      .sort((a, b) => a.priority - b.priority);

    if (options.forceProvider) {
      activeConfigs = activeConfigs.filter(c => c.provider === options.forceProvider);
    }

    if (activeConfigs.length === 0) {
      // Fallback to built-in rules
      return this.executeBuiltInFallback(options);
    }

    const mode: AiExecutionMode = options.forceMode || activeConfigs[0]?.mode || 'failover';

    if (mode === 'single') {
      const primary = activeConfigs[0];
      try {
        const result = await this.callProvider(primary.provider, primary.model_name, options);
        this.logAiCall(primary.provider, options, 'success', Date.now() - startTime, 120);
        return result;
      } catch (err: any) {
        this.logAiCall(primary.provider, options, 'failed', Date.now() - startTime, 0);
        return this.executeBuiltInFallback(options);
      }
    } else if (mode === 'parallel') {
      // Parallel execution: dispatch all active providers simultaneously and take fastest successful response
      const promises = activeConfigs.map(async (config) => {
        const provStart = Date.now();
        try {
          const res = await this.callProvider(config.provider, config.model_name, options);
          const latency = Date.now() - provStart;
          this.logAiCall(config.provider, options, 'success', latency, 130);
          return res;
        } catch (err: any) {
          const latency = Date.now() - provStart;
          this.logAiCall(config.provider, options, 'failed', latency, 0);
          throw err;
        }
      });

      try {
        const winnerResult = await Promise.any(promises);
        return winnerResult;
      } catch {
        // If all parallel calls failed, fall back to built-in rules
        return this.executeBuiltInFallback(options);
      }
    } else {
      // Failover mode: try primary, if fails try next in priority order
      for (const config of activeConfigs) {
        const provStart = Date.now();
        try {
          const result = await this.callProvider(config.provider, config.model_name, options);
          this.logAiCall(config.provider, options, 'success', Date.now() - provStart, 140);
          return result;
        } catch {
          this.logAiCall(config.provider, options, 'failed', Date.now() - provStart, 0);
          continue;
        }
      }
      return this.executeBuiltInFallback(options);
    }
  }

  /**
   * Calls specific AI provider API
   */
  async callProvider(provider: string, model: string, options: AiRequestOptions): Promise<any> {
    if (options.simulateFailureFor?.includes(provider)) {
      throw new Error(`Simulated failure for provider: ${provider}`);
    }

    const systemPrompt = `Anda adalah AI parser transaksi finansial TataDana. Ekstrak pesan bahasa Indonesia menjadi JSON valid dengan schema:
{
  "type": "expense" | "income",
  "amount": number,
  "categoryName": string,
  "categoryEmoji": string,
  "description": string
}
Aturan nominal Indonesia: "15rb"=15000, "1.5jt"=1500000, "500k"=500000, "25.000"=25000, "7.500.000"=7500000. Kembalikan HANYA JSON.`;

    if (options.feature === 'nlp_parser') {
      // 1. Google Gemini Flash
      if (provider === 'gemini') {
        const geminiKey = process.env.GEMINI_API_KEY;
        if (geminiKey && !geminiKey.includes('Example') && !geminiKey.includes('example')) {
          try {
            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model || 'gemini-1.5-flash'}:generateContent?key=${geminiKey}`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [{ parts: [{ text: `${systemPrompt}\n\nPesan input: "${options.prompt}"` }] }],
                generationConfig: { responseMimeType: 'application/json' }
              })
            });
            const data = await response.json();
            const rawJsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawJsonText) {
              const parsed = JSON.parse(rawJsonText);
              if (parsed.amount && parsed.type) {
                return {
                  success: true,
                  data: {
                    type: parsed.type,
                    amount: Number(parsed.amount),
                    categoryName: parsed.categoryName || 'Lain-lain',
                    categoryEmoji: parsed.categoryEmoji || (parsed.type === 'income' ? '💼' : '🏷️'),
                    description: parsed.description || options.prompt,
                  }
                };
              }
            }
          } catch (err: any) {
            throw new Error(`Gemini API error: ${err.message}`);
          }
        }
        // If no external key configured, use local engine unless simulated to fail
        const parsed = parseIndonesianText(options.prompt);
        if (parsed.success && parsed.data) {
          return parsed;
        }
        throw new Error('Gemini API key not configured or unavailable');
      }

      // 2. OpenAI GPT-4o-mini
      if (provider === 'openai') {
        const openaiKey = process.env.OPENAI_API_KEY;
        if (openaiKey && !openaiKey.includes('example') && !openaiKey.includes('Example')) {
          try {
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${openaiKey}`
              },
              body: JSON.stringify({
                model: model || 'gpt-4o-mini',
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: options.prompt }
                ],
                response_format: { type: 'json_object' }
              })
            });
            const data = await response.json();
            const content = data?.choices?.[0]?.message?.content;
            if (content) {
              const parsed = JSON.parse(content);
              if (parsed.amount && parsed.type) {
                return {
                  success: true,
                  data: {
                    type: parsed.type,
                    amount: Number(parsed.amount),
                    categoryName: parsed.categoryName || 'Lain-lain',
                    categoryEmoji: parsed.categoryEmoji || (parsed.type === 'income' ? '💼' : '🏷️'),
                    description: parsed.description || options.prompt,
                  }
                };
              }
            }
          } catch (err: any) {
            throw new Error(`OpenAI API error: ${err.message}`);
          }
        }
        const parsed = parseIndonesianText(options.prompt);
        if (parsed.success && parsed.data) {
          return parsed;
        }
        throw new Error('OpenAI API key not configured or unavailable');
      }

      // 3. DeepSeek V3
      if (provider === 'deepseek') {
        const deepseekKey = process.env.DEEPSEEK_API_KEY;
        if (deepseekKey && !deepseekKey.includes('example') && !deepseekKey.includes('Example')) {
          try {
            const response = await fetch('https://api.deepseek.com/chat/completions', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${deepseekKey}`
              },
              body: JSON.stringify({
                model: model || 'deepseek-chat',
                messages: [
                  { role: 'system', content: systemPrompt },
                  { role: 'user', content: options.prompt }
                ],
                response_format: { type: 'json_object' }
              })
            });
            const data = await response.json();
            const content = data?.choices?.[0]?.message?.content;
            if (content) {
              const parsed = JSON.parse(content);
              if (parsed.amount && parsed.type) {
                return {
                  success: true,
                  data: {
                    type: parsed.type,
                    amount: Number(parsed.amount),
                    categoryName: parsed.categoryName || 'Lain-lain',
                    categoryEmoji: parsed.categoryEmoji || (parsed.type === 'income' ? '💼' : '🏷️'),
                    description: parsed.description || options.prompt,
                  }
                };
              }
            }
          } catch (err: any) {
            throw new Error(`DeepSeek API error: ${err.message}`);
          }
        }
        const parsed = parseIndonesianText(options.prompt);
        if (parsed.success && parsed.data) {
          return parsed;
        }
        throw new Error('DeepSeek API key not configured or unavailable');
      }
    }

    // Non-nlp features or fallback
    return this.executeBuiltInFallback(options);
  }

  executeBuiltInFallback(options: AiRequestOptions): any {
    switch (options.feature) {
      case 'nlp_parser':
        return parseIndonesianText(options.prompt);

      case 'voice_stt':
        return {
          transcript: options.prompt || 'beli bensin 50rb',
          durationSeconds: 4,
        };

      case 'receipt_ocr':
        const receiptData: ReceiptData = {
          merchant: 'Superindo Express',
          date: new Date().toISOString().split('T')[0],
          items: [
            { name: 'Beras Pandan Wangi 5kg', qty: 1, price: 95000, category: 'Makanan' },
            { name: 'Minyak Goreng 2L', qty: 2, price: 70000, category: 'Makanan' },
            { name: 'Daging Ayam Segar', qty: 1, price: 45000, category: 'Makanan' },
            { name: 'Buah Apel Fuji', qty: 1, price: 35000, category: 'Makanan' },
          ],
          subtotal: 245000,
          tax: 0,
          total: 245000,
        };
        return receiptData;

      case 'advisor':
        return {
          analysis: 'Pengeluaran kategori Makanan & Minuman kamu sudah mencapai 72% dari batas budget bulanan!',
          advice: 'Coba masak sendiri di rumah 3 hari ke depan untuk menghemat sekitar Rp150.000.',
        };

      case 'onboarding_category':
        return [
          { name: 'Makanan & Minuman', emoji: '🍜', type: 'expense', color: '#F97316', budget: 2000000 },
          { name: 'Transportasi', emoji: '🚗', type: 'expense', color: '#10B981', budget: 1000000 },
          { name: 'Tagihan & Wifi', emoji: '🏠', type: 'expense', color: '#EF4444', budget: 1000000 },
          { name: 'Belanja Kebutuhan', emoji: '👕', type: 'expense', color: '#8B5CF6', budget: 1500000 },
          { name: 'Kesehatan', emoji: '💊', type: 'expense', color: '#EC4899', budget: 500000 },
          { name: 'Hiburan', emoji: '🎮', type: 'expense', color: '#06B6D4', budget: 500000 },
          { name: 'Gaji & Pendapatan', emoji: '💼', type: 'income', color: '#10B981', budget: 0 },
        ];

      default:
        return { success: true };
    }
  }

  logAiCall(provider: string, options: AiRequestOptions, status: 'success' | 'failed', latency: number, tokens: number) {
    mockStore.aiLogs.unshift({
      id: `ailog-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      user_id: options.userId,
      provider,
      feature: options.feature,
      prompt_summary: options.prompt.slice(0, 100),
      response_status: status,
      latency_ms: latency,
      tokens_used: tokens,
      created_at: new Date().toISOString(),
    });
  }

  /**
   * Aggregates AI call telemetry statistics
   */
  getTelemetryStats(): TelemetryStats {
    const logs = mockStore.aiLogs;
    const totalCalls = logs.length;
    const successCount = logs.filter(l => l.response_status === 'success').length;
    const failedCount = totalCalls - successCount;
    const successRate = totalCalls > 0 ? Math.round((successCount / totalCalls) * 100) : 100;
    const totalLatency = logs.reduce((acc, l) => acc + l.latency_ms, 0);
    const avgLatencyMs = totalCalls > 0 ? Math.round(totalLatency / totalCalls) : 0;
    const totalTokens = logs.reduce((acc, l) => acc + l.tokens_used, 0);

    const providerStats: Record<string, { calls: number; success: number; avgLatency: number; tokens: number }> = {};
    for (const log of logs) {
      if (!providerStats[log.provider]) {
        providerStats[log.provider] = { calls: 0, success: 0, avgLatency: 0, tokens: 0 };
      }
      providerStats[log.provider].calls++;
      if (log.response_status === 'success') {
        providerStats[log.provider].success++;
      }
      providerStats[log.provider].tokens += log.tokens_used;
    }

    for (const prov of Object.keys(providerStats)) {
      const pLogs = logs.filter(l => l.provider === prov);
      const pLatency = pLogs.reduce((acc, l) => acc + l.latency_ms, 0);
      providerStats[prov].avgLatency = pLogs.length > 0 ? Math.round(pLatency / pLogs.length) : 0;
    }

    return {
      totalCalls,
      successCount,
      failedCount,
      successRate,
      avgLatencyMs,
      totalTokens,
      providerStats,
    };
  }
}

export const aiService = new MultiProviderAiService();
