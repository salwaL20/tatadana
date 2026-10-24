'use client';

import React, { useState, useEffect } from 'react';
import { 
  CreditCard, 
  Check, 
  X, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  RefreshCw, 
  Eye, 
  ExternalLink,
  ShieldCheck,
  Search,
  Filter,
  Pencil
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils/currency';
import { formatDateOnlyWIB, formatShortTimeWIB } from '@/lib/utils/timezone';
import { mockStore } from '@/lib/supabase/mockStore';
import { SubscriptionRecord, Profile } from '@/types/database';

interface PaymentItem extends SubscriptionRecord {
  user_name: string;
  user_phone?: string | null;
  current_user_plan?: string;
}

export default function AdminPaymentsPage() {
  const [payments, setPayments] = useState<PaymentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch] = useState('');
  
  // Custom naming
  const [adminPanelName, setAdminPanelName] = useState('Panel Approval Salwa L');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [tempRenameName, setTempRenameName] = useState('Panel Approval Salwa L');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tatadana_admin_panel_name');
      if (saved) {
        setAdminPanelName(saved);
        setTempRenameName(saved);
      }
      const handleStorage = (e: StorageEvent) => {
        if (e.key === 'tatadana_admin_panel_name' && e.newValue) {
          setAdminPanelName(e.newValue);
          setTempRenameName(e.newValue);
        }
      };
      const handleCustom = () => {
        const updated = localStorage.getItem('tatadana_admin_panel_name');
        if (updated) {
          setAdminPanelName(updated);
          setTempRenameName(updated);
        }
      };
      window.addEventListener('storage', handleStorage);
      window.addEventListener('panelNameChanged', handleCustom);
      return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener('panelNameChanged', handleCustom);
      };
    }
  }, []);

  // Modals
  const [previewProofUrl, setPreviewProofUrl] = useState<string | null>(null);
  const [midtransStatusData, setMidtransStatusData] = useState<any | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('Bukti transfer tidak terbaca / nominal tidak sesuai');

  const loadPayments = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/payments');
      if (res.ok) {
        const data = await res.json();
        setPayments(data.subscriptions);
      } else {
        fallbackLocalData();
      }
    } catch {
      fallbackLocalData();
    } finally {
      setLoading(false);
    }
  };

  const fallbackLocalData = () => {
    const list: PaymentItem[] = mockStore.subscriptions.map(s => {
      const u = mockStore.profiles.find(p => p.id === s.user_id);
      return {
        ...s,
        user_name: u?.full_name || 'Pengguna TataDana',
        user_phone: u?.phone_number,
        current_user_plan: u?.subscription_tier,
      };
    });
    setPayments(list);
  };

  useEffect(() => {
    loadPayments();
  }, []);

  const handleApprove = async (id: string) => {
    try {
      await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', id }),
      });
      await loadPayments();
    } catch (err: any) {
      alert(`Error approving: ${err.message}`);
    }
  };

  const handleConfirmReject = async () => {
    if (!rejectingId) return;
    try {
      await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'reject', 
          id: rejectingId,
          rejectionReason,
        }),
      });
      setRejectingId(null);
      await loadPayments();
    } catch (err: any) {
      alert(`Error rejecting: ${err.message}`);
    }
  };

  const handleCheckMidtransStatus = async (item: PaymentItem) => {
    try {
      const res = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'sync_midtrans', 
          id: item.id 
        }),
      });
      const data = await res.json();
      setMidtransStatusData(data);
    } catch (err: any) {
      alert(`Error syncing with Midtrans: ${err.message}`);
    }
  };

  // Filter items
  const filteredPayments = payments.filter(p => {
    if (statusFilter !== 'all' && p.status !== statusFilter) return false;
    if (search) {
      const term = search.toLowerCase();
      const matchName = p.user_name.toLowerCase().includes(term);
      const matchOrder = p.midtrans_order_id?.toLowerCase().includes(term);
      const matchMethod = p.payment_method.toLowerCase().includes(term);
      return matchName || matchOrder || matchMethod;
    }
    return true;
  });

  const totalCount = payments.length;
  const pendingCount = payments.filter(p => p.status === 'pending_approval').length;
  const activeCount = payments.filter(p => p.status === 'active').length;
  const rejectedCount = payments.filter(p => p.status === 'rejected').length;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl font-bold text-white tracking-tight">{adminPanelName}</h1>
            <button
              onClick={() => {
                setTempRenameName(adminPanelName);
                setShowRenameModal(true);
              }}
              title="Ganti nama panel sendiri"
              className="px-2.5 py-1 rounded-lg bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/30 text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer"
            >
              <Pencil className="w-3 h-3" />
              <span>Ganti Nama Sendiri</span>
            </button>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Pelacakan status order Midtrans, verifikasi bukti transfer manual, dan persetujuan upgrade akun ke PRO.
          </p>
        </div>

        <button
          onClick={loadPayments}
          disabled={loading}
          className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded-xl transition border border-slate-700 flex items-center gap-1.5 self-start sm:self-auto"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          <span>Segarkan Data</span>
        </button>
      </div>

      {/* 4 Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase">
            <span>Total Transaksi</span>
            <CreditCard className="w-4 h-4 text-orange-400" />
          </div>
          <div className="text-2xl font-bold text-white mt-2">{totalCount} Pesanan</div>
          <div className="text-[11px] text-slate-400 mt-1">Midtrans & Manual Transfer</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase">
            <span>Menunggu Approval</span>
            <Clock className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-400 mt-2">{pendingCount} Pesanan</div>
          <div className="text-[11px] text-amber-400/80 mt-1">Perlu tindakan superadmin</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase">
            <span>Disetujui / Aktif</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 mt-2">{activeCount} Sukses</div>
          <div className="text-[11px] text-emerald-400/80 mt-1">Paket Pro Aktif</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-lg">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase">
            <span>Ditolak</span>
            <AlertCircle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-2">{rejectedCount} Ditolak</div>
          <div className="text-[11px] text-rose-400/80 mt-1">Transfer tidak valid</div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Cari nama pengguna, order ID, atau metode..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>

        <div className="flex gap-1.5 p-1 bg-slate-950 border border-slate-800 rounded-xl">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === 'all' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Semua
          </button>
          <button
            onClick={() => setStatusFilter('pending_approval')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === 'pending_approval' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Menunggu ({pendingCount})
          </button>
          <button
            onClick={() => setStatusFilter('active')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === 'active' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Aktif ({activeCount})
          </button>
          <button
            onClick={() => setStatusFilter('rejected')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              statusFilter === 'rejected' ? 'bg-orange-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Ditolak ({rejectedCount})
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase tracking-wider">
              <tr>
                <th className="py-3 px-4">Pengguna</th>
                <th className="py-3 px-4">Order ID & Gateway</th>
                <th className="py-3 px-4">Nominal</th>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Bukti</th>
                <th className="py-3 px-4">Status Pesanan</th>
                <th className="py-3 px-4 text-right">Aksi Superadmin</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500">
                    Tidak ada transaksi pembayaran yang cocok.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-900/50 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-white">{p.user_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">ID: {p.user_id}</div>
                      {p.user_phone && (
                        <div className="text-[10px] text-slate-500">{p.user_phone}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="font-mono text-[11px] font-bold text-orange-400">
                        {p.midtrans_order_id || p.id}
                      </div>
                      <div className="text-[10px] text-slate-400 uppercase mt-0.5">
                        Metode: {p.payment_method}
                      </div>
                      {p.midtrans_transaction_id && (
                        <div className="text-[10px] text-slate-500 font-mono">
                          TRX: {p.midtrans_transaction_id}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 font-bold text-white">
                      <div>{formatRupiah(p.amount)}</div>
                      <div className="text-[10px] text-orange-400 uppercase font-mono font-normal">
                        Paket {p.plan}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-slate-400 whitespace-nowrap">
                      <div>{formatDateOnlyWIB(p.created_at)}</div>
                      <div className="text-[10px] text-slate-500">{formatShortTimeWIB(p.created_at)}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      {p.proof_image_url ? (
                        <button
                          onClick={() => setPreviewProofUrl(p.proof_image_url || null)}
                          className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-lg border border-slate-700 text-[11px] font-semibold flex items-center gap-1 transition"
                        >
                          <Eye className="w-3 h-3 text-orange-400" />
                          <span>Lihat Struk</span>
                        </button>
                      ) : (
                        <span className="text-slate-600 text-[11px]">-</span>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {p.status === 'active' ? (
                        <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20 inline-flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> Disetujui (Aktif)
                        </span>
                      ) : p.status === 'rejected' ? (
                        <div>
                          <span className="text-[10px] font-bold text-rose-400 bg-rose-500/10 px-2.5 py-1 rounded-lg border border-rose-500/20 inline-flex items-center gap-1">
                            <X className="w-3 h-3" /> Ditolak
                          </span>
                          {p.rejection_reason && (
                            <div className="text-[10px] text-rose-400/70 mt-1 max-w-[150px] truncate" title={p.rejection_reason}>
                              {p.rejection_reason}
                            </div>
                          )}
                        </div>
                      ) : (
                        <span className="text-[10px] font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-lg border border-amber-500/20 inline-flex items-center gap-1">
                          <Clock className="w-3 h-3" /> Menunggu Approval
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {p.midtrans_order_id && (
                          <button
                            onClick={() => handleCheckMidtransStatus(p)}
                            className="px-2.5 py-1 bg-blue-950/40 hover:bg-blue-900 text-blue-300 border border-blue-800 rounded-lg text-xs font-semibold transition"
                            title="Cek callback status di Midtrans"
                          >
                            Cek Midtrans
                          </button>
                        )}

                        {p.status === 'pending_approval' && (
                          <>
                            <button
                              onClick={() => setRejectingId(p.id)}
                              className="px-2.5 py-1 bg-rose-950/60 hover:bg-rose-900 text-rose-300 border border-rose-800 rounded-lg text-xs font-semibold transition"
                            >
                              Tolak
                            </button>
                            <button
                              onClick={() => handleApprove(p.id)}
                              className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow"
                            >
                              Approve Pro
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Proof Preview Modal */}
      {previewProofUrl && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-white">Bukti Transfer Nasabah</h3>
              <button
                onClick={() => setPreviewProofUrl(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-xl overflow-hidden border border-slate-800 max-h-96 flex items-center justify-center bg-slate-900">
              <img
                src={previewProofUrl}
                alt="Bukti Transfer"
                className="object-contain max-h-96 w-full"
              />
            </div>
            <button
              onClick={() => setPreviewProofUrl(null)}
              className="w-full py-2 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl"
            >
              Tutup
            </button>
          </div>
        </div>
      )}

      {/* Rejection Dialog Modal */}
      {rejectingId && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <h3 className="font-bold text-sm text-white">Konfirmasi Penolakan Pembayaran</h3>
            <p className="text-xs text-slate-400">
              Masukkan alasan penolakan. Status pesanan akan diubah menjadi ditolak dan user tetap berada pada paket Starter.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Alasan Penolakan:</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                className="w-full p-3 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setRejectingId(null)}
                className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 font-bold text-xs rounded-xl border border-slate-800"
              >
                Batal
              </button>
              <button
                onClick={handleConfirmReject}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-xl"
              >
                Tolak Pesanan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Midtrans Sync Status Modal */}
      {midtransStatusData && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="font-bold text-sm text-white flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-400" /> Hasil Gateway Midtrans API
              </h3>
              <button
                onClick={() => setMidtransStatusData(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Order ID:</span>
                <span className="font-mono font-bold text-white">{midtransStatusData.orderId}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Transaction Status:</span>
                <span className="font-bold text-emerald-400 uppercase">{midtransStatusData.transactionStatus}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Fraud Status:</span>
                <span className="font-bold text-white">{midtransStatusData.fraudStatus}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Payment Type:</span>
                <span className="font-mono text-white uppercase">{midtransStatusData.paymentType}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-800/60">
                <span className="text-slate-400">Settlement Time:</span>
                <span className="font-mono text-slate-300">{formatDateOnlyWIB(midtransStatusData.settlementTime)}</span>
              </div>
            </div>

            <button
              onClick={() => {
                setMidtransStatusData(null);
                loadPayments();
              }}
              className="w-full py-2 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow"
            >
              Tutup & Terapkan Status
            </button>
          </div>
        </div>
      )}

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-800 text-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-600/20 text-orange-400 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-white text-base">Ganti Nama Approval Panel Sendiri</h3>
              </div>
              <button 
                onClick={() => setShowRenameModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="text-xs font-semibold text-slate-300 block">
                Nama Tampilan Menu / Panel Anda:
              </label>
              <input
                type="text"
                value={tempRenameName}
                onChange={(e) => setTempRenameName(e.target.value)}
                placeholder="Contoh: Panel Approval Salwa L"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-medium text-white"
                autoFocus
              />
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Tulis nama panel yang Anda inginkan (misal: <b>Panel Approval Salwa L</b>, <b>Persetujuan Salwa</b>, atau nama Anda sendiri).
              </p>
              
              <div className="pt-2 flex flex-wrap gap-1.5">
                <span className="text-[10px] text-slate-400 font-medium w-full">Saran Cepat:</span>
                <button
                  type="button"
                  onClick={() => setTempRenameName('Panel Approval Salwa L')}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/30"
                >
                  Panel Approval Salwa L
                </button>
                <button
                  type="button"
                  onClick={() => setTempRenameName('Persetujuan Pembayaran')}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  Persetujuan Pembayaran
                </button>
                <button
                  type="button"
                  onClick={() => setTempRenameName('Admin Approval Panel')}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700"
                >
                  Admin Approval Panel
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => {
                  setTempRenameName('Panel Approval Salwa L');
                }}
                className="text-xs text-orange-400 hover:text-orange-300 font-semibold"
              >
                Reset ke Salwa L
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowRenameModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nameToSave = tempRenameName.trim() || 'Panel Approval Salwa L';
                    setAdminPanelName(nameToSave);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('tatadana_admin_panel_name', nameToSave);
                      window.dispatchEvent(new Event('panelNameChanged'));
                    }
                    setShowRenameModal(false);
                  }}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Simpan Nama
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
