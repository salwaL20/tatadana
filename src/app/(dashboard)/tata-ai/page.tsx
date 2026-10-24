'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Bot, 
  Send, 
  Sparkles, 
  TrendingUp, 
  PiggyBank, 
  ShieldCheck, 
  HelpCircle,
  RefreshCw,
  Zap,
  ArrowRight,
  Calendar,
  Wallet as WalletIcon,
  PlusCircle,
  CheckCircle2,
  DollarSign,
  FileText,
  CreditCard,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ChatMessage, Wallet, Profile } from '@/types/database';
import { formatRupiah } from '@/lib/utils/currency';

export default function TataAiPage() {
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string>('usr-salwa-001');

  // Wallets live state
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [bcaWallet, setBcaWallet] = useState<Wallet | null>(null);
  const [gopayWallet, setGopayWallet] = useState<Wallet | null>(null);
  const [tunaiWallet, setTunaiWallet] = useState<Wallet | null>(null);

  // Transaction form state (Fitur Catat Transaksi di Tata AI Bot)
  const [showRecorder, setShowRecorder] = useState(true);
  const [txType, setTxType] = useState<'expense' | 'income'>('expense');
  const [txDate, setTxDate] = useState<string>(() => {
    const now = new Date();
    return now.toISOString().slice(0, 10);
  });
  const [walletChoice, setWalletChoice] = useState<'bca' | 'gopay' | 'tunai'>('bca');
  const [txAmount, setTxAmount] = useState<string>('50000');
  const [txDesc, setTxDesc] = useState<string>('Makan siang & kopi');
  const [isRecording, setIsRecording] = useState(false);
  const [recordSuccess, setRecordSuccess] = useState<string | null>(null);

  // Chat messages
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadUserDataAndWallets = async () => {
    const { dataService } = await import('@/lib/supabase/client');
    const activeUserId = typeof window !== 'undefined'
      ? localStorage.getItem('tatadana_current_user_id') || 'usr-salwa-001'
      : 'usr-salwa-001';
    setCurrentUserId(activeUserId);

    let [prof, wls] = await Promise.all([
      dataService.getProfile(activeUserId),
      dataService.getWallets(activeUserId),
    ]);

    if (!prof) prof = await dataService.getProfile('usr-budi-12345');
    if (wls.length === 0) wls = await dataService.getWallets('usr-budi-12345');

    setCurrentUser(prof);
    setWallets(wls);

    // Map BCA, GoPay, and Dompet Tunai
    const bca = wls.find(w => w.name.toLowerCase().includes('bca') || w.type === 'bank') || null;
    const gopay = wls.find(w => w.name.toLowerCase().includes('gopay') || w.type === 'ewallet') || null;
    const tunai = wls.find(w => w.name.toLowerCase().includes('tunai') || w.name.toLowerCase().includes('cash') || w.type === 'cash') || null;

    setBcaWallet(bca);
    setGopayWallet(gopay);
    setTunaiWallet(tunai);

    // Initial welcome message if empty
    if (messages.length === 0) {
      const name = prof?.full_name || 'Salwa L';
      setMessages([
        {
          id: 'msg-welcome',
          role: 'assistant',
          content: `👋 Halo **${name}**! Saya **Tata AI**, asisten penasihat keuangan dan robot pencatat transaksi pintarmu di TataDana.

Kini kamu bisa mencatat mutasi langsung di sini:
📅 **Pilih Tanggal Transaksi:** Pengeluaran/pemasukan hari ini atau tanggal lampau
👛 **Pilih Dompet:** BCA, GoPay, atau Dompet Tunai
⚡ **Tersambung Otomatis:** Setiap transaksi langsung memperbarui saldo dompet, muncul di **/transactions**, dan terhitung di **/reports**!

Ketik transaksimu (misal: *"beli kopi 25rb gopay"*) atau gunakan formulir di atas!`,
          timestamp: new Date().toISOString(),
          suggestedActions: [
            'Beli makan 35rb gopay',
            'Catat bensin 50rb dompet tunai',
            'Berapa sisa uang makan minggu ini?',
            'Analisa pengeluaran terbesarku bulan ini',
          ],
        },
      ]);
    }
  };

  useEffect(() => {
    loadUserDataAndWallets();

    const handleSync = () => loadUserDataAndWallets();
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

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  // Handle Interactive Record Transaction
  const handleRecordTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    const nominal = parseFloat(txAmount.replace(/[^0-9]/g, '')) || 0;
    if (nominal <= 0) {
      alert('Masukkan nominal transaksi yang valid');
      return;
    }

    setIsRecording(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'record_transaction',
          userId: currentUserId,
          transactionData: {
            type: txType,
            amount: nominal,
            description: txDesc.trim() || 'Transaksi Tata AI',
            walletChoice,
            date: txDate,
          }
        }),
      });

      const data = await res.json();
      if (data.success && data.transaction) {
        // Dispatch global sync event
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('tatadana_transaction_added', { detail: data.transaction }));
          localStorage.setItem('tatadana_last_tx_time', Date.now().toString());
        }

        // Add to chat
        const walletLabel = walletChoice === 'bca' ? 'BCA' : walletChoice === 'gopay' ? 'GoPay' : 'Dompet Tunai';
        const userNotice: ChatMessage = {
          id: `usr-${Date.now()}`,
          role: 'user',
          content: `Catat ${txType === 'income' ? 'pemasukan' : 'pengeluaran'} ${formatRupiah(nominal)} (${walletLabel}) pada tanggal ${txDate}: "${txDesc}"`,
          timestamp: new Date().toISOString(),
        };

        const txId = data.transaction?.id || `tx-${Date.now()}`;
        const aiNotice: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: `${data.reply || `✅ Berhasil mencatat transaksi ${formatRupiah(nominal)} ke ${walletLabel}!`}\n\n📄 [Unduh Struk PDF](/api/transactions/${txId}/export?format=pdf) • 📊 [Unduh File Excel](/api/transactions/${txId}/export?format=excel)`,
          timestamp: new Date().toISOString(),
          suggestedActions: [
            'Berapa sisa uang makan minggu ini?',
            'Lihat transaksi di halaman Transaksi',
            'Buka laporan keuangan bulan ini',
          ]
        };

        setMessages(prev => [...prev, userNotice, aiNotice]);
        setRecordSuccess(`Transaksi ${formatRupiah(nominal)} berhasil dicatat ke ${walletLabel} (${txDate})!`);
        setTimeout(() => setRecordSuccess(null), 4000);
        await loadUserDataAndWallets();
      } else {
        alert(data.error || 'Gagal mencatat transaksi');
      }
    } catch (err: any) {
      alert('Terjadi kesalahan koneksi saat mencatat transaksi');
    } finally {
      setIsRecording(false);
    }
  };

  // Handle Sending Chat message
  const handleSend = async (messageText: string) => {
    const textToSend = messageText || input;
    if (!textToSend.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      content: textToSend.trim(),
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: textToSend, userId: currentUserId }),
      });

      const data = await res.json();
      if (data.reply) {
        // If a transaction was parsed and added
        if (data.transaction) {
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent('tatadana_transaction_added', { detail: data.transaction }));
            localStorage.setItem('tatadana_last_tx_time', Date.now().toString());
          }
          await loadUserDataAndWallets();
        }

        const aiMessage: ChatMessage = {
          id: `ai-${Date.now()}`,
          role: 'assistant',
          content: data.reply,
          timestamp: data.timestamp || new Date().toISOString(),
          suggestedActions: data.suggestedActions || [],
        };
        setMessages((prev) => [...prev, aiMessage]);
      } else {
        throw new Error(data.error || 'Gagal menerima balasan AI');
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          content: 'Maaf, terjadi kendala saat memproses permintaanmu. Pastikan koneksi aman dan coba ulangi kembali.',
          timestamp: new Date().toISOString(),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4 pb-8 max-w-4xl mx-auto min-h-[calc(100vh-90px)] flex flex-col">
      {/* Header Bar */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-white shadow-md shadow-orange-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-bold text-base text-slate-900 tracking-tight">🧠 Tata AI Bot Finansial</h1>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Tersinkron Realtime
              </span>
            </div>
            <p className="text-xs text-slate-500">
              Mencatat tanggal pengeluaran/pemasukan lewat BCA, GoPay, Dompet Tunai • Terhubung ke Transaksi & Laporan
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowRecorder(!showRecorder)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 transition"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>{showRecorder ? 'Tutup Form Catat' : 'Buka Form Catat'}</span>
            {showRecorder ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

          <Link
            href="/transactions"
            className="px-3 py-1.5 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 transition flex items-center gap-1"
          >
            <span>Transaksi</span>
            <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* Live Wallet Balances Badge Bar */}
      <div className="grid grid-cols-3 gap-2 shrink-0">
        <div className={`p-2.5 rounded-xl border text-xs transition ${
          walletChoice === 'bca' ? 'bg-blue-50/80 border-blue-300 ring-2 ring-blue-500/20' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-800">
            <span>🏦 BCA</span>
            <span className="text-[10px] bg-blue-100 px-1 rounded text-blue-700">Bank</span>
          </div>
          <div className="text-xs sm:text-sm font-black text-slate-900 mt-1 truncate">
            {formatRupiah(bcaWallet?.balance || 0)}
          </div>
        </div>

        <div className={`p-2.5 rounded-xl border text-xs transition ${
          walletChoice === 'gopay' ? 'bg-emerald-50/80 border-emerald-300 ring-2 ring-emerald-500/20' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-bold text-emerald-800">
            <span>📱 GoPay</span>
            <span className="text-[10px] bg-emerald-100 px-1 rounded text-emerald-700">E-Wallet</span>
          </div>
          <div className="text-xs sm:text-sm font-black text-slate-900 mt-1 truncate">
            {formatRupiah(gopayWallet?.balance || 0)}
          </div>
        </div>

        <div className={`p-2.5 rounded-xl border text-xs transition ${
          walletChoice === 'tunai' ? 'bg-amber-50/80 border-amber-300 ring-2 ring-amber-500/20' : 'bg-white border-slate-200'
        }`}>
          <div className="flex items-center justify-between text-[11px] font-bold text-amber-800">
            <span>💵 Dompet Tunai</span>
            <span className="text-[10px] bg-amber-100 px-1 rounded text-amber-700">Cash</span>
          </div>
          <div className="text-xs sm:text-sm font-black text-slate-900 mt-1 truncate">
            {formatRupiah(tunaiWallet?.balance || 0)}
          </div>
        </div>
      </div>

      {/* FEATURE: INTERACTIVE TRANSACTION RECORDER PANEL IN TATA AI BOT */}
      {showRecorder && (
        <div className="bg-gradient-to-r from-orange-50 via-amber-50/70 to-orange-50 border-2 border-orange-200 rounded-2xl p-4 shadow-sm space-y-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="p-1 rounded-lg bg-orange-500 text-white font-bold text-xs">
                ⚡ Catat Cepat
              </span>
              <span className="text-xs font-bold text-slate-900">
                Pencatatan Finansial Tata AI Bot (BCA, GoPay, Tunai)
              </span>
            </div>
            <span className="text-[10px] text-orange-700 font-semibold bg-orange-100 px-2 py-0.5 rounded-full">
              Langsung Nyambung ke Laporan
            </span>
          </div>

          <form onSubmit={handleRecordTransaction} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
              {/* 1. Tipe Transaksi */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Tipe Mutasi</label>
                <div className="grid grid-cols-2 gap-1 bg-white p-1 rounded-xl border border-slate-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setTxType('expense')}
                    className={`py-1.5 rounded-lg transition text-[11px] ${
                      txType === 'expense' ? 'bg-rose-500 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🔴 Keluar
                  </button>
                  <button
                    type="button"
                    onClick={() => setTxType('income')}
                    className={`py-1.5 rounded-lg transition text-[11px] ${
                      txType === 'income' ? 'bg-emerald-600 text-white shadow-xs' : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🟢 Masuk
                  </button>
                </div>
              </div>

              {/* 2. Tanggal Transaksi */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  📅 Tanggal Mutasi
                </label>
                <input
                  type="date"
                  value={txDate}
                  onChange={(e) => setTxDate(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* 3. Pilihan Dompet: BCA, GoPay, Dompet Tunai */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  👛 Pilihan Dompet
                </label>
                <select
                  value={walletChoice}
                  onChange={(e) => setWalletChoice(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
                >
                  <option value="bca">🏦 Rekening BCA</option>
                  <option value="gopay">📱 GoPay E-Wallet</option>
                  <option value="tunai">💵 Dompet Tunai (Cash)</option>
                </select>
              </div>

              {/* 4. Nominal */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  💰 Jumlah (Nominal Rp)
                </label>
                <input
                  type="number"
                  placeholder="50000"
                  value={txAmount}
                  onChange={(e) => setTxAmount(e.target.value)}
                  required
                  className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Keterangan & Submit */}
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="Keterangan transaksi (misal: Beli makan siang, Bayar bensin, atau Bonus proyek)..."
                value={txDesc}
                onChange={(e) => setTxDesc(e.target.value)}
                required
                className="flex-1 px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-orange-500"
              />

              <button
                type="submit"
                disabled={isRecording}
                className="px-5 py-2 bg-orange-600 hover:bg-orange-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5 whitespace-nowrap"
              >
                {isRecording ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Zap className="w-3.5 h-3.5" />
                )}
                <span>Simpan Transaksi ke TataDana</span>
              </button>
            </div>
          </form>

          {recordSuccess && (
            <div className="p-2.5 bg-emerald-100/90 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
              <span>{recordSuccess}</span>
            </div>
          )}
        </div>
      )}

      {/* Chat Messages Container */}
      <div className="flex-1 bg-white border border-slate-200 rounded-2xl shadow-sm p-4 overflow-y-auto space-y-4">
        {messages.map((m) => {
          const isUser = m.role === 'user';
          return (
            <div
              key={m.id}
              className={`flex gap-3 ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div className={`max-w-[88%] sm:max-w-[78%] space-y-2`}>
                <div
                  className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    isUser
                      ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-tr-xs shadow-sm font-medium'
                      : 'bg-slate-50 border border-slate-200 text-slate-800 rounded-tl-xs shadow-2xs whitespace-pre-line'
                  }`}
                >
                  {m.content}
                </div>

                {/* Suggested Action Chips (if any from assistant) */}
                {!isUser && m.suggestedActions && m.suggestedActions.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {m.suggestedActions.map((action, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleSend(action)}
                        className="px-2.5 py-1 text-[11px] bg-orange-50 hover:bg-orange-100 text-orange-800 font-semibold rounded-lg border border-orange-200 transition text-left flex items-center gap-1"
                      >
                        <Sparkles className="w-3 h-3 text-orange-500 shrink-0" />
                        <span>{action}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}

        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-lg bg-orange-500 text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 flex items-center gap-2">
              <RefreshCw className="w-3.5 h-3.5 animate-spin text-orange-500" />
              <span>Tata AI sedang membaca dompet & mencatat mutasi...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Input Form */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSend(input);
        }}
        className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm flex items-center gap-2 shrink-0"
      >
        <input
          type="text"
          placeholder="Tanya / ketik: 'beli makan 25rb gopay' atau 'catat bensin 50rb bca tanggal 2026-10-18'..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={isLoading}
          className="flex-1 px-3.5 py-2.5 text-xs sm:text-sm bg-transparent focus:outline-none text-slate-900 placeholder:text-slate-400 font-medium"
        />
        <button
          type="submit"
          disabled={!input.trim() || isLoading}
          className="p-2.5 bg-orange-500 hover:bg-orange-600 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl transition shadow-sm"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
