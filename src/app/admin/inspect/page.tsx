'use client';

import React, { useState } from 'react';
import { Search, ShieldAlert, History, Lock, FileText, CheckCircle2 } from 'lucide-react';
import { mockStore } from '@/lib/supabase/mockStore';
import { formatRupiah } from '@/lib/utils/currency';
import { formatDateOnlyWIB } from '@/lib/utils/timezone';
import { Transaction, Profile, AuditLogRecord } from '@/types/database';

export default function AdminInspectPage() {
  const [selectedUserId, setSelectedUserId] = useState<string>('usr-budi-12345');
  const [hasLoggedAudit, setHasLoggedAudit] = useState(false);
  const [auditLogs, setAuditLogs] = useState<AuditLogRecord[]>(mockStore.auditLogs);

  const selectedUser = mockStore.profiles.find(p => p.id === selectedUserId) || mockStore.profiles[0];
  const userTransactions = mockStore.transactions.filter(t => t.user_id === selectedUserId);

  const handleInspectUser = (userId: string) => {
    setSelectedUserId(userId);
    // Mandatory Audit Log insertion for privacy compliance
    const newLog: AuditLogRecord = {
      id: `aud-${Date.now()}`,
      admin_id: 'usr-admin-super',
      target_user_id: userId,
      action: 'inspect_transactions',
      metadata: { target_name: selectedUser.full_name, timestamp: new Date().toISOString() },
      ip_address: '127.0.0.1 (Internal Admin)',
      created_at: new Date().toISOString(),
    };
    mockStore.auditLogs.unshift(newLog);
    setAuditLogs([...mockStore.auditLogs]);
    setHasLoggedAudit(true);
  };

  return (
    <div className="space-y-6 pb-12">
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight">Inspeksi Transaksi Pengguna & Audit Log</h1>
        <p className="text-xs text-slate-400 mt-1">
          Akses transaksi pengguna terbatas hanya untuk keperluan troubleshooting teknis dengan perekaman audit log ketat.
        </p>
      </div>

      {/* Security Privacy Alert */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 flex items-start gap-3 text-xs text-amber-200">
        <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
        <div>
          <b className="text-amber-300">Pemberitahuan Kepatuhan Privasi:</b> Setiap klik inspeksi transaksi dicatat secara permanen di tabel audit log sistem TataDana demi menjaga kerahasiaan data finansial nasabah.
        </div>
      </div>

      {/* Select User to Inspect */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <label className="block text-xs font-bold text-slate-300">Pilih Pengguna yang Diinspeksi:</label>
        <div className="flex flex-wrap gap-2">
          {mockStore.profiles.map(u => (
            <button
              key={u.id}
              onClick={() => handleInspectUser(u.id)}
              className={`px-3.5 py-2 rounded-xl text-xs font-bold border transition ${
                selectedUserId === u.id
                  ? 'bg-orange-600 text-white border-orange-500'
                  : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {u.full_name} ({u.phone_number || 'No Phone'})
            </button>
          ))}
        </div>
      </div>

      {/* Inspected Transactions Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl shadow-xl overflow-hidden space-y-4 p-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <FileText className="w-4 h-4 text-orange-400" />
            Transaksi Milik: <span className="text-orange-400">{selectedUser.full_name}</span> ({userTransactions.length} transaksi)
          </h2>
          <span className="text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            Audit Recorded ✓
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 font-bold uppercase">
              <tr>
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Deskripsi</th>
                <th className="py-2.5 px-3">Jenis</th>
                <th className="py-2.5 px-3">Sumber</th>
                <th className="py-2.5 px-3 text-right">Nominal</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {userTransactions.map(t => (
                <tr key={t.id} className="hover:bg-slate-900/40">
                  <td className="py-2.5 px-3 text-slate-400">{formatDateOnlyWIB(t.transaction_time)}</td>
                  <td className="py-2.5 px-3 text-white font-medium">{t.description}</td>
                  <td className="py-2.5 px-3 capitalize text-slate-300">{t.type}</td>
                  <td className="py-2.5 px-3 text-slate-400 font-mono text-[10px]">{t.source}</td>
                  <td className="py-2.5 px-3 text-right font-bold text-orange-400">{formatRupiah(t.amount)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-3">
        <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
          <History className="w-4 h-4 text-orange-400" /> Riwayat Audit Akses Superadmin
        </h3>
        <div className="divide-y divide-slate-800/60 text-xs">
          {auditLogs.slice(0, 5).map(a => (
            <div key={a.id} className="py-2 flex items-center justify-between text-slate-400">
              <span>Admin diakses tindakan <b>{a.action}</b> pada user <code>{a.target_user_id}</code></span>
              <span className="font-mono text-[10px]">{formatDateOnlyWIB(a.created_at)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
