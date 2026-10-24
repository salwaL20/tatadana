'use client';

import React, { useState, useEffect } from 'react';
import { 
  Settings, 
  Save, 
  ShieldCheck, 
  AlertTriangle, 
  CheckCircle2, 
  Lock, 
  Smartphone, 
  DollarSign, 
  Database, 
  Server, 
  Mail, 
  User, 
  FileText,
  RotateCcw,
  Sparkles,
  Download
} from 'lucide-react';
import { mockStore } from '@/lib/supabase/mockStore';
import { SystemSettingsRecord } from '@/types/database';

export default function AdminSystemSettingsPage() {
  const [settings, setSettings] = useState<SystemSettingsRecord>(mockStore.systemSettings);
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  useEffect(() => {
    setSettings({ ...mockStore.systemSettings });
  }, []);

  const handleChange = (field: keyof SystemSettingsRecord, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/system', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          settings,
          adminId: 'usr-salwa-001',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        mockStore.systemSettings = { ...settings, updated_at: new Date().toISOString() };
        setFeedback({ type: 'success', message: data.message || 'Pengaturan sistem berhasil disimpan!' });
      } else {
        setFeedback({ type: 'error', message: data.error || 'Gagal menyimpan pengaturan' });
      }
    } catch {
      mockStore.systemSettings = { ...settings, updated_at: new Date().toISOString() };
      setFeedback({ type: 'success', message: 'Pengaturan sistem berhasil diperbarui secara lokal!' });
    } finally {
      setSaving(false);
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleResetDefaults = () => {
    const defaultSettings: SystemSettingsRecord = {
      site_name: 'TataDana FinTech SaaS',
      admin_name: 'Salwa L',
      admin_phone: '08815703360',
      admin_email: 'salwaL20@gmail.com',
      maintenance_mode: false,
      maintenance_message: 'Sistem sedang dalam peningkatan performa berkala. Mohon tunggu beberapa saat.',
      starter_tx_limit: 50,
      pro_price_idr: 99000,
      ocr_receipt_daily_limit: 10,
      ai_daily_limit_starter: 20,
      auto_backup_enabled: true,
      updated_at: new Date().toISOString(),
    };
    setSettings(defaultSettings);
    mockStore.systemSettings = defaultSettings;
    setFeedback({ type: 'success', message: 'Pengaturan telah dikembalikan ke standar awal!' });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleDownloadBackup = () => {
    const backupData = {
      timestamp: new Date().toISOString(),
      systemSettings: settings,
      profilesCount: mockStore.profiles.length,
      walletsCount: mockStore.wallets.length,
      transactionsCount: mockStore.transactions.length,
      auditLogsCount: mockStore.auditLogs.length,
      profiles: mockStore.profiles,
      wallets: mockStore.wallets,
      categories: mockStore.categories,
      transactions: mockStore.transactions,
      broadcasts: mockStore.broadcasts,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute('href', dataStr);
    dlAnchor.setAttribute('download', `tatadana_system_backup_${Date.now()}.json`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Settings className="w-7 h-7 text-orange-500" />
            <span>Panel Pengaturan Sistem & Kuota</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Konfigurasi parameter operasional platform, tarif paket PRO, batasan transaksi gratis, dan status pemeliharaan sistem.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadBackup}
            className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700"
          >
            <Download className="w-3.5 h-3.5 text-emerald-400" />
            <span>Cadangkan Data (JSON)</span>
          </button>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200' 
            : 'bg-rose-950/80 border border-rose-500/50 text-rose-200'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Form Settings */}
      <form onSubmit={handleSaveSettings} className="space-y-6">
        {/* Card 1: Status Mode Pemeliharaan (Maintenance Mode) */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Server className="w-5 h-5 text-orange-400" />
              <h2 className="text-sm font-bold text-white">1. Mode Pemeliharaan (Maintenance Mode)</h2>
            </div>
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              settings.maintenance_mode 
                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse' 
                : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
            }`}>
              {settings.maintenance_mode ? '🔴 Pemeliharaan Aktif' : '🟢 Server Berjalan Normal'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 bg-slate-900 border border-slate-800 rounded-2xl">
            <div>
              <div className="font-bold text-white text-xs">Aktifkan Status Pemeliharaan Sistem</div>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                Saat diaktifkan, pengguna reguler akan melihat spanduk pemeliharaan saat login dan transaksi baru dijeda sementara.
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer shrink-0">
              <input
                type="checkbox"
                checked={settings.maintenance_mode}
                onChange={(e) => handleChange('maintenance_mode', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-600"></div>
            </label>
          </div>

          {settings.maintenance_mode && (
            <div className="space-y-1.5 animate-in fade-in">
              <label className="block text-xs font-bold text-slate-300">
                Pesan Notifikasi Pemeliharaan untuk Pengguna:
              </label>
              <textarea
                rows={2}
                value={settings.maintenance_message}
                onChange={(e) => handleChange('maintenance_message', e.target.value)}
                className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          )}
        </div>

        {/* Card 2: Parameter Kuota & Tarif Finansial */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <DollarSign className="w-5 h-5 text-emerald-400" />
            <h2 className="text-sm font-bold text-white">2. Parameter Kuota & Tarif Langganan</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Batas Transaksi Akun Starter (per Bulan):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={10}
                  max={500}
                  value={settings.starter_tx_limit}
                  onChange={(e) => handleChange('starter_tx_limit', Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-orange-500"
                />
                <span className="absolute right-3.5 top-2.5 text-[11px] text-slate-500 font-medium">Transaksi/bln</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Standar: 50 transaksi per pengguna paket Starter.</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Tarif Upgrade Paket PRO Seumur Hidup (Rp):
              </label>
              <div className="relative">
                <input
                  type="number"
                  step={1000}
                  min={10000}
                  value={settings.pro_price_idr}
                  onChange={(e) => handleChange('pro_price_idr', Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-orange-500"
                />
                <span className="absolute right-3.5 top-2.5 text-[11px] text-slate-500 font-medium">IDR Lifetime</span>
              </div>
              <p className="text-[10px] text-slate-500 mt-1">Standar: Rp99.000 (Akses tanpa batas + OCR struk).</p>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Batas Scan OCR Struk Belanja (per Hari):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={1}
                  max={50}
                  value={settings.ocr_receipt_daily_limit}
                  onChange={(e) => handleChange('ocr_receipt_daily_limit', Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-orange-500"
                />
                <span className="absolute right-3.5 top-2.5 text-[11px] text-slate-500 font-medium">Foto Struk/hari</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Batas Chat Konsultasi Tata AI (Starter / Hari):
              </label>
              <div className="relative">
                <input
                  type="number"
                  min={5}
                  max={100}
                  value={settings.ai_daily_limit_starter}
                  onChange={(e) => handleChange('ai_daily_limit_starter', Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-bold text-white focus:outline-none focus:border-orange-500"
                />
                <span className="absolute right-3.5 top-2.5 text-[11px] text-slate-500 font-medium">Prompt/hari</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: Identitas & Kontak Resmi Superadmin */}
        <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
            <User className="w-5 h-5 text-orange-400" />
            <h2 className="text-sm font-bold text-white">3. Identitas & Kontak Resmi Superadmin</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nama Lengkap Admin:
              </label>
              <input
                type="text"
                value={settings.admin_name}
                onChange={(e) => handleChange('admin_name', e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Nomor WhatsApp Resmi Admin:
              </label>
              <input
                type="text"
                value={settings.admin_phone}
                onChange={(e) => handleChange('admin_phone', e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-mono font-semibold text-white focus:outline-none focus:border-orange-500"
              />
              <span className="text-[10px] text-emerald-400 mt-1 block">Digunakan pada tombol verifikasi pengguna</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Email Resmi Admin:
              </label>
              <input
                type="email"
                value={settings.admin_email}
                onChange={(e) => handleChange('admin_email', e.target.value)}
                required
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs font-semibold text-white focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="px-4 py-2 text-slate-400 hover:text-white text-xs font-semibold rounded-xl transition flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset ke Pengaturan Default</span>
          </button>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto px-6 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/30 transition flex items-center justify-center gap-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Menyimpan Perubahan...' : 'Simpan Seluruh Pengaturan Sistem'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
