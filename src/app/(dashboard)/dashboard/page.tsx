'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  TrendingUp, 
  Wallet as WalletIcon, 
  Calendar, 
  CheckCircle2, 
  Circle, 
  ArrowRight,
  Filter,
  PlusCircle,
  Receipt,
  Mic,
  MessageSquare,
  Sparkles,
  Loader2,
  Bot,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils/currency';
import { formatDateOnlyWIB, formatShortTimeWIB } from '@/lib/utils/timezone';
import { Transaction, Wallet, Category } from '@/types/database';

export default function DashboardPage() {
  const [period, setPeriod] = useState<'harian' | 'mingguan' | 'bulanan' | 'tahunan'>('bulanan');
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOnboardingModalOpen, setIsOnboardingModalOpen] = useState(false);
  const [profession, setProfession] = useState('karyawan');
  const [isGeneratingCategories, setIsGeneratingCategories] = useState(false);
  const [generatedCategories, setGeneratedCategories] = useState<any[]>([]);
  const [categoriesSaved, setCategoriesSaved] = useState(false);
  const [activeUserId, setActiveUserId] = useState<string>('usr-salwa-001');

  const loadData = async () => {
    const currentId = typeof window !== 'undefined'
      ? localStorage.getItem('tatadana_current_user_id') || 'usr-salwa-001'
      : 'usr-salwa-001';
    setActiveUserId(currentId);

    // Import dynamic client to prevent SSR mismatch
    const { dataService } = await import('@/lib/supabase/client');
    let [w, c, t] = await Promise.all([
      dataService.getWallets(currentId),
      dataService.getCategories(currentId),
      dataService.getTransactions(currentId),
    ]);

    if (w.length === 0) w = await dataService.getWallets('usr-budi-12345');
    if (c.length === 0) c = await dataService.getCategories('usr-budi-12345');
    if (t.length === 0) t = await dataService.getTransactions('usr-budi-12345');

    setWallets(w);
    setCategories(c);
    setTransactions(t);
    setLoading(false);
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

  const handleGenerateAiCategories = async () => {
    setIsGeneratingCategories(true);
    const { aiService } = await import('@/lib/ai/multiProvider');
    const result = await aiService.execute({
      feature: 'onboarding_category',
      prompt: `Profesi: ${profession}`,
      userId: activeUserId,
    });
    setGeneratedCategories(result);
    setIsGeneratingCategories(false);
  };

  const handleApplyAiCategories = async () => {
    const { dataService } = await import('@/lib/supabase/client');
    for (const cat of generatedCategories) {
      await dataService.addCategory({
        user_id: activeUserId,
        name: cat.name,
        emoji: cat.emoji,
        type: cat.type,
        color: cat.color,
        monthly_budget: cat.budget,
      });
    }
    const updatedCats = await dataService.getCategories(activeUserId);
    setCategories(updatedCats.length > 0 ? updatedCats : await dataService.getCategories('usr-budi-12345'));
    setCategoriesSaved(true);
    setTimeout(() => {
      setIsOnboardingModalOpen(false);
      setCategoriesSaved(false);
      setGeneratedCategories([]);
    }, 1500);
  };

  // Compute Aggregates dynamically filtered by selected period (1 Hari, 7 Hari, 1 Bulan, Tahunan)
  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);
  
  const now = new Date();
  const todayWIB = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  const periodFilteredTxs = transactions.filter(t => {
    const txDate = new Date(t.transaction_time);
    const txDateWIB = txDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    if (period === 'harian') {
      return txDateWIB === todayWIB || t.transaction_time.startsWith(todayWIB) || Math.abs(now.getTime() - txDate.getTime()) <= 24 * 60 * 60 * 1000;
    } else if (period === 'mingguan') {
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return (txDate >= sevenDaysAgo && txDate.getTime() <= now.getTime() + 60000) || Math.abs(now.getTime() - txDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
    } else if (period === 'bulanan') {
      const currentYearMonth = todayWIB.slice(0, 7);
      return txDateWIB.startsWith(currentYearMonth) || t.transaction_time.startsWith(currentYearMonth) || Math.abs(now.getTime() - txDate.getTime()) <= 31 * 24 * 60 * 60 * 1000;
    } else if (period === 'tahunan') {
      const currentYear = todayWIB.slice(0, 4);
      return txDateWIB.startsWith(currentYear) || t.transaction_time.startsWith(currentYear);
    }
    return true;
  });

  const incomeTxs = periodFilteredTxs.filter(t => t.type === 'income');
  const expenseTxs = periodFilteredTxs.filter(t => t.type === 'expense');

  const totalIncome = incomeTxs.reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = expenseTxs.reduce((acc, t) => acc + t.amount, 0);

  const totalMonthlyBudget = categories
    .filter(c => c.type === 'expense')
    .reduce((acc, c) => acc + c.monthly_budget, 0);
  const remainingBudget = Math.max(0, totalMonthlyBudget - totalExpense);

  // Category Breakdown for Pie Chart
  const expenseByCategory = categories.filter(c => c.type === 'expense').map(c => {
    const amount = periodFilteredTxs
      .filter(t => t.category_id === c.id && t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);
    return {
      name: c.name,
      emoji: c.emoji,
      color: c.color,
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0,
    };
  }).filter(c => c.amount > 0);

  // 6 Months Income vs Expense
  const sixMonthsData = [
    { month: 'Mei', income: 15000000, expense: 9200000 },
    { month: 'Jun', income: 15500000, expense: 8400000 },
    { month: 'Jul', income: 16000000, expense: 11000000 },
    { month: 'Agu', income: 16000000, expense: 7800000 },
    { month: 'Sep', income: 17500000, expense: 8900000 },
    { month: 'Okt', income: totalIncome, expense: totalExpense },
  ];

  // Daily Expense Trend Line (Part 3 Requirement)
  const currentMonthDays = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
  const dailyTrendData = currentMonthDays.map(day => {
    const dayStr = String(day).padStart(2, '0');
    const dayTxs = transactions.filter(
      t => t.type === 'expense' && t.transaction_time.startsWith(`2026-10-${dayStr}`)
    );
    const amount = dayTxs.reduce((acc, t) => acc + t.amount, 0);
    return { day: `Tgl ${day}`, dateNum: day, amount, count: dayTxs.length };
  });

  const maxDailyVal = Math.max(...dailyTrendData.map(d => d.amount), 1500000);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-slate-200 rounded-2xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="h-72 bg-slate-200 rounded-2xl lg:col-span-2"></div>
          <div className="h-72 bg-slate-200 rounded-2xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Header and Period Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Beranda Keuangan</h1>
          <p className="text-sm text-slate-500">Pantau arus kas, status budget, dan ringkasan transaksi kamu.</p>
        </div>

        <div className="flex items-center gap-2">
          {/* Period Selector (1 Hari, 7 Hari, 1 Bulan, Tahunan) */}
          <div className="bg-white border border-slate-200 p-1 rounded-xl flex items-center shadow-xs text-xs font-semibold">
            {[
              { key: 'harian', label: '1 Hari' },
              { key: 'mingguan', label: '7 Hari' },
              { key: 'bulanan', label: '1 Bulan' },
              { key: 'tahunan', label: 'Tahunan' },
            ].map(p => (
              <button
                key={p.key}
                onClick={() => setPeriod(p.key as any)}
                className={`px-3 py-1.5 rounded-lg transition ${
                  period === p.key
                    ? 'bg-orange-500 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <Link
            href="/calendar"
            className="hidden sm:flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Calendar className="w-3.5 h-3.5 text-orange-500" />
            <span>Kalender</span>
          </Link>

          <Link
            href="/tata-ai"
            className="flex items-center gap-1.5 px-3 py-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Bot className="w-3.5 h-3.5" />
            <span>Tata AI</span>
          </Link>

          <Link
            href="/transactions?action=new"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span className="hidden sm:inline">Catat Manual</span>
          </Link>
        </div>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Saldo Total */}
        <Link
          href="/wallets"
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow hover:border-orange-300 transition block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-orange-600 transition-colors">Saldo Total</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
              <WalletIcon className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{formatRupiah(totalBalance)}</div>
          <div className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center justify-between">
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>{wallets.length} dompet aktif</span>
            </span>
            <span className="text-orange-600 font-bold text-[10px]">Kelola →</span>
          </div>
        </Link>

        {/* Card 2: Pemasukan Bulan Ini */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pemasukan ({period})</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-emerald-600 mt-2">{formatRupiah(totalIncome)}</div>
          <div className="text-[11px] text-slate-500 mt-1">{incomeTxs.length} transaksi tercatat</div>
        </div>

        {/* Card 3: Pengeluaran Bulan Ini */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Pengeluaran ({period})</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-orange-600 mt-2">{formatRupiah(totalExpense)}</div>
          <div className="text-[11px] text-slate-500 mt-1">{expenseTxs.length} transaksi tercatat</div>
        </div>

        {/* Card 4: Budget Tersisa */}
        <Link
          href="/budgets"
          className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm hover:shadow hover:border-orange-300 transition block group"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider group-hover:text-orange-600 transition-colors">Budget Tersisa</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-orange-50 group-hover:text-orange-600 transition-colors">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-bold text-slate-900 mt-2">{formatRupiah(remainingBudget)}</div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center justify-between">
            <span>Dari {formatRupiah(totalMonthlyBudget)}</span>
            <span className="text-orange-600 font-bold text-[10px]">Multi-Periode →</span>
          </div>
        </Link>
      </div>

      {/* Onboarding Checklist for New Users */}
      <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-orange-500/5 border border-orange-200/80 rounded-2xl p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <span className="text-orange-500 font-extrabold">🚀</span> Checklist Memulai TataDana
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">Selesaikan langkah ini untuk mengoptimalkan otomatisasi bot Telegram kamu.</p>
          </div>
          <span className="text-xs font-bold text-orange-600 bg-white px-3 py-1 rounded-full border border-orange-200 shadow-sm">
            3 dari 4 Selesai
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mt-4">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 flex items-center justify-between shadow-sm">
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <div className="text-xs font-bold text-slate-900">Hubungkan Telegram</div>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Aktif</span>
          </div>

          <Link
            href="/wallets"
            className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-orange-500 flex items-center justify-between shadow-sm group transition"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <div className="text-xs font-bold text-slate-900 group-hover:text-orange-600 transition-colors">Atur Dompet Utama (BCA)</div>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">Default</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsOnboardingModalOpen(true)}
            className="bg-white p-3.5 rounded-xl border border-orange-300 hover:border-orange-500 flex items-center justify-between shadow-sm group transition text-left"
          >
            <div className="flex items-center gap-2.5">
              <Sparkles className="w-4 h-4 text-orange-500 group-hover:scale-110 transition-transform" />
              <div className="text-xs font-bold text-slate-900">AI Kategori Onboarding</div>
            </div>
            <span className="text-[10px] text-orange-600 font-bold bg-orange-50 px-2 py-0.5 rounded border border-orange-200 flex items-center gap-0.5">
              Buka <ArrowRight className="w-2.5 h-2.5" />
            </span>
          </button>

          <Link
            href="/budgets"
            className="bg-white p-3.5 rounded-xl border border-slate-200 hover:border-orange-500 flex items-center justify-between shadow-sm group transition"
          >
            <div className="flex items-center gap-2.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <div className="text-xs font-bold text-slate-900">Atur Target Budget</div>
            </div>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
              Siap
            </span>
          </Link>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: 6-Month Income vs Expense Bar Chart */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-bold text-slate-900">Arus Kas 6 Bulan Terakhir</h2>
              <p className="text-xs text-slate-500">Perbandingan pemasukan vs pengeluaran bulanan</p>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-emerald-500"></span>
                <span>Pemasukan</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-orange-500"></span>
                <span>Pengeluaran</span>
              </div>
            </div>
          </div>

          {/* SVG Bar Chart */}
          <div className="h-60 flex items-end justify-between gap-3 pt-4 px-2">
            {sixMonthsData.map((d, i) => {
              const maxVal = 20000000;
              const incHeight = Math.round((d.income / maxVal) * 100);
              const expHeight = Math.round((d.expense / maxVal) * 100);

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    {/* Income Bar */}
                    <div
                      style={{ height: `${incHeight}%` }}
                      className="w-1/2 max-w-[20px] bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all relative group-hover:opacity-90"
                      title={`Pemasukan ${d.month}: ${formatRupiah(d.income)}`}
                    ></div>
                    {/* Expense Bar */}
                    <div
                      style={{ height: `${expHeight}%` }}
                      className="w-1/2 max-w-[20px] bg-orange-500 hover:bg-orange-600 rounded-t-md transition-all relative group-hover:opacity-90"
                      title={`Pengeluaran ${d.month}: ${formatRupiah(d.expense)}`}
                    ></div>
                  </div>
                  <span className="text-xs font-bold text-slate-500">{d.month}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Chart 2: Category Breakdown Pie Chart */}
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">Pengeluaran per Kategori</h2>
            <p className="text-xs text-slate-500">Distribusi pengeluaran bulan ini (Pie Chart)</p>
          </div>

          {/* SVG Category Donut / Pie Chart */}
          <div className="flex items-center justify-center my-3">
            <div className="relative w-36 h-36">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="38" fill="transparent" stroke="#f1f5f9" strokeWidth="14" />
                {(() => {
                  let accumulatedPercent = 0;
                  const circumference = 2 * Math.PI * 38;
                  return expenseByCategory.map((cat, i) => {
                    const strokeDasharray = `${(cat.percentage / 100) * circumference} ${circumference}`;
                    const strokeDashoffset = -((accumulatedPercent / 100) * circumference);
                    accumulatedPercent += cat.percentage;
                    return (
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r="38"
                        fill="transparent"
                        stroke={cat.color || '#f97316'}
                        strokeWidth="14"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500 hover:opacity-80"
                      />
                    );
                  });
                })()}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Total</span>
                <span className="text-xs font-black text-slate-900">{formatRupiah(totalExpense)}</span>
              </div>
            </div>
          </div>

          <div className="space-y-3 my-2 max-h-48 overflow-y-auto pr-1">
            {expenseByCategory.map((cat, i) => (
              <div key={i} className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-800 flex items-center gap-1.5">
                    <span>{cat.emoji}</span>
                    <span>{cat.name}</span>
                  </span>
                  <span className="text-slate-600 font-bold">{formatRupiah(cat.amount)} ({cat.percentage}%)</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ width: `${cat.percentage}%`, backgroundColor: cat.color || '#f97316' }}
                  ></div>
                </div>
              </div>
            ))}
          </div>

          <Link
            href="/reports"
            className="w-full py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl text-center border border-slate-200 transition"
          >
            Lihat Analisa Lengkap di Laporan →
          </Link>
        </div>
      </div>

      {/* Chart 3: Trend Line Pengeluaran Harian Bulan Ini (Part 3 Requirement) */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <h2 className="text-base font-bold text-slate-900">Trend Line Pengeluaran Harian Bulan Ini</h2>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Grafik fluktuasi belanja harian (Oktober 2026) untuk mendeteksi lonjakan pengeluaran.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <span className="font-semibold text-slate-600">
              Rata-rata: <b className="text-slate-900">{formatRupiah(Math.round(totalExpense / Math.max(1, dailyTrendData.length)))}/hari</b>
            </span>
          </div>
        </div>

        {/* Responsive SVG Trend Line */}
        <div className="h-44 w-full pt-2">
          <svg className="w-full h-full overflow-visible" viewBox="0 0 900 170" preserveAspectRatio="none">
            <defs>
              <linearGradient id="orangeTrendGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#f97316" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#f97316" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[20, 60, 100, 140].map((y, idx) => (
              <line key={idx} x1="10" y1={y} x2="890" y2={y} stroke="#f1f5f9" strokeWidth="1" strokeDasharray="4 4" />
            ))}

            {/* Area & Polyline */}
            {(() => {
              const points = dailyTrendData.map((d, idx) => {
                const x = (idx / (dailyTrendData.length - 1)) * 860 + 20;
                const y = 140 - (d.amount / maxDailyVal) * 115;
                return `${x},${y}`;
              });
              const areaPoints = `20,150 ${points.join(' ')} 880,150`;
              return (
                <>
                  <polygon points={areaPoints} fill="url(#orangeTrendGrad)" />
                  <polyline points={points.join(' ')} fill="none" stroke="#f97316" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                </>
              );
            })()}

            {/* Data Circles with Values */}
            {dailyTrendData.map((d, idx) => {
              const x = (idx / (dailyTrendData.length - 1)) * 860 + 20;
              const y = 140 - (d.amount / maxDailyVal) * 115;
              return (
                <g key={idx} className="group cursor-pointer">
                  <circle cx={x} cy={y} r="4.5" fill="#f97316" stroke="#ffffff" strokeWidth="2" />
                  <text x={x} y={162} textAnchor="middle" fontSize="10" fill="#64748b" fontWeight="600">{d.day}</text>
                  {d.amount > 0 && (
                    <text x={x} y={y - 8} textAnchor="middle" fontSize="10" fill="#c2410c" fontWeight="bold">
                      {formatRupiah(d.amount)}
                    </text>
                  )}
                </g>
              );
            })}
          </svg>
        </div>
      </div>

      {/* Recent 10 Transactions */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900">10 Transaksi Terbaru</h2>
            <p className="text-xs text-slate-500">Real-time sinkron dari Telegram & Web</p>
          </div>
          <Link
            href="/transactions"
            className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1"
          >
            Lihat Semua Transaksi →
          </Link>
        </div>

        <div className="divide-y divide-slate-100">
          {transactions.slice(0, 10).map((t) => {
            const isExpense = t.type === 'expense';
            return (
              <div key={t.id} className="p-4 hover:bg-slate-50/80 transition flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-lg">
                    {t.category?.emoji || (isExpense ? '💸' : '💰')}
                  </div>
                  <div>
                    <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <span>{t.description}</span>
                      {t.source === 'telegram_receipt' && (
                        <span className="text-[10px] bg-purple-50 text-purple-600 px-2 py-0.5 rounded font-bold border border-purple-200 flex items-center gap-0.5">
                          <Receipt className="w-3 h-3" /> Struk
                        </span>
                      )}
                      {t.source === 'telegram_voice' && (
                        <span className="text-[10px] bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-bold border border-blue-200 flex items-center gap-0.5">
                          <Mic className="w-3 h-3" /> VN
                        </span>
                      )}
                      {t.source === 'telegram_text' && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-bold flex items-center gap-0.5">
                          <MessageSquare className="w-3 h-3" /> Telegram
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2">
                      <span>{formatDateOnlyWIB(t.transaction_time)}</span>
                      <span>•</span>
                      <span>{formatShortTimeWIB(t.transaction_time)}</span>
                      <span>•</span>
                      <span>👛 {t.wallet?.name || 'Dompet'}</span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 flex flex-col items-end gap-1">
                  <div>
                    <div className={`text-sm font-bold font-mono ${isExpense ? 'text-orange-600' : 'text-emerald-600'}`}>
                      {isExpense ? '-' : '+'}{formatRupiah(t.amount)}
                    </div>
                    <div className="text-[10px] text-slate-400 capitalize">{t.type}</div>
                  </div>

                  <div className="flex items-center gap-1 mt-0.5">
                    <a
                      href={`/api/transactions/${t.id}/export?format=pdf`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded text-[10px] font-bold transition hover:scale-105"
                      title="Unduh Struk PDF"
                    >
                      <FileText className="w-2.5 h-2.5 text-red-600" />
                      <span>PDF</span>
                    </a>
                    <a
                      href={`/api/transactions/${t.id}/export?format=excel`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded text-[10px] font-bold transition hover:scale-105"
                      title="Unduh Excel (.xlsx)"
                    >
                      <FileSpreadsheet className="w-2.5 h-2.5 text-emerald-600" />
                      <span>Excel</span>
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Modal AI Category Onboarding */}
      {isOnboardingModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-6 space-y-5 border border-slate-100">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-sm">AI Category Onboarding</h3>
                  <p className="text-[11px] text-slate-500">Rekomendasi pos anggaran otomatis berbasis AI</p>
                </div>
              </div>
              <button
                onClick={() => setIsOnboardingModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-sm font-bold p-1"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-2">Pilih Profil / Gaya Hidup:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'karyawan', label: '💼 Karyawan' },
                  { id: 'freelancer', label: '💻 Freelancer' },
                  { id: 'mahasiswa', label: '🎓 Mahasiswa' },
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProfession(p.id)}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                      profession === p.id
                        ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {generatedCategories.length === 0 ? (
              <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-3">
                <p className="text-xs text-slate-600">
                  AI akan menganalisa profil <b>{profession}</b> dan menyiapkan pos kategori lengkap dengan alokasi target budget bulanan yang realistis.
                </p>
                <button
                  type="button"
                  onClick={handleGenerateAiCategories}
                  disabled={isGeneratingCategories}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2 mx-auto"
                >
                  {isGeneratingCategories ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>AI Sedang Meracik Kategori...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Kategori AI Sekarang</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-xs font-bold text-slate-700">Hasil Rekomendasi Kategori AI:</div>
                <div className="grid grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                  {generatedCategories.map((cat, i) => (
                    <div key={i} className="p-2.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span>{cat.emoji}</span>
                        <div>
                          <div className="font-bold text-slate-800">{cat.name}</div>
                          <div className="text-[10px] text-slate-400 capitalize">{cat.type}</div>
                        </div>
                      </div>
                      {cat.budget > 0 && (
                        <span className="font-bold text-orange-600 text-[11px]">{formatRupiah(cat.budget)}</span>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setGeneratedCategories([])}
                    className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                  >
                    Reset
                  </button>
                  <button
                    type="button"
                    onClick={handleApplyAiCategories}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow transition"
                  >
                    {categoriesSaved ? '✓ Tersimpan ke Akun!' : 'Terapkan Kategori Ini'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
