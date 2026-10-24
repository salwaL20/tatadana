'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Eye, 
  Sparkles, 
  CheckCircle2, 
  ShieldAlert, 
  ArrowRight, 
  Search, 
  UserCheck, 
  Phone, 
  Shield, 
  Calendar,
  Filter,
  Check,
  Clock,
  XCircle
} from 'lucide-react';
import { mockStore } from '@/lib/supabase/mockStore';
import { Profile } from '@/types/database';
import UserProfileModal from '@/components/admin/UserProfileModal';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<Profile[]>(mockStore.profiles);
  const [search, setSearch] = useState('');
  const [selectedUserForDetail, setSelectedUserForDetail] = useState<Profile | null>(null);
  const [filterTab, setFilterTab] = useState<'all' | 'verified_wa' | 'pro' | 'starter' | 'pending'>('all');

  const refreshUsers = async () => {
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
        setUsers(merged);
        mockStore.profiles = merged;
        return;
      }
    } catch (err) {}

    let fallback = [...mockStore.profiles];
    if (typeof window !== 'undefined') {
      const localStr = localStorage.getItem('tatadana_registered_users');
      if (localStr) {
        try {
          const localUsers: Profile[] = JSON.parse(localStr);
          localUsers.forEach(lu => {
            if (!fallback.some(m => m.id === lu.id || (lu.phone_number && m.phone_number === lu.phone_number))) {
              fallback.unshift(lu);
            }
          });
        } catch (e) {}
      }
    }
    setUsers(fallback);
  };

  useEffect(() => {
    refreshUsers();
    const interval = setInterval(refreshUsers, 3000);
    const handleUserRegistered = () => refreshUsers();
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

  const handleApproveQuick = async (userId: string) => {
    try {
      await fetch('/api/admin/users/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action: 'verify', adminId: 'usr-salwa-001' }),
      });
    } catch {}
    const idx = mockStore.profiles.findIndex(p => p.id === userId);
    if (idx !== -1) {
      mockStore.profiles[idx].phone_verified = true;
      mockStore.profiles[idx].approval_status = 'approved';
      mockStore.profiles[idx].approved_at = new Date().toISOString();
      mockStore.profiles[idx].approved_by = 'usr-salwa-001';
      mockStore.profiles[idx].updated_at = new Date().toISOString();
      refreshUsers();
    }
  };

  const handleImpersonate = (user: Profile) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('tatadana_impersonating', 'true');
      sessionStorage.setItem('tatadana_impersonate_user_id', user.id);
      // Record audit log
      mockStore.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        admin_id: 'usr-salwa-001',
        target_user_id: user.id,
        action: 'impersonate_user',
        metadata: { target_name: user.full_name, target_phone: user.phone_number },
        ip_address: '127.0.0.1 (Internal Admin)',
        created_at: new Date().toISOString(),
      });
      window.location.href = '/dashboard';
    }
  };

  const toggleUserPlan = (userId: string) => {
    const idx = mockStore.profiles.findIndex(p => p.id === userId);
    if (idx !== -1) {
      const current = mockStore.profiles[idx].subscription_tier;
      const newTier = current === 'starter' ? 'pro' : 'starter';
      mockStore.profiles[idx].subscription_tier = newTier;
      mockStore.profiles[idx].updated_at = new Date().toISOString();
      refreshUsers();

      mockStore.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        admin_id: 'usr-salwa-001',
        target_user_id: userId,
        action: 'change_subscription_tier',
        metadata: { from: current, to: newTier, user_name: mockStore.profiles[idx].full_name },
        ip_address: '127.0.0.1 (Internal Admin)',
        created_at: new Date().toISOString(),
      });
    }
  };

  const filteredUsers = users.filter(u => {
    // 1. Search Filter
    const matchesSearch = u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone_number && u.phone_number.includes(search)) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
      u.id.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    // 2. Tab Filter
    if (filterTab === 'pending') return u.approval_status === 'pending';
    if (filterTab === 'verified_wa') return u.phone_verified;
    if (filterTab === 'pro') return u.subscription_tier === 'pro';
    if (filterTab === 'starter') return u.subscription_tier === 'starter';
    return true;
  });

  const pendingCount = users.filter(u => u.approval_status === 'pending').length;
  const verifiedCount = users.filter(u => u.phone_verified).length;
  const proCount = users.filter(u => u.subscription_tier === 'pro').length;

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            <Users className="w-6 h-6 text-orange-500" />
            <span>Kelola Pengguna & Detail Profil</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Daftar lengkap pengguna terdaftar, verifikasi WhatsApp, hak akses paket, dan inspeksi detail profil.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama, WhatsApp, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Filter Tabs & Stats Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-2 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap gap-1.5 text-xs font-bold">
          <button
            onClick={() => setFilterTab('all')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterTab === 'all'
                ? 'bg-orange-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Semua ({users.length})
          </button>
          <button
            onClick={() => setFilterTab('pending')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              filterTab === 'pending'
                ? 'bg-amber-500 text-slate-950 font-black shadow'
                : 'text-amber-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Clock className="w-3.5 h-3.5" />
            <span>Menunggu Approval ({pendingCount})</span>
            {pendingCount > 0 && <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping"></span>}
          </button>
          <button
            onClick={() => setFilterTab('verified_wa')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
              filterTab === 'verified_wa'
                ? 'bg-emerald-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>WhatsApp Terverifikasi ({verifiedCount})</span>
          </button>
          <button
            onClick={() => setFilterTab('pro')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterTab === 'pro'
                ? 'bg-amber-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Paket PRO ({proCount})
          </button>
          <button
            onClick={() => setFilterTab('starter')}
            className={`px-3 py-1.5 rounded-xl transition ${
              filterTab === 'starter'
                ? 'bg-blue-600 text-white shadow'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Starter ({users.length - proCount})
          </button>
        </div>

        <div className="text-[11px] text-slate-400 px-2 font-mono">
          Sinkronisasi realtime: <span className="text-emerald-400 font-bold">Aktif 🟢</span>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Pengguna Terdaftar</th>
                <th className="py-3 px-4">Verifikasi WhatsApp</th>
                <th className="py-3 px-4">Waktu Daftar</th>
                <th className="py-3 px-4">Paket Akun</th>
                <th className="py-3 px-4">Status Approval</th>
                <th className="py-3 px-4 text-right">Aksi Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const bot = mockStore.telegramBots.find(b => b.user_id === u.id);
                  const isNewUser = Date.now() - new Date(u.created_at).getTime() < 7 * 86400000;
                  const regDateWIB = new Date(u.created_at).toLocaleDateString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric'
                  });

                  return (
                    <tr key={u.id} className="hover:bg-slate-900/50 transition">
                      {/* 1. Pengguna */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={u.full_name}
                            className="w-9 h-9 rounded-full object-cover border border-slate-700 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span>{u.full_name}</span>
                              {isNewUser && (
                                <span className="text-[9px] bg-orange-500/20 text-orange-400 border border-orange-500/30 font-bold px-1.5 py-0.2 rounded-full">
                                  Baru 🌟
                                </span>
                              )}
                              {u.role === 'superadmin' && (
                                <span className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                                  Admin
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 truncate max-w-xs">
                              {u.email || u.id}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. WhatsApp Status */}
                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="font-mono text-xs">{u.phone_number || '-'}</div>
                        {u.phone_verified ? (
                          <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1 mt-0.5">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>WhatsApp Terverifikasi 🟢</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-400 font-semibold flex items-center gap-1 mt-0.5">
                            <span>Belum Verifikasi 🟡</span>
                          </span>
                        )}
                      </td>

                      {/* 3. Waktu Daftar */}
                      <td className="py-3.5 px-4 text-slate-400">
                        <div className="text-xs text-slate-300">{regDateWIB}</div>
                        <div className="text-[10px] text-slate-500">
                          {new Date(u.created_at).toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta', hour: '2-digit', minute: '2-digit' })} WIB
                        </div>
                      </td>

                      {/* 4. Paket */}
                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => toggleUserPlan(u.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wider uppercase border transition ${
                            u.subscription_tier === 'pro'
                              ? 'bg-orange-500/20 text-orange-400 border-orange-500/40 hover:bg-orange-500/30'
                              : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                          }`}
                          title="Klik untuk ubah paket"
                        >
                          {u.subscription_tier} (Ubah)
                        </button>
                      </td>

                      {/* 5. Status Approval */}
                      <td className="py-3.5 px-4">
                        {u.approval_status === 'pending' ? (
                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                              <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                              <span>Menunggu 🟡</span>
                            </span>
                            <button
                              onClick={() => handleApproveQuick(u.id)}
                              className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] rounded-lg shadow transition flex items-center gap-1"
                              title="Setujui pengguna ini"
                            >
                              <Check className="w-2.5 h-2.5" />
                              <span>Setujui</span>
                            </button>
                          </div>
                        ) : u.approval_status === 'rejected' ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <XCircle className="w-3 h-3 text-rose-400" />
                            <span>Ditolak 🔴</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Disetujui 🟢</span>
                          </span>
                        )}
                      </td>

                      {/* 5. Aksi Admin */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* CHAT WA BUTTON */}
                          {u.phone_number && (
                            <a
                              href={`https://wa.me/${u.phone_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(`Halo Kak ${u.full_name}, kami dari Admin TataDana.`)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-950/60 hover:bg-emerald-900/80 text-emerald-300 hover:text-emerald-200 font-bold text-xs rounded-xl border border-emerald-700/50 shadow-sm transition"
                              title="Hubungi pengguna langsung di WhatsApp"
                            >
                              <Phone className="w-3.5 h-3.5 text-emerald-400" />
                              <span>Chat WA</span>
                            </a>
                          )}

                          {/* LIHAT PROFIL BUTTON */}
                          <button
                            onClick={() => setSelectedUserForDetail(u)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 hover:text-white font-bold text-xs rounded-xl border border-slate-700 shadow-sm transition"
                            title="Buka detail profil lengkap pengguna"
                          >
                            <UserCheck className="w-3.5 h-3.5 text-orange-400" />
                            <span>Lihat Profil</span>
                          </button>

                          {/* IMPERSONASI BUTTON */}
                          <button
                            onClick={() => handleImpersonate(u)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow transition"
                            title="Masuk sebagai pengguna tanpa password"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Masuk</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    Tidak ada pengguna yang cocok dengan pencarian &quot;{search}&quot;.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* User Profile Detail Modal */}
      <UserProfileModal
        user={selectedUserForDetail}
        isOpen={Boolean(selectedUserForDetail)}
        onClose={() => setSelectedUserForDetail(null)}
        onPlanToggle={(uid) => {
          toggleUserPlan(uid);
          const updated = mockStore.profiles.find(p => p.id === uid);
          if (updated) setSelectedUserForDetail({ ...updated });
        }}
        onImpersonate={(u) => handleImpersonate(u)}
      />
    </div>
  );
}
