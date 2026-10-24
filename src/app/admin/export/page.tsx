'use client';

import React, { useState } from 'react';
import { Database, Download, FileSpreadsheet, FileJson, CheckCircle2, FileText, Loader2 } from 'lucide-react';
import { mockStore } from '@/lib/supabase/mockStore';

export default function AdminExportPage() {
  const [downloaded, setDownloaded] = useState<string | null>(null);
  const [loading, setLoading] = useState<string | null>(null);

  const handleExportSystemJson = () => {
    const data = {
      exportedAt: new Date().toISOString(),
      profiles: mockStore.profiles,
      wallets: mockStore.wallets,
      categories: mockStore.categories,
      transactions: mockStore.transactions,
      aiLogs: mockStore.aiLogs,
      auditLogs: mockStore.auditLogs,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tatadana_full_system_backup_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setDownloaded('JSON Backup');
    setTimeout(() => setDownloaded(null), 3000);
  };

  const handleExportExcel = async () => {
    setLoading('excel');
    try {
      const res = await fetch('/api/reports/export-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodStart: '2026-01-01',
          periodEnd: '2026-12-31',
          userId: 'usr-salwa-001',
        })
      });
      const data = await res.json();
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
        setDownloaded('Excel (.xlsx)');
        setTimeout(() => setDownloaded(null), 3000);
      }
    } catch (e) {
      alert('Gagal export Excel');
    } finally {
      setLoading(null);
    }
  };

  const handleExportPdf = async () => {
    setLoading('pdf');
    try {
      const res = await fetch('/api/reports/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodStart: '2026-01-01',
          periodEnd: '2026-12-31',
          userId: 'usr-salwa-001',
        })
      });
      const data = await res.json();
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
        setDownloaded('Laporan PDF');
        setTimeout(() => setDownloaded(null), 3000);
      }
    } catch (e) {
      alert('Gagal export PDF');
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Ekspor Data Sistem & Analisis Internal</h1>
        <p className="text-xs text-slate-400 mt-1">Unduh snapshot lengkap database semua user, laporan Excel (.xlsx), atau PDF resmi untuk backup & audit kepatuhan internal.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl">
        {/* Card 1: Excel */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Ekspor Excel (.xlsx)</h2>
              <p className="text-xs text-slate-400">Sheet transaksi lengkap dengan formatting nominal mata uang IDR & multi-kolom via ExcelJS.</p>
            </div>
          </div>

          <button
            onClick={handleExportExcel}
            disabled={loading !== null}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-2"
          >
            {loading === 'excel' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{loading === 'excel' ? 'Membuat file...' : 'Unduh File Excel (.xlsx)'}</span>
          </button>
        </div>

        {/* Card 2: PDF */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-rose-600/20 text-rose-400 flex items-center justify-center">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Ekspor Dokumen PDF</h2>
              <p className="text-xs text-slate-400">Ringkasan kas, grafik visual HTML/PDF siap cetak dengan logo resmi TataDana.</p>
            </div>
          </div>

          <button
            onClick={handleExportPdf}
            disabled={loading !== null}
            className="w-full py-3 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-2"
          >
            {loading === 'pdf' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
            <span>{loading === 'pdf' ? 'Membuat file...' : 'Unduh Dokumen PDF'}</span>
          </button>
        </div>

        {/* Card 3: JSON Backup */}
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="w-12 h-12 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Full Backup Database JSON</h2>
              <p className="text-xs text-slate-400">Tabel profiles, wallets, categories, transactions, aiLogs, dan auditLogs sistem.</p>
            </div>
          </div>

          <button
            onClick={handleExportSystemJson}
            className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl transition shadow flex items-center justify-center gap-2"
          >
            <FileJson className="w-4 h-4" />
            <span>Unduh Snapshot JSON</span>
          </button>
        </div>
      </div>

      {downloaded && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400 text-xs font-semibold flex items-center gap-2 max-w-md">
          <CheckCircle2 className="w-4 h-4" />
          <span>{downloaded} berhasil digenerate dan diunduh ke browser.</span>
        </div>
      )}
    </div>
  );
}
