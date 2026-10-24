'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Cpu, 
  CreditCard, 
  Activity, 
  ArrowRight, 
  ShieldCheck, 
  CheckCircle2, 
  Search, 
  Database, 
  UserCheck, 
  Phone,
  Sparkles,
  Megaphone,
  Layers,
  Settings
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils/currency';
import { mockStore } from '@/lib/supabase/mockStore';
import { Profile } from '@/types/database';
import UserProfileModal from '@/components/admin/UserProfileModal';

export default function AdminOverviewPage() {
  const [usersCount, setUsersCount] = useState(mockStore.profiles.length);
  const [proCount, setProCount] = useState(mockStore.profiles.filter(p => p.subscription_tier === 'pro').length);
  const [pendingApprovalCount, setPendingApprovalCount] = useState(mockStore.profiles.filter(p => p.approval_status === 'pending').length);
  const [activeBots, setActiveBots] = useState(mockStore.telegramBots.filter(b => b.webhook_status === 'connected').length);
  const [aiCalls, setAiCalls] = useState(mockStore.aiLogs.length);
  const [activeMode, setActiveMode] = useState(mockStore.aiConfigs[0]?.mode || 'failover');
  const [activeProviderName, setActiveProviderName] = useState(mockStore.aiConfigs.find(c => c.is_active)?.display_name || 'Gemini 1.5 Flash');
  const [recentUsers, setRecentUsers] = useState<Profile[]>(mockStore.profiles.slice(0, 5));
  const [selectedProfileModal, setSelectedProfileModal] = useState<Profile | null>(null);

  const refreshOverviewData = async () => {
    try {
      const res = await fetch('/api/admin/users/approve');
      if (res.ok) {
        const data = await res.json();
        const serverProfiles: Profile[] = Array.isArray(data.users) 
          ? data.users 
          : (Array.isArray(data.pendingUsers) ? data.pendingUsers : []);
        let merged = [...serverProfiles];
        
        if (typeof window !== 'undefined') {
          const localStr = localStorage.getItem('tatadana_registered_users');
          if (localStr) {
            try {
              const localUsers: Profile[] = JSON.parse(localStr);
              localUsers.forEach(lu => {
                const exIdx = merged.findIndex(m => m.id === lu.id || (lu.phone_number && m.phone_number === lu.phone_number));
                if (exIdx === -1) {
                  merged.unshift(lu);
                }
              });
            } catch (e) {}
          }
        }
        setUsersCount(merged.length);
        setProCount(merged.filter(p => p.subscription_tier === 'pro').length);
        setPendingApprovalCount(merged.filter(p => p.approval_status === 'pending').length);
        setRecentUsers(merged.slice(0, 5));
        mockStore.profiles = merged;
      }
    } catch (e) {
      setUsersCount(mockStore.profiles.length);
      setProCount(mockStore.profiles.filter(p => p.subscription_tier === 'pro').length);
      setPendingApprovalCount(mockStore.profiles.filter(p => p.approval_status === 'pending').length);
      setRecentUsers([...mockStore.profiles].slice(0, 5));
    }
    setActiveBots(mockStore.telegramBots.filter(b => b.webhook_status === 'connected').length);
    setAiCalls(mockStore.aiLogs.length);
    setActiveMode(mockStore.aiConfigs[0]?.mode || 'failover');
    setActiveProviderName(mockStore.aiConfigs.find(c => c.is_active)?.display_name || 'Gemini 1.5 Flash');
  };

  useEffect(() => {
    refreshOverviewData();
    const interval = setInterval(refreshOverviewData, 3000);
    const handleUserRegistered = () => refreshOverviewData();
    if (typeof window !== 'undefined') {
      window.addEventListener('tatadana_user_registered', handleUserRegistered);
      window.addEventListener('storage', handleUserRegistered);
    }
    return () => {
      clearInterval(interval);
      if (typeof window !== 'undefined') {
        window.removeEventListener('tatadana_user_registered', handleUserRegistered);
        window.removeEventListener('storage', handleUserRegistered);
      }
    };
  }, []);

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-7 h-7 text-orange-500" />
            <span>Pusat Kendali Superadmin Salwa L</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pemantauan metrik operasional, pengguna terdaftar WhatsApp, approval transaksi, AI multi-provider, dan audit log.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Sistem Aktif & Terlindungi
          </span>
        </div>
      </div>

      {/* PENGGUNA MENUNGGU APPROVAL BANNER */}
      {pendingApprovalCount > 0 && (
        <div className="bg-gradient-to-r from-amber-950/70 via-slate-900 to-amber-950/70 border-2 border-amber-500/50 rounded-2xl p-4 shadow-lg flex flex-col sm:flex-row items-center justify-between gap-3 animate-in fade-in">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 border border-amber-500/30">
              <UserCheck className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                <span>Perlu Tindakan Approval Pengguna</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 font-black text-[10px]">
                  {pendingApprovalCount} Akun Baru
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5">
                Ada pendaftar baru yang menunggu persetujuan akun dari Admin Salwa L sebelum dapat mengakses seluruh fitur keuangan.
              </p>
            </div>
          </div>
          <Link
            href="/admin/user-approvals"
            className="w-full sm:w-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-xl shadow transition flex items-center justify-center gap-1.5 whitespace-nowrap"
          >
            <span>Buka Panel Approval Pengguna →</span>
          </Link>
        </div>
      )}

      {/* 4 Admin Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase">
            <span>Total Pengguna</span>
            <Users className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{usersCount} Akun</div>
          <div className="text-[11px] text-emerald-400 mt-1">{proCount} Pro • {usersCount - proCount} Starter</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase">
            <span>Bot Telegram Terhubung</span>
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{activeBots} Webhook</div>
          <div className="text-[11px] text-slate-400 mt-1">Status 100% Idempotent</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase">
            <span>AI Provider Aktif</span>
            <Cpu className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2 truncate" title={activeProviderName}>
            {activeProviderName.split(' ')[0]} {activeProviderName.split(' ')[1] || ''}
          </div>
          <div className="text-[11px] text-blue-400 mt-1 capitalize">Mode {activeMode}</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase">
            <span>Panggilan AI Terakhir</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-purple-400 mt-2">{aiCalls} Requests</div>
          <div className="text-[11px] text-slate-400 mt-1">Avg latency: ~140ms</div>
        </div>
      </div>

      {/* FEATURE BARU: DAFTAR PENGGUNA TERBARU MENDAFTAR (WHATSAPP VERIFIED) */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800/80">
          <div>
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <UserCheck className="w-5 h-5 text-emerald-400" />
              <span>Pengguna Terbaru Mendaftar (WhatsApp Verified)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Klik &quot;Lihat Profil&quot; untuk memeriksa detail identitas, verifikasi nomor WhatsApp, paket, dan saldo dompet pengguna.
            </p>
          </div>

          <Link
            href="/admin/users"
            className="text-xs font-bold text-orange-400 hover:text-orange-300 transition flex items-center gap-1 self-start sm:self-auto"
          >
            <span>Lihat Semua Pengguna ({usersCount})</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="divide-y divide-slate-800/60">
          {recentUsers.map((u) => {
            const regTimeWIB = new Date(u.created_at).toLocaleString('id-ID', {
              timeZone: 'Asia/Jakarta',
              day: 'numeric',
              month: 'short',
              hour: '2-digit',
              minute: '2-digit',
            }) + ' WIB';

            return (
              <div key={u.id} className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-900/40 p-2 rounded-xl transition">
                <div className="flex items-center gap-3">
                  <img
                    src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                    alt={u.full_name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                  />
                  <div>
                    <div className="font-bold text-white text-xs flex items-center gap-2">
                      <span>{u.full_name}</span>
                      {u.phone_verified && (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.2 rounded-full border border-emerald-500/20 flex items-center gap-1">
                          <CheckCircle2 className="w-2.5 h-2.5" />
                          WA Terverifikasi 🟢
                        </span>
                      )}
                      <span className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded ${
                        u.subscription_tier === 'pro'
                          ? 'bg-orange-500/20 text-orange-400'
                          : 'bg-slate-800 text-slate-400'
                      }`}>
                        {u.subscription_tier}
                      </span>
                    </div>

                    <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                      <span className="font-mono text-slate-300">{u.phone_number || '-'}</span>
                      <span>•</span>
                      <span className="truncate max-w-[200px]">{u.email || u.id}</span>
                      <span>•</span>
                      <span className="text-slate-500 text-[10px]">Daftar: {regTimeWIB}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                  <button
                    onClick={() => setSelectedProfileModal(u)}
                    className="px-3.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white rounded-xl text-xs font-bold border border-slate-700 shadow-sm transition flex items-center gap-1.5"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-orange-400" />
                    <span>Lihat Profil User</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Quick Action Matrix Cards */}
      <div>
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider mb-3">Katalog Lengkap Panel Admin Superadmin</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            href="/admin/user-approvals"
            className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-2xl transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-3">
              <UserCheck className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition">1. Panel Approval Pengguna</h3>
            <p className="text-xs text-slate-400 mt-1">Verifikasi pendaftar baru via WhatsApp (08815703360), setujui akun, atau tolak pendaftaran.</p>
          </Link>

          <Link
            href="/admin/broadcast"
            className="bg-slate-950 border border-slate-800 hover:border-orange-500/50 p-5 rounded-2xl transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center mb-3">
              <Megaphone className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white group-hover:text-orange-400 transition">2. Panel Broadcast & Notifikasi</h3>
            <p className="text-xs text-slate-400 mt-1">Kirim siaran pesan massal dan pengumuman resmi ke WhatsApp & Telegram pengguna.</p>
          </Link>

          <Link
            href="/admin/global-transactions"
            className="bg-slate-950 border border-slate-800 hover:border-blue-500/50 p-5 rounded-2xl transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition">3. Transaksi & Dompet Global</h3>
            <p className="text-xs text-slate-400 mt-1">Pantau seluruh mutasi keuangan, arus kas platform, dan total saldo pengguna secara realtime.</p>
          </Link>

          <Link
            href="/admin/payments"
            className="bg-slate-950 border border-slate-800 hover:border-emerald-500/50 p-5 rounded-2xl transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 text-emerald-400 flex items-center justify-center mb-3">
              <CreditCard className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white group-hover:text-emerald-400 transition">4. Panel Approval Pembayaran</h3>
            <p className="text-xs text-slate-400 mt-1">Verifikasi bukti transfer manual, approve upgrade ke Pro, atau cek status Midtrans.</p>
          </Link>

          <Link
            href="/admin/users"
            className="bg-slate-950 border border-slate-800 hover:border-orange-500/50 p-5 rounded-2xl transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center mb-3">
              <Users className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white group-hover:text-orange-400 transition">5. Kelola Pengguna & Impersonasi</h3>
            <p className="text-xs text-slate-400 mt-1">Lihat seluruh profil pengguna, ganti tier Starter/Pro, dan impersonasi akun tanpa password.</p>
          </Link>

          <Link
            href="/admin/system-settings"
            className="bg-slate-950 border border-slate-800 hover:border-orange-500/50 p-5 rounded-2xl transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-orange-600/20 text-orange-400 flex items-center justify-center mb-3">
              <Settings className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white group-hover:text-orange-400 transition">6. Pengaturan Sistem & Kuota</h3>
            <p className="text-xs text-slate-400 mt-1">Atur limit Starter, tarif langganan PRO seumur hidup, batas OCR, dan mode pemeliharaan.</p>
          </Link>

          <Link
            href="/admin/ai-config"
            className="bg-slate-950 border border-slate-800 hover:border-blue-500/50 p-5 rounded-2xl transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 text-blue-400 flex items-center justify-center mb-3">
              <Cpu className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white group-hover:text-blue-400 transition">7. Konfigurasi AI Multi-Provider</h3>
            <p className="text-xs text-slate-400 mt-1">Ganti API key, ubah mode Single ke Failover paralel (Gemini, OpenAI GPT, DeepSeek).</p>
          </Link>

          <Link
            href="/admin/ai-logs"
            className="bg-slate-950 border border-slate-800 hover:border-purple-500/50 p-5 rounded-2xl transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-400 flex items-center justify-center mb-3">
              <Activity className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white group-hover:text-purple-400 transition">8. Log Aktivitas & Telemetri AI</h3>
            <p className="text-xs text-slate-400 mt-1">Inspeksi latency, token usage, kegagalan fallback, dan prompt summary pengguna.</p>
          </Link>

          <Link
            href="/admin/inspect"
            className="bg-slate-950 border border-slate-800 hover:border-amber-500/50 p-5 rounded-2xl transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 text-amber-400 flex items-center justify-center mb-3">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white group-hover:text-amber-400 transition">9. Inspeksi Transaksi & Audit Trail</h3>
            <p className="text-xs text-slate-400 mt-1">Audit log seluruh mutasi, riwayat tindakan admin, dan integritas database.</p>
          </Link>

          <Link
            href="/admin/export"
            className="bg-slate-950 border border-slate-800 hover:border-cyan-500/50 p-5 rounded-2xl transition group"
          >
            <div className="w-10 h-10 rounded-xl bg-cyan-600/20 text-cyan-400 flex items-center justify-center mb-3">
              <Database className="w-5 h-5" />
            </div>
            <h3 className="font-bold text-sm text-white group-hover:text-cyan-400 transition">10. Ekspor Data & Laporan Sistem</h3>
            <p className="text-xs text-slate-400 mt-1">Ekspor komprehensif ke format Excel (.xlsx), PDF, dan backup JSON snapshot.</p>
          </Link>
        </div>
      </div>

      {/* User Profile Detail Modal */}
      <UserProfileModal
        user={selectedProfileModal}
        isOpen={Boolean(selectedProfileModal)}
        onClose={() => setSelectedProfileModal(null)}
        onPlanToggle={(uid) => {
          const idx = mockStore.profiles.findIndex(p => p.id === uid);
          if (idx !== -1) {
            mockStore.profiles[idx].subscription_tier = mockStore.profiles[idx].subscription_tier === 'pro' ? 'starter' : 'pro';
            refreshOverviewData();
          }
        }}
      />
    </div>
  );
}
