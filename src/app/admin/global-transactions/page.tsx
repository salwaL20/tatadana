'use client';

import React, { useState, useEffect } from 'react';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  Wallet, 
  Search, 
  CreditCard, 
  Filter, 
  Download, 
  Calendar, 
  TrendingUp, 
  CheckCircle2, 
  Layers,
  ArrowRightLeft,
  Building,
  DollarSign
} from 'lucide-react';
import { mockStore } from '@/lib/supabase/mockStore';
import { Transaction, Wallet as WalletType, Profile } from '@/types/database';
import { formatRupiah } from '@/lib/utils/currency';
import { formatDateOnlyWIB } from '@/lib/utils/timezone';

export default function AdminGlobalTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>(mockStore.transactions);
  const [wallets, setWallets] = useState<WalletType[]>(mockStore.wallets);
  const [profiles, setProfiles] = useState<Profile[]>(mockStore.profiles);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'income' | 'expense' | 'transfer'>('all');
  const [selectedWalletId, setSelectedWalletId] = useState<string>('all');

  const refreshData = () => {
    setTransactions([...mockStore.transactions]);
    setWallets([...mockStore.wallets]);
    setProfiles([...mockStore.profiles]);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, []);

  // Compute Platform Aggregates
  const totalPlatformBalance = wallets.reduce((acc, w) => acc + (w.balance || 0), 0);
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const totalTransactionsCount = transactions.length;

  const filteredTransactions = transactions.filter(t => {
    const user = profiles.find(p => p.id === t.user_id);
    const wallet = wallets.find(w => w.id === t.wallet_id);
    const matchesSearch = 
      t.description.toLowerCase().includes(search.toLowerCase()) ||
      (user && user.full_name.toLowerCase().includes(search.toLowerCase())) ||
      (wallet && wallet.name.toLowerCase().includes(search.toLowerCase())) ||
      t.amount.toString().includes(search);

    if (!matchesSearch) return false;
    if (typeFilter !== 'all' && t.type !== typeFilter) return false;
    if (selectedWalletId !== 'all' && t.wallet_id !== selectedWalletId) return false;
    return true;
  });

  const handleExportCSV = () => {
    const headers = ['ID', 'Waktu WIB', 'Nama Pengguna', 'Deskripsi', 'Tipe', 'Nominal', 'Dompet', 'Sumber'];
    const rows = filteredTransactions.map(t => {
      const u = profiles.find(p => p.id === t.user_id);
      const w = wallets.find(wl => wl.id === t.wallet_id);
      return [
        t.id,
        t.transaction_time,
        `"${u?.full_name || t.user_id}"`,
        `"${t.description.replace(/"/g, '""')}"`,
        t.type,
        t.amount,
        `"${w?.name || t.wallet_id || '-'}"`,
        t.source
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tatadana_transaksi_global_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Layers className="w-7 h-7 text-orange-500" />
            <span>Panel Monitor Transaksi & Dompet Global</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Pantau seluruh mutasi keuangan, arus kas platform, dan total saldo pengguna secara terpusat realtime.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 border border-slate-700 shadow"
          >
            <Download className="w-3.5 h-3.5 text-orange-400" />
            <span>Ekspor CSV Transaksi</span>
          </button>
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Total Saldo Seluruh Dompet</span>
            <Wallet className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">
            {formatRupiah(totalPlatformBalance)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">{wallets.length} dompet terdaftar</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Total Transaksi Masuk</span>
            <ArrowDownRight className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {formatRupiah(totalIncome)}
          </div>
          <div className="text-[11px] text-emerald-400 mt-1">Platform Inflow</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Total Transaksi Keluar</span>
            <ArrowUpRight className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2">
            {formatRupiah(totalExpense)}
          </div>
          <div className="text-[11px] text-rose-300 mt-1">Platform Outflow</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400">
            <span>Volume Mutasi Platform</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">
            {totalTransactionsCount} Mutasi
          </div>
          <div className="text-[11px] text-blue-400 mt-1">Net: {formatRupiah(totalIncome - totalExpense)}</div>
        </div>
      </div>

      {/* Dompet Ringkasan Grid */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <h2 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
            <Building className="w-4 h-4 text-orange-400" />
            <span>Penyebaran Saldo Dompet & Bank Pengguna</span>
          </h2>
          <span className="text-[11px] text-slate-400">{wallets.length} Akun Dompet</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2.5">
          {wallets.slice(0, 6).map(w => {
            const user = profiles.find(p => p.id === w.user_id);
            return (
              <div 
                key={w.id} 
                onClick={() => setSelectedWalletId(selectedWalletId === w.id ? 'all' : w.id)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                  selectedWalletId === w.id 
                    ? 'border-orange-500 bg-orange-500/10' 
                    : 'bg-slate-900 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="text-[10px] text-slate-400 truncate flex items-center justify-between">
                  <span>{w.name}</span>
                  <span className="text-[9px] uppercase font-bold text-slate-500">{w.type}</span>
                </div>
                <div className="font-bold text-white text-xs mt-1 truncate">{formatRupiah(w.balance)}</div>
                <div className="text-[9px] text-orange-400 truncate mt-0.5">{user?.full_name || 'User'}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-950 p-3 rounded-2xl border border-slate-800">
        <div className="flex flex-wrap gap-1.5 text-xs font-bold">
          <button
            onClick={() => setTypeFilter('all')}
            className={`px-3 py-1.5 rounded-xl transition ${
              typeFilter === 'all' ? 'bg-orange-600 text-white shadow' : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            Semua ({transactions.length})
          </button>
          <button
            onClick={() => setTypeFilter('income')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
              typeFilter === 'income' ? 'bg-emerald-600 text-white shadow' : 'text-emerald-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ArrowDownRight className="w-3.5 h-3.5" />
            <span>Pemasukan</span>
          </button>
          <button
            onClick={() => setTypeFilter('expense')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
              typeFilter === 'expense' ? 'bg-rose-600 text-white shadow' : 'text-rose-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Pengeluaran</span>
          </button>
          <button
            onClick={() => setTypeFilter('transfer')}
            className={`px-3 py-1.5 rounded-xl transition flex items-center gap-1 ${
              typeFilter === 'transfer' ? 'bg-blue-600 text-white shadow' : 'text-blue-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <ArrowRightLeft className="w-3.5 h-3.5" />
            <span>Transfer</span>
          </button>
        </div>

        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Cari transaksi, nominal, pengguna..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Global Transactions Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Waktu Transaksi</th>
                <th className="py-3 px-4">Deskripsi Mutasi</th>
                <th className="py-3 px-4">Dompet / Rekening</th>
                <th className="py-3 px-4">Jenis & Sumber</th>
                <th className="py-3 px-4 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map(t => {
                  const user = profiles.find(p => p.id === t.user_id);
                  const wallet = wallets.find(w => w.id === t.wallet_id);
                  const timeWIB = new Date(t.transaction_time).toLocaleString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit'
                  }) + ' WIB';

                  return (
                    <tr key={t.id} className="hover:bg-slate-900/50 transition">
                      {/* User */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2.5">
                          <img
                            src={user?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                            alt={user?.full_name || 'User'}
                            className="w-8 h-8 rounded-full object-cover border border-slate-700 shrink-0"
                          />
                          <div>
                            <div className="font-bold text-white text-xs truncate max-w-[130px]">
                              {user?.full_name || 'User'}
                            </div>
                            <div className="text-[10px] text-orange-400 font-medium uppercase">
                              {user?.subscription_tier || 'Starter'}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Waktu */}
                      <td className="py-3 px-4 text-slate-400 font-mono text-[11px]">
                        {timeWIB}
                      </td>

                      {/* Deskripsi */}
                      <td className="py-3 px-4">
                        <div className="font-semibold text-slate-200 text-xs">{t.description}</div>
                        {t.category_id && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            ID: {t.id}
                          </div>
                        )}
                      </td>

                      {/* Dompet */}
                      <td className="py-3 px-4 text-slate-300">
                        <div className="font-medium text-xs flex items-center gap-1.5">
                          <Wallet className="w-3 h-3 text-slate-400" />
                          <span>{wallet?.name || 'Dompet Utama'}</span>
                        </div>
                        <div className="text-[10px] text-slate-500 capitalize">{wallet?.type || 'bank'}</div>
                      </td>

                      {/* Jenis & Sumber */}
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.type === 'income' 
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : t.type === 'expense'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {t.type === 'income' ? <ArrowDownRight className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                          <span className="capitalize">{t.type}</span>
                        </span>
                        <div className="text-[9px] text-slate-500 mt-0.5 font-mono">
                          Via: {t.source}
                        </div>
                      </td>

                      {/* Nominal */}
                      <td className="py-3 px-4 text-right">
                        <div className={`font-black text-xs ${
                          t.type === 'income' 
                            ? 'text-emerald-400' 
                            : t.type === 'expense' 
                            ? 'text-rose-400' 
                            : 'text-blue-400'
                        }`}>
                          {t.type === 'expense' ? '-' : '+'}{formatRupiah(t.amount)}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500 text-xs">
                    Tidak ada transaksi yang cocok dengan filter pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
