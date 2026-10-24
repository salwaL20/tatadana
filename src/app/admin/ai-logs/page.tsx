'use client';

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Search, 
  Filter, 
  Trash2, 
  RefreshCw, 
  Send, 
  Cpu, 
  Coins, 
  Zap,
  BarChart3
} from 'lucide-react';
import { mockStore } from '@/lib/supabase/mockStore';
import { formatDateOnlyWIB, formatShortTimeWIB } from '@/lib/utils/timezone';
import { AiLogRecord } from '@/types/database';

export default function AdminAiLogsPage() {
  const [logs, setLogs] = useState<AiLogRecord[]>(mockStore.aiLogs);
  const [loading, setLoading] = useState(false);
  const [providerFilter, setProviderFilter] = useState('all');
  const [featureFilter, setFeatureFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sendingTest, setSendingTest] = useState(false);

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/ai-logs?provider=${providerFilter}&feature=${featureFilter}&status=${statusFilter}`);
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
      } else {
        setLogs([...mockStore.aiLogs]);
      }
    } catch {
      setLogs([...mockStore.aiLogs]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [providerFilter, featureFilter, statusFilter]);

  const handleClearLogs = async () => {
    if (confirm('Apakah Anda yakin ingin menghapus semua riwayat log panggilan AI?')) {
      mockStore.aiLogs = [];
      setLogs([]);
      await fetch('/api/admin/ai-logs', { method: 'DELETE' });
    }
  };

  const handleSendTestRequest = async () => {
    setSendingTest(true);
    try {
      const prompts = [
        'beli makan siang ayam bakar 35rb',
        'top up dana 150k lewat bca',
        'bayar listrik pln 250rb',
        'beli perlengkapan kantor 450rb',
        'gaji freelancer design 3.5jt',
      ];
      const randomPrompt = prompts[Math.floor(Math.random() * prompts.length)];

      await fetch('/api/admin/ai-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: randomPrompt }),
      });
      await fetchLogs();
    } finally {
      setSendingTest(false);
    }
  };

  // Filter logs by search term
  const filteredLogs = logs.filter(l => {
    if (!search) return true;
    const term = search.toLowerCase();
    return (
      l.prompt_summary?.toLowerCase().includes(term) ||
      l.provider.toLowerCase().includes(term) ||
      l.feature.toLowerCase().includes(term)
    );
  });

  // Calculate telemetry metrics
  const totalCalls = logs.length;
  const successCalls = logs.filter(l => l.response_status === 'success').length;
  const successRate = totalCalls > 0 ? Math.round((successCalls / totalCalls) * 100) : 100;
  const avgLatency = totalCalls > 0 ? Math.round(logs.reduce((acc, l) => acc + l.latency_ms, 0) / totalCalls) : 0;
  const totalTokens = logs.reduce((acc, l) => acc + l.tokens_used, 0);

  const geminiCount = logs.filter(l => l.provider === 'gemini').length;
  const openaiCount = logs.filter(l => l.provider === 'openai').length;
  const deepseekCount = logs.filter(l => l.provider === 'deepseek').length;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight">Log & Telemetri Aktivitas AI</h1>
          <p className="text-xs text-slate-400 mt-1">
            Audit pemanggilan multi-LLM, latensi respon milidetik, konsumsi token, dan tingkat keberhasilan parsing.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleSendTestRequest}
            disabled={sendingTest}
            className="px-3.5 py-2 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow flex items-center gap-1.5"
          >
            <Send className={`w-3.5 h-3.5 ${sendingTest ? 'animate-spin' : ''}`} />
            <span>{sendingTest ? 'Mengirim...' : 'Simulasi Request AI'}</span>
          </button>

          <button
            onClick={fetchLogs}
            disabled={loading}
            className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700"
            title="Refresh Log"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>

          <button
            onClick={handleClearLogs}
            className="p-2 bg-rose-950/40 hover:bg-rose-900 text-rose-300 rounded-xl transition border border-rose-800"
            title="Bersihkan Log"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 4 Telemetry Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase">
            <span>Total Permintaan AI</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalCalls} Panggilan</div>
          <div className="text-[11px] text-slate-400 mt-1">Multi-LLM TataDana</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase">
            <span>Tingkat Keberhasilan</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{successRate}%</div>
          <div className="text-[11px] text-slate-400 mt-1">{successCalls} Berhasil • {totalCalls - successCalls} Gagal</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase">
            <span>Rata-Rata Latensi</span>
            <Clock className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{avgLatency} ms</div>
          <div className="text-[11px] text-orange-400 mt-1">Standar respon cepat &lt;500ms</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase">
            <span>Konsumsi Token</span>
            <Coins className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalTokens.toLocaleString('id-ID')}</div>
          <div className="text-[11px] text-blue-400 mt-1">Prompt & Completion Tokens</div>
        </div>
      </div>

      {/* Provider Distribution Chips */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-slate-950 border border-slate-800 rounded-2xl">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
          <BarChart3 className="w-4 h-4 text-slate-400" /> Distribusi LLM:
        </span>
        <span className="px-3 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-300 rounded-xl text-xs font-semibold">
          ✨ Google Gemini: {geminiCount}
        </span>
        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-xl text-xs font-semibold">
          🧠 OpenAI GPT-4o-mini: {openaiCount}
        </span>
        <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 text-purple-300 rounded-xl text-xs font-semibold">
          ⚡ DeepSeek V3: {deepseekCount}
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari ringkasan prompt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        <select
          value={providerFilter}
          onChange={(e) => setProviderFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-orange-500"
        >
          <option value="all">Semua Provider</option>
          <option value="gemini">Google Gemini</option>
          <option value="openai">OpenAI</option>
          <option value="deepseek">DeepSeek</option>
        </select>

        <select
          value={featureFilter}
          onChange={(e) => setFeatureFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-orange-500"
        >
          <option value="all">Semua Fitur</option>
          <option value="nlp_parser">NLP Parser Teks</option>
          <option value="voice_stt">Voice Note STT</option>
          <option value="receipt_ocr">Receipt OCR</option>
          <option value="advisor">Financial Advisor</option>
          <option value="onboarding_category">Onboarding Category</option>
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3.5 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-orange-500"
        >
          <option value="all">Semua Status</option>
          <option value="success">Berhasil</option>
          <option value="failed">Gagal</option>
        </select>
      </div>

      {/* Telemetry Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Waktu (WIB)</th>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Fitur</th>
                <th className="py-3 px-4">Ringkasan Prompt</th>
                <th className="py-3 px-4">Latensi</th>
                <th className="py-3 px-4">Tokens</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Tidak ada log panggilan AI yang cocok dengan filter.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3 px-4 text-slate-400 whitespace-nowrap">
                      <div>{formatDateOnlyWIB(log.created_at)}</div>
                      <div className="text-[10px] text-slate-500">{formatShortTimeWIB(log.created_at)}</div>
                    </td>
                    <td className="py-3 px-4 font-bold text-white uppercase flex items-center gap-1.5 mt-2">
                      <span className={`w-2 h-2 rounded-full ${
                        log.provider === 'gemini' ? 'bg-blue-400' :
                        log.provider === 'openai' ? 'bg-emerald-400' : 'bg-purple-400'
                      }`}></span>
                      <span>{log.provider}</span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono text-[11px]">
                        {log.feature}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate" title={log.prompt_summary || ''}>
                      {log.prompt_summary}
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">
                      <span className={log.latency_ms > 500 ? 'text-amber-400' : 'text-slate-300'}>
                        {log.latency_ms} ms
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-300 font-mono">{log.tokens_used}</td>
                    <td className="py-3 px-4 text-right">
                      {log.response_status === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Berhasil
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded border border-rose-500/20">
                          <AlertCircle className="w-3 h-3" /> Gagal
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
