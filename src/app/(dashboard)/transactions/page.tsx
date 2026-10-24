'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  PlusCircle, 
  ArrowUpRight, 
  ArrowDownRight, 
  ArrowRightLeft, 
  ChevronDown, 
  ChevronUp, 
  Receipt, 
  Filter,
  Check,
  Search,
  Calendar,
  Wallet as WalletIcon,
  Tag,
  Download,
  RotateCcw,
  TrendingUp,
  FileSpreadsheet,
  FileText,
  Printer,
  Eye,
  ExternalLink
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils/currency';
import { formatDateOnlyWIB, formatShortTimeWIB } from '@/lib/utils/timezone';
import { Transaction, Wallet, Category } from '@/types/database';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [expandedReceiptId, setExpandedReceiptId] = useState<string | null>(null);
  const [selectedDetailTx, setSelectedDetailTx] = useState<Transaction | null>(null);

  // Timeframe and Filter states
  const [timeframe, setTimeframe] = useState<'1hari' | '7hari' | '1bulan' | 'semua' | 'kustom'>('1bulan');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedWalletFilter, setSelectedWalletFilter] = useState<string>('all');
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('all');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Form states for Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [type, setType] = useState<'expense' | 'income' | 'transfer'>('expense');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [walletId, setWalletId] = useState('');
  const [destWalletId, setDestWalletId] = useState('');
  const [categoryId, setCategoryId] = useState('');

  const loadData = async () => {
    const { dataService } = await import('@/lib/supabase/client');
    const activeUserId = typeof window !== 'undefined'
      ? localStorage.getItem('tatadana_current_user_id') || 'usr-salwa-001'
      : 'usr-salwa-001';

    let [txs, wls, cats] = await Promise.all([
      dataService.getTransactions(activeUserId),
      dataService.getWallets(activeUserId),
      dataService.getCategories(activeUserId),
    ]);

    // Fallback if current user has no transactions yet
    if (txs.length === 0) {
      txs = await dataService.getTransactions('usr-budi-12345');
    }
    if (wls.length === 0) {
      wls = await dataService.getWallets('usr-budi-12345');
    }
    if (cats.length === 0) {
      cats = await dataService.getCategories('usr-budi-12345');
    }

    setTransactions(txs);
    setWallets(wls);
    setCategories(cats);
    if (wls.length > 0) setWalletId(wls[0].id);
    if (wls.length > 1) setDestWalletId(wls[1].id);
    if (cats.length > 0) setCategoryId(cats[0].id);
  };

  useEffect(() => {
    loadData();
    const handleSync = () => loadData();
    const interval = setInterval(loadData, 2000);
    if (typeof window !== 'undefined') {
      window.addEventListener('tatadana_user_switched', handleSync);
      window.addEventListener('tatadana_transaction_added', handleSync);
      window.addEventListener('storage', handleSync);
      return () => {
        clearInterval(interval);
        window.removeEventListener('tatadana_user_switched', handleSync);
        window.removeEventListener('tatadana_transaction_added', handleSync);
        window.removeEventListener('storage', handleSync);
      };
    }
    return () => clearInterval(interval);
  }, []);

  const handleCreateTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const nominal = parseFloat(amount.replace(/[^0-9]/g, ''));
    if (!nominal || nominal <= 0) {
      alert('Masukkan nominal yang valid');
      return;
    }

    const activeUserId = typeof window !== 'undefined'
      ? localStorage.getItem('tatadana_current_user_id') || 'usr-salwa-001'
      : 'usr-salwa-001';

    const { dataService } = await import('@/lib/supabase/client');
    await dataService.addTransaction({
      user_id: activeUserId,
      wallet_id: walletId,
      category_id: type === 'transfer' ? null : categoryId,
      destination_wallet_id: type === 'transfer' ? destWalletId : null,
      type,
      amount: nominal,
      description: description || (type === 'transfer' ? 'Transfer Antar Dompet' : 'Transaksi Baru'),
      source: 'web_manual',
      transaction_time: new Date().toISOString(),
    });

    setIsModalOpen(false);
    setAmount('');
    setDescription('');
    loadData();
  };

  const handleResetFilters = () => {
    setTimeframe('1bulan');
    setStartDate('');
    setEndDate('');
    setSelectedWalletFilter('all');
    setSelectedCategoryFilter('all');
    setSelectedTypeFilter('all');
    setSearchQuery('');
  };

  // Filtered transactions computed dynamically
  const filteredTransactions = transactions.filter(t => {
    // 1. Search Query
    const query = searchQuery.toLowerCase().trim();
    const matchesSearch = !query || 
      t.description.toLowerCase().includes(query) ||
      (t.category?.name && t.category.name.toLowerCase().includes(query)) ||
      (t.wallet?.name && t.wallet.name.toLowerCase().includes(query)) ||
      (t.receipt_data?.merchant && t.receipt_data.merchant.toLowerCase().includes(query));

    // 2. Type Filter
    const matchesType = selectedTypeFilter === 'all' || t.type === selectedTypeFilter;

    // 3. Wallet Filter
    const matchesWallet = selectedWalletFilter === 'all' || 
      t.wallet_id === selectedWalletFilter || 
      t.destination_wallet_id === selectedWalletFilter;

    // 4. Category Filter
    const matchesCategory = selectedCategoryFilter === 'all' || t.category_id === selectedCategoryFilter;

    // 5. Timeframe Filter
    const txDate = new Date(t.transaction_time);
    const now = new Date();
    const todayWIB = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    const txDateWIB = txDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    let matchesTimeframe = true;

    if (timeframe === '1hari') {
      matchesTimeframe = txDateWIB === todayWIB || Math.abs(now.getTime() - txDate.getTime()) <= 24 * 60 * 60 * 1000;
    } else if (timeframe === '7hari') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      matchesTimeframe = txDate >= sevenDaysAgo && txDate.getTime() <= now.getTime() + 60000;
    } else if (timeframe === '1bulan') {
      const currentMonthWIB = todayWIB.slice(0, 7);
      matchesTimeframe = txDateWIB.startsWith(currentMonthWIB) || t.transaction_time.startsWith(currentMonthWIB) || Math.abs(now.getTime() - txDate.getTime()) <= 31 * 24 * 60 * 60 * 1000;
    } else if (timeframe === 'kustom') {
      if (startDate) {
        matchesTimeframe = matchesTimeframe && txDate >= new Date(startDate + 'T00:00:00');
      }
      if (endDate) {
        matchesTimeframe = matchesTimeframe && txDate <= new Date(endDate + 'T23:59:59');
      }
    }

    return matchesSearch && matchesType && matchesWallet && matchesCategory && matchesTimeframe;
  });

  // Calculate Metrics from filtered transactions
  const totalIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((acc, t) => acc + t.amount, 0);

  const totalExpense = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((acc, t) => acc + t.amount, 0);

  const netCashflow = totalIncome - totalExpense;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Daftar Transaksi</h1>
            <span className="text-xs bg-orange-100 text-orange-700 font-bold px-2 py-0.5 rounded-full">
              {filteredTransactions.length} Transaksi
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Telusuri dan saring riwayat transaksi dengan filter 1 Hari, 7 Hari, 1 Bulan, dompet, dan kategori.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Export PDF */}
          <a
            href={`/api/transactions/export?format=pdf&userId=${typeof window !== 'undefined' ? localStorage.getItem('tatadana_current_user_id') || 'usr-salwa-001' : 'usr-salwa-001'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition shadow-2xs hover:scale-105"
            title="Download PDF semua transaksi"
          >
            <FileText className="w-3.5 h-3.5 text-red-600" />
            <span>Export PDF</span>
          </a>

          {/* Quick Export Excel */}
          <a
            href={`/api/transactions/export?format=excel&userId=${typeof window !== 'undefined' ? localStorage.getItem('tatadana_current_user_id') || 'usr-salwa-001' : 'usr-salwa-001'}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition shadow-2xs hover:scale-105"
            title="Download Excel (.xlsx) semua transaksi"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
            <span>Export Excel</span>
          </a>

          <Link
            href="/reports"
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-orange-500" />
            <span>Laporan</span>
          </Link>

          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tambah Transaksi</span>
          </button>
        </div>
      </div>

      {/* QUICK SUMMARY METRICS BANNER (Dynamic based on active timeframe & filters) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Pemasukan</div>
          <div className="text-lg md:text-xl font-black text-emerald-600 mt-1">
            {formatRupiah(totalIncome)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Filter aktif: {timeframe.toUpperCase()}</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Pengeluaran</div>
          <div className="text-lg md:text-xl font-black text-orange-600 mt-1">
            {formatRupiah(totalExpense)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Filter aktif: {timeframe.toUpperCase()}</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Arus Kas Bersih (Net)</div>
          <div className={`text-lg md:text-xl font-black mt-1 ${netCashflow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {netCashflow >= 0 ? '+' : ''}{formatRupiah(netCashflow)}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">{netCashflow >= 0 ? 'Surplus Aman' : 'Defisit Terdeteksi'}</div>
        </div>

        <div className="bg-white border border-slate-200 p-4 rounded-2xl shadow-xs">
          <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Transaksi</div>
          <div className="text-lg md:text-xl font-black text-slate-900 mt-1">
            {filteredTransactions.length}
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Dari total {transactions.length} catatan</div>
        </div>
      </div>

      {/* FILTER CONTROLS BAR */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        {/* ROW 1: Quick Timeframe Filters (1 Hari, 7 Hari, 1 Bulan, Semua, Kustom) */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            <span className="font-bold text-slate-700 flex items-center gap-1 mr-1">
              <Calendar className="w-3.5 h-3.5 text-orange-500" /> Periode:
            </span>
            <button
              type="button"
              onClick={() => setTimeframe('1hari')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                timeframe === '1hari'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              ☀️ 1 Hari (Hari Ini)
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('7hari')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                timeframe === '7hari'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🗓️ 7 Hari Terakhir
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('1bulan')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                timeframe === '1bulan'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              🌙 1 Bulan (Bulan Ini)
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('semua')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                timeframe === 'semua'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              Semua Waktu
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('kustom')}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                timeframe === 'kustom'
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              📅 Rentang Kustom
            </button>
          </div>

          <button
            type="button"
            onClick={handleResetFilters}
            className="text-xs text-slate-500 hover:text-orange-600 flex items-center gap-1 font-semibold self-start sm:self-auto"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Semua Filter</span>
          </button>
        </div>

        {/* ROW 1.5: If Kustom Date Selected, show date range picker */}
        {timeframe === 'kustom' && (
          <div className="p-3 bg-orange-50/70 border border-orange-200 rounded-xl flex flex-wrap items-center gap-3 text-xs">
            <span className="font-bold text-orange-900">Pilih Tanggal:</span>
            <div className="flex items-center gap-2">
              <label className="text-slate-600">Dari:</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-slate-600">Sampai:</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs"
              />
            </div>
          </div>
        )}

        {/* ROW 2: Search, Type, Wallet, and Category Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
          {/* Search Box */}
          <div className="lg:col-span-4 relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
            <input
              type="text"
              placeholder="Cari transaksi, merchant, catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-orange-500"
            />
          </div>

          {/* Type Filter Buttons */}
          <div className="lg:col-span-3 flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
            {(['all', 'expense', 'income', 'transfer'] as const).map(f => (
              <button
                key={f}
                type="button"
                onClick={() => setSelectedTypeFilter(f)}
                className={`flex-1 py-1 rounded-lg text-[11px] capitalize transition ${
                  selectedTypeFilter === f
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {f === 'all' ? 'Semua' : f === 'expense' ? 'Keluar' : f === 'income' ? 'Masuk' : 'Transfer'}
              </button>
            ))}
          </div>

          {/* Wallet Filter Dropdown */}
          <div className="lg:col-span-2">
            <select
              value={selectedWalletFilter}
              onChange={(e) => setSelectedWalletFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-orange-500"
            >
              <option value="all">👛 Semua Dompet</option>
              {wallets.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({formatRupiah(w.balance)})
                </option>
              ))}
            </select>
          </div>

          {/* Category Filter Dropdown */}
          <div className="lg:col-span-3">
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-hidden focus:border-orange-500"
            >
              <option value="all">🏷️ Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.emoji} {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="divide-y divide-slate-100">
          {filteredTransactions.length === 0 ? (
            <div className="p-12 text-center text-slate-400 space-y-2">
              <p className="text-sm font-semibold">Tidak ada transaksi yang cocok dengan filter aktif.</p>
              <p className="text-xs text-slate-400">
                Coba pilih timeframe "Semua Waktu" atau klik "Reset Semua Filter".
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="mt-2 px-4 py-2 bg-orange-50 hover:bg-orange-100 text-orange-700 text-xs font-bold rounded-xl transition"
              >
                Reset Filter
              </button>
            </div>
          ) : (
            filteredTransactions.map((t) => {
              const isExpense = t.type === 'expense';
              const isTransfer = t.type === 'transfer';
              const isExpanded = expandedReceiptId === t.id;

              return (
                <div key={t.id} className="p-4 hover:bg-slate-50/80 transition">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-lg mt-0.5 shrink-0">
                        {isTransfer ? '🔄' : t.category?.emoji || (isExpense ? '💸' : '💰')}
                      </div>
                      <div>
                        <div className="text-sm font-bold text-slate-900 flex flex-wrap items-center gap-2">
                          <span>{t.description}</span>
                          {t.receipt_data && (
                            <button
                              type="button"
                              onClick={() => setExpandedReceiptId(isExpanded ? null : t.id)}
                              className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded border border-purple-200 flex items-center gap-1 transition"
                            >
                              <Receipt className="w-3 h-3" />
                              <span>{t.receipt_data.items?.length || 0} item struk</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </div>

                        <div className="text-xs text-slate-500 mt-1 flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-slate-700">{formatDateOnlyWIB(t.transaction_time)}</span>
                          <span>•</span>
                          <span>{formatShortTimeWIB(t.transaction_time)}</span>
                          <span>•</span>
                          <span className="font-medium text-slate-600">👛 {t.wallet?.name || 'Dompet'}</span>
                          {isTransfer && t.destination_wallet && (
                            <span>➔ {t.destination_wallet.name}</span>
                          )}
                          {!isTransfer && t.category && (
                            <>
                              <span>•</span>
                              <span className="text-slate-600 font-medium">{t.category.emoji} {t.category.name}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                      <div>
                        <div className={`text-sm md:text-base font-bold font-mono ${
                          isExpense ? 'text-orange-600' : isTransfer ? 'text-blue-600' : 'text-emerald-600'
                        }`}>
                          {isExpense ? '-' : isTransfer ? '⇄ ' : '+'}{formatRupiah(t.amount)}
                        </div>
                        <span className="text-[10px] text-slate-400 capitalize">{t.type}</span>
                      </div>

                      {/* Tombol File PDF & Excel dari Setiap Transaksi */}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <a
                          href={`/api/transactions/${t.id}/export?format=pdf`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-lg text-[10px] font-bold transition shadow-2xs hover:scale-105"
                          title="Download Struk PDF Transaksi Ini"
                        >
                          <FileText className="w-3 h-3 text-red-600" />
                          <span>PDF Struk</span>
                        </a>

                        <a
                          href={`/api/transactions/${t.id}/export?format=excel`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold transition shadow-2xs hover:scale-105"
                          title="Download File Excel (.xlsx) Transaksi Ini"
                        >
                          <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                          <span>Excel</span>
                        </a>

                        <button
                          type="button"
                          onClick={() => setSelectedDetailTx(t)}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-semibold transition"
                          title="Lihat Detail & Cetak Struk"
                        >
                          <Eye className="w-3 h-3 text-slate-500" />
                          <span>Detail</span>
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expandable Receipt Breakdown Accordion */}
                  {t.receipt_data && isExpanded && (
                    <div className="mt-3 ml-12 p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                      <div className="flex justify-between items-center text-xs font-bold text-slate-700 border-b border-slate-200 pb-1.5">
                        <span>Rincian Item Struk — {t.receipt_data.merchant || 'Merchant'}</span>
                        <span>Total: {formatRupiah(t.receipt_data.total)}</span>
                      </div>
                      <div className="space-y-1">
                        {t.receipt_data.items?.map((item, idx) => (
                          <div key={idx} className="flex justify-between text-xs text-slate-600">
                            <span>• {item.name} ({item.qty}x)</span>
                            <span className="font-medium text-slate-900">{formatRupiah(item.price * item.qty)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Modal Catat Transaksi Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-100">
            <h2 className="text-lg font-bold text-slate-900 mb-4">Catat Transaksi Baru</h2>

            {/* Type selector tabs */}
            <div className="grid grid-cols-3 gap-2 bg-slate-100 p-1 rounded-xl mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => setType('expense')}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  type === 'expense' ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                <ArrowDownRight className="w-4 h-4" /> Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => setType('income')}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  type === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" /> Pemasukan
              </button>
              <button
                type="button"
                onClick={() => setType('transfer')}
                className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                  type === 'transfer' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-600'
                }`}
              >
                <ArrowRightLeft className="w-4 h-4" /> Transfer
              </button>
            </div>

            <form onSubmit={handleCreateTransaction} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nominal (Rp)</label>
                <input
                  type="text"
                  placeholder="Contoh: 50000 atau 1500000"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Keterangan / Catatan</label>
                <input
                  type="text"
                  placeholder="Contoh: Makan siang soto ayam / Beli bensin"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    {type === 'transfer' ? 'Dari Dompet' : 'Dompet / Rekening'}
                  </label>
                  <select
                    value={walletId}
                    onChange={(e) => setWalletId(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    {wallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.name} ({formatRupiah(w.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                {type === 'transfer' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ke Dompet Tujuan</label>
                    <select
                      value={destWalletId}
                      onChange={(e) => setDestWalletId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      {wallets.filter(w => w.id !== walletId).map((w) => (
                        <option key={w.id} value={w.id}>
                          {w.name} ({formatRupiah(w.balance)})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Kategori</label>
                    <select
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                    >
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.emoji} {c.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow-xs"
                >
                  Simpan Transaksi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail & Struk Resmi Transaksi */}
      {selectedDetailTx && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Header Modal */}
            <div className="bg-orange-500 text-white p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-5 h-5" />
                <h3 className="font-bold text-sm">Bukti Transaksi Resmi TataDana</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedDetailTx(null)}
                className="text-white/80 hover:text-white text-lg font-bold w-6 h-6 flex items-center justify-center rounded-full hover:bg-orange-600 transition"
              >
                ✕
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Status Badge & Amount */}
              <div className="text-center pb-3 border-b border-slate-100">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                  ✓ TRANSAKSI SUKSES
                </span>
                <div className={`text-2xl font-black font-mono mt-2 ${
                  selectedDetailTx.type === 'expense' ? 'text-orange-600' : selectedDetailTx.type === 'transfer' ? 'text-blue-600' : 'text-emerald-600'
                }`}>
                  {selectedDetailTx.type === 'expense' ? '-' : selectedDetailTx.type === 'transfer' ? '⇄ ' : '+'}{formatRupiah(selectedDetailTx.amount)}
                </div>
                <div className="text-xs text-slate-500 mt-0.5 font-medium">{selectedDetailTx.description}</div>
              </div>

              {/* Transaction Key Details */}
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1 border-b border-dashed border-slate-100">
                  <span className="text-slate-400">ID Transaksi</span>
                  <span className="font-mono font-bold text-slate-700">{selectedDetailTx.id}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-100">
                  <span className="text-slate-400">Tanggal & Waktu</span>
                  <span className="font-semibold text-slate-800">
                    {formatDateOnlyWIB(selectedDetailTx.transaction_time)} • {formatShortTimeWIB(selectedDetailTx.transaction_time)} WIB
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-100">
                  <span className="text-slate-400">Dompet Asal</span>
                  <span className="font-semibold text-slate-800">👛 {selectedDetailTx.wallet?.name || 'Dompet Utama'}</span>
                </div>
                {selectedDetailTx.type === 'transfer' && selectedDetailTx.destination_wallet && (
                  <div className="flex justify-between py-1 border-b border-dashed border-slate-100">
                    <span className="text-slate-400">Dompet Tujuan</span>
                    <span className="font-semibold text-blue-600">👛 {selectedDetailTx.destination_wallet.name}</span>
                  </div>
                )}
                <div className="flex justify-between py-1 border-b border-dashed border-slate-100">
                  <span className="text-slate-400">Kategori</span>
                  <span className="font-semibold text-slate-800">
                    {selectedDetailTx.category?.emoji || '🏷️'} {selectedDetailTx.category?.name || 'Umum'}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-100">
                  <span className="text-slate-400">Sumber Transaksi</span>
                  <span className="font-semibold text-slate-800">
                    {selectedDetailTx.source === 'telegram_text' ? '🤖 Telegram Bot' : selectedDetailTx.source === 'telegram_voice' ? '🎙️ Voice Note' : selectedDetailTx.source === 'telegram_receipt' ? '🧾 Foto Struk' : '💻 Web Manual'}
                  </span>
                </div>
              </div>

              {/* Receipt Items breakdown if present */}
              {selectedDetailTx.receipt_data?.items && selectedDetailTx.receipt_data.items.length > 0 && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1.5 text-xs">
                  <div className="font-bold text-slate-700 border-b border-slate-200 pb-1">
                    Item Struk: {selectedDetailTx.receipt_data.merchant || 'Merchant'}
                  </div>
                  {selectedDetailTx.receipt_data.items.map((it, idx) => (
                    <div key={idx} className="flex justify-between text-slate-600">
                      <span>• {it.name} ({it.qty}x)</span>
                      <span className="font-bold text-slate-900">{formatRupiah(it.price * it.qty)}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Action Buttons: PDF and Excel */}
              <div className="pt-2 grid grid-cols-2 gap-2">
                <a
                  href={`/api/transactions/${selectedDetailTx.id}/export?format=pdf`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <FileText className="w-4 h-4" />
                  <span>Unduh PDF Struk</span>
                </a>

                <a
                  href={`/api/transactions/${selectedDetailTx.id}/export?format=excel`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  <span>Unduh File Excel</span>
                </a>
              </div>

              <div className="pt-1">
                <a
                  href={`/api/transactions/${selectedDetailTx.id}/export?format=html&preview=1`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition"
                >
                  <Printer className="w-3.5 h-3.5 text-slate-500" />
                  <span>Lihat Tampilan Struk / Cetak</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
