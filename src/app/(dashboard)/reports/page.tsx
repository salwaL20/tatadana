'use client';

import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  FileSpreadsheet, 
  Download, 
  Filter, 
  Calendar, 
  ArrowUpDown, 
  Receipt, 
  Sparkles, 
  Search,
  ChevronDown,
  ChevronUp,
  History,
  AlertCircle
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils/currency';
import { formatDateOnlyWIB, formatShortTimeWIB } from '@/lib/utils/timezone';
import { Transaction, Wallet, Category, ExportHistoryRecord, Profile } from '@/types/database';

export default function ReportsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [exportHistories, setExportHistories] = useState<ExportHistoryRecord[]>([]);
  const [user, setUser] = useState<Profile | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [selectedWallet, setSelectedWallet] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-31');

  // Sorting & Pagination
  const [sortField, setSortField] = useState<'transaction_time' | 'amount' | 'description'>('transaction_time');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Expanding receipt accordion
  const [expandedReceiptId, setExpandedReceiptId] = useState<string | null>(null);
  const [exporting, setExporting] = useState<string | null>(null);
  const [upgradeModal, setUpgradeModal] = useState(false);

  const loadData = async () => {
    const { dataService } = await import('@/lib/supabase/client');
    const { mockStore } = await import('@/lib/supabase/mockStore');
    const currentId = typeof window !== 'undefined'
      ? localStorage.getItem('tatadana_current_user_id') || 'usr-salwa-001'
      : 'usr-salwa-001';

    let [txs, wls, cats, prof] = await Promise.all([
      dataService.getTransactions(currentId),
      dataService.getWallets(currentId),
      dataService.getCategories(currentId),
      dataService.getProfile(currentId),
    ]);

    if (txs.length === 0) txs = await dataService.getTransactions('usr-budi-12345');
    if (wls.length === 0) wls = await dataService.getWallets('usr-budi-12345');
    if (cats.length === 0) cats = await dataService.getCategories('usr-budi-12345');
    if (!prof) prof = await dataService.getProfile('usr-budi-12345');

    setTransactions(txs);
    setWallets(wls);
    setCategories(cats);
    setUser(prof);
    setExportHistories([...mockStore.exportHistories]);
  };

  useEffect(() => {
    loadData();
    const handleSync = () => loadData();
    if (typeof window !== 'undefined') {
      window.addEventListener('tatadana_user_switched', handleSync);
      window.addEventListener('tatadana_transaction_added', handleSync);
      window.addEventListener('storage', handleSync);
      return () => {
        window.removeEventListener('tatadana_user_switched', handleSync);
        window.removeEventListener('tatadana_transaction_added', handleSync);
        window.removeEventListener('storage', handleSync);
      };
    }
  }, []);

  // Filtered list
  const filtered = transactions.filter(t => {
    const matchesSearch = t.description.toLowerCase().includes(search.toLowerCase());
    const matchesWallet = selectedWallet === 'all' || t.wallet_id === selectedWallet;
    const matchesCat = selectedCategory === 'all' || t.category_id === selectedCategory;
    const matchesType = selectedType === 'all' || t.type === selectedType;
    return matchesSearch && matchesWallet && matchesCat && matchesType;
  });

  // Sorted list
  const sorted = [...filtered].sort((a, b) => {
    let cmp = 0;
    if (sortField === 'transaction_time') {
      cmp = new Date(a.transaction_time).getTime() - new Date(b.transaction_time).getTime();
    } else if (sortField === 'amount') {
      cmp = a.amount - b.amount;
    } else {
      cmp = a.description.localeCompare(b.description);
    }
    return sortOrder === 'desc' ? -cmp : cmp;
  });

  const totalPages = Math.ceil(sorted.length / pageSize) || 1;
  const paginatedTransactions = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  // Summary Computations
  const totalIncome = filtered.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = filtered.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const netCashflow = totalIncome - totalExpense;

  // Top 5 categories
  const catMap = new Map<string, number>();
  filtered.filter(t => t.type === 'expense').forEach(t => {
    const name = t.category?.name || 'Lainnya';
    catMap.set(name, (catMap.get(name) || 0) + t.amount);
  });
  const top5Categories = Array.from(catMap.entries())
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  const toggleSort = (field: 'transaction_time' | 'amount' | 'description') => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const handleExportPdf = async () => {
    if (user?.subscription_tier === 'starter') {
      setUpgradeModal(true);
      return;
    }

    setExporting('pdf');
    try {
      const res = await fetch('/api/reports/export-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodStart: startDate,
          periodEnd: endDate,
          userId: user?.id,
        })
      });
      const data = await res.json();
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
        loadData();
      }
    } catch (e) {
      alert('Gagal export PDF');
    } finally {
      setExporting(null);
    }
  };

  const handleExportExcel = async () => {
    if (user?.subscription_tier === 'starter') {
      setUpgradeModal(true);
      return;
    }

    setExporting('excel');
    try {
      const res = await fetch('/api/reports/export-excel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          periodStart: startDate,
          periodEnd: endDate,
          userId: user?.id,
        })
      });
      const data = await res.json();
      if (data.downloadUrl) {
        window.open(data.downloadUrl, '_blank');
        loadData();
      }
    } catch (e) {
      alert('Gagal export Excel');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Export Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Laporan Keuangan</h1>
          <p className="text-sm text-slate-500">Analisa mendalam arus kas, filter multi-kolom, dan ekspor instan.</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportPdf}
            disabled={exporting !== null}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <FileText className="w-4 h-4 text-rose-600" />
            <span>{exporting === 'pdf' ? 'Membuat PDF...' : 'Export PDF'}</span>
          </button>

          <button
            onClick={handleExportExcel}
            disabled={exporting !== null}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <span>{exporting === 'excel' ? 'Membuat Excel...' : 'Export Excel (.xlsx)'}</span>
          </button>
        </div>
      </div>

      {/* Summary Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase">Total Pemasukan</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">{formatRupiah(totalIncome)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Sesuai filter periode aktif</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase">Total Pengeluaran</div>
          <div className="text-2xl font-bold text-orange-600 mt-1">{formatRupiah(totalExpense)}</div>
          <div className="text-[11px] text-slate-400 mt-1">Sesuai filter periode aktif</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase">Net Cashflow</div>
          <div className={`text-2xl font-bold mt-1 ${netCashflow >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            {formatRupiah(netCashflow)}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Selisih pemasukan vs pengeluaran</div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between border-b border-slate-100 pb-2">
          <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-orange-500" /> Filter & Pencarian Lanjutan
          </span>
          <button
            onClick={() => {
              setSearch('');
              setSelectedWallet('all');
              setSelectedCategory('all');
              setSelectedType('all');
            }}
            className="text-[11px] font-semibold text-orange-600 hover:underline"
          >
            Reset Filter
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Cari catatan..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <select
              value={selectedWallet}
              onChange={(e) => setSelectedWallet(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500"
            >
              <option value="all">Semua Dompet</option>
              {wallets.map(w => (
                <option key={w.id} value={w.id}>{w.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500"
            >
              <option value="all">Semua Kategori</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500"
            >
              <option value="all">Semua Jenis</option>
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
              <option value="transfer">Transfer</option>
            </select>
          </div>

          <div className="flex items-center gap-1">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-1/2 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px]"
            />
            <span className="text-slate-400 text-xs">-</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-1/2 px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-[11px]"
            />
          </div>
        </div>
      </div>

      {/* Main Sortable Table */}
      <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider">
              <tr>
                <th 
                  onClick={() => toggleSort('transaction_time')}
                  className="py-3 px-4 cursor-pointer hover:text-orange-600 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Tanggal</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th 
                  onClick={() => toggleSort('description')}
                  className="py-3 px-4 cursor-pointer hover:text-orange-600 select-none"
                >
                  <div className="flex items-center gap-1">
                    <span>Deskripsi / Struk</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4">Kategori</th>
                <th className="py-3 px-4">Dompet</th>
                <th 
                  onClick={() => toggleSort('amount')}
                  className="py-3 px-4 cursor-pointer hover:text-orange-600 select-none text-right"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Nominal</span>
                    <ArrowUpDown className="w-3 h-3 text-slate-400" />
                  </div>
                </th>
                <th className="py-3 px-4 text-center">Export Struk</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {paginatedTransactions.map((t) => {
                const isExpense = t.type === 'expense';
                const isTransfer = t.type === 'transfer';
                const isExpanded = expandedReceiptId === t.id;

                return (
                  <React.Fragment key={t.id}>
                    <tr className="hover:bg-slate-50/70 transition">
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        <div>{formatDateOnlyWIB(t.transaction_time)}</div>
                        <div className="text-[10px] text-slate-400">{formatShortTimeWIB(t.transaction_time)}</div>
                      </td>
                      <td className="py-3 px-4 font-medium text-slate-900">
                        <div className="flex items-center gap-2">
                          <span>{t.description}</span>
                          {t.receipt_data && (
                            <button
                              onClick={() => setExpandedReceiptId(isExpanded ? null : t.id)}
                              className="text-[10px] bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold px-2 py-0.5 rounded border border-purple-200 flex items-center gap-0.5"
                            >
                              <Receipt className="w-3 h-3" />
                              <span>{t.receipt_data.items?.length || 0} item</span>
                              {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                            </button>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-slate-600">
                        {t.category ? (
                          <span>{t.category.emoji} {t.category.name}</span>
                        ) : isTransfer ? (
                          <span className="text-blue-600 font-semibold">🔄 Transfer</span>
                        ) : (
                          'Umum'
                        )}
                      </td>
                      <td className="py-3 px-4 text-slate-600 whitespace-nowrap">
                        👛 {t.wallet?.name}
                      </td>
                      <td className={`py-3 px-4 text-right font-bold whitespace-nowrap ${
                        isExpense ? 'text-orange-600' : isTransfer ? 'text-blue-600' : 'text-emerald-600'
                      }`}>
                        {isExpense ? '-' : isTransfer ? '⇄ ' : '+'}{formatRupiah(t.amount)}
                      </td>
                      <td className="py-3 px-4 text-center whitespace-nowrap">
                        <div className="flex items-center justify-center gap-1.5">
                          <a
                            href={`/api/transactions/${t.id}/export?format=pdf`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-[10px] font-bold transition shadow-2xs hover:scale-105"
                            title="Unduh Struk PDF Transaksi"
                          >
                            <FileText className="w-3 h-3 text-rose-600" />
                            <span>PDF</span>
                          </a>
                          <a
                            href={`/api/transactions/${t.id}/export?format=excel`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg text-[10px] font-bold transition shadow-2xs hover:scale-105"
                            title="Unduh Excel (.xlsx) Transaksi"
                          >
                            <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                            <span>Excel</span>
                          </a>
                        </div>
                      </td>
                    </tr>

                    {/* Expandable Receipt Items Accordion */}
                    {t.receipt_data && isExpanded && (
                      <tr className="bg-purple-50/40">
                        <td colSpan={6} className="py-2.5 px-6">
                          <div className="text-xs font-bold text-purple-900 mb-1">
                            🧾 Rincian Item ({t.receipt_data.merchant || 'Merchant'}):
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
                            {t.receipt_data.items?.map((item, idx) => (
                              <div key={idx} className="flex justify-between bg-white p-2 rounded-lg border border-purple-100">
                                <span>• {item.name} ({item.qty}x)</span>
                                <span className="font-semibold text-slate-900">{formatRupiah(item.price * item.qty)}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination controls */}
        <div className="p-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          <span>Menampilkan {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, sorted.length)} dari {sorted.length} transaksi</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition"
            >
              Sebelumnya
            </button>
            <span className="font-bold text-slate-800 px-1">{currentPage} / {totalPages}</span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 transition"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      </div>

      {/* Riwayat Export Tersimpan */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-4">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <History className="w-4 h-4 text-orange-500" /> Riwayat Export Tersimpan
        </h3>

        {exportHistories.length === 0 ? (
          <p className="text-xs text-slate-400">Belum ada file export yang dibuat sebelumnya.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {exportHistories.map(h => (
              <div key={h.id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2.5">
                  {h.file_type === 'pdf' ? (
                    <FileText className="w-4 h-4 text-rose-500" />
                  ) : (
                    <FileSpreadsheet className="w-4 h-4 text-emerald-500" />
                  )}
                  <div>
                    <div className="font-bold text-slate-800">{h.file_name}</div>
                    <div className="text-[10px] text-slate-400">{formatDateOnlyWIB(h.created_at)} • {h.file_size_kb} KB</div>
                  </div>
                </div>

                <a
                  href={h.download_url || '#'}
                  target="_blank"
                  className="flex items-center gap-1 px-3 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg transition"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </a>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pro Upgrade Required Modal */}
      {upgradeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">Upgrade ke TataDana Pro</h3>
            <p className="text-xs text-slate-600">
              Fitur Export Laporan Lengkap ke PDF dan Excel (.xlsx) tanpa batas eksklusif untuk member Pro.
            </p>
            <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 text-xs text-orange-900 font-semibold">
              Hanya Rp 99.000 (Sekali Bayar Seumur Hidup)
            </div>
            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                onClick={() => setUpgradeModal(false)}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Tutup
              </button>
              <a
                href="/settings?tab=subscription"
                className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition"
              >
                Upgrade Sekarang
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
