'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  GraduationCap, 
  Calculator, 
  Terminal, 
  BookOpen, 
  Copy, 
  Check, 
  ArrowRight, 
  Sparkles, 
  PieChart, 
  CheckCircle2, 
  Lightbulb, 
  TrendingUp, 
  ShieldAlert, 
  Wallet, 
  ChevronRight, 
  X, 
  ExternalLink,
  Smartphone
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils/currency';

interface Lesson {
  id: string;
  title: string;
  category: string;
  readTime: string;
  emoji: string;
  summary: string;
  content: string[];
  tips: string[];
}

export default function LearnCenterPage() {
  // 50/30/20 Calculator State
  const [incomeInput, setIncomeInput] = useState<string>('10000000');
  const incomeNumber = parseFloat(incomeInput.replace(/[^0-9]/g, '')) || 0;

  const needsAmount = Math.round(incomeNumber * 0.50);
  const wantsAmount = Math.round(incomeNumber * 0.30);
  const savingsAmount = Math.round(incomeNumber * 0.20);

  // Copy Cheat Sheet State
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // Completed Lessons State
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [activeLesson, setActiveLesson] = useState<Lesson | null>(null);

  // Filter States
  const [commandFilter, setCommandFilter] = useState<'all' | 'catat' | 'saldo' | 'laporan' | 'pro'>('all');
  const [commandSearch, setCommandSearch] = useState('');
  const [lessonFilter, setLessonFilter] = useState<string>('all');

  const telegramCommands = [
    {
      category: 'saldo',
      command: '/saldo',
      description: 'Cek total saldo terkonsolidasi & rincian semua rekening bank/e-wallet real-time.',
      example: 'Ketik: /saldo'
    },
    {
      category: 'catat',
      command: 'beli bakso 15rb',
      description: 'Catat pengeluaran instan dengan NLP parser AI otomatis tanpa perlu form manual.',
      example: 'Ketik: beli bakso 15rb'
    },
    {
      category: 'catat',
      command: 'gajian 8.5jt',
      description: 'Catat pemasukan gaji otomatis bertambah ke rekening utama dompet default.',
      example: 'Ketik: gajian 8.5jt pt maju berkah'
    },
    {
      category: 'saldo',
      command: '/hari ini',
      description: 'Lihat ringkasan mutasi dan pengeluaran hari ini serta sisa kuota harian.',
      example: 'Ketik: /hari ini'
    },
    {
      category: 'catat',
      command: 'bensin 50k tunai',
      description: 'Catat mutasi dengan spesifikasi dompet sumber (tunai, bca, gopay, mandiri).',
      example: 'Ketik: bensin 50k tunai'
    },
    {
      category: 'pro',
      command: 'foto struk belanja',
      description: 'Kirim foto struk belanja untuk dipindai otomatis oleh AI Vision OCR TataDana.',
      example: 'Lampirkan foto kasir mart/resto'
    },
    {
      category: 'laporan',
      command: '/laporan',
      description: 'Download rekapitulasi keuangan bulanan dalam format file PDF atau Excel XLS.',
      example: 'Ketik: /laporan bulanan'
    },
    {
      category: 'laporan',
      command: '/kategori',
      description: 'Periksa status pemakaian kuota anggaran per kategori (Aman, 80%, atau Overlimit).',
      example: 'Ketik: /kategori'
    }
  ];

  const lessons: Lesson[] = [
    {
      id: 'lesson-1',
      title: 'Fondasi Dana Darurat 3-6 Bulan',
      category: 'Fondasi Finansial',
      readTime: '3 Menit',
      emoji: '🛡️',
      summary: 'Mengapa dana darurat adalah perisai utama sebelum Anda mulai berinvestasi.',
      content: [
        'Dana darurat adalah sejumlah uang tunai atau instrumen likuid yang disisihkan khusus untuk menghadapi kondisi tidak terduga, seperti kehilangan pekerjaan, sakit mendadak, atau kerusakan rumah dan kendaraan.',
        'Rumus umum dana darurat bagi lajang adalah 3 hingga 6 kali pengeluaran rutin bulanan. Jika pengeluaran Anda Rp 5.000.000/bulan, target dana darurat minimal adalah Rp 15.000.000 hingga Rp 30.000.000.',
        'Untuk yang sudah menikah dan memiliki tanggungan anak, idealnya dana darurat disiapkan sebesar 6 hingga 12 kali pengeluaran bulanan.',
        'Simpan dana darurat di instrumen yang aman dari fluktuasi dan mudah dicairkan kapan saja (maksimal 1x24 jam), seperti Reksa Dana Pasar Uang (RDPU) atau Deposito Digital berbunga harian.'
      ],
      tips: [
        'Jangan simpan dana darurat di saham atau kripto karena risikonya fluktuatif.',
        'Pisahkan rekening dana darurat dari rekening belanja sehari-hari agar tidak terpakai tanpa sadar.',
        'Bangun dana darurat secara bertahap dengan menyisihkan 10-20% dari gaji setiap bulan.'
      ]
    },
    {
      id: 'lesson-2',
      title: 'Formula Budgeting 50/30/20 Anti Gagal',
      category: 'Metode Penganggaran',
      readTime: '4 Menit',
      emoji: '📊',
      summary: 'Metode pembagian gaji paling seimbang yang diperkenalkan oleh Senator Elizabeth Warren.',
      content: [
        'Aturan 50/30/20 adalah salah satu metode perencanaan keuangan paling sederhana namun efektif di dunia. Metode ini membagi penghasilan bersih bulanan menjadi 3 pos utama:',
        '1. 50% untuk Kebutuhan Pokok (Needs): Sewa tempat tinggal, cicilan KPR, tagihan listrik, internet, belanja dapur, transportasi wajib, dan premi asuransi dasar.',
        '2. 30% untuk Keinginan & Lifestyle (Wants): Belanja baju baru, makan di restoran favorit, langganan Netflix/Spotify, hobi, dan liburan akhir pekan.',
        '3. 20% untuk Tabungan & Investasi (Savings): Alokasi dana darurat, investasi saham dividen atau reksa dana, serta tabungan masa depan.',
        'Keunggulan metode ini adalah Anda tidak merasa terkekang karena masih memiliki porsi 30% untuk menikmati hidup tanpa rasa bersalah.'
      ],
      tips: [
        'Langsung potong 20% tabungan di hari gajian (Pay Yourself First).',
        'Gunakan fitur multi-dompet di TataDana untuk memisahkan pos Kebutuhan dan Keinginan.',
        'Jika porsi Kebutuhan melebihi 50%, pangkas sementara pos Keinginan hingga seimbang.'
      ]
    },
    {
      id: 'lesson-3',
      title: 'Strategi Melunasi Hutang: Snowball vs Avalanche',
      category: 'Manajemen Hutang',
      readTime: '5 Menit',
      emoji: '⚡',
      summary: 'Dua pendekatan taktis melunasi hutang konsumtif dan pinjol secara terstruktur.',
      content: [
        'Ketika memiliki beberapa pinjaman atau tagihan kartu kredit, Anda membutuhkan strategi terarah agar tidak terjebak bunga berbunga.',
        'Metode Snowball (Bola Salju): Fokus melunasi hutang dengan saldo nominal terkecil terlebih dahulu, sementara hutang lainnya cukup dibayar cicilan minimum. Saat hutang terkecil lunas, alihkan dananya untuk melunasi hutang terkecil berikutnya. Keunggulannya memberikan dorongan psikologis positif secara cepat.',
        'Metode Avalanche (Longsoran Salju): Fokus melunasi hutang dengan tingkat bunga tertinggi terlebih dahulu. Secara matematis, metode ini menghemat lebih banyak biaya bunga dalam jangka panjang.',
        'Pilihlah metode Snowball jika Anda butuh motivasi cepat, atau pilih metode Avalanche jika Anda berorientasi pada efisiensi rupiah tertinggi.'
      ],
      tips: [
        'Hentikan pembuatan hutang baru sebelum hutang lama lunas.',
        'Negosiasikan restrukturisasi bunga jika beban cicilan terasa mencekik.',
        'Gunakan dana bonus atau THR 100% untuk akselerasi pelunasan hutang.'
      ]
    },
    {
      id: 'lesson-4',
      title: 'Memulai Investasi Reksa Dana & Saham Pemula',
      category: 'Investasi & Pertumbuhan',
      readTime: '4 Menit',
      emoji: '📈',
      summary: 'Langkah awal menumbuhkan kekayaan dan melawan inflasi dengan aman.',
      content: [
        'Inflasi menggerus nilai uang tunai setiap tahun. Agar daya beli Anda terjaga di masa depan, uang harus diinvestasikan ke aset produktif.',
        'Bagi pemula, mulailah dengan Reksa Dana Pasar Uang (RDPU) dan Reksa Dana Pendapatan Tetap (RDPT) yang risikonya relatif terukur dan imbal hasilnya di atas bunga tabungan biasa.',
        'Untuk horizon investasi lebih dari 5 tahun, Anda dapat mempertimbangkan Saham Bluechip (LQ45) yang rutin membagikan dividen atau Reksa Dana Indeks.',
        'Terapkan metode Dollar-Cost Averaging (DCA), yaitu membeli secara rutin dengan nominal yang sama setiap bulan, tanpa perlu pusing menebak kapan harga pasar terendah atau tertinggi.'
      ],
      tips: [
        'Hanya investasikan "uang dingin", bukan uang kebutuhan sehari-hari atau dana darurat.',
        'Pahami profil risiko Anda sebelum memilih produk investasi.',
        'Fokus pada konsistensi jangka panjang, bukan keuntungan instan yang berisiko tinggi.'
      ]
    },
    {
      id: 'lesson-5',
      title: 'Manajemen Cashflow Tim & Bisnis UMKM',
      category: 'Keuangan Bisnis',
      readTime: '5 Menit',
      emoji: '🏢',
      summary: 'Kunci menjaga kelangsungan bisnis UMKM lewat transparansi kas bersama.',
      content: [
        'Salah satu penyebab utama kegagalan UMKM adalah tercampurnya uang pribadi pemilik dan uang kas operasional usaha.',
        'Setiap bisnis wajib memiliki rekening bank dan buku kas terpisah. Pemilik sebaiknya digaji secara tetap setiap bulan layaknya karyawan, bukan mengambil uang kasir seenaknya.',
        'Gunakan sistem approval bertingkat untuk pengeluaran usaha. Tunjuk seorang Bendahara yang bertugas mencatat mutasi, dan Owner bertindak sebagai pemberi otorisasi akhir.',
        'Sisihkan cadangan modal kerja minimal 3 bulan biaya operasional untuk mengantisipasi penurunan omset atau keterlambatan pembayaran invoice klien.'
      ],
      tips: [
        'Manfaatkan fitur Kolaborasi Tim di TataDana untuk membagikan akses mutasi ke mitra bisnis.',
        'Lakukan rekonsiliasi kas fisik dan rekening bank minimal seminggu sekali.',
        'Simpan bukti nota dan invoice digital untuk kemudahan audit tahunan.'
      ]
    },
    {
      id: 'lesson-6',
      title: 'Otomasi Finansial Lewat Telegram Bot TataDana',
      category: 'Teknologi & TataDana',
      readTime: '3 Menit',
      emoji: '🤖',
      summary: 'Catat pengeluaran hanya dalam 3 detik tanpa repot membuka aplikasi.',
      content: [
        'TataDana mengintegrasikan kecerdasan buatan (AI) ke dalam bot Telegram pribadi Anda. Bot ini memahami bahasa percakapan sehari-hari bahasa Indonesia.',
        'Anda cukup mengetik pesan seperti "kopi kenangan 28rb gopay" atau mengirimkan rekaman suara note 3 detik, AI akan langsung mengekstrak nominal, kategori, dan dompet yang bersangkutan.',
        'Saat Anda berbelanja di minimarket atau restoran, cukup foto struk kasir Anda. Fitur OCR akan membaca total nota belanja dan mencatatnya ke buku kas Anda.',
        'Bot juga berfungsi sebagai asisten pribadi yang mengirimkan peringatan otomatis ketika pengeluaran kategori Anda telah mendekati ambang 80% atau 100% dari target.'
      ],
      tips: [
        'Simpan pin chat bot Telegram TataDana di posisi teratas agar mudah diakses.',
        'Aktifkan reminder harian di jam 12:00 dan 20:00 WIB agar tidak ada transaksi yang terlewat.',
        'Gunakan perintah /saldo setiap pagi untuk memantau sisa uang saku harian Anda.'
      ]
    }
  ];

  const fallbackCopy = (text: string) => {
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-9999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    } catch (e) {}
  };

  const handleCopyCommand = (text: string, index: number) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleLessonComplete = (lessonId: string) => {
    if (completedLessons.includes(lessonId)) {
      setCompletedLessons(prev => prev.filter(id => id !== lessonId));
    } else {
      setCompletedLessons(prev => [...prev, lessonId]);
    }
  };

  return (
    <div className="space-y-8 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">🎓 Pusat Belajar & Cheat Sheet Finansial</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-orange-100 text-orange-700 rounded-full">
              Fintech Academy
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Panduan praktis pengelolaan keuangan, kalkulator alokasi 50/30/20, dan contekan perintah bot Telegram.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/teamwork-preview"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs"
          >
            <span>👥 Kolaborasi 10 Tim</span>
          </Link>
          <Link
            href="/budgets"
            className="flex items-center gap-1.5 px-3.5 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            <span>🎯 Atur Target Budget</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* SECTION 1: INTERACTIVE 50/30/20 CALCULATOR */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-orange-500 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Kalkulator Budgeting 50/30/20 Interaktif</h2>
              <p className="text-xs text-slate-500">Masukkan penghasilan bulanan Anda untuk menghitung porsi ideal secara otomatis</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl px-4 py-2 w-full md:w-auto">
              <span className="text-xs font-bold text-slate-500">Gaji Bersih: Rp</span>
              <input
                type="number"
                value={incomeInput}
                onChange={(e) => setIncomeInput(e.target.value)}
                placeholder="10000000"
                className="bg-transparent text-sm font-black text-slate-900 focus:outline-none w-36"
              />
            </div>
            {/* Quick Presets */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { label: '5 Jt (UMR)', val: '5000000' },
                { label: '10 Jt', val: '10000000' },
                { label: '20 Jt', val: '20000000' },
                { label: '50 Jt', val: '50000000' },
              ].map(p => (
                <button
                  key={p.val}
                  type="button"
                  onClick={() => setIncomeInput(p.val)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-bold border transition ${
                    incomeInput === p.val 
                      ? 'bg-orange-500 text-white border-orange-500 shadow-xs' 
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Visual Allocation Bar */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-emerald-700">50% Kebutuhan Pokok</span>
            <span className="text-amber-700">30% Keinginan & Lifestyle</span>
            <span className="text-blue-700">20% Tabungan & Investasi</span>
          </div>
          <div className="w-full h-4 bg-slate-100 rounded-full flex overflow-hidden p-0.5 border border-slate-200">
            <div className="h-full bg-emerald-500 rounded-l-full" style={{ width: '50%' }}></div>
            <div className="h-full bg-amber-500" style={{ width: '30%' }}></div>
            <div className="h-full bg-blue-500 rounded-r-full" style={{ width: '20%' }}></div>
          </div>
        </div>

        {/* 3 Allocation Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
          {/* 50% Needs */}
          <div className="bg-emerald-50/60 border border-emerald-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">50% Kebutuhan Pokok</span>
              <span className="text-lg">🏡</span>
            </div>
            <div className="text-2xl font-black text-emerald-950">
              {formatRupiah(needsAmount)}
            </div>
            <p className="text-xs text-emerald-900/80 leading-relaxed">
              Pos wajib untuk kelangsungan hidup: sewa rumah, belanja beras & lauk, tagihan listrik/air, internet, transportasi kantor, dan premi asuransi dasar.
            </p>
            <div className="text-[11px] font-semibold text-emerald-800 bg-white/80 rounded-xl p-2.5 border border-emerald-200/60">
              💡 Saran: Jaga total cicilan dan sewa agar tidak melebihi 30% dari pos ini.
            </div>
          </div>

          {/* 30% Wants */}
          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-amber-800 uppercase tracking-wider">30% Keinginan (Wants)</span>
              <span className="text-lg">☕</span>
            </div>
            <div className="text-2xl font-black text-amber-950">
              {formatRupiah(wantsAmount)}
            </div>
            <p className="text-xs text-amber-900/80 leading-relaxed">
              Pos gaya hidup untuk menikmati hasil kerja keras: nongkrong di kafe, makan di restoran, langganan streaming film, hobi olahraga, dan traveling santai.
            </p>
            <div className="text-[11px] font-semibold text-amber-800 bg-white/80 rounded-xl p-2.5 border border-amber-200/60">
              💡 Saran: Hindari berhutang atau paylater untuk pos belanja keinginan.
            </div>
          </div>

          {/* 20% Savings */}
          <div className="bg-blue-50/60 border border-blue-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-blue-800 uppercase tracking-wider">20% Tabungan & Investasi</span>
              <span className="text-lg">📈</span>
            </div>
            <div className="text-2xl font-black text-blue-950">
              {formatRupiah(savingsAmount)}
            </div>
            <p className="text-xs text-blue-900/80 leading-relaxed">
              Pos masa depan untuk perlindungan dan kebebasan finansial: dana darurat likuid, reksa dana pasar uang, saham dividen, sukuk syariah, dan emas fisik.
            </p>
            <div className="text-[11px] font-semibold text-blue-800 bg-white/80 rounded-xl p-2.5 border border-blue-200/60">
              💡 Saran: Sisihkan pos ini di awal gajian (metode Pay Yourself First).
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: TELEGRAM BOT CHEAT SHEET */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white shrink-0 shadow-xs">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Contekan Perintah Bot Telegram (Cheat Sheet)</h2>
              <p className="text-xs text-slate-500">Klik perintah untuk menyalin ke clipboard dan gunakan langsung di chat bot @TataDana</p>
            </div>
          </div>

          <span className="text-xs font-bold text-sky-800 bg-sky-50 border border-sky-200 px-3 py-1 rounded-full self-start sm:self-center">
            NLP Parser Aktif ⚡
          </span>
        </div>

        {/* Filter and Search Bar for Commands */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
            {[
              { key: 'all', label: 'Semua Perintah' },
              { key: 'catat', label: '💸 Catat Mutasi' },
              { key: 'saldo', label: '🏦 Cek Saldo' },
              { key: 'pro', label: '🧾 OCR & Struk' },
              { key: 'laporan', label: '📊 Laporan' },
            ].map(tab => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setCommandFilter(tab.key as any)}
                className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                  commandFilter === tab.key
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-60">
            <input
              type="text"
              placeholder="Cari perintah bot..."
              value={commandSearch}
              onChange={(e) => setCommandSearch(e.target.value)}
              className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs placeholder-slate-400 focus:outline-none focus:border-orange-500"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {telegramCommands
            .filter(item => {
              if (commandFilter !== 'all' && item.category !== commandFilter) return false;
              if (commandSearch.trim()) {
                const q = commandSearch.toLowerCase();
                return item.command.toLowerCase().includes(q) || item.description.toLowerCase().includes(q);
              }
              return true;
            })
            .map((item, idx) => (
            <div
              key={idx}
              onClick={() => handleCopyCommand(item.command, idx)}
              className="group p-4 rounded-2xl border border-slate-200 hover:border-orange-400 bg-slate-50/50 hover:bg-orange-50/30 transition cursor-pointer flex items-start justify-between gap-3 shadow-xs"
            >
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <code className="text-xs font-mono font-bold text-orange-600 bg-white px-2 py-0.5 rounded-md border border-slate-200">
                    {item.command}
                  </code>
                  {copiedIndex === idx && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1 animate-in fade-in duration-150">
                      <Check className="w-3 h-3" /> Tersalin!
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 leading-snug">{item.description}</p>
                <p className="text-[11px] text-slate-400 font-mono mt-1">{item.example}</p>
              </div>

              <button
                type="button"
                className="p-2 rounded-xl text-slate-400 group-hover:text-orange-600 group-hover:bg-white transition shrink-0"
                title="Salin Perintah"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 3: 6 FINTECH LEARNING MODULES */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-slate-900">📚 6 Modul Panduan Finansial Terstruktur</h2>
            <p className="text-xs text-slate-500">Materi kurasi mendalam untuk meningkatkan literasi dan ketahanan finansial Anda</p>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <div className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl flex items-center gap-2">
              <span>Progres Belajar:</span>
              <span className="text-orange-600 font-extrabold">{completedLessons.length}/{lessons.length}</span>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs space-y-2">
          <div className="flex justify-between items-center text-xs font-bold">
            <span className="text-slate-700">Tingkat Penyelesaian Modul:</span>
            <span className="text-orange-600 font-black">{Math.round((completedLessons.length / lessons.length) * 100)}%</span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div 
              className="h-2.5 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500" 
              style={{ width: `${Math.round((completedLessons.length / lessons.length) * 100)}%` }}
            />
          </div>
        </div>

        {/* Lesson Category Filters */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { key: 'all', label: 'Semua Modul' },
            { key: 'Fondasi Finansial', label: '🛡️ Fondasi Finansial' },
            { key: 'Metode Penganggaran', label: '📊 Budgeting' },
            { key: 'Manajemen Hutang', label: '⚡ Hutang' },
            { key: 'Investasi & Pertumbuhan', label: '📈 Investasi' },
            { key: 'Keuangan Bisnis', label: '🏢 Bisnis UMKM' },
            { key: 'Teknologi & TataDana', label: '🤖 TataDana' },
          ].map(cat => (
            <button
              key={cat.key}
              type="button"
              onClick={() => setLessonFilter(cat.key)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition ${
                lessonFilter === cat.key
                  ? 'bg-orange-500 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {lessons
            .filter(l => lessonFilter === 'all' || l.category === lessonFilter)
            .map((lesson) => {
            const isDone = completedLessons.includes(lesson.id);

            return (
              <div
                key={lesson.id}
                className={`bg-white border rounded-2xl p-5 shadow-xs flex flex-col justify-between space-y-4 transition ${
                  isDone ? 'border-emerald-300 bg-emerald-50/20' : 'border-slate-200 hover:border-orange-300'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-3xl p-2 bg-slate-50 border border-slate-100 rounded-xl shadow-xs">
                      {lesson.emoji}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                        ⏱️ {lesson.readTime}
                      </span>
                      {isDone && (
                        <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Selesai
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <span className="text-[11px] font-bold text-orange-600 block mb-0.5">{lesson.category}</span>
                    <h3 className="font-bold text-sm text-slate-900 leading-snug">{lesson.title}</h3>
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2 leading-relaxed">
                      {lesson.summary}
                    </p>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => toggleLessonComplete(lesson.id)}
                    className={`text-xs font-bold transition flex items-center gap-1 ${
                      isDone ? 'text-emerald-700 hover:text-emerald-800' : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 ${isDone ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>{isDone ? 'Sudah Dipelajari' : 'Tandai Selesai'}</span>
                  </button>

                  <button
                    onClick={() => setActiveLesson(lesson)}
                    className="px-3 py-1.5 bg-orange-50 hover:bg-orange-500 text-orange-700 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                  >
                    <span>Baca</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* READING MODAL */}
      {activeLesson && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[85vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <span className="text-3xl p-2.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  {activeLesson.emoji}
                </span>
                <div>
                  <span className="text-[11px] font-bold text-orange-600 block">{activeLesson.category}</span>
                  <h2 className="text-lg font-black text-slate-900 leading-snug">{activeLesson.title}</h2>
                  <span className="text-[11px] text-slate-400 mt-0.5 block">Waktu baca estimasi: {activeLesson.readTime}</span>
                </div>
              </div>
              <button
                onClick={() => setActiveLesson(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700 leading-relaxed flex-1">
              {activeLesson.content.map((paragraph, pIdx) => (
                <p key={pIdx} className="leading-relaxed">
                  {paragraph}
                </p>
              ))}

              {/* Actionable Tips */}
              <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 space-y-2 mt-4">
                <h4 className="font-bold text-orange-950 flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-orange-500" />
                  Tips Praktis Penerapan:
                </h4>
                <ul className="space-y-1.5 text-orange-900/90 pl-4 list-disc">
                  {activeLesson.tips.map((tip, tIdx) => (
                    <li key={tIdx}>{tip}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => {
                  toggleLessonComplete(activeLesson.id);
                  setActiveLesson(null);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                  completedLessons.includes(activeLesson.id)
                    ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {completedLessons.includes(activeLesson.id) ? 'Tandai Belum Selesai' : 'Tandai Sudah Selesai'}
                </span>
              </button>

              <button
                onClick={() => setActiveLesson(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
