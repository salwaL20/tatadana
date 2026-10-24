'use client';

import React, { useState, useEffect } from 'react';
import { 
  Calendar as CalendarIcon, 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  ArrowUpRight, 
  ArrowDownLeft, 
  Clock, 
  AlertCircle, 
  CheckCircle2, 
  X,
  CreditCard,
  Building,
  Sparkles,
  Layers
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils/currency';
import { Transaction, RecurringBill } from '@/types/database';

export default function CalendarPage() {
  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(9); // 0-indexed, 9 = October
  const [viewMode, setViewMode] = useState<'month' | 'week'>('month');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [recurringBills, setRecurringBills] = useState<RecurringBill[]>([]);
  
  // Drill-down Modal State
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  
  // Quick Add Form State
  const [quickAmount, setQuickAmount] = useState('');
  const [quickDesc, setQuickDesc] = useState('');
  const [quickType, setQuickType] = useState<'income' | 'expense'>('expense');

  const loadData = async () => {
    const { dataService } = await import('@/lib/supabase/client');
    const [txs, bills] = await Promise.all([
      dataService.getTransactions(),
      dataService.getRecurringBills(),
    ]);
    setTransactions(txs);
    setRecurringBills(bills);
  };

  useEffect(() => {
    loadData();
  }, []);

  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  const prevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  const setToday = () => {
    setCurrentYear(2026);
    setCurrentMonth(9); // Oktober 2026
  };

  // Helper to format ISO date string: "2026-10-05"
  const formatDateString = (year: number, month: number, day: number) => {
    const m = (month + 1).toString().padStart(2, '0');
    const d = day.toString().padStart(2, '0');
    return `${year}-${m}-${d}`;
  };

  // Days in month
  const daysInCurrentMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDayIndex = (new Date(currentYear, currentMonth, 1).getDay() + 6) % 7; // Monday = 0

  // Calculate day stats
  const getDayData = (dateStr: string) => {
    const dayTxs = transactions.filter(t => {
      if (t.transaction_time && t.transaction_time.startsWith(dateStr)) return true;
      try {
        const d = new Date(t.transaction_time);
        if (isNaN(d.getTime())) return false;
        return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }) === dateStr;
      } catch {
        return false;
      }
    });
    const income = dayTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = dayTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const net = income - expense;
    
    // Check if any recurring bills fall on this day of month
    const dayNum = parseInt(dateStr.split('-')[2], 10);
    const dueBills = recurringBills.filter(b => b.due_day === dayNum && b.is_active);

    return { dayTxs, income, expense, net, dueBills };
  };

  const handleQuickAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) return;
    const nominal = parseFloat(quickAmount.replace(/[^0-9]/g, ''));
    if (isNaN(nominal) || nominal <= 0) return;

    const { dataService } = await import('@/lib/supabase/client');
    const wallets = await dataService.getWallets();
    const categories = await dataService.getCategories();
    
    await dataService.addTransaction({
      user_id: 'usr-budi-12345',
      wallet_id: wallets[0]?.id || 'wlt-bca-01',
      category_id: categories.find(c => c.type === quickType)?.id || null,
      type: quickType,
      amount: nominal,
      description: quickDesc.trim() || (quickType === 'income' ? 'Pemasukan kalender' : 'Pengeluaran kalender'),
      source: 'web_manual',
      transaction_time: `${selectedDate}T12:00:00+07:00`,
    });

    setQuickAmount('');
    setQuickDesc('');
    setIsQuickAddOpen(false);
    loadData();
  };

  const selectedDateData = selectedDate ? getDayData(selectedDate) : null;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">📅 Kalender Keuangan & Arus Kas</h1>
          <p className="text-sm text-slate-500">
            Pantau arus kas harian, deteksi hari-hari boros, dan lacak jatuh tempo tagihan berulang secara visual.
          </p>
        </div>

        {/* Month Navigation & View Mode */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl p-1 shadow-sm">
            <button
              onClick={prevMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              title="Bulan Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-xs font-bold text-slate-800 px-3 min-w-[140px] text-center">
              {monthNames[currentMonth]} {currentYear}
            </span>
            <button
              onClick={nextMonth}
              className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition"
              title="Bulan Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={setToday}
            className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-sm"
          >
            Hari Ini
          </button>

          <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
            <button
              onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                viewMode === 'month' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setViewMode('week')}
              className={`px-3 py-1 rounded-lg text-xs font-bold transition ${
                viewMode === 'week' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Mingguan
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid & Upcoming Bills Container */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Calendar View Area (3 Cols) */}
        <div className="lg:col-span-3 bg-white border border-slate-200 rounded-2xl shadow-sm p-5 space-y-4">
          {/* Day of Week Headers */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-slate-500 pb-2 border-b border-slate-100">
            <span className="text-slate-600">Sen</span>
            <span className="text-slate-600">Sel</span>
            <span className="text-slate-600">Rab</span>
            <span className="text-slate-600">Kam</span>
            <span className="text-slate-600">Jum</span>
            <span className="text-amber-600">Sab</span>
            <span className="text-rose-600">Min</span>
          </div>

          {/* Calendar Matrix Cells */}
          <div className="grid grid-cols-7 gap-2">
            {/* Empty slots before first day */}
            {Array.from({ length: firstDayIndex }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[90px] rounded-xl bg-slate-50/50 border border-transparent"></div>
            ))}

            {/* Days in month */}
            {Array.from({ length: daysInCurrentMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = formatDateString(currentYear, currentMonth, day);
              const data = getDayData(dateStr);
              const isToday = dateStr === '2026-10-12';
              const hasActivity = data.dayTxs.length > 0 || data.dueBills.length > 0;

              return (
                <div
                  key={dateStr}
                  onClick={() => setSelectedDate(dateStr)}
                  className={`min-h-[92px] p-2 rounded-xl border transition cursor-pointer flex flex-col justify-between hover:border-orange-500 hover:shadow-sm ${
                    isToday
                      ? 'bg-orange-50/40 border-orange-400 ring-2 ring-orange-400/20'
                      : hasActivity
                      ? 'bg-white border-slate-200'
                      : 'bg-white border-slate-100 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center ${
                      isToday ? 'bg-orange-500 text-white shadow-xs' : 'text-slate-700'
                    }`}>
                      {day}
                    </span>

                    {data.dueBills.length > 0 && (
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-1 rounded flex items-center gap-0.5" title="Tagihan Jatuh Tempo">
                        <Clock className="w-2.5 h-2.5" /> {data.dueBills.length}
                      </span>
                    )}
                  </div>

                  {/* Flow Badges */}
                  <div className="space-y-1 my-1">
                    {data.income > 0 && (
                      <div className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded truncate">
                        +{formatRupiah(data.income)}
                      </div>
                    )}
                    {data.expense > 0 && (
                      <div className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1 py-0.5 rounded truncate">
                        -{formatRupiah(data.expense)}
                      </div>
                    )}
                  </div>

                  {/* Daily Net Cashflow Footer */}
                  <div className="text-[10px] text-right font-medium">
                    {data.net !== 0 ? (
                      <span className={data.net > 0 ? 'text-emerald-600 font-bold' : 'text-rose-600 font-bold'}>
                        {data.net > 0 ? `+${formatRupiah(data.net)}` : formatRupiah(data.net)}
                      </span>
                    ) : (
                      <span className="text-slate-300">-</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span> Pemasukan</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Pengeluaran</span>
              <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Tagihan Jatuh Tempo</span>
            </div>
            <span>💡 Klik pada tanggal untuk rincian & aksi cepat</span>
          </div>
        </div>

        {/* Sidebar: Recurring Bills & Upcoming Budget Due Dates (1 Col) */}
        <div className="space-y-4">
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500" />
                <h3 className="text-sm font-bold text-slate-900">Tagihan & Agenda Rutin</h3>
              </div>
              <span className="text-[10px] bg-slate-100 text-slate-600 font-bold px-2 py-0.5 rounded-full">
                {recurringBills.length} Terdaftar
              </span>
            </div>

            <p className="text-xs text-slate-500">
              Pengingat jatuh tempo tagihan listrik, internet, dan langganan bulanan.
            </p>

            <div className="space-y-3 pt-1">
              {recurringBills.map((bill) => (
                <div key={bill.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{bill.name}</span>
                    <span className="text-[10px] font-bold text-orange-700 bg-orange-100 px-2 py-0.5 rounded-full">
                      Tgl {bill.due_day}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-500">{formatRupiah(bill.amount)}</span>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Auto-track
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Cashflow Summary Widget */}
          <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-2xl p-5 shadow-sm space-y-3">
            <div className="flex items-center gap-2 text-orange-950 font-bold text-xs">
              <Sparkles className="w-4 h-4 text-orange-500" />
              <span>Analisa Siklus Arus Kas</span>
            </div>
            <p className="text-xs text-orange-900/80 leading-relaxed">
              Arus kas tertinggi kamu biasanya berada di awal bulan (gajian), dengan beban tagihan terkonsentrasi di tanggal <b>15-28</b>.
            </p>
          </div>
        </div>
      </div>

      {/* Drill-Down Date Modal */}
      {selectedDate && selectedDateData && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Agenda & Transaksi: {selectedDate}
                </h3>
                <p className="text-xs text-slate-500">
                  Net Cashflow:{' '}
                  <b className={selectedDateData.net >= 0 ? 'text-emerald-600' : 'text-rose-600'}>
                    {selectedDateData.net >= 0 ? `+${formatRupiah(selectedDateData.net)}` : formatRupiah(selectedDateData.net)}
                  </b>
                </p>
              </div>
              <button 
                onClick={() => setSelectedDate(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content: List of transactions */}
            <div className="py-4 space-y-4 max-h-[360px] overflow-y-auto">
              {/* Due Bills on this day */}
              {selectedDateData.dueBills.length > 0 && (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
                  <span className="text-xs font-bold text-amber-900 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Tagihan Jatuh Tempo Hari Ini:
                  </span>
                  {selectedDateData.dueBills.map(b => (
                    <div key={b.id} className="text-xs text-amber-800 flex justify-between">
                      <span>• {b.name}</span>
                      <b>{formatRupiah(b.amount)}</b>
                    </div>
                  ))}
                </div>
              )}

              {/* Transactions on this day */}
              {selectedDateData.dayTxs.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Tidak ada catatan transaksi di tanggal ini.
                </div>
              ) : (
                <div className="space-y-2">
                  <span className="text-xs font-bold text-slate-700">Histori Transaksi:</span>
                  {selectedDateData.dayTxs.map(t => (
                    <div key={t.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2.5">
                        <span className="text-base">{t.category?.emoji || '💳'}</span>
                        <div>
                          <div className="font-bold text-slate-900">{t.description}</div>
                          <div className="text-[10px] text-slate-400">{t.wallet?.name || 'Dompet'} • {t.source}</div>
                        </div>
                      </div>
                      <div className={`font-black ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'income' ? '+' : '-'}{formatRupiah(t.amount)}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Quick Add Form Section */}
              {isQuickAddOpen ? (
                <form onSubmit={handleQuickAdd} className="p-4 bg-orange-50/60 border border-orange-200 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-orange-950">Catat Cepat di {selectedDate}</span>
                    <button 
                      type="button" 
                      onClick={() => setIsQuickAddOpen(false)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Batal
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setQuickType('expense')}
                      className={`py-1 rounded-lg text-xs font-bold ${quickType === 'expense' ? 'bg-rose-500 text-white' : 'bg-white text-slate-600'}`}
                    >
                      Pengeluaran
                    </button>
                    <button
                      type="button"
                      onClick={() => setQuickType('income')}
                      className={`py-1 rounded-lg text-xs font-bold ${quickType === 'income' ? 'bg-emerald-500 text-white' : 'bg-white text-slate-600'}`}
                    >
                      Pemasukan
                    </button>
                  </div>

                  <input
                    type="number"
                    placeholder="Nominal (Rp)"
                    value={quickAmount}
                    onChange={(e) => setQuickAmount(e.target.value)}
                    required
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold"
                  />

                  <input
                    type="text"
                    placeholder="Keterangan (contoh: Makan siang, Grab)"
                    value={quickDesc}
                    onChange={(e) => setQuickDesc(e.target.value)}
                    className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs"
                  />

                  <button
                    type="submit"
                    className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition shadow-sm"
                  >
                    Simpan Transaksi
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setIsQuickAddOpen(true)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 bg-slate-100 hover:bg-orange-50 hover:text-orange-600 text-slate-700 rounded-xl text-xs font-bold transition border border-dashed border-slate-300"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Catat Transaksi di Tanggal Ini</span>
                </button>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-slate-100">
              <button
                onClick={() => setSelectedDate(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
