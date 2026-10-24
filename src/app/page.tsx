'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  ArrowRight, 
  CheckCircle2, 
  MessageSquare, 
  Receipt, 
  Mic, 
  Sparkles, 
  ShieldCheck, 
  BarChart3, 
  ChevronDown, 
  ChevronUp, 
  Play, 
  Wallet,
  Clock,
  Zap,
  Star,
  Layers,
  FileSpreadsheet,
  FileText,
  TrendingUp,
  X,
  CreditCard,
  Check
} from 'lucide-react';
import { parseIndonesianText } from '@/lib/telegram/parser';
import { formatExpenseReply, formatIncomeReply, formatReceiptReply } from '@/lib/telegram/formatter';
import { formatRupiah } from '@/lib/utils/currency';
import { formatShortTimeWIB } from '@/lib/utils/timezone';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export default function LandingPage() {
  // Pricing toggle state
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'lifetime'>('lifetime');

  // Video Demo Modal state
  const [isVideoModalOpen, setIsVideoModalOpen] = useState(false);

  // Interactive Bot Preview state
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'bot'; text: string; time: string }>>([
    {
      sender: 'bot',
      text: `👋 Halo Kak Budi!\nSelamat datang di TataDana Bot. Ketik transaksimu seperti:\n• beli bakso 15rb\n• gajian 8.5jt\n• atau klik tombol tes cepat di bawah!`,
      time: '12:00 WIB',
    }
  ]);
  const [isBotTyping, setIsBotTyping] = useState(false);

  // Dynamic Web Dashboard Simulator State (Connected live to bot actions!)
  const [dashboardState, setDashboardState] = useState({
    totalBalance: 14850000,
    monthlySpent: 3650000,
    foodBudgetSpent: 1450000,
    foodBudgetLimit: 2000000,
    recentTransactions: [
      { id: '1', title: 'Belanja Grocery Superindo Express', category: '🍜 Makanan & Minuman', amount: 145000, type: 'expense' as const, time: '12:15 WIB' },
      { id: '2', title: 'Beli Bensin Pertamax', category: '🚗 Transportasi', amount: 50000, type: 'expense' as const, time: '10:30 WIB' },
      { id: '3', title: 'Gaji Bulanan Kantor PT Maju', category: '💼 Pemasukan', amount: 8500000, type: 'income' as const, time: '09:00 WIB' },
    ]
  });

  // FAQ state
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleSendChat = (e?: React.FormEvent, customText?: string) => {
    if (e) e.preventDefault();
    const userText = (customText || chatInput).trim();
    if (!userText) return;

    const nowTime = formatShortTimeWIB(new Date());

    // Append user message
    setChatMessages(prev => [...prev, { sender: 'user', text: userText, time: nowTime }]);
    setChatInput('');
    setIsBotTyping(true);

    setTimeout(() => {
      let reply = '';

      if (userText.startsWith('/saldo')) {
        reply = `🏦 Saldo Dompet TataDana\n├ 👛 BCA Tahapan (Default) : ${formatRupiah(dashboardState.totalBalance - 3650000)}\n├ 👛 GoPay Pocket : Rp1.450.000\n└ 👛 Dompet Tunai : Rp2.200.000\n\n💰 Total Saldo: ${formatRupiah(dashboardState.totalBalance)}`;
      } else if (userText.startsWith('/hari ini') || userText.startsWith('/hariini')) {
        reply = `📅 Rekap Hari Ini (${nowTime})\n💰 Masuk: Rp8.500.000\n💸 Keluar: ${formatRupiah(dashboardState.monthlySpent)}\n─────────────────\n• ${dashboardState.recentTransactions[0]?.title || 'Belanja'}: ${formatRupiah(dashboardState.recentTransactions[0]?.amount || 50000)}\n• Beli bensin motor: -Rp50.000\n• Kopi & snack sore: -Rp25.000`;
      } else if (userText.startsWith('/bantuan') || userText.startsWith('/start')) {
        reply = `🤖 Pusat Bantuan TataDana Bot:\n\n💬 Cara Mencatat:\n• "beli bakso 15rb" ➔ Pengeluaran\n• "gajian 8.5jt" ➔ Pemasukan\n• Kirim Voice Note (maks 60 detik)\n• Kirim Foto Struk (Paket Pro OCR)\n\n📋 Perintah Cepat:\n/saldo — Cek saldo semua dompet\n/hari ini — Rekap transaksi hari ini\n/budget — Pantau sisa budget bulanan`;
      } else if (userText.toLowerCase().includes('struk') || userText.toLowerCase().includes('supermarket')) {
        // Receipt OCR simulation
        const receiptTotal = 245000;
        const newBalance = dashboardState.totalBalance - receiptTotal;
        const newSpent = dashboardState.monthlySpent + receiptTotal;
        const newFoodSpent = dashboardState.foodBudgetSpent + receiptTotal;

        reply = formatReceiptReply({
          merchant: 'Superindo Express Mart',
          total: receiptTotal,
          itemCount: 4,
          category: { id: 'c1', user_id: 'u1', name: 'Makanan & Minuman', emoji: '🍜', type: 'expense', color: '#f97316', monthly_budget: 2000000, created_at: '', updated_at: '' },
          wallet: { id: 'w1', user_id: 'u1', name: 'BCA Tahapan', type: 'bank', balance: newBalance, is_default: true, color: '#3b82f6', created_at: '', updated_at: '' },
          newBalance: newBalance,
        });

        // Update dashboard simulator state live!
        setDashboardState(prev => ({
          ...prev,
          totalBalance: newBalance,
          monthlySpent: newSpent,
          foodBudgetSpent: newFoodSpent,
          recentTransactions: [
            { id: String(Date.now()), title: 'Struk Belanja Superindo Express (OCR)', category: '🍜 Makanan & Minuman', amount: receiptTotal, type: 'expense', time: nowTime },
            ...prev.recentTransactions.slice(0, 2)
          ]
        }));
      } else {
        // Parse with Indonesian NLP parser
        const parsed = parseIndonesianText(userText);

        if (parsed.success && parsed.data) {
          if (parsed.data.type === 'income') {
            const newBal = dashboardState.totalBalance + parsed.data.amount;
            reply = formatIncomeReply({
              amount: parsed.data.amount,
              wallet: { id: 'w1', user_id: 'u1', name: 'BCA Tahapan', type: 'bank', balance: newBal, is_default: true, color: '#3b82f6', created_at: '', updated_at: '' },
              newBalance: newBal,
            });

            // Update live dashboard simulator
            setDashboardState(prev => ({
              ...prev,
              totalBalance: newBal,
              recentTransactions: [
                { id: String(Date.now()), title: parsed.data?.description || 'Pemasukan', category: '💼 Pemasukan', amount: parsed.data?.amount || 0, type: 'income', time: nowTime },
                ...prev.recentTransactions.slice(0, 2)
              ]
            }));
          } else {
            const newBal = dashboardState.totalBalance - parsed.data.amount;
            const newSpent = dashboardState.monthlySpent + parsed.data.amount;
            const isFood = parsed.data.categoryName.toLowerCase().includes('makan');
            const newFoodSpent = isFood ? dashboardState.foodBudgetSpent + parsed.data.amount : dashboardState.foodBudgetSpent;

            reply = formatExpenseReply({
              amount: parsed.data.amount,
              category: { id: 'c1', user_id: 'u1', name: parsed.data.categoryName, emoji: parsed.data.categoryEmoji, type: 'expense', color: '#f97316', monthly_budget: 2000000, created_at: '', updated_at: '' },
              wallet: { id: 'w1', user_id: 'u1', name: 'BCA Tahapan', type: 'bank', balance: newBal, is_default: true, color: '#3b82f6', created_at: '', updated_at: '' },
              description: parsed.data.description,
              newBalance: newBal,
              monthlySpent: newSpent,
              monthlyBudget: 2000000,
            });

            // Update live dashboard simulator
            setDashboardState(prev => ({
              ...prev,
              totalBalance: newBal,
              monthlySpent: newSpent,
              foodBudgetSpent: newFoodSpent,
              recentTransactions: [
                { id: String(Date.now()), title: parsed.data?.description || 'Pengeluaran', category: `${parsed.data?.categoryEmoji} ${parsed.data?.categoryName}`, amount: parsed.data?.amount || 0, type: 'expense', time: nowTime },
                ...prev.recentTransactions.slice(0, 2)
              ]
            }));
          }
        } else {
          reply = parsed.errorMessage || '⚠️ Format belum tepat. Contoh: "beli bakso 15rb" atau "gajian 5jt"';
        }
      }

      setChatMessages(prev => [...prev, { sender: 'bot', text: reply, time: nowTime }]);
      setIsBotTyping(false);
    }, 450);
  };

  const faqs = [
    {
      q: 'Apakah saya bisa mencatat menggunakan foto struk di paket Starter?',
      a: 'Fitur input via foto struk (OCR otomatis bertenaga AI Multi-Provider) hanya tersedia pada paket TataDana Pro. Namun di paket Starter, Anda tetap dapat mencatat pengeluaran melalui teks Telegram maupun Voice Note (VN) hingga 50 transaksi per bulan.'
    },
    {
      q: 'Bagaimana keamanan data transaksi saya di TataDana?',
      a: 'Data Anda disimpan 100% di server Supabase Postgres terenkripsi dengan Row Level Security (RLS) berstandar fintech. Hanya Anda yang memiliki akses ke buku catatan finansial Anda. Setiap akses teknis dari admin pun diwajibkan melewati audit log permanen demi menjaga privasi.'
    },
    {
      q: 'Apakah saya harus membuat bot Telegram sendiri dari nol?',
      a: 'Tidak harus! Anda bisa langsung memakai bot resmi bersama TataDana yang terhubung ke nomor WhatsApp Anda secara instan, ATAU jika Anda menginginkan privasi bot pribadi (Custom Token), Anda cukup copy-paste token dari @BotFather ke halaman Settings TataDana.'
    },
    {
      q: 'Bagaimana bot mengenali nominal seperti "15rb", "1.5jt", atau "500k"?',
      a: 'TataDana dilengkapi model NLP khusus percakapan bahasa Indonesia informal yang secara cerdas mendeteksi format singkatan nominal, jenis pos pengeluaran, dan memetakan ke kategori yang tepat secara otomatis tanpa perlu memilih menu manual.'
    },
    {
      q: 'Berapa lama Voice Note (VN) yang didukung untuk pencatatan suara?',
      a: 'Durasi rekaman suara maksimal 60 detik per voice note. Ini sangat cukup untuk mengucapkan "Beli makan siang nasi padang tiga puluh lima ribu pakai gopay". Hasil transkrip langsung ditampilkan di bot dan tersimpan rapi.'
    },
    {
      q: 'Metode pembayaran apa saja yang didukung untuk upgrade ke Pro?',
      a: 'Kami menerima pembayaran otomatis via Midtrans (QRIS, GoPay, OVO, ShopeePay, Virtual Account BCA/Mandiri/BRI/BNI) serta opsi transfer bank manual dengan konfirmasi admin super cepat.'
    },
    {
      q: 'Apakah laporan keuangan bisa diexport ke file Excel atau PDF?',
      a: 'Ya, pengguna paket Pro dapat mengunduh laporan keuangan lengkap dalam format PDF siap cetak dengan visual ringkasan atau spreadsheet Excel (.xlsx) dengan signed URL Supabase Storage kapan pun dibutuhkan.'
    },
    {
      q: 'Apakah waktu transaksi bot disinkronkan dengan waktu lokal Indonesia?',
      a: 'Tentu saja! Seluruh transaksi, rekap harian, notifikasi pengingat, dan riwayat bot beroperasi menggunakan zona waktu WIB (Asia/Jakarta, UTC+7) secara presisi.'
    }
  ];

  const foodPercentage = Math.min(100, Math.round((dashboardState.foodBudgetSpent / dashboardState.foodBudgetLimit) * 100));

  return (
    <div className="min-h-screen bg-white text-slate-900 selection:bg-orange-500 selection:text-white">
      {/* 1. NAVBAR (Sticky) */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white font-black text-xl shadow-md shadow-orange-500/20">
              TD
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-slate-900">TataDana</span>
              <span className="hidden sm:inline-block ml-2 px-2 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-700 rounded-full">
                Fintech Telegram #1
              </span>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center gap-6 text-sm font-semibold text-slate-600">
            <a href="#fitur" className="hover:text-orange-600 transition">Fitur</a>
            <a href="#demo" className="hover:text-orange-600 transition">Simulator Bot</a>
            <Link href="/teamwork-preview" className="hover:text-orange-600 transition flex items-center gap-1 text-slate-700">
              <span>👥 Kolaborasi 10 Tim</span>
            </Link>
            <Link href="/learn" className="hover:text-orange-600 transition flex items-center gap-1 text-slate-700">
              <span>🎓 Pusat Belajar</span>
            </Link>
            <a href="#harga" className="hover:text-orange-600 transition">Harga</a>
            <a href="#faq" className="hover:text-orange-600 transition">FAQ</a>
          </nav>

          <div className="flex items-center gap-2 sm:gap-2.5">
            <ThemeSwitcher />
            <Link
              href="/login"
              className="text-xs sm:text-sm font-bold text-slate-700 hover:text-orange-600 px-3 py-2 transition"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs sm:text-sm font-bold rounded-xl shadow-md shadow-orange-500/20 transition hover:scale-105"
            >
              Coba Gratis
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="pt-16 pb-14 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto text-center space-y-6">
        {/* Pre-headline badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs sm:text-sm font-semibold shadow-sm">
          <Sparkles className="w-4 h-4 text-orange-500" />
          <span>Fintech Pertama di Indonesia: Catat Keuangan Langsung dari Telegram & WhatsApp</span>
        </div>

        {/* Headline (H1) */}
        <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight sm:leading-none">
          Gaji habis sebelum akhir bulan?{' '}
          <span className="bg-gradient-to-r from-orange-500 to-amber-500 bg-clip-text text-transparent">
            Sudah saatnya kamu tahu ke mana uangmu pergi.
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
          TataDana mencatat setiap pengeluaranmu langsung dari chat Telegram, voice note suara, atau foto struk — sisanya AI kami yang rapikan ke dashboard finansialmu.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <Link
            href="/register"
            className="w-full sm:w-auto px-8 py-3.5 bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-xl shadow-lg shadow-orange-500/25 transition transform hover:-translate-y-0.5 text-sm flex items-center justify-center gap-2"
          >
            <span>Mulai Gratis Sekarang</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <a
            href="#demo"
            className="w-full sm:w-auto px-7 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition text-sm flex items-center justify-center gap-2"
          >
            <span>Coba Simulator Langsung ↓</span>
          </a>
        </div>

        {/* Trust Badges */}
        <div className="pt-2 flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs text-slate-500 font-medium">
          <span className="flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 text-orange-500" /> Setup Kilat 30 Detik
          </span>
          <span className="flex items-center gap-1.5">
            <CreditCard className="w-3.5 h-3.5 text-orange-500" /> Tanpa Kartu Kredit
          </span>
          <span className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" /> Bank-Grade RLS Supabase
          </span>
        </div>
      </section>

      {/* 3. HERO VIDEO / SHOWCASE TOUR MODAL */}
      <section className="pb-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div 
          onClick={() => setIsVideoModalOpen(true)}
          className="aspect-video bg-gradient-to-tr from-slate-900 via-slate-800 to-slate-950 rounded-3xl border-4 border-slate-100 shadow-2xl relative flex flex-col items-center justify-center p-6 text-white group cursor-pointer overflow-hidden transition transform hover:scale-[1.01]"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-orange-500 group-hover:bg-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/50 transition-transform group-hover:scale-110 mb-3 z-10">
            <Play className="w-7 h-7 sm:w-8 sm:h-8 text-white fill-white ml-1" />
          </div>
          <div className="font-extrabold text-base sm:text-xl tracking-tight z-10 text-center">
            Tonton Demo Cepat TataDana (1:30 Menit)
          </div>
          <p className="text-xs text-orange-200 mt-1 z-10 font-medium">
            Lihat bagaimana chat Telegram & foto struk langsung tersinkron ke dashboard web
          </p>
          <div className="absolute bottom-4 right-4 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-mono text-slate-300">
            Demo Video • HD 1080p
          </div>
        </div>

        {/* Video Demo Modal */}
        {isVideoModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-3xl w-full p-6 text-white space-y-4 relative shadow-2xl">
              <button
                onClick={() => setIsVideoModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white bg-slate-800 p-2 rounded-xl transition"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center font-bold text-sm">TD</div>
                <div>
                  <h3 className="font-bold text-base">Alur Kerja Cepat TataDana</h3>
                  <p className="text-xs text-slate-400">3 Langkah mudah mengelola keuangan pribadimu</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 text-xs">
                <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
                  <div className="text-orange-400 font-extrabold text-sm">Langkah 1</div>
                  <div className="font-bold">Ketik di Telegram</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Ketik "beli bakso 15rb", rekam suara VN, atau kirim foto struk belanja Superindo.
                  </p>
                </div>
                <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
                  <div className="text-orange-400 font-extrabold text-sm">Langkah 2</div>
                  <div className="font-bold">AI Proses Otomatis</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    AI membaca nominal, kategori, dan membalas saldo terbaru beserta progress bar budget.
                  </p>
                </div>
                <div className="p-4 bg-slate-800/80 rounded-2xl border border-slate-700 space-y-2">
                  <div className="text-orange-400 font-extrabold text-sm">Langkah 3</div>
                  <div className="font-bold">Web Sinkron Realtime</div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    Semua transaksi otomatis tercatat di dashboard web tanpa perlu buka aplikasi berulang kali.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setIsVideoModalOpen(false)}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 font-bold rounded-xl text-xs transition"
                >
                  Tutup & Coba Simulator Langsung
                </button>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* 4. ECOSYSTEM & PARTNER WALLET BAR */}
      <section className="py-8 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <p className="text-xs uppercase tracking-wider font-bold text-slate-500">
            Mendukung pencatatan & sinkronisasi multi-wallet seluruh Indonesia
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 text-xs font-bold text-slate-700">
            {['Bank BCA', 'Bank Mandiri', 'Bank BRI', 'Bank BNI', 'GoPay', 'OVO', 'ShopeePay', 'DANA', 'QRIS'].map((bank, i) => (
              <div key={i} className="px-3.5 py-1.5 bg-white rounded-xl border border-slate-200 shadow-sm flex items-center gap-1.5 hover:border-orange-300 transition">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                <span>{bank}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5 & 6. PROBLEM AWARENESS & SOLUTION TRANSITION */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <h2 className="text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">Realita Keuangan Sehari-hari</h2>
            <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Kenapa mencatat pengeluaran itu terasa sangat berat?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3 hover:shadow-md transition">
              <div className="text-3xl">⏳</div>
              <h3 className="font-bold text-slate-900 text-base">"Buka aplikasi keuangan? Nanti dulu deh..."</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Aplikasi keuangan biasa terlalu ribet. Harus buka app, lewati splash screen, pilih kategori bertingkat, dan isi form panjang. Akhirnya malas dan lupa.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3 hover:shadow-md transition">
              <div className="text-3xl">💸</div>
              <h3 className="font-bold text-slate-900 text-base">"Kok uang habis ya? Padahal kayak nggak beli apa-apa"</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Pengeluaran kecil seperti kopi 20rb, parkir 5rb, atau jajan sore tidak pernah tercatat, padahal bila diakumulasi bisa tembus 1,5 juta sebulan.
              </p>
            </div>

            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200/80 shadow-sm space-y-3 hover:shadow-md transition">
              <div className="text-3xl">📉</div>
              <h3 className="font-bold text-slate-900 text-base">"Udah niat bikin budget di Excel, seminggu jebol"</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Bikin budget di Excel tapi tidak pernah dipantau secara real-time. Begitu sadar di akhir bulan, saldo tabungan sudah ludes di minggu ketiga.
              </p>
            </div>
          </div>

          {/* 6. Solution Transition */}
          <div className="text-center pt-6 max-w-2xl mx-auto space-y-3">
            <div className="text-base sm:text-lg font-semibold text-slate-700">
              Bagaimana kalau mencatat keuangan semudah kirim pesan chat ke teman?
            </div>
            <div className="text-2xl sm:text-4xl font-black text-orange-600 tracking-tight">
              Introducing TataDana.
            </div>
            <p className="text-xs sm:text-sm text-slate-500 leading-relaxed">
              Cukup chat Telegram seperti biasa, AI kami yang merapikannya secara otomatis ke buku kas & dashboard web profesional Anda.
            </p>
          </div>
        </div>
      </section>

      {/* 7. INTERACTIVE BOT SIMULATOR & DUMMY DASHBOARD PREVIEW */}
      <section id="demo" className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Coba Langsung di Web</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Simulasi Interaktif Bot Telegram & Dashboard Live
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Ketik transaksi atau klik tombol tes cepat di bawah. Perhatikan bagaimana bot membalas dan Dashboard di sebelah kanan ter-update seketika!
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
            {/* KIRI (Chat Mockup Screen) */}
            <div className="lg:col-span-6 bg-slate-900 rounded-3xl border-4 border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[560px]">
              {/* Telegram Header */}
              <div className="bg-slate-800 px-4 py-3 border-b border-slate-700 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-500 to-amber-500 flex items-center justify-center font-bold text-sm shadow">
                    🤖
                  </div>
                  <div>
                    <div className="text-xs sm:text-sm font-bold flex items-center gap-1.5">
                      <span>TataDana Bot</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
                    </div>
                    <div className="text-[11px] text-slate-400">@TataDanaOfficial_bot • online</div>
                  </div>
                </div>
                <span className="text-[10px] text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-700/50 font-mono font-bold">
                  WIB LIVE
                </span>
              </div>

              {/* Chat Messages Body */}
              <div className="flex-1 p-4 overflow-y-auto space-y-3.5 text-xs sm:text-sm bg-slate-950/40">
                {chatMessages.map((msg, i) => (
                  <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-[85%] p-3.5 rounded-2xl whitespace-pre-line text-xs font-mono leading-relaxed shadow ${
                        msg.sender === 'user'
                          ? 'bg-orange-500 text-white rounded-tr-none'
                          : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
                      }`}
                    >
                      <div>{msg.text}</div>
                      <div className={`text-[10px] text-right mt-1.5 ${msg.sender === 'user' ? 'text-orange-200' : 'text-slate-400'}`}>
                        {msg.time} {msg.sender === 'user' && '✓✓'}
                      </div>
                    </div>
                  </div>
                ))}
                {isBotTyping && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 text-slate-300 px-3 py-2 rounded-2xl text-xs flex items-center gap-1.5 border border-slate-700">
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      <span className="text-[11px] text-slate-400 ml-1">AI sedang memproses transaksi...</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Chat Input */}
              <div className="p-3 bg-slate-950 border-t border-slate-800 space-y-2">
                <form onSubmit={handleSendChat} className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ketik: beli bakso 15rb atau gajian 8.5jt..."
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shadow"
                  >
                    Kirim
                  </button>
                </form>

                {/* Quick test buttons */}
                <div className="flex items-center gap-1.5 overflow-x-auto text-[11px] pb-1 text-slate-400">
                  <span className="shrink-0">Tes Cepat:</span>
                  <button
                    type="button"
                    onClick={() => handleSendChat(undefined, 'beli bensin motor 50rb')}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 whitespace-nowrap"
                  >
                    ⛽ bensin 50rb
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendChat(undefined, 'gajian kantor 8.5jt')}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 whitespace-nowrap"
                  >
                    💰 gajian 8.5jt
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendChat(undefined, 'foto struk supermarket')}
                    className="px-2 py-0.5 bg-orange-950 hover:bg-orange-900 text-orange-200 rounded border border-orange-800 whitespace-nowrap font-bold"
                  >
                    🧾 struk belanja
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendChat(undefined, '/saldo')}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 whitespace-nowrap"
                  >
                    /saldo
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSendChat(undefined, '/hari ini')}
                    className="px-2 py-0.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 whitespace-nowrap"
                  >
                    /hari ini
                  </button>
                </div>
              </div>
            </div>

            {/* KANAN (Real-time Web Dashboard Mockup Preview) */}
            <div className="lg:col-span-6 space-y-4">
              <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-orange-500" />
                    <span>Sinkronisasi Otomatis ke Web Dashboard</span>
                  </div>
                  <span className="text-[11px] text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded-full font-bold flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span>Realtime Supabase</span>
                  </span>
                </div>

                {/* 2 Stats Cards */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div className="text-[10px] uppercase font-bold text-slate-500">Saldo Total Aktif</div>
                    <div className="text-xl font-black text-slate-900">{formatRupiah(dashboardState.totalBalance)}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">3 Dompet Terhubung</div>
                  </div>
                  <div className="bg-orange-50/70 p-3.5 rounded-2xl border border-orange-100">
                    <div className="text-[10px] uppercase font-bold text-orange-700">Pengeluaran Bulan Ini</div>
                    <div className="text-xl font-black text-orange-600">{formatRupiah(dashboardState.monthlySpent)}</div>
                    <div className="text-[10px] text-orange-500 mt-0.5">Otomatis Terkategori</div>
                  </div>
                </div>

                {/* Live Budget Progress Bar */}
                <div className="space-y-2 p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">🍜 Budget Kategori Makanan:</span>
                    <span className="font-extrabold text-orange-600">{foodPercentage}%</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-2.5 overflow-hidden">
                    <div 
                      className={`h-2.5 rounded-full transition-all duration-500 ${
                        foodPercentage >= 90 ? 'bg-rose-500' : foodPercentage >= 75 ? 'bg-amber-500' : 'bg-orange-500'
                      }`}
                      style={{ width: `${foodPercentage}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500">
                    <span>Terpakai: {formatRupiah(dashboardState.foodBudgetSpent)}</span>
                    <span>Batas: {formatRupiah(dashboardState.foodBudgetLimit)}</span>
                  </div>
                </div>

                {/* Recent Feed */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-slate-700">Aktivitas Terakhir (Sinkron dari Chat):</div>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto">
                    {dashboardState.recentTransactions.map((tx) => (
                      <div key={tx.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between text-xs">
                        <div>
                          <div className="font-bold text-slate-800">{tx.title}</div>
                          <div className="text-[10px] text-slate-400">{tx.category} • {tx.time}</div>
                        </div>
                        <span className={`font-mono font-bold ${tx.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                          {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Value proposition pill */}
                <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs text-amber-900 space-y-1">
                  <div className="font-bold">💡 Pengalaman Finansial Tanpa Gesekan</div>
                  <p className="text-[11px] text-amber-800 leading-relaxed">
                    Setiap transaksi yang Anda kirimkan lewat bot langsung mengubah saldo dompet, grafik kategori, dan alert budget di dashboard tanpa perlu refresh halaman.
                  </p>
                </div>

                <Link
                  href="/register"
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition flex items-center justify-center gap-2 shadow"
                >
                  <span>Mulai Hubungkan Akun Pribadimu Gratis</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 8, 9, 10. CORE FEATURE SHOWCASE (3 Alternating Layouts) */}
      <section id="fitur" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
          
          {/* Fitur 1: Multi-Modal Input */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Multi-Modal Input</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                1. Catat Lewat Teks Slang, Voice Note, & Foto Struk Sekaligus
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Sedang menyetir mobil? Kirim Voice Note suara singkat. Sedang belanja bulanan di supermarket? Cukup foto struk belanjamu. AI OCR Pro kami akan otomatis membaca rincian item, nama merchant, dan total belanja secara presisi.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>Parsing kalimat percakapan natural Indonesia (15rb, 1.5jt, 500k)</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>Voice Note speech-to-text otomatis berdurasi hingga 60 detik</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>Ekstraksi struk belanja multi-item bertenaga AI Vision OCR Pro</span>
                </li>
              </ul>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4">
              <div className="text-xs font-bold text-slate-500 uppercase">Contoh Parsing Natural NLP</div>
              <div className="bg-white p-4 rounded-2xl border border-slate-200 font-mono text-xs text-slate-800 shadow-sm space-y-2">
                <div className="text-slate-500 text-[11px]">// Input Pesan Pengguna:</div>
                <div className="text-orange-600 font-bold">"makan siang soto ayam 25ribu es teh 5rb di warung bca"</div>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 font-medium">
                ✓ <b>Terdeteksi:</b> Nominal Rp30.000 • Kategori 🍜 Makanan & Minuman • Dompet 👛 BCA
              </div>
            </div>
          </div>

          {/* Fitur 2: Native In-App Reporting & Export */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center md:flex-row-reverse">
            <div className="md:order-2 space-y-4">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Native Reporting</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                2. Laporan Lengkap & Ekspor PDF / Excel Instan
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Tidak perlu lagi pusing menyusun rumus spreadsheet manual. Dashboard Laporan TataDana menyajikan filter transaksi, sortir tabel, dan tombol download dokumen PDF siap cetak maupun Excel (.xlsx) dengan signed URL aman.
              </p>
              <ul className="space-y-2 text-xs font-semibold text-slate-700">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>Filter kategori, dompet wallet, dan rentang tanggal kustom</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>Expandable accordion untuk melihat rincian item tiap struk belanja</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>Riwayat ekspor tersimpan di Supabase Storage yang bisa diunduh kapan saja</span>
                </li>
              </ul>
            </div>
            <div className="md:order-1 bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4">
              <div className="text-xs font-bold text-slate-500 uppercase">Ekspor Dokumen Siap Pakai</div>
              <div className="grid grid-cols-2 gap-3 pt-1">
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex flex-col items-center justify-center gap-2">
                  <FileText className="w-6 h-6 text-rose-600" />
                  <span>PDF Resmi Siap Cetak</span>
                  <span className="text-[10px] text-rose-600 font-normal">Header & tabel rapi</span>
                </div>
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex flex-col items-center justify-center gap-2">
                  <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                  <span>Excel (.xlsx) Lengkap</span>
                  <span className="text-[10px] text-emerald-600 font-normal">Rumus & format angka IDR</span>
                </div>
              </div>
            </div>
          </div>

          {/* Fitur 3: Intelligent Advisory */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Intelligent Advisory</span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                3. AI Financial Advisor Personal di Chat Kamu
              </h3>
              <p className="text-slate-600 text-sm leading-relaxed">
                Fitur eksklusif Pro yang bekerja secara pasif di latar belakang. Jika pengeluaran satu kategori naik di atas 50% dibanding minggu lalu, atau single purchase melebihi 20% budget, bot akan memberikan analisa dan saran actionable yang ramah.
              </p>
              <div className="bg-[#122b4a] p-4 rounded-2xl text-blue-100 font-mono text-xs leading-relaxed border border-blue-900 shadow">
                🤖 <b>TataDana Financial Advisor</b><br />
                Hei Budi! Pengeluaran kategori Makanan minggu ini naik 60% dibanding minggu lalu.<br />
                💡 <b>Saran:</b> Masak sendiri di rumah 3 hari ke depan untuk menghemat ~Rp150.000.
              </div>
            </div>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-200 shadow-xl space-y-4">
              <div className="text-xs font-bold text-slate-500 uppercase">Trigger Cerdas AI Advisor</div>
              <ul className="text-xs text-slate-600 space-y-3 font-medium">
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  <span>Kenaikan pengeluaran kategori &gt;50% dibanding minggu sebelumnya</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  <span>Total pengeluaran menyentuh batas &gt;80% dari total pemasukan</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                  <span>Transaksi tunggal besar melebih 20% total budget bulanan</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      </section>

      {/* 11. HOW IT WORKS (3 Simple Steps) */}
      <section id="cara-kerja" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Hanya Butuh 3 Langkah</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
              Cara Kerja TataDana yang Super Simpel
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 relative">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 font-black text-lg flex items-center justify-center border border-orange-200">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base">Hubungkan Akun Telegram</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Daftar dengan nomor WhatsApp Anda, lalu buka bot Telegram resmi TataDana dalam 30 detik tanpa instal aplikasi baru yang membebani memori HP.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 relative">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 font-black text-lg flex items-center justify-center border border-orange-200">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base">Kirim Transaksi Sesukamu</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Ketik teks santai "beli bensin 50rb", rekam suara Voice Note, atau kirim foto struk belanjaanmu. AI langsung memvalidasi nominal dan kategorinya.
              </p>
            </div>

            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 relative">
              <div className="w-10 h-10 rounded-2xl bg-orange-50 text-orange-600 font-black text-lg flex items-center justify-center border border-orange-200">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base">Pantau & Capai Target Finansial</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Lihat saldo dompet, grafik pengeluaran, peringatan budget 80%/100%, serta unduh laporan keuangan PDF/Excel kapan pun Anda butuhkan.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 12. METRICS & IMPACT STATS */}
      <section className="py-16 bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black tracking-tight">15.000+</div>
              <div className="text-xs text-orange-100 font-semibold">Transaksi Tercatat</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black tracking-tight">99.4%</div>
              <div className="text-xs text-orange-100 font-semibold">Akurasi Parsing NLP</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black tracking-tight">Rp3.8 M+</div>
              <div className="text-xs text-orange-100 font-semibold">Anggaran Dikelola</div>
            </div>
            <div className="space-y-1">
              <div className="text-3xl sm:text-4xl font-black tracking-tight">4.9 / 5.0</div>
              <div className="text-xs text-orange-100 font-semibold">Kepuasan Pengguna</div>
            </div>
          </div>
        </div>
      </section>

      {/* 13. TESTIMONIALS (Masonry Grid) */}
      <section id="testimoni" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center max-w-2xl mx-auto">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Testimoni Pengguna</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Dipercaya Profesional, UMKM, & Mahasiswa
          </h2>
          <p className="text-xs text-slate-500 mt-1">Pengalaman nyata pengguna yang berhenti cemas di akhir bulan</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex text-amber-400 text-xs">★★★★★</div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "Dulu selalu malas buka app keuangan karena ribet login dan inputnya panjang. Sekarang pas bayar kopi langsung ketik di Telegram 'kopi 25rb', beres!"
              </p>
            </div>
            <div className="font-bold text-xs text-slate-900 border-t border-slate-100 pt-3">
              — Dimas R., Software Engineer (Jakarta)
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex text-amber-400 text-xs">★★★★★</div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "Fitur foto struk di paket Pro sangat menghemat waktu. Belanja bulanan di Superindo langsung terinci 15 item tanpa perlu ngetik satu-satu."
              </p>
            </div>
            <div className="font-bold text-xs text-slate-900 border-t border-slate-100 pt-3">
              — Sarah P., Product Manager (Bandung)
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex text-amber-400 text-xs">★★★★★</div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "Gaji UMR sering habis sebelum akhir bulan. Berkat alert budget 80% dari Telegram, saya jadi ngerem jajan dan berhasil nabung 20% tiap bulan."
              </p>
            </div>
            <div className="font-bold text-xs text-slate-900 border-t border-slate-100 pt-3">
              — Rizky A., Freelance Designer (Surabaya)
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex text-amber-400 text-xs">★★★★★</div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "Mengatur uang belanja keluarga jadi jauh lebih tertib. Voice Note-nya sangat membantu saat tangan repot bawa belanjaan di pasar."
              </p>
            </div>
            <div className="font-bold text-xs text-slate-900 border-t border-slate-100 pt-3">
              — Maya Indah, Ibu Rumah Tangga (Yogyakarta)
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex text-amber-400 text-xs">★★★★★</div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "Sangat berguna untuk misahin kas kedai kopi dengan uang pribadi. Ekspor Excel-nya memudahkan rekap pajak dan laporan bulanan."
              </p>
            </div>
            <div className="font-bold text-xs text-slate-900 border-t border-slate-100 pt-3">
              — Kevin Tan, Pemilik Coffee Shop (Medan)
            </div>
          </div>

          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-3 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex text-amber-400 text-xs">★★★★★</div>
              <p className="text-xs text-slate-600 leading-relaxed italic">
                "Sebagai mahasiswi rantau, kiriman orang tua dulu sering habis di minggu ke-2. Sekarang ada peringatan budget harian, jadi aman terkendali!"
              </p>
            </div>
            <div className="font-bold text-xs text-slate-900 border-t border-slate-100 pt-3">
              — Anisa W., Mahasiswi UI (Depok)
            </div>
          </div>
        </div>
      </section>

      {/* 14. PRICING SECTION (Starter vs Pro) */}
      <section id="harga" className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-3">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Harga Sederhana & Transparan</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Investasi Kecil untuk Finansial yang Terkontrol
            </h2>
            <p className="text-xs sm:text-sm text-slate-500">
              Pilih paket bulanan fleksibel atau miliki paket Pro seumur hidup tanpa biaya langganan berulang.
            </p>

            {/* Toggle Switch */}
            <div className="inline-flex items-center p-1 bg-white border border-slate-200 rounded-xl shadow-sm text-xs font-bold">
              <button
                type="button"
                onClick={() => setBillingCycle('monthly')}
                className={`px-4 py-2 rounded-lg transition ${
                  billingCycle === 'monthly' ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Bulanan
              </button>
              <button
                type="button"
                onClick={() => setBillingCycle('lifetime')}
                className={`px-4 py-2 rounded-lg transition ${
                  billingCycle === 'lifetime' ? 'bg-orange-500 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sekali Bayar (Lifetime) ✨
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-stretch">
            {/* Starter Plan */}
            <div className="bg-white border border-slate-200 rounded-3xl p-8 shadow-sm flex flex-col justify-between space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-slate-900">Starter</h3>
                  <p className="text-xs text-slate-500">Cocok untuk pencatatan transaksi dasar pribadi</p>
                </div>

                <div className="text-3xl font-black text-slate-900">
                  Rp 49.000 <span className="text-xs font-normal text-slate-500">/ bulan</span>
                </div>

                <ul className="space-y-3 text-xs text-slate-600">
                  <li className="flex items-center gap-2">✓ Catat transaksi via teks & VN Telegram</li>
                  <li className="flex items-center gap-2">✓ Akses dashboard web lengkap</li>
                  <li className="flex items-center gap-2">✓ Maksimal 50 transaksi / bulan</li>
                  <li className="flex items-center gap-2">✓ Maksimal 3 wallet & 5 kategori budget</li>
                  <li className="flex items-center gap-2">✓ Ringkasan laporan bulanan</li>
                  <li className="flex items-center gap-2 text-slate-400">✗ Tidak ada input foto struk OCR</li>
                  <li className="flex items-center gap-2 text-slate-400">✗ Tidak ada AI Financial Advisor</li>
                  <li className="flex items-center gap-2 text-slate-400">✗ Tidak ada ekspor PDF / Excel</li>
                </ul>
              </div>

              <Link
                href="/register"
                className="w-full py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold rounded-xl text-center transition"
              >
                Pilih Starter
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-gradient-to-br from-orange-500 to-amber-500 text-white rounded-3xl p-8 shadow-xl shadow-orange-500/20 flex flex-col justify-between space-y-6 relative overflow-hidden">
              <div className="absolute top-4 right-4 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider">
                Paling Populer
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="font-bold text-lg text-white">TataDana Pro</h3>
                  <p className="text-xs text-orange-100">Bebas batas untuk kontrol finansial total seumur hidup</p>
                </div>

                <div className="text-3xl font-black text-white">
                  Rp 99.000 <span className="text-xs font-normal text-orange-100">Sekali Bayar Seumur Hidup</span>
                </div>

                <ul className="space-y-3 text-xs text-orange-50">
                  <li className="flex items-center gap-2">✓ <b>Unlimited</b> transaksi per bulan</li>
                  <li className="flex items-center gap-2">✓ <b>Unlimited</b> wallet & kategori budget</li>
                  <li className="flex items-center gap-2">✓ <b>Input Foto Struk OCR</b> multi-item otomatis</li>
                  <li className="flex items-center gap-2">✓ <b>AI Financial Advisor</b> personal</li>
                  <li className="flex items-center gap-2">✓ <b>Ekspor Dokumen</b> ke PDF & Excel (.xlsx)</li>
                  <li className="flex items-center gap-2">✓ Pengingat custom (hingga 2x sehari)</li>
                  <li className="flex items-center gap-2">✓ Prioritas customer support</li>
                </ul>
              </div>

              <Link
                href="/register?plan=pro"
                className="w-full py-3 bg-white hover:bg-orange-50 text-orange-600 text-xs font-extrabold rounded-xl text-center transition shadow"
              >
                Miliki Pro Seumur Hidup
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 15. FAQ SECTION, FINAL CTA, & FOOTER */}
      <section id="faq" className="py-20 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
        <div className="text-center max-w-xl mx-auto">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">Pertanyaan Umum</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">
            Frequently Asked Questions
          </h2>
          <p className="text-xs text-slate-500 mt-1">Jawaban atas pertanyaan yang sering ditanyakan seputar TataDana</p>
        </div>

        <div className="divide-y divide-slate-200 border-y border-slate-200">
          {faqs.map((faq, idx) => {
            const isOpen = openFaq === idx;
            return (
              <div key={idx} className="py-4">
                <button
                  type="button"
                  onClick={() => setOpenFaq(isOpen ? null : idx)}
                  className="w-full flex justify-between items-center text-left text-sm font-bold text-slate-900 hover:text-orange-600 transition"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-orange-600" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>
                {isOpen && (
                  <p className="mt-2 text-xs text-slate-600 leading-relaxed pl-1">
                    {faq.a}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </section>

      {/* FINAL CTA BANNER */}
      <section className="py-16 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto space-y-4">
          <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
            Mulai kendalikan keuanganmu hari ini
          </h2>
          <p className="text-xs sm:text-sm text-orange-100 max-w-xl mx-auto leading-relaxed">
            Bergabunglah dengan ribuan pengguna yang berhenti cemas di akhir bulan. Cukup ketik transaksi dari chat Telegram favoritmu.
          </p>
          <div className="pt-2">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-3.5 bg-white text-orange-600 font-extrabold rounded-xl shadow-lg hover:bg-orange-50 transition text-xs sm:text-sm"
            >
              <span>Daftar Gratis Sekarang</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER (4 Columns) */}
      <footer className="bg-slate-950 text-slate-400 py-12 px-4 sm:px-6 lg:px-8 border-t border-slate-800 text-xs">
        <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Col 1 */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-base">
              <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white text-xs font-black">
                TD
              </div>
              <span>TataDana</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-500">
              Catat keuangan semudah chat — langsung dari Telegram kamu. Berbasis zona waktu WIB (Asia/Jakarta).
            </p>
            <div className="text-[11px] text-slate-500">
              © 2026 TataDana Fintech Indonesia. All rights reserved.
            </div>
          </div>

          {/* Col 2 */}
          <div className="space-y-2">
            <div className="text-white font-bold text-xs uppercase tracking-wider">Produk</div>
            <ul className="space-y-1.5 text-[11px]">
              <li><a href="#fitur" className="hover:text-white">Bot Telegram</a></li>
              <li><a href="#fitur" className="hover:text-white">AI Vision OCR Struk</a></li>
              <li><a href="#fitur" className="hover:text-white">Voice Note STT</a></li>
              <li><a href="#demo" className="hover:text-white">Web Dashboard</a></li>
            </ul>
          </div>

          {/* Col 3 */}
          <div className="space-y-2">
            <div className="text-white font-bold text-xs uppercase tracking-wider">Perusahaan</div>
            <ul className="space-y-1.5 text-[11px]">
              <li><a href="#" className="hover:text-white">Tentang Kami</a></li>
              <li><a href="#" className="hover:text-white">Blog Keuangan</a></li>
              <li><a href="#" className="hover:text-white">Karir</a></li>
              <li><a href="#fitur" className="hover:text-white">Keamanan Sistem</a></li>
            </ul>
          </div>

          {/* Col 4 */}
          <div className="space-y-2">
            <div className="text-white font-bold text-xs uppercase tracking-wider">Legal & Bantuan</div>
            <ul className="space-y-1.5 text-[11px]">
              <li><a href="#" className="hover:text-white">Kebijakan Privasi</a></li>
              <li><a href="#" className="hover:text-white">Syarat & Ketentuan</a></li>
              <li><a href="#" className="hover:text-white">Kontak Support WhatsApp</a></li>
              <li><a href="#" className="hover:text-white">Dokumentasi API</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
