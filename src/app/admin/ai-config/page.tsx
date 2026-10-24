'use client';

import React, { useState } from 'react';
import { 
  Cpu, 
  ShieldCheck, 
  Check, 
  Save, 
  Sparkles, 
  Zap, 
  Play, 
  ArrowUp, 
  ArrowDown, 
  RefreshCw,
  Clock,
  Coins
} from 'lucide-react';
import { mockStore } from '@/lib/supabase/mockStore';
import { AiConfigRecord, AiExecutionMode } from '@/types/database';

export default function AdminAiConfigPage() {
  const [configs, setConfigs] = useState<AiConfigRecord[]>(mockStore.aiConfigs);
  const [executionMode, setExecutionMode] = useState<AiExecutionMode>(mockStore.aiConfigs[0]?.mode || 'failover');
  const [savedBanner, setSavedBanner] = useState(false);
  const [bannerMessage, setBannerMessage] = useState('');

  // Interactive Test State
  const [testPrompt, setTestPrompt] = useState('beli bakso campur 25rb di warung pojok');
  const [testProvider, setTestProvider] = useState<string>('auto');
  const [testLoading, setTestLoading] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const showBanner = (msg: string) => {
    setBannerMessage(msg);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 3000);
  };

  const handleToggleActive = async (id: string) => {
    const updated = configs.map(c => c.id === id ? { ...c, is_active: !c.is_active } : c);
    setConfigs(updated);
    mockStore.aiConfigs = updated;
    await fetch('/api/admin/ai-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configs: updated, mode: executionMode }),
    });
    showBanner('Status aktif provider berhasil diperbarui');
  };

  const handleApiKeyChange = (id: string, newKey: string) => {
    const updated = configs.map(c => c.id === id ? { ...c, api_key_encrypted: newKey } : c);
    setConfigs(updated);
    mockStore.aiConfigs = updated;
  };

  const handleSaveApiKey = async (id: string) => {
    mockStore.aiConfigs = configs;
    await fetch('/api/admin/ai-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configs, mode: executionMode }),
    });
    showBanner('API Key berhasil disimpan dan dienkripsi!');
  };

  const handleSaveMode = async (mode: AiExecutionMode) => {
    setExecutionMode(mode);
    const updated = configs.map(c => ({ ...c, mode }));
    setConfigs(updated);
    mockStore.aiConfigs = updated;
    await fetch('/api/admin/ai-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode, configs: updated }),
    });
    showBanner(`Mode eksekusi AI diubah ke: ${mode.toUpperCase()}`);
  };

  const movePriority = async (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    if (targetIndex < 0 || targetIndex >= configs.length) return;

    const newConfigs = [...configs];
    const temp = newConfigs[index];
    newConfigs[index] = newConfigs[targetIndex];
    newConfigs[targetIndex] = temp;

    // Re-assign priority numbers
    const updated = newConfigs.map((c, idx) => ({ ...c, priority: idx + 1 }));
    setConfigs(updated);
    mockStore.aiConfigs = updated;
    await fetch('/api/admin/ai-config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ configs: updated, mode: executionMode }),
    });
    showBanner('Urutan prioritas failover berhasil diperbarui!');
  };

  const handleRunAiTest = async () => {
    if (!testPrompt.trim()) return;
    setTestLoading(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/admin/ai-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: testPrompt,
          provider: testProvider === 'auto' ? undefined : testProvider,
          mode: executionMode,
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err: any) {
      setTestResult({ error: err.message });
    } finally {
      setTestLoading(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Konfigurasi Multi-Provider AI</h1>
        <p className="text-xs text-slate-400 mt-1">
          TataDana mendukung fleksibilitas multi-LLM (Google Gemini 1.5 Flash, OpenAI GPT-4o-mini, DeepSeek V3) dengan opsi Single, Failover, dan Paralel.
        </p>
      </div>

      {savedBanner && (
        <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-400" />
          <span>{bannerMessage || 'Pengaturan AI Provider berhasil disimpan ke database!'}</span>
        </div>
      )}

      {/* Mode Selector (Single vs Failover vs Parallel) */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div>
          <h2 className="text-base font-bold text-white">Mode Eksekusi Model AI</h2>
          <p className="text-xs text-slate-400">Pilih strategi penanganan request parsing kalimat dan transkripsi suara.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleSaveMode('single')}
            className={`p-4 rounded-xl border text-left transition ${
              executionMode === 'single'
                ? 'border-orange-500 bg-orange-500/10 text-white shadow-lg'
                : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
              <div className="font-bold text-sm text-white">Mode Tunggal (Single)</div>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Hanya mengeksekusi 1 provider prioritas pertama. Jika gagal, langsung menggunakan built-in fallback tanpa mencoba provider berikutnya.
            </p>
          </button>

          <button
            onClick={() => handleSaveMode('failover')}
            className={`p-4 rounded-xl border text-left transition ${
              executionMode === 'failover'
                ? 'border-orange-500 bg-orange-500/10 text-white shadow-lg'
                : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Sparkles className="w-4 h-4 text-orange-400" />
              <div className="font-bold text-sm text-orange-400">Mode Failover (Sekuensial)</div>
            </div>
            <p className="text-xs leading-relaxed text-slate-300">
              Mencoba provider prioritas #1 (Gemini). Jika timeout/kuota habis, otomatis beralih ke provider #2 (OpenAI) lalu #3 (DeepSeek).
            </p>
          </button>

          <button
            onClick={() => handleSaveMode('parallel')}
            className={`p-4 rounded-xl border text-left transition ${
              executionMode === 'parallel'
                ? 'border-orange-500 bg-orange-500/10 text-white shadow-lg'
                : 'border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-emerald-400" />
              <div className="font-bold text-sm text-emerald-400">Mode Paralel (Fastest Race)</div>
            </div>
            <p className="text-xs leading-relaxed text-slate-400">
              Mengeksekusi semua provider aktif secara bersamaan via Promise.any dan mengambil respon tercepat untuk latensi minimum.
            </p>
          </button>
        </div>
      </div>

      {/* Provider List & Keys */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white">Daftar API Provider & Prioritas Eksekusi</h2>

        <div className="space-y-3">
          {configs.map((c, idx) => (
            <div
              key={c.id}
              className={`bg-slate-950 border rounded-2xl p-5 shadow-lg transition space-y-4 ${
                c.is_active ? 'border-slate-800' : 'border-slate-800/50 opacity-60'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-center text-lg">
                    {c.provider === 'gemini' ? '✨' : c.provider === 'openai' ? '🧠' : '⚡'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-sm text-white">{c.display_name}</h3>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-800 text-orange-400 border border-orange-500/20">
                        Prioritas #{c.priority}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      Model ID: {c.model_name} • Provider: {c.provider}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="flex items-center border border-slate-800 rounded-lg overflow-hidden bg-slate-900">
                    <button
                      onClick={() => movePriority(idx, 'up')}
                      disabled={idx === 0}
                      className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 transition"
                      title="Naikkan prioritas"
                    >
                      <ArrowUp className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => movePriority(idx, 'down')}
                      disabled={idx === configs.length - 1}
                      className="p-1.5 text-slate-400 hover:text-white disabled:opacity-30 transition"
                      title="Turunkan prioritas"
                    >
                      <ArrowDown className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <button
                    onClick={() => handleToggleActive(c.id)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                      c.is_active
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                        : 'bg-slate-800 text-slate-500 border-slate-700'
                    }`}
                  >
                    {c.is_active ? 'Aktif' : 'Non-aktif'}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">API Key Terenkripsi</label>
                <div className="flex gap-2">
                  <input
                    type="password"
                    value={c.api_key_encrypted}
                    onChange={(e) => handleApiKeyChange(c.id, e.target.value)}
                    className="flex-1 px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono text-slate-300 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    onClick={() => handleSaveApiKey(c.id)}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl transition"
                  >
                    Simpan Key
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Interactive AI Prompt Tester */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Play className="w-4 h-4 text-orange-400" /> Uji Coba Langsung Parser Multi-AI
            </h2>
            <p className="text-xs text-slate-400">
              Kirim kalimat transaksi finansial bahasa Indonesia untuk melihat provider yang memproses, latensi respon, dan hasil ekstraksi.
            </p>
          </div>
        </div>

        <div className="space-y-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder="Contoh: beli bensin pertamax 50rb di spbu"
              className="flex-1 px-4 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
            />

            <select
              value={testProvider}
              onChange={(e) => setTestProvider(e.target.value)}
              className="px-3 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-orange-500"
            >
              <option value="auto">Otomatis ({executionMode})</option>
              <option value="gemini">Gemini 1.5 Flash</option>
              <option value="openai">OpenAI GPT-4o-mini</option>
              <option value="deepseek">DeepSeek Chat V3</option>
            </select>

            <button
              onClick={handleRunAiTest}
              disabled={testLoading}
              className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-2 shrink-0"
            >
              {testLoading ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Memproses...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Jalankan Uji Coba</span>
                </>
              )}
            </button>
          </div>

          <div className="flex flex-wrap gap-2 text-[11px] text-slate-400">
            <span>Contoh input cepat:</span>
            <button
              onClick={() => setTestPrompt('makan soto ayam 20rb')}
              className="hover:text-orange-400 underline"
            >
              "makan soto ayam 20rb"
            </button>
            <span>•</span>
            <button
              onClick={() => setTestPrompt('gaji bulanan pt sukses 15.5jt')}
              className="hover:text-orange-400 underline"
            >
              "gaji bulanan pt sukses 15.5jt"
            </button>
            <span>•</span>
            <button
              onClick={() => setTestPrompt('bayar wifi indihome 350k')}
              className="hover:text-orange-400 underline"
            >
              "bayar wifi indihome 350k"
            </button>
          </div>
        </div>

        {testResult && (
          <div className="mt-4 p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between text-xs border-b border-slate-800/80 pb-2">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" /> Hasil Eksekusi AI
              </span>
              <div className="flex items-center gap-3 text-[11px] text-slate-400 font-mono">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-orange-400" /> {testResult.latencyMs} ms
                </span>
                <span className="flex items-center gap-1">
                  <Coins className="w-3 h-3 text-purple-400" /> ~120 tokens
                </span>
                <span className="text-emerald-400 font-bold uppercase">{testResult.provider}</span>
              </div>
            </div>

            <pre className="text-xs font-mono text-emerald-300 bg-slate-950 p-3 rounded-lg overflow-x-auto border border-slate-800">
              {JSON.stringify(testResult.result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
