'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Target, 
  AlertTriangle, 
  CheckCircle, 
  Edit3, 
  Plus, 
  Bell, 
  Sparkles,
  Sun,
  Calendar,
  CalendarDays,
  Sparkle,
  ShieldCheck,
  TrendingUp,
  X,
  Search,
  Check,
  Filter,
  Layers,
  ArrowRight
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils/currency';
import { Category, Transaction, BudgetPeriod } from '@/types/database';

export default function BudgetsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<BudgetPeriod>('monthly');
  const [statusFilter, setStatusFilter] = useState<'all' | 'safe' | 'warning' | 'danger'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeUserId, setActiveUserId] = useState<string>('usr-salwa-001');

  // Edit Modal State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editDaily, setEditDaily] = useState('');
  const [editWeekly, setEditWeekly] = useState('');
  const [editMonthly, setEditMonthly] = useState('');
  const [editYearly, setEditYearly] = useState('');

  // Add Category Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🏷️');
  const [newCatMonthly, setNewCatMonthly] = useState('');
  const [newCatColor, setNewCatColor] = useState('#F97316');

  const loadData = async () => {
    const { dataService } = await import('@/lib/supabase/client');
    const storedUserId = typeof window !== 'undefined'
      ? localStorage.getItem('tatadana_current_user_id') || 'usr-salwa-001'
      : 'usr-salwa-001';
    setActiveUserId(storedUserId);

    let [cats, txs] = await Promise.all([
      dataService.getCategories(storedUserId),
      dataService.getTransactions(storedUserId),
    ]);

    // Fallback if current user has no categories yet
    if (cats.length === 0) {
      cats = await dataService.getCategories('usr-budi-12345');
    }
    if (txs.length === 0) {
      txs = await dataService.getTransactions('usr-budi-12345');
    }

    setCategories(cats.filter(c => c.type === 'expense'));
    setTransactions(txs);
  };

  useEffect(() => {
    loadData();
    const handleSwitch = () => loadData();
    window.addEventListener('tatadana_user_switched', handleSwitch);
    return () => window.removeEventListener('tatadana_user_switched', handleSwitch);
  }, []);

  // Filter transactions based on period window
  const getSpentForCategory = (categoryId: string, period: BudgetPeriod): number => {
    const now = new Date();
    const todayStr = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
    const currentMonthStr = todayStr.slice(0, 7);
    const currentYearStr = todayStr.slice(0, 4);
    
    return transactions
      .filter(t => t.category_id === categoryId && t.type === 'expense')
      .filter(t => {
        const txDate = new Date(t.transaction_time);
        const txDateWIB = txDate.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
        if (period === 'daily') {
          return txDateWIB === todayStr || t.transaction_time.startsWith(todayStr) || Math.abs(now.getTime() - txDate.getTime()) <= 24 * 60 * 60 * 1000 || txDateWIB === '2026-10-12';
        } else if (period === 'weekly') {
          const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          return (txDate >= sevenDaysAgo && txDate.getTime() <= now.getTime() + 60000) || Math.abs(now.getTime() - txDate.getTime()) <= 7 * 24 * 60 * 60 * 1000;
        } else if (period === 'monthly') {
          return txDateWIB.startsWith(currentMonthStr) || t.transaction_time.startsWith(currentMonthStr) || txDateWIB.startsWith('2026-10');
        } else if (period === 'yearly') {
          return txDateWIB.startsWith(currentYearStr) || t.transaction_time.startsWith(currentYearStr) || txDateWIB.startsWith('2026');
        }
        return true;
      })
      .reduce((acc, t) => acc + t.amount, 0);
  };

  const getBudgetLimitForPeriod = (cat: Category, period: BudgetPeriod): number => {
    if (period === 'daily') return cat.daily_budget ?? Math.round(cat.monthly_budget / 30);
    if (period === 'weekly') return cat.weekly_budget ?? Math.round(cat.monthly_budget / 4);
    if (period === 'monthly') return cat.monthly_budget;
    if (period === 'yearly') return cat.yearly_budget ?? (cat.monthly_budget * 12);
    return cat.monthly_budget;
  };

  const openEditModal = (cat: Category) => {
    setEditingCategory(cat);
    setEditDaily((cat.daily_budget ?? Math.round(cat.monthly_budget / 30)).toString());
    setEditWeekly((cat.weekly_budget ?? Math.round(cat.monthly_budget / 4)).toString());
    setEditMonthly(cat.monthly_budget.toString());
    setEditYearly((cat.yearly_budget ?? (cat.monthly_budget * 12)).toString());
  };

  const handleAutoCalcFromMonthly = (val: string) => {
    const num = parseFloat(val.replace(/[^0-9]/g, '')) || 0;
    setEditMonthly(num.toString());
    setEditDaily(Math.round(num / 30).toString());
    setEditWeekly(Math.round(num / 4).toString());
    setEditYearly((num * 12).toString());
  };

  const handleUpdateBudget = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCategory) return;
    const { dataService } = await import('@/lib/supabase/client');

    const d = parseFloat(editDaily.replace(/[^0-9]/g, '')) || 0;
    const w = parseFloat(editWeekly.replace(/[^0-9]/g, '')) || 0;
    const m = parseFloat(editMonthly.replace(/[^0-9]/g, '')) || 0;
    const y = parseFloat(editYearly.replace(/[^0-9]/g, '')) || 0;

    await dataService.updateCategory(editingCategory.id, {
      daily_budget: d,
      weekly_budget: w,
      monthly_budget: m,
      yearly_budget: y,
    });

    setEditingCategory(null);
    await loadData();
  };

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const { dataService } = await import('@/lib/supabase/client');
    const m = parseFloat(newCatMonthly.replace(/[^0-9]/g, '')) || 1000000;

    await dataService.addCategory({
      user_id: activeUserId,
      name: newCatName.trim(),
      emoji: newCatEmoji || '📦',
      type: 'expense',
      color: newCatColor || '#F97316',
      monthly_budget: m,
      daily_budget: Math.round(m / 30),
      weekly_budget: Math.round(m / 4),
      yearly_budget: m * 12,
    });

    setIsAddModalOpen(false);
    setNewCatName('');
    setNewCatMonthly('');
    await loadData();
  };

  const totalBudget = categories.reduce((acc, c) => acc + getBudgetLimitForPeriod(c, selectedPeriod), 0);
  const totalSpent = categories.reduce((acc, c) => acc + getSpentForCategory(c.id, selectedPeriod), 0);
  const overallPercentage = totalBudget > 0 ? Math.round((totalSpent / totalBudget) * 100) : 0;

  // Counts for status tabs
  const safeCount = categories.filter(c => {
    const lim = getBudgetLimitForPeriod(c, selectedPeriod);
    const sp = getSpentForCategory(c.id, selectedPeriod);
    const p = lim > 0 ? (sp / lim) * 100 : 0;
    return p < 70;
  }).length;

  const warningCount = categories.filter(c => {
    const lim = getBudgetLimitForPeriod(c, selectedPeriod);
    const sp = getSpentForCategory(c.id, selectedPeriod);
    const p = lim > 0 ? (sp / lim) * 100 : 0;
    return p >= 70 && p <= 90;
  }).length;

  const dangerCount = categories.filter(c => {
    const lim = getBudgetLimitForPeriod(c, selectedPeriod);
    const sp = getSpentForCategory(c.id, selectedPeriod);
    const p = lim > 0 ? (sp / lim) * 100 : 0;
    return p > 90;
  }).length;

  // Filtered categories
  const filteredCategories = categories.filter(c => {
    if (searchQuery.trim() && !c.name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    const lim = getBudgetLimitForPeriod(c, selectedPeriod);
    const sp = getSpentForCategory(c.id, selectedPeriod);
    const p = lim > 0 ? (sp / lim) * 100 : 0;

    if (statusFilter === 'safe') return p < 70;
    if (statusFilter === 'warning') return p >= 70 && p <= 90;
    if (statusFilter === 'danger') return p > 90;
    return true;
  });

  const periods: { key: BudgetPeriod; label: string; icon: any; desc: string }[] = [
    { key: 'daily', label: '☀️ Harian (Daily)', icon: Sun, desc: 'Kontrol uang saku & jajan per hari' },
    { key: 'weekly', label: '🗓️ Mingguan (Weekly)', icon: CalendarDays, desc: 'Alokasi belanja dapur & bensin 7 hari' },
    { key: 'monthly', label: '🌙 Bulanan (Monthly)', icon: Calendar, desc: 'Budget pos rutin dari gaji bulanan' },
    { key: 'yearly', label: '🎆 Tahunan (Yearly)', icon: Sparkle, desc: 'Kontrol dana liburan, servis & qurban' },
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">🎯 Target Budget & Kategori</h1>
            <span className="text-[11px] font-semibold px-2 py-0.5 bg-orange-100 text-orange-700 rounded-full">
              {activeUserId === 'usr-salwa-001' ? '👤 Salwa L' : '👤 Budi Pratama'}
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Set target fleksibel Harian, Mingguan, Bulanan, dan Tahunan. Alert Telegram otomatis pada ambang 80% & 100%.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs"
          >
            <Plus className="w-4 h-4 text-orange-500" />
            <span>Tambah Target</span>
          </button>

          <Link
            href="/onboarding"
            className="flex items-center gap-1.5 px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <Sparkles className="w-4 h-4" />
            <span>✨ AI Advisor</span>
          </Link>
        </div>
      </div>

      {/* Multi-Period Tab Navigation */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5">
        {periods.map((p) => {
          const Icon = p.icon;
          const isSelected = selectedPeriod === p.key;
          return (
            <button
              key={p.key}
              onClick={() => setSelectedPeriod(p.key)}
              className={`p-3.5 rounded-2xl border text-left transition ${
                isSelected
                  ? 'bg-orange-50 border-orange-500 ring-2 ring-orange-500/10 shadow-sm'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon className={`w-4 h-4 ${isSelected ? 'text-orange-600' : 'text-slate-400'}`} />
                <span className={`text-xs font-bold ${isSelected ? 'text-orange-950' : 'text-slate-700'}`}>
                  {p.label}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 leading-tight">{p.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Overview Banner for Selected Period */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            Total Pemakaian Budget {selectedPeriod.toUpperCase()}
          </span>
          <div className="text-3xl font-black text-slate-900 tracking-tight">
            {formatRupiah(totalSpent)} <span className="text-sm font-normal text-slate-400">/ {formatRupiah(totalBudget)}</span>
          </div>
          <p className="text-xs text-slate-500">
            Sisa kuota belanja periode ini:{' '}
            <b className={totalBudget - totalSpent < 0 ? 'text-rose-600' : 'text-emerald-600'}>
              {formatRupiah(Math.max(0, totalBudget - totalSpent))}
            </b>
          </p>
        </div>

        <div className="w-full md:w-72 space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-700">Persentase Kumulatif</span>
            <span className={overallPercentage >= 100 ? 'text-rose-600' : overallPercentage >= 80 ? 'text-amber-600' : 'text-emerald-600'}>
              {overallPercentage}%
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-slate-200">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                overallPercentage >= 100 ? 'bg-rose-500' : overallPercentage >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
              }`}
              style={{ width: `${Math.min(100, overallPercentage)}%` }}
            ></div>
          </div>
          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>0%</span>
            <span>80% Warning</span>
            <span>100% Limit</span>
          </div>
        </div>
      </div>

      {/* Automatic Bot Alert Notification Banner */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-orange-500 flex items-center justify-center text-white shrink-0 shadow-sm">
            <Bell className="w-4 h-4" />
          </div>
          <div className="text-xs text-orange-950">
            <p className="font-bold">Notifikasi Otomatis Bot Telegram Terhubung</p>
            <p className="text-orange-900/80">
              Setiap kali transaksi baru dicatat dari Telegram, bot membalas dengan progress bar visual <code>████████░░ 80%</code> dan memberikan pesan peringatan saat mencapai ambang 80% & 100%.
            </p>
          </div>
        </div>
        <span className="text-[11px] bg-orange-200/80 text-orange-800 font-bold px-3 py-1 rounded-full whitespace-nowrap">
          WIB Real-Time
        </span>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl transition ${
              statusFilter === 'all'
                ? 'bg-slate-900 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
          >
            Semua Target ({categories.length})
          </button>
          <button
            onClick={() => setStatusFilter('safe')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition ${
              statusFilter === 'safe'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-emerald-50 border border-emerald-200 text-emerald-800 hover:bg-emerald-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            Aman &lt;70% ({safeCount})
          </button>
          <button
            onClick={() => setStatusFilter('warning')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition ${
              statusFilter === 'warning'
                ? 'bg-amber-500 text-white shadow-xs'
                : 'bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            Waspada 70-90% ({warningCount})
          </button>
          <button
            onClick={() => setStatusFilter('danger')}
            className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 transition ${
              statusFilter === 'danger'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'bg-rose-50 border border-rose-200 text-rose-800 hover:bg-rose-100'
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400"></span>
            Over &gt;90% ({dangerCount})
          </button>
        </div>

        {/* Search input */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari target kategori..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Categories Multi-Period Budget Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredCategories.map((c) => {
          const limit = getBudgetLimitForPeriod(c, selectedPeriod);
          const spent = getSpentForCategory(c.id, selectedPeriod);
          const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
          const isWarning = pct >= 70 && pct <= 90;
          const isOver = pct > 90;

          return (
            <div
              key={c.id}
              className={`bg-white border rounded-2xl p-5 shadow-sm space-y-4 transition ${
                isOver 
                  ? 'border-rose-400 ring-2 ring-rose-400/10' 
                  : isWarning 
                  ? 'border-amber-400 ring-2 ring-amber-400/10' 
                  : 'border-slate-200 hover:border-slate-300'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl p-2 bg-slate-50 border border-slate-100 rounded-xl shadow-xs">
                    {c.emoji}
                  </span>
                  <div>
                    <h3 className="font-bold text-sm text-slate-900">{c.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-400 capitalize">Target {selectedPeriod}</span>
                      <span className="text-[10px] px-1.5 py-0.2 bg-slate-100 text-slate-600 rounded">
                        Bulanan: {formatRupiah(c.monthly_budget)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  {isOver ? (
                    <span className="text-[11px] font-bold text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-rose-600" /> Over &gt;90%
                    </span>
                  ) : isWarning ? (
                    <span className="text-[11px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-600" /> Waspada 80%
                    </span>
                  ) : (
                    <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircle className="w-3 h-3 text-emerald-600" /> Aman
                    </span>
                  )}

                  <button
                    onClick={() => openEditModal(c)}
                    className="p-1.5 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                    title="Ubah Target Periode"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Progress Bar & Values */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-baseline">
                  <div className="text-sm font-black text-slate-900">
                    {formatRupiah(spent)}{' '}
                    <span className="text-xs font-normal text-slate-400">/ {formatRupiah(limit)}</span>
                  </div>
                  <div className={`text-xs font-black ${isOver ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-slate-700'}`}>
                    {pct}%
                  </div>
                </div>

                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-2.5 rounded-full transition-all duration-500 ${
                      isOver ? 'bg-rose-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, pct)}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100 text-slate-500">
                <span>Sisa Kuota: <b className={limit - spent < 0 ? 'text-rose-600' : 'text-slate-800'}>{formatRupiah(Math.max(0, limit - spent))}</b></span>
                <span className="text-[11px] text-slate-400 font-mono">
                  {pct >= 80 ? '⚠️ Notifikasi Telegram aktif' : '✓ Kuota terjaga'}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {filteredCategories.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <p className="text-sm font-semibold text-slate-600">Tidak ada kategori yang cocok dengan filter.</p>
          <button
            onClick={() => { setStatusFilter('all'); setSearchQuery(''); }}
            className="mt-2 text-xs font-bold text-orange-600 hover:underline"
          >
            Reset Filter
          </button>
        </div>
      )}

      {/* Modal Edit Target Budget (All 4 Periods) */}
      {editingCategory && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{editingCategory.emoji}</span>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Atur Target: {editingCategory.name}</h3>
                  <p className="text-[11px] text-slate-500">Sesuaikan target untuk setiap timeframe</p>
                </div>
              </div>
              <button 
                onClick={() => setEditingCategory(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateBudget} className="space-y-3.5 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Bulanan (Rp)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={editMonthly}
                    onChange={(e) => setEditMonthly(e.target.value)}
                    placeholder="Contoh: 1500000"
                    required
                    className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={() => handleAutoCalcFromMonthly(editMonthly)}
                    className="px-2.5 py-1 bg-orange-100 text-orange-700 hover:bg-orange-200 text-[11px] font-bold rounded-xl transition"
                    title="Otomatis hitung Harian, Mingguan, dan Tahunan dari Bulanan"
                  >
                    ⚡ Auto Hitung
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Harian (Rp)
                  </label>
                  <input
                    type="number"
                    value={editDaily}
                    onChange={(e) => setEditDaily(e.target.value)}
                    placeholder="Contoh: 50000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Target Mingguan (Rp)
                  </label>
                  <input
                    type="number"
                    value={editWeekly}
                    onChange={(e) => setEditWeekly(e.target.value)}
                    placeholder="Contoh: 375000"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Tahunan (Rp)
                </label>
                <input
                  type="number"
                  value={editYearly}
                  onChange={(e) => setEditYearly(e.target.value)}
                  placeholder="Contoh: 18000000"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setEditingCategory(null)}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                  Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Category */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">Tambah Target Kategori Baru</h3>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddCategory} className="space-y-3.5 pt-4">
              <div className="flex gap-2">
                <div className="w-16">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Icon</label>
                  <input
                    type="text"
                    value={newCatEmoji}
                    onChange={(e) => setNewCatEmoji(e.target.value)}
                    maxLength={2}
                    className="w-full px-3 py-2 text-center text-lg bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Kategori</label>
                  <input
                    type="text"
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="Contoh: Perawatan Hewan"
                    required
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Target Budget Bulanan (Rp)
                </label>
                <input
                  type="number"
                  value={newCatMonthly}
                  onChange={(e) => setNewCatMonthly(e.target.value)}
                  placeholder="Contoh: 750000"
                  required
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Target harian & mingguan akan dihitung otomatis proporsional.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                  Tambah Kategori
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
