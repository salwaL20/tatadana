'use client';

import React, { useState, useEffect } from 'react';
import { 
  UserCheck, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  AlertCircle, 
  Search, 
  Phone, 
  ShieldCheck, 
  RotateCcw,
  Sparkles,
  Filter,
  Check,
  X,
  User,
  ExternalLink
} from 'lucide-react';
import { mockStore } from '@/lib/supabase/mockStore';
import { Profile, UserApprovalStatus } from '@/types/database';
import UserProfileModal from '@/components/admin/UserProfileModal';

export default function AdminUserApprovalsPage() {
  const [users, setUsers] = useState<Profile[]>(mockStore.profiles);
  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedProfileModal, setSelectedProfileModal] = useState<Profile | null>(null);
  const [feedbackNotice, setFeedbackNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Rejection modal
  const [rejectingUser, setRejectingUser] = useState<Profile | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Data pendaftaran tidak valid / nomor WhatsApp tidak aktif');

  const refreshData = async () => {
    try {
      const res = await fetch('/api/admin/users/approve');
      if (res.ok) {
        const data = await res.json();
        const serverProfiles: Profile[] = Array.isArray(data.users) 
          ? data.users 
          : (Array.isArray(data.pendingUsers) ? data.pendingUsers : []);
        let merged = [...serverProfiles];
        
        // Also merge any users stored locally in browser
        if (typeof window !== 'undefined') {
          const localStr = localStorage.getItem('tatadana_registered_users');
          if (localStr) {
            try {
              const localUsers: Profile[] = JSON.parse(localStr);
              localUsers.forEach(lu => {
                const exIdx = merged.findIndex(m => m.id === lu.id || (lu.phone_number && m.phone_number === lu.phone_number));
                if (exIdx === -1) {
                  merged.unshift(lu);
                } else if (lu.approval_status === 'pending') {
                  merged[exIdx].approval_status = 'pending';
                  merged[exIdx].phone_verified = false;
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

    // Fallback to local mockStore & localStorage
    let fallback = [...mockStore.profiles];
    if (typeof window !== 'undefined') {
      const localStr = localStorage.getItem('tatadana_registered_users');
      if (localStr) {
        try {
          const localUsers: Profile[] = JSON.parse(localStr);
          localUsers.forEach(lu => {
            const exIdx = fallback.findIndex(m => m.id === lu.id || (lu.phone_number && m.phone_number === lu.phone_number));
            if (exIdx === -1) {
              fallback.unshift(lu);
            } else if (lu.approval_status === 'pending') {
              fallback[exIdx].approval_status = 'pending';
              fallback[exIdx].phone_verified = false;
            }
          });
        } catch (e) {}
      }
    }
    setUsers(fallback);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    const handleUserRegistered = () => refreshData();
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

  const handleApprove = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/users/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'verify',
          notes: 'Nomor WhatsApp diverifikasi & disetujui oleh Superadmin Salwa L',
          adminId: 'usr-salwa-001',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackNotice({ type: 'success', message: data.message || 'Pengguna berhasil diverifikasi & disetujui!' });
        refreshData();
      } else {
        setFeedbackNotice({ type: 'error', message: data.error || 'Gagal memverifikasi pengguna.' });
      }
    } catch {
      // Local fallback
      const idx = mockStore.profiles.findIndex(p => p.id === userId);
      if (idx !== -1) {
        mockStore.profiles[idx].phone_verified = true;
        mockStore.profiles[idx].approval_status = 'approved';
        mockStore.profiles[idx].approved_at = new Date().toISOString();
        mockStore.profiles[idx].approved_by = 'usr-salwa-001';
        mockStore.profiles[idx].updated_at = new Date().toISOString();
        setFeedbackNotice({ type: 'success', message: `Pengguna ${mockStore.profiles[idx].full_name} berhasil diverifikasi & disetujui!` });
        refreshData();
      }
    }
      if (typeof window !== 'undefined') {
        const localStr = localStorage.getItem('tatadana_registered_users');
        if (localStr) {
          try {
            const list: Profile[] = JSON.parse(localStr);
            const target = list.find(u => u.id === userId);
            if (target) {
              target.approval_status = 'approved';
              target.phone_verified = true;
              localStorage.setItem('tatadana_registered_users', JSON.stringify(list));
            }
          } catch (e) {}
        }
      }
      setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const handleConfirmReject = async () => {
    if (!rejectingUser) return;
    try {
      const res = await fetch('/api/admin/users/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: rejectingUser.id,
          action: 'reject',
          notes: rejectionReason,
          adminId: 'usr-salwa-001',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackNotice({ type: 'success', message: data.message || 'Pendaftaran pengguna berhasil ditolak.' });
        refreshData();
      } else {
        setFeedbackNotice({ type: 'error', message: data.error || 'Gagal menolak pengguna.' });
      }
    } catch {
      const idx = mockStore.profiles.findIndex(p => p.id === rejectingUser.id);
      if (idx !== -1) {
        mockStore.profiles[idx].approval_status = 'rejected';
        mockStore.profiles[idx].approval_notes = rejectionReason;
        mockStore.profiles[idx].updated_at = new Date().toISOString();
        setFeedbackNotice({ type: 'success', message: `Pengguna ${mockStore.profiles[idx].full_name} berhasil ditolak.` });
        refreshData();
      }
    }
    if (typeof window !== 'undefined') {
      const localStr = localStorage.getItem('tatadana_registered_users');
      if (localStr) {
        try {
          const list: Profile[] = JSON.parse(localStr);
          const target = list.find(u => u.id === rejectingUser.id);
          if (target) {
            target.approval_status = 'rejected';
            target.approval_notes = rejectionReason;
            localStorage.setItem('tatadana_registered_users', JSON.stringify(list));
          }
        } catch (e) {}
      }
    }
    setRejectingUser(null);
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const handleResetPending = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/users/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          action: 'reset',
          notes: 'Dikembalikan ke status peninjauan oleh Salwa L',
          adminId: 'usr-salwa-001',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedbackNotice({ type: 'success', message: data.message });
        refreshData();
      }
    } catch {
      const idx = mockStore.profiles.findIndex(p => p.id === userId);
      if (idx !== -1) {
        mockStore.profiles[idx].approval_status = 'pending';
        mockStore.profiles[idx].approved_at = null;
        mockStore.profiles[idx].approved_by = null;
        mockStore.profiles[idx].updated_at = new Date().toISOString();
        refreshData();
      }
    }
    if (typeof window !== 'undefined') {
      const localStr = localStorage.getItem('tatadana_registered_users');
      if (localStr) {
        try {
          const list: Profile[] = JSON.parse(localStr);
          const target = list.find(u => u.id === userId);
          if (target) {
            target.approval_status = 'pending';
            localStorage.setItem('tatadana_registered_users', JSON.stringify(list));
          }
        } catch (e) {}
      }
    }
    setTimeout(() => setFeedbackNotice(null), 4000);
  };

  const pendingCount = users.filter(u => u.approval_status === 'pending').length;
  const approvedCount = users.filter(u => !u.approval_status || u.approval_status === 'approved').length;
  const rejectedCount = users.filter(u => u.approval_status === 'rejected').length;

  const filteredUsers = users.filter(u => {
    const status = u.approval_status || 'approved';
    const matchesSearch = 
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      (u.phone_number && u.phone_number.includes(search)) ||
      (u.email && u.email.toLowerCase().includes(search.toLowerCase())) ||
      u.id.toLowerCase().includes(search.toLowerCase());

    if (!matchesSearch) return false;

    if (filterTab === 'pending') return status === 'pending';
    if (filterTab === 'approved') return status === 'approved';
    if (filterTab === 'rejected') return status === 'rejected';
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <UserCheck className="w-7 h-7 text-emerald-500" />
            <span>Pusat Approval Pengguna TataDana</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Verifikasi dan berikan persetujuan akses pendaftar baru oleh Superadmin Salwa L sebelum menggunakan layanan penuh.
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari nama, WhatsApp, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>
      </div>

      {/* Feedback Toast */}
      {feedbackNotice && (
        <div className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
          feedbackNotice.type === 'success' 
            ? 'bg-emerald-950/80 border border-emerald-600/50 text-emerald-200' 
            : 'bg-rose-950/80 border border-rose-600/50 text-rose-200'
        }`}>
          {feedbackNotice.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedbackNotice.message}</span>
        </div>
      )}

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div 
          onClick={() => setFilterTab('pending')}
          className={`cursor-pointer bg-slate-950 border rounded-2xl p-4 transition shadow-md ${
            filterTab === 'pending' ? 'border-amber-500/80 ring-2 ring-amber-500/20' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Menunggu Approval</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-black text-amber-400 mt-1 flex items-center gap-2">
            <span>{pendingCount}</span>
            {pendingCount > 0 && (
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-ping"></span>
            )}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Perlu tindakan verifikasi</div>
        </div>

        <div 
          onClick={() => setFilterTab('approved')}
          className={`cursor-pointer bg-slate-950 border rounded-2xl p-4 transition shadow-md ${
            filterTab === 'approved' ? 'border-emerald-500/80 ring-2 ring-emerald-500/20' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Pengguna Disetujui</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-black text-emerald-400 mt-1">{approvedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Akses penuh aktif</div>
        </div>

        <div 
          onClick={() => setFilterTab('rejected')}
          className={`cursor-pointer bg-slate-950 border rounded-2xl p-4 transition shadow-md ${
            filterTab === 'rejected' ? 'border-rose-500/80 ring-2 ring-rose-500/20' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Pendaftaran Ditolak</span>
            <XCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-black text-rose-400 mt-1">{rejectedCount}</div>
          <div className="text-[11px] text-slate-400 mt-1">Dibatasi dari sistem</div>
        </div>

        <div 
          onClick={() => setFilterTab('all')}
          className={`cursor-pointer bg-slate-950 border rounded-2xl p-4 transition shadow-md ${
            filterTab === 'all' ? 'border-orange-500/80 ring-2 ring-orange-500/20' : 'border-slate-800 hover:border-slate-700'
          }`}
        >
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Total Pengguna</span>
            <User className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-black text-white mt-1">{users.length}</div>
          <div className="text-[11px] text-slate-400 mt-1">Basis data TataDana</div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap gap-2 bg-slate-950 p-2 rounded-2xl border border-slate-800 text-xs font-bold">
        <button
          onClick={() => setFilterTab('pending')}
          className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
            filterTab === 'pending'
              ? 'bg-amber-500 text-slate-950 font-black shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>Menunggu Approval ({pendingCount})</span>
        </button>

        <button
          onClick={() => setFilterTab('approved')}
          className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
            filterTab === 'approved'
              ? 'bg-emerald-600 text-white font-black shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Disetujui ({approvedCount})</span>
        </button>

        <button
          onClick={() => setFilterTab('rejected')}
          className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 ${
            filterTab === 'rejected'
              ? 'bg-rose-600 text-white font-black shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          <XCircle className="w-3.5 h-3.5" />
          <span>Ditolak ({rejectedCount})</span>
        </button>

        <button
          onClick={() => setFilterTab('all')}
          className={`px-3 py-1.5 rounded-xl transition ${
            filterTab === 'all'
              ? 'bg-slate-800 text-white font-black shadow'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          Semua Pengguna ({users.length})
        </button>
      </div>

      {/* Approval Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">WhatsApp & Kontak</th>
                <th className="py-3 px-4">Waktu Daftar</th>
                <th className="py-3 px-4">Status Approval</th>
                <th className="py-3 px-4 text-right">Keputusan Admin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredUsers.length > 0 ? (
                filteredUsers.map((u) => {
                  const status: UserApprovalStatus = u.approval_status || 'approved';
                  const regDateWIB = new Date(u.created_at).toLocaleDateString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }) + ' WIB';

                  return (
                    <tr key={u.id} className="hover:bg-slate-900/50 transition">
                      {/* 1. Pengguna */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={u.full_name}
                            className="w-10 h-10 rounded-full object-cover border border-slate-700 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-white text-xs flex items-center gap-1.5">
                              <span>{u.full_name}</span>
                              {u.role === 'superadmin' && (
                                <span className="text-[9px] bg-red-600 text-white font-bold px-1.5 py-0.2 rounded-full">
                                  Superadmin
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              {u.email || u.id}
                            </div>
                            <div className="text-[10px] text-orange-400 font-medium">
                              Paket: {u.subscription_tier.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* 2. WhatsApp & Kontak */}
                      <td className="py-3.5 px-4 text-slate-300">
                        <div className="font-mono text-xs">{u.phone_number || '-'}</div>
                        <div className="flex items-center gap-1 mt-1">
                          {u.phone_verified ? (
                            <span className="text-[10px] text-emerald-400 font-bold flex items-center gap-1">
                              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                              <span>WA Terverifikasi 🟢</span>
                            </span>
                          ) : (
                            <span className="text-[10px] text-amber-400 font-bold flex items-center gap-1">
                              <Clock className="w-3 h-3 text-amber-400" />
                              <span>Perlu Verifikasi WA 🟡</span>
                            </span>
                          )}
                        </div>
                      </td>

                      {/* 3. Waktu Daftar */}
                      <td className="py-3.5 px-4 text-slate-400">
                        <div className="text-xs text-slate-300">{regDateWIB}</div>
                        {u.approval_notes && (
                          <div className="text-[10px] text-slate-500 italic mt-0.5 line-clamp-1" title={u.approval_notes}>
                            &ldquo;{u.approval_notes}&rdquo;
                          </div>
                        )}
                      </td>

                      {/* 4. Status Approval */}
                      <td className="py-3.5 px-4">
                        {status === 'pending' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                            <span>Menunggu Approval 🟡</span>
                          </span>
                        )}
                        {status === 'approved' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                            <span>Disetujui 🟢</span>
                          </span>
                        )}
                        {status === 'rejected' && (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                            <XCircle className="w-3 h-3 text-rose-400" />
                            <span>Ditolak 🔴</span>
                          </span>
                        )}
                      </td>

                      {/* 5. Aksi Keputusan Admin */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* CHAT WA BUTTON */}
                          {u.phone_number && (
                            <a
                              href={`https://wa.me/${u.phone_number.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(
                                status === 'pending'
                                  ? `Halo Kak ${u.full_name}, kami dari Admin Salwa L. Kami menerima pendaftaran Anda di TataDana. Akun Anda segera kami verifikasi.`
                                  : `Halo Kak ${u.full_name}, akun TataDana Anda telah resmi diverifikasi & disetujui oleh Admin Salwa L!`
                              )}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-1.5 bg-emerald-950/60 hover:bg-emerald-900 text-emerald-300 rounded-lg border border-emerald-700/50 transition"
                              title="Hubungi di WhatsApp"
                            >
                              <Phone className="w-3.5 h-3.5" />
                            </a>
                          )}

                          {/* VERIFIKASI PENDAFTAR BUTTON */}
                          {status !== 'approved' && (
                            <button
                              onClick={() => handleApprove(u.id)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition"
                              title="Verifikasi nomor WhatsApp & setujui pendaftar"
                            >
                              <Check className="w-3.5 h-3.5" />
                              <span>Verifikasi Pendaftar</span>
                            </button>
                          )}

                          {/* REJECT BUTTON */}
                          {status !== 'rejected' && (
                            <button
                              onClick={() => setRejectingUser(u)}
                              className="inline-flex items-center gap-1 px-2 py-1.5 bg-rose-950/70 hover:bg-rose-900 text-rose-300 hover:text-white font-bold text-xs rounded-xl border border-rose-700/50 transition"
                              title="Tolak pendaftaran pengguna"
                            >
                              <X className="w-3.5 h-3.5" />
                              <span>Tolak</span>
                            </button>
                          )}

                          {/* RESET BUTTON */}
                          {status !== 'pending' && (
                            <button
                              onClick={() => handleResetPending(u.id)}
                              className="p-1.5 text-slate-400 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition"
                              title="Kembalikan ke status Menunggu Approval"
                            >
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* LIHAT PROFIL */}
                          <button
                            onClick={() => setSelectedProfileModal(u)}
                            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-lg transition"
                            title="Buka profil lengkap"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="py-10 text-center text-slate-500 text-xs">
                    Tidak ada pengguna dalam kategori approval ini.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Rejection Modal */}
      {rejectingUser && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 text-white shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h3 className="font-bold text-sm flex items-center gap-2 text-rose-400">
                <XCircle className="w-5 h-5 text-rose-500" />
                <span>Tolak Pendaftaran Pengguna</span>
              </h3>
              <button 
                onClick={() => setRejectingUser(null)}
                className="text-slate-400 hover:text-white text-xs"
              >
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Anda akan menolak pendaftaran <b>{rejectingUser.full_name}</b> ({rejectingUser.phone_number}). Pengguna tidak dapat menggunakan fitur finansial hingga disetujui kembali.
            </p>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                Alasan Penolakan:
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectingUser(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-white"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl shadow transition"
              >
                Konfirmasi Tolak
              </button>
            </div>
          </div>
        </div>
      )}

      {/* User Detail Modal */}
      <UserProfileModal
        user={selectedProfileModal}
        isOpen={Boolean(selectedProfileModal)}
        onClose={() => setSelectedProfileModal(null)}
        onPlanToggle={() => refreshData()}
      />
    </div>
  );
}
