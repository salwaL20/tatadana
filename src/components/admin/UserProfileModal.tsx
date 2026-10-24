'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  Wallet, 
  CreditCard, 
  Sparkles, 
  ArrowUpRight, 
  ArrowDownRight, 
  ExternalLink,
  Eye,
  Bot,
  UserCheck,
  Clock,
  XCircle,
  Check
} from 'lucide-react';
import { Profile, Wallet as WalletType, Transaction } from '@/types/database';
import { mockStore } from '@/lib/supabase/mockStore';
import { formatRupiah } from '@/lib/utils/currency';

interface UserProfileModalProps {
  user: Profile | null;
  isOpen: boolean;
  onClose: () => void;
  onPlanToggle?: (userId: string) => void;
  onImpersonate?: (user: Profile) => void;
}

export default function UserProfileModal({
  user,
  isOpen,
  onClose,
  onPlanToggle,
  onImpersonate,
}: UserProfileModalProps) {
  const [userWallets, setUserWallets] = useState<WalletType[]>([]);
  const [userTransactions, setUserTransactions] = useState<Transaction[]>([]);
  const [currentTier, setCurrentTier] = useState<string>('starter');
  const [currentApprovalStatus, setCurrentApprovalStatus] = useState<string>('approved');

  useEffect(() => {
    if (user) {
      setCurrentTier(user.subscription_tier);
      setCurrentApprovalStatus(user.approval_status || 'approved');
      // Fetch user wallets and transactions from mockStore
      const w = mockStore.wallets.filter(wl => wl.user_id === user.id);
      const t = mockStore.transactions.filter(tx => tx.user_id === user.id);
      setUserWallets(w);
      setUserTransactions(t);
    }
  }, [user]);

  const handleApprovalAction = async (action: 'approve' | 'reject' | 'reset') => {
    try {
      await fetch('/api/admin/users/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: user.id, 
          action: action === 'approve' ? 'verify' : action, 
          adminId: 'usr-salwa-001' 
        }),
      });
    } catch {}
    const newStatus = action === 'approve' ? 'approved' : (action === 'reject' ? 'rejected' : 'pending');
    user.approval_status = newStatus as any;
    if (action === 'approve') {
      user.phone_verified = true;
    }
    setCurrentApprovalStatus(newStatus);
    const idx = mockStore.profiles.findIndex(p => p.id === user.id);
    if (idx !== -1) {
      mockStore.profiles[idx].approval_status = newStatus as any;
      if (action === 'approve') {
        mockStore.profiles[idx].phone_verified = true;
        mockStore.profiles[idx].approved_at = new Date().toISOString();
        mockStore.profiles[idx].approved_by = 'usr-salwa-001';
      }
    }
    if (onPlanToggle) onPlanToggle(user.id);
  };

  if (!isOpen || !user) return null;

  const totalBalance = userWallets.reduce((acc, w) => acc + w.balance, 0);
  const totalExpense = userTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const totalIncome = userTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const telegramBot = mockStore.telegramBots.find(b => b.user_id === user.id);

  // Format date WIB
  const registrationDateWIB = new Date(user.created_at).toLocaleString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }) + ' WIB';

  const cleanPhoneForWa = user.phone_number ? user.phone_number.replace(/[^0-9]/g, '') : '';

  const handleTogglePlan = () => {
    const nextTier = currentTier === 'pro' ? 'starter' : 'pro';
    user.subscription_tier = nextTier;
    setCurrentTier(nextTier);
    if (onPlanToggle) onPlanToggle(user.id);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full p-6 text-slate-100 shadow-2xl relative my-8 animate-in fade-in duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Tutup Modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header Profile Info */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 pb-6 border-b border-slate-800">
          <div className="relative">
            <img
              src={user.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
              alt={user.full_name}
              className="w-20 h-20 rounded-2xl object-cover border-2 border-orange-500 shadow-md"
            />
            {user.role === 'superadmin' && (
              <span className="absolute -bottom-2 -right-2 px-2 py-0.5 rounded-full text-[9px] font-black bg-orange-600 text-white shadow uppercase">
                Admin
              </span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-xl font-black text-white">{user.full_name}</h2>
              {user.phone_verified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3" />
                  WhatsApp Terverifikasi 🟢
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                  <AlertCircle className="w-3 h-3" />
                  Belum Verifikasi WhatsApp
                </span>
              )}
              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                currentTier === 'pro'
                  ? 'bg-orange-500/20 text-orange-400 border border-orange-500/40'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}>
                Paket {currentTier}
              </span>
              {currentApprovalStatus === 'pending' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  <Clock className="w-3 h-3 text-amber-400 animate-pulse" />
                  <span>Menunggu Approval 🟡</span>
                </span>
              )}
              {currentApprovalStatus === 'approved' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                  <span>Disetujui 🟢</span>
                </span>
              )}
              {currentApprovalStatus === 'rejected' && (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                  <XCircle className="w-3 h-3 text-rose-400" />
                  <span>Ditolak 🔴</span>
                </span>
              )}
            </div>

            <p className="text-xs text-slate-400 font-mono">ID Pengguna: {user.id}</p>
            <p className="text-xs text-slate-300 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span>{user.email || 'Email belum diatur'}</span>
            </p>
          </div>
        </div>

        {/* 2-Column Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-6 border-b border-slate-800 text-xs">
          {/* WhatsApp & Registrasi */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              <span>Kontak & Verifikasi WhatsApp</span>
            </div>

            <div className="space-y-1.5">
              <div className="text-slate-400 text-[11px]">Nomor WhatsApp Terdaftar:</div>
              <div className="font-bold text-white font-mono flex items-center justify-between">
                <span>{user.phone_number || '-'}</span>
                {cleanPhoneForWa && (
                  <a
                    href={`https://wa.me/${cleanPhoneForWa}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 font-sans"
                  >
                    <span>Hubungi WA</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
              <div className="text-slate-400 text-[11px] flex items-center gap-1">
                <Calendar className="w-3 h-3 text-orange-400" />
                <span>Waktu Pendaftaran Akun:</span>
              </div>
              <div className="font-semibold text-slate-200">{registrationDateWIB}</div>
            </div>
          </div>

          {/* Telegram Bot Integration */}
          <div className="bg-slate-950/60 border border-slate-800/80 rounded-2xl p-4 space-y-3">
            <div className="font-bold text-slate-300 uppercase tracking-wider text-[10px] flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5 text-blue-400" />
              <span>Integrasi Bot Telegram</span>
            </div>

            <div className="space-y-1.5">
              <div className="text-slate-400 text-[11px]">Status Sambungan Bot:</div>
              <div className="font-bold">
                {user.telegram_chat_id ? (
                  <span className="text-emerald-400 flex items-center gap-1.5">
                    <span>🟢 Terhubung</span>
                    <span className="text-[10px] text-slate-400">(@{user.telegram_username || 'tatadanasalwabot'})</span>
                  </span>
                ) : (
                  <span className="text-slate-500">Belum Dikaitkan</span>
                )}
              </div>
            </div>

            <div className="space-y-1.5 pt-2 border-t border-slate-800/60">
              <div className="text-slate-400 text-[11px]">Telegram Chat ID:</div>
              <div className="font-mono text-slate-300">{user.telegram_chat_id || '-'}</div>
            </div>
          </div>
        </div>

        {/* Keuangan & Mutasi Pengguna */}
        <div className="py-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="font-bold text-slate-300 uppercase tracking-wider text-xs flex items-center gap-1.5">
              <Wallet className="w-4 h-4 text-orange-400" />
              <span>Ringkasan Keuangan & Dompet Pengguna</span>
            </div>
            <div className="text-xs font-bold text-emerald-400">
              Total Saldo: {formatRupiah(totalBalance)}
            </div>
          </div>

          {/* Dompet List */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {userWallets.length > 0 ? (
              userWallets.map(w => (
                <div key={w.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800/80">
                  <div className="text-[10px] text-slate-400 truncate flex items-center justify-between">
                    <span>{w.name}</span>
                    {w.is_default && <span className="text-[9px] text-orange-400 font-bold">Default</span>}
                  </div>
                  <div className="font-bold text-white text-xs mt-1">{formatRupiah(w.balance)}</div>
                </div>
              ))
            ) : (
              <div className="col-span-3 text-slate-500 text-xs py-2 text-center bg-slate-950 rounded-xl border border-slate-800/60">
                Belum ada mutasi dompet terdaftar untuk pengguna ini.
              </div>
            )}
          </div>

          {/* Stats Bar */}
          <div className="grid grid-cols-2 gap-3 text-xs pt-1">
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <ArrowDownRight className="w-3.5 h-3.5 text-emerald-400" />
                Total Masuk
              </span>
              <span className="font-bold text-emerald-400">{formatRupiah(totalIncome)}</span>
            </div>
            <div className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex items-center justify-between">
              <span className="text-slate-400 flex items-center gap-1">
                <ArrowUpRight className="w-3.5 h-3.5 text-rose-400" />
                Total Keluar
              </span>
              <span className="font-bold text-rose-400">{formatRupiah(totalExpense)}</span>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={handleTogglePlan}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                currentTier === 'pro'
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  : 'bg-orange-600 hover:bg-orange-500 text-white shadow-md shadow-orange-600/20'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>{currentTier === 'pro' ? 'Turunkan ke Starter' : 'Upgrade ke PRO (Gratiskan)'}</span>
            </button>

            {currentApprovalStatus !== 'approved' && (
              <button
                onClick={() => handleApprovalAction('approve')}
                className="px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow"
                title="Verifikasi nomor WhatsApp & setujui akun pengguna ini"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Verifikasi Pendaftar</span>
              </button>
            )}

            {currentApprovalStatus !== 'rejected' && (
              <button
                onClick={() => handleApprovalAction('reject')}
                className="px-3 py-2 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-700/50 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                title="Tolak pendaftaran pengguna ini"
              >
                <XCircle className="w-3.5 h-3.5" />
                <span>Tolak</span>
              </button>
            )}

            {onImpersonate && (
              <button
                onClick={() => onImpersonate(user)}
                className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>Masuk Sebagai User</span>
              </button>
            )}
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold rounded-xl transition"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
}
