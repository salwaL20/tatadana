'use client';

import React, { useState, useEffect } from 'react';
import { 
  Wallet as WalletIcon, 
  PlusCircle, 
  Check, 
  Star, 
  ArrowRightLeft, 
  CreditCard,
  Building2,
  Smartphone,
  Banknote,
  PiggyBank,
  CheckCircle2,
  X,
  AlertCircle
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils/currency';
import { Wallet, WalletType } from '@/types/database';

export default function WalletsPage() {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  // New Wallet Form State
  const [name, setName] = useState('');
  const [type, setType] = useState<WalletType>('bank');
  const [institution, setInstitution] = useState('BCA');
  const [accountNumber, setAccountNumber] = useState('');
  const [balance, setBalance] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [isDefault, setIsDefault] = useState(false);

  // Transfer Form State
  const [fromWalletId, setFromWalletId] = useState('');
  const [toWalletId, setToWalletId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferNotes, setTransferNotes] = useState('Transfer saldo antar dompet');
  const [transferError, setTransferError] = useState('');
  const [transferSuccess, setTransferSuccess] = useState('');

  const loadData = async () => {
    const activeUserId = typeof window !== 'undefined'
      ? localStorage.getItem('tatadana_current_user_id') || 'usr-salwa-001'
      : 'usr-salwa-001';

    const { dataService } = await import('@/lib/supabase/client');
    let wls = await dataService.getWallets(activeUserId);
    if (wls.length === 0) {
      wls = await dataService.getWallets('usr-budi-12345');
    }
    setWallets(wls);
    if (wls.length > 0 && !fromWalletId) {
      setFromWalletId(wls[0].id);
      if (wls.length > 1) setToWalletId(wls[1].id);
    }
  };

  useEffect(() => {
    loadData();
    const handleSwitch = () => loadData();
    const interval = setInterval(loadData, 2000);
    window.addEventListener('tatadana_user_switched', handleSwitch);
    return () => {
      clearInterval(interval);
      window.removeEventListener('tatadana_user_switched', handleSwitch);
    };
  }, []);

  const handleSetDefault = async (walletId: string) => {
    const { dataService } = await import('@/lib/supabase/client');
    await dataService.updateWallet(walletId, { is_default: true });
    loadData();
  };

  const handleCreateWallet = async (e: React.FormEvent) => {
    e.preventDefault();
    const initialBalance = parseFloat(balance.replace(/[^0-9]/g, '')) || 0;
    if (!name.trim()) return;

    const activeUserId = typeof window !== 'undefined'
      ? localStorage.getItem('tatadana_current_user_id') || 'usr-salwa-001'
      : 'usr-salwa-001';

    const { dataService } = await import('@/lib/supabase/client');
    await dataService.addWallet({
      user_id: activeUserId,
      name: name.trim(),
      type,
      balance: initialBalance,
      is_default: isDefault || wallets.length === 0,
      color,
      institution: institution || undefined,
      account_number: accountNumber || undefined,
    });

    setIsModalOpen(false);
    resetForm();
    loadData();
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError('');
    setTransferSuccess('');

    const amount = parseFloat(transferAmount.replace(/[^0-9]/g, ''));
    if (isNaN(amount) || amount <= 0) {
      setTransferError('Nominal transfer harus lebih besar dari Rp0');
      return;
    }
    if (fromWalletId === toWalletId) {
      setTransferError('Dompet asal dan tujuan tidak boleh sama');
      return;
    }

    const fromWallet = wallets.find(w => w.id === fromWalletId);
    if (!fromWallet || fromWallet.balance < amount) {
      setTransferError('Saldo dompet pengirim tidak mencukupi');
      return;
    }

    try {
      const { dataService } = await import('@/lib/supabase/client');
      await dataService.transferBetweenWallets(
        'usr-budi-12345',
        fromWalletId,
        toWalletId,
        amount,
        transferNotes
      );
      setTransferSuccess(`Berhasil transfer ${formatRupiah(amount)}!`);
      setTimeout(() => {
        setIsTransferModalOpen(false);
        setTransferSuccess('');
        setTransferAmount('');
      }, 1200);
      loadData();
    } catch (err: any) {
      setTransferError(err.message || 'Gagal memproses transfer');
    }
  };

  const resetForm = () => {
    setName('');
    setType('bank');
    setInstitution('BCA');
    setAccountNumber('');
    setBalance('');
    setColor('#3B82F6');
    setIsDefault(false);
  };

  const selectPreset = (preset: { 
    name: string; 
    type: WalletType; 
    color: string; 
    institution: string 
  }) => {
    setName(preset.name);
    setType(preset.type);
    setColor(preset.color);
    setInstitution(preset.institution);
  };

  const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);

  const getTypeIcon = (t: WalletType) => {
    switch (t) {
      case 'bank': return <Building2 className="w-4 h-4" />;
      case 'ewallet': return <Smartphone className="w-4 h-4" />;
      case 'cash': return <Banknote className="w-4 h-4" />;
      case 'deposit': return <PiggyBank className="w-4 h-4" />;
      case 'credit_card': return <CreditCard className="w-4 h-4" />;
      default: return <WalletIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">👛 Wallet & Dompet Digital</h1>
          <p className="text-sm text-slate-500">
            Kelola rekening bank, e-wallet, kas tunai, dan deposito. 1 dompet terhubung sebagai default Telegram.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={() => setIsTransferModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-sm"
          >
            <ArrowRightLeft className="w-4 h-4 text-orange-500" />
            <span>Transfer Antar Dompet</span>
          </button>

          <button
            onClick={() => {
              resetForm();
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            <span>+ Tambah Dompet Baru</span>
          </button>
        </div>
      </div>

      {/* Total Balance Card */}
      <div className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs uppercase font-bold text-orange-100 tracking-wider">Total Saldo di Semua Akun</span>
          <div className="text-3xl md:text-4xl font-black mt-1 tracking-tight">{formatRupiah(totalBalance)}</div>
          <p className="text-xs text-orange-100 mt-1">Tersebar di {wallets.length} dompet aktif (Bank, E-Wallet & Kas)</p>
        </div>
        <div className="text-xs font-semibold bg-white/20 backdrop-blur-md px-4 py-2.5 rounded-xl border border-white/25 flex items-center gap-2">
          <Star className="w-4 h-4 fill-amber-300 text-amber-300" />
          <span>Dompet bertanda <b>Default</b> otomatis didebit/dikredit saat mencatat via Telegram</span>
        </div>
      </div>

      {/* Wallets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {wallets.map((w) => (
          <div
            key={w.id}
            className={`bg-white border rounded-2xl p-5 shadow-sm transition space-y-4 hover:shadow-md ${
              w.is_default ? 'border-orange-500 ring-2 ring-orange-500/10' : 'border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  style={{ backgroundColor: w.color }}
                  className="w-11 h-11 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md"
                >
                  {getTypeIcon(w.type)}
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-900 flex items-center gap-1.5">
                    <span>{w.name}</span>
                    {w.is_default && (
                      <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full font-bold flex items-center gap-0.5">
                        <Star className="w-2.5 h-2.5 fill-orange-500 text-orange-500" /> Utama Bot
                      </span>
                    )}
                  </h3>
                  <div className="text-xs text-slate-400 capitalize flex items-center gap-1 mt-0.5">
                    <span>{w.institution || w.type}</span>
                    {w.account_number && <span>• {w.account_number}</span>}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div className="text-xs text-slate-400 font-medium">Saldo Tersedia</div>
              <div className="text-xl font-black text-slate-900 mt-0.5 tracking-tight">{formatRupiah(w.balance)}</div>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              {w.is_default ? (
                <span className="text-xs text-emerald-600 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Terhubung Telegram
                </span>
              ) : (
                <button
                  onClick={() => handleSetDefault(w.id)}
                  className="text-xs font-bold text-orange-600 hover:text-orange-700 hover:underline flex items-center gap-1"
                >
                  <Star className="w-3 h-3" /> Jadikan Dompet Utama Telegram
                </button>
              )}

              <button
                onClick={() => {
                  setFromWalletId(w.id);
                  const other = wallets.find(o => o.id !== w.id);
                  if (other) setToWalletId(other.id);
                  setIsTransferModalOpen(true);
                }}
                className="text-xs text-slate-400 hover:text-slate-700 font-semibold flex items-center gap-1"
              >
                <ArrowRightLeft className="w-3 h-3" /> Transfer
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal Tambah Wallet Baru */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Tambah Dompet Baru</h3>
                <p className="text-xs text-slate-500">Pilih tipe instansi atau atur dompet kustom kamu.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateWallet} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">Pilihan Cepat Preset:</label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {[
                    { label: '🏦 BCA', name: 'BCA Tahapan', type: 'bank' as const, color: '#3B82F6', institution: 'BCA' },
                    { label: '🏦 Mandiri', name: 'Mandiri Livin', type: 'bank' as const, color: '#1E40AF', institution: 'Mandiri' },
                    { label: '🏦 BRI', name: 'BRI BritAma', type: 'bank' as const, color: '#0369A1', institution: 'BRI' },
                    { label: '📱 GoPay', name: 'GoPay Pocket', type: 'ewallet' as const, color: '#10B981', institution: 'GoPay' },
                    { label: '📱 OVO', name: 'OVO Premier', type: 'ewallet' as const, color: '#7C3AED', institution: 'OVO' },
                    { label: '📱 ShopeePay', name: 'ShopeePay', type: 'ewallet' as const, color: '#EA580C', institution: 'ShopeePay' },
                    { label: '💵 Tunai Kas', name: 'Dompet Tunai', type: 'cash' as const, color: '#F59E0B', institution: 'Tunai' },
                    { label: '🐷 Deposito', name: 'Deposito Berjangka', type: 'deposit' as const, color: '#059669', institution: 'Bank' },
                    { label: '💳 Kartu Kredit', name: 'Kartu Kredit Utama', type: 'credit_card' as const, color: '#6366F1', institution: 'Visa/Master' },
                  ].map((preset) => (
                    <button
                      key={preset.name}
                      type="button"
                      onClick={() => selectPreset(preset)}
                      className="px-2.5 py-1 text-[11px] bg-slate-100 hover:bg-orange-50 hover:text-orange-600 rounded-lg border border-slate-200 transition font-semibold"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Dompet</label>
                <input
                  type="text"
                  placeholder="Contoh: BCA Prioritas, DANA Dompet"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Tipe Akun</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as WalletType)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                  >
                    <option value="bank">Rekening Bank</option>
                    <option value="ewallet">E-Wallet</option>
                    <option value="cash">Uang Tunai / Cash</option>
                    <option value="deposit">Deposito / Simpanan</option>
                    <option value="credit_card">Kartu Kredit</option>
                    <option value="other">Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nama Instansi</label>
                  <input
                    type="text"
                    placeholder="BCA, Mandiri, OVO"
                    value={institution}
                    onChange={(e) => setInstitution(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Saldo Awal (Rp)</label>
                  <input
                    type="number"
                    placeholder="0"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Warna Kartu</label>
                  <div className="flex items-center gap-2 mt-1">
                    {['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#7C3AED', '#EA580C', '#059669', '#6366F1'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        onClick={() => setColor(c)}
                        style={{ backgroundColor: c }}
                        className={`w-5 h-5 rounded-full transition-transform ${color === c ? 'scale-125 ring-2 ring-offset-2 ring-slate-400' : ''}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="isDefaultToggle"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded text-orange-500 focus:ring-orange-500 h-4 w-4"
                />
                <label htmlFor="isDefaultToggle" className="text-xs text-slate-700 font-semibold cursor-pointer">
                  Jadikan Dompet Utama untuk Transaksi Telegram Bot
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                  Simpan Dompet Baru
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Transfer Antar Dompet */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center text-orange-600">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Transfer Antar Dompet</h3>
                  <p className="text-[11px] text-slate-500">Pindah dana antar rekening & e-wallet.</p>
                </div>
              </div>
              <button 
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {transferError && (
              <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{transferError}</span>
              </div>
            )}

            {transferSuccess && (
              <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-700 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{transferSuccess}</span>
              </div>
            )}

            <form onSubmit={handleTransfer} className="space-y-3.5 pt-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Dari Dompet (Sumber)</label>
                <select
                  value={fromWalletId}
                  onChange={(e) => setFromWalletId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatRupiah(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Ke Dompet (Tujuan)</label>
                <select
                  value={toWalletId}
                  onChange={(e) => setToWalletId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  {wallets.map(w => (
                    <option key={w.id} value={w.id}>
                      {w.name} ({formatRupiah(w.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nominal Transfer (Rp)</label>
                <input
                  type="number"
                  placeholder="Contoh: 500000"
                  value={transferAmount}
                  onChange={(e) => setTransferAmount(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-orange-500 font-bold text-slate-900"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Catatan</label>
                <input
                  type="text"
                  placeholder="Keterangan transfer"
                  value={transferNotes}
                  onChange={(e) => setTransferNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow-sm"
                >
                  Proses Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
