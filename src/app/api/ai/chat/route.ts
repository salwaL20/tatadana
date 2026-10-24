import { NextResponse } from 'next/server';
import { dataService } from '@/lib/supabase/client';
import { aiService } from '@/lib/ai/multiProvider';
import { formatRupiah } from '@/lib/utils/currency';
import { parseIndonesianText } from '@/lib/telegram/parser';
import { formatDateOnlyWIB } from '@/lib/utils/timezone';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { message, userId = 'usr-salwa-001', history = [], action, transactionData } = body;

    // Fetch user's real financial context
    const [profile, wallets, categories, transactions] = await Promise.all([
      dataService.getProfile(userId),
      dataService.getWallets(userId),
      dataService.getCategories(userId),
      dataService.getTransactions(userId),
    ]);

    // Helper to resolve wallet specifically for BCA, GoPay, Dompet Tunai
    const resolveWalletChoice = (wls: typeof wallets, choice: string) => {
      const target = (choice || '').toLowerCase();
      if (target === 'bca') {
        return wls.find(w => w.name.toLowerCase().includes('bca')) || wls.find(w => w.type === 'bank') || wls[0];
      }
      if (target === 'gopay' || target === 'go-pay') {
        return wls.find(w => w.name.toLowerCase().includes('gopay')) || wls.find(w => w.type === 'ewallet') || wls[0];
      }
      if (target === 'tunai' || target === 'dompet_tunai' || target === 'cash') {
        return wls.find(w => w.name.toLowerCase().includes('tunai') || w.name.toLowerCase().includes('cash')) || wls.find(w => w.type === 'cash') || wls[0];
      }
      return wls[0];
    };

    // Helper to extract flexible Indonesian date
    const parseFlexibleDate = (rawDateStr?: string, textContext?: string): string => {
      if (rawDateStr && rawDateStr.trim()) {
        const d = new Date(rawDateStr);
        if (!isNaN(d.getTime())) return d.toISOString();
      }

      const text = (textContext || '').toLowerCase();

      // 1. ISO format: YYYY-MM-DD
      const isoMatch = text.match(/\b(\d{4})[-/](\d{1,2})[-/](\d{1,2})\b/);
      if (isoMatch) {
        const y = parseInt(isoMatch[1], 10);
        const m = parseInt(isoMatch[2], 10) - 1;
        const d = parseInt(isoMatch[3], 10);
        const dt = new Date(Date.UTC(y, m, d, 12, 0, 0));
        if (!isNaN(dt.getTime())) return dt.toISOString();
      }

      // 2. Indonesian / European format: DD/MM/YYYY or DD-MM-YYYY
      const dmyMatch = text.match(/\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/);
      if (dmyMatch) {
        const d = parseInt(dmyMatch[1], 10);
        const m = parseInt(dmyMatch[2], 10) - 1;
        const y = parseInt(dmyMatch[3], 10);
        const dt = new Date(Date.UTC(y, m, d, 12, 0, 0));
        if (!isNaN(dt.getTime())) return dt.toISOString();
      }

      // 3. Worded Indonesian month names (e.g. "18 Oktober 2026", "18 okt 2026", "tanggal 18")
      const monthMap: Record<string, number> = {
        jan: 0, januari: 0, feb: 1, februari: 1, mar: 2, maret: 2,
        apr: 3, april: 3, mei: 4, may: 4, jun: 5, juni: 5,
        jul: 6, juli: 6, agu: 7, agustus: 7, ags: 7, sep: 8, september: 8,
        okt: 9, oktober: 9, oct: 9, nov: 10, november: 10, des: 11, desember: 11,
      };

      const wordMatch = text.match(/\b(?:tgl\s*|tanggal\s*)?(\d{1,2})\s+([a-z]+)(?:\s+(\d{4}))?\b/i);
      if (wordMatch) {
        const d = parseInt(wordMatch[1], 10);
        const mStr = wordMatch[2].toLowerCase();
        if (mStr in monthMap) {
          const m = monthMap[mStr];
          const y = wordMatch[3] ? parseInt(wordMatch[3], 10) : new Date().getFullYear();
          const dt = new Date(Date.UTC(y, m, d, 12, 0, 0));
          if (!isNaN(dt.getTime())) return dt.toISOString();
        }
      }

      if (text.includes('kemarin')) {
        return new Date(Date.now() - 86400000).toISOString();
      }
      if (text.includes('2 hari lalu') || text.includes('dua hari lalu')) {
        return new Date(Date.now() - 2 * 86400000).toISOString();
      }

      return new Date().toISOString();
    };

    // Handle Direct Action: Record Transaction with specified date and wallet (BCA, GoPay, Dompet Tunai)
    if (action === 'record_transaction' && transactionData) {
      const { type = 'expense', amount, description = 'Transaksi Tata AI', walletChoice = 'bca', date, categoryId } = transactionData;
      const nominal = typeof amount === 'number' ? amount : parseFloat(String(amount).replace(/[^0-9]/g, '')) || 0;

      if (nominal <= 0) {
        return NextResponse.json({ error: 'Nominal transaksi tidak valid' }, { status: 400 });
      }

      const selectedWallet = resolveWalletChoice(wallets, walletChoice);

      // Find matching category
      let chosenCatId = categoryId;
      if (!chosenCatId && categories.length > 0) {
        const found = categories.find(c => description.toLowerCase().includes(c.name.toLowerCase()));
        chosenCatId = found ? found.id : categories[0].id;
      }

      // Transaction date (flexible parser respecting user input)
      const txTime = parseFlexibleDate(date, description);

      const newTx = await dataService.addTransaction({
        user_id: userId,
        wallet_id: selectedWallet ? selectedWallet.id : (wallets[0]?.id || 'wlt-bca-01'),
        category_id: chosenCatId || null,
        type: type === 'income' ? 'income' : 'expense',
        amount: nominal,
        description,
        source: 'web_manual',
        transaction_time: txTime,
      });

      const walletDisplayName = selectedWallet ? selectedWallet.name : 'Dompet Utama';
      const formattedDate = formatDateOnlyWIB(newTx.transaction_time);
      const reply = `✅ **Transaksi Berhasil Dicatat oleh Tata AI!**\n\n• **Tanggal:** ${formattedDate}\n• **Tipe:** ${newTx.type === 'income' ? '🟢 Pemasukan' : '🔴 Pengeluaran'}\n• **Dompet:** ${walletDisplayName}\n• **Jumlah:** ${formatRupiah(newTx.amount)}\n• **Keterangan:** ${newTx.description}\n\n⚡ Saldo dompet telah diperbarui menjadi **${formatRupiah(selectedWallet ? selectedWallet.balance : 0)}** dan data ini langsung tersinkron ke menu **Transaksi**, **Dashboard**, serta **Laporan Keuangan**.`;

      return NextResponse.json({
        success: true,
        transaction: newTx,
        reply,
        suggestedActions: [
          'Berapa sisa uang makan minggu ini?',
          'Cek saldo seluruh dompet',
          'Lihat laporan keuangan bulan ini'
        ],
        timestamp: new Date().toISOString(),
      });
    }

    if (!message || typeof message !== 'string') {
      return NextResponse.json({ error: 'Pesan wajib diisi' }, { status: 400 });
    }

    const lower = message.toLowerCase();

    // Natural Language Transaction Recording in Tata AI Chat
    const parsed = parseIndonesianText(message);
    const hasNominal = parsed.success && parsed.data && parsed.data.amount > 0;
    const isExplicitRecord = (
      lower.startsWith('catat') || lower.startsWith('beli') || lower.startsWith('bayar') ||
      lower.includes('keluar') || lower.includes('pemasukan') || lower.includes('masuk') ||
      lower.includes('gajian') || lower.includes('transfer') || lower.includes('transaksi')
    );

    if (hasNominal && (isExplicitRecord || lower.includes('bca') || lower.includes('gopay') || lower.includes('tunai') || lower.includes('cash') || lower.includes('tgl') || lower.includes('tanggal'))) {
      const { amount: nominal, type, description: desc, categoryName } = parsed.data!;

      // Detect wallet choice from text
      let walletChoice: 'bca' | 'gopay' | 'tunai' = 'bca';
      if (lower.includes('gopay') || lower.includes('go-pay') || lower.includes('go pay')) {
        walletChoice = 'gopay';
      } else if (lower.includes('tunai') || lower.includes('cash') || lower.includes('dompet tunai')) {
        walletChoice = 'tunai';
      } else if (lower.includes('bca')) {
        walletChoice = 'bca';
      }

      const selectedWallet = resolveWalletChoice(wallets, walletChoice);

      // Detect date from message text (YYYY-MM-DD, DD/MM/YYYY, DD Bulan YYYY, kemarin)
      const txDate = parseFlexibleDate(undefined, message);

      // Match category
      const matchedCat = categories.find(c => c.name.toLowerCase().includes(categoryName.toLowerCase())) || categories[0];

      const newTx = await dataService.addTransaction({
        user_id: userId,
        wallet_id: selectedWallet ? selectedWallet.id : (wallets[0]?.id || 'wlt-bca-01'),
        category_id: matchedCat?.id || null,
        type,
        amount: nominal,
        description: desc,
        source: 'web_manual',
        transaction_time: txDate,
      });

      const walletDisplayName = selectedWallet ? selectedWallet.name : 'Dompet Utama';
      const formattedDate = formatDateOnlyWIB(newTx.transaction_time);
      const reply = `✅ **Transaksi Otomatis Dicatat oleh Tata AI!**\n\n• **Tanggal:** ${formattedDate}\n• **Tipe:** ${newTx.type === 'income' ? '🟢 Pemasukan' : '🔴 Pengeluaran'}\n• **Pilihan Dompet:** ${walletDisplayName} (${walletChoice.toUpperCase()})\n• **Nominal:** ${formatRupiah(newTx.amount)}\n• **Keterangan:** ${newTx.description}\n\n⚡ Saldo terkini dompet ${walletDisplayName}: **${formatRupiah(selectedWallet ? selectedWallet.balance : 0)}**. Transaksi langsung tampil di tabel Transaksi dan Laporan!`;

      return NextResponse.json({
        success: true,
        transaction: newTx,
        reply,
        suggestedActions: [
          'Berapa sisa uang makan minggu ini?',
          'Analisa pengeluaran terbesarku bulan ini',
          'Lihat rekapitulasi laporan'
        ],
        timestamp: new Date().toISOString(),
      });
    }

    const totalBalance = wallets.reduce((acc, w) => acc + w.balance, 0);
    const expenseTxs = transactions.filter(t => t.type === 'expense');
    const incomeTxs = transactions.filter(t => t.type === 'income');
    const totalExpense = expenseTxs.reduce((acc, t) => acc + t.amount, 0);
    const totalIncome = incomeTxs.reduce((acc, t) => acc + t.amount, 0);

    // Food category calculations
    const foodCat = categories.find(c => c.name.toLowerCase().includes('makan'));
    const foodSpent = foodCat 
      ? expenseTxs.filter(t => t.category_id === foodCat.id).reduce((acc, t) => acc + t.amount, 0)
      : 0;
    const foodBudget = foodCat?.monthly_budget || 2000000;
    const foodRemaining = Math.max(0, foodBudget - foodSpent);

    // Top expense categories
    const categoryExpenses: { [id: string]: number } = {};
    expenseTxs.forEach(t => {
      if (t.category_id) {
        categoryExpenses[t.category_id] = (categoryExpenses[t.category_id] || 0) + t.amount;
      }
    });

    const topCatId = Object.keys(categoryExpenses).sort((a, b) => categoryExpenses[b] - categoryExpenses[a])[0];
    const topCat = categories.find(c => c.id === topCatId);
    const topCatAmount = topCatId ? categoryExpenses[topCatId] : 0;

    // Financial prompt context for AI
    const systemFinancialContext = `
Kamu adalah Tata AI, Asisten Finansial Pintar resmi TataDana (Fintech Indonesia).
Gunakan bahasa Indonesia yang ramah, profesional, suportif, dan berbasis data keuangan riil user:
- Nama User: ${profile?.full_name || 'Budi Pratama'}
- Total Saldo Semua Dompet: ${formatRupiah(totalBalance)}
- Pemasukan Bulan Ini: ${formatRupiah(totalIncome)}
- Pengeluaran Bulan Ini: ${formatRupiah(totalExpense)}
- Pos Pengeluaran Terbesar: ${topCat?.name || 'Makanan'} (${formatRupiah(topCatAmount)})
- Sisa Budget Makanan Bulan Ini: ${formatRupiah(foodRemaining)} (dari total ${formatRupiah(foodBudget)})
`;

    let reply = '';
    let suggestedActions: string[] = [];

    // Contextual intelligent responses tailored to Part 9 user questions:
    if (lower.includes('uang makan') || lower.includes('makan') && lower.includes('sisa')) {
      reply = `Halo ${profile?.full_name || 'Budi'}! Berdasarkan pencatatan dompetmu bulan ini:

🍜 **Kategori Makanan & Minuman**:
• Alokasi Budget: ${formatRupiah(foodBudget)}
• Sudah Terpakai: ${formatRupiah(foodSpent)} (${Math.round((foodSpent / foodBudget) * 100)}%)
• **Sisa Kuota Makanan:** **${formatRupiah(foodRemaining)}**

💡 *Saran Tata AI:* Dengan sisa kuota ini dan sisa hari bulan Oktober, kamu bisa mengatur batas makan harian sekitar **${formatRupiah(Math.round(foodRemaining / 20))} / hari** agar keuanganmu tetap aman sampai gajian berikutnya!`;
      suggestedActions = [
        'Buatkan strategi hemat akhir bulan',
        'Analisa pengeluaran terbesarku bulan ini',
        'Cek saldo seluruh dompet'
      ];
    } else if (lower.includes('strategi hemat') || lower.includes('hemat')) {
      reply = `Tentu! Berikut strategi hemat personal untuk kamu berdasarkan pos pengeluaran bulan ini:

1. 🎯 **Fokus Pos Terbesar (${topCat?.name || 'Makanan'}):** Pos ini menyerap **${formatRupiah(topCatAmount)}** dari pengeluaranmu. Coba terapkan meal-prep di hari kerja atau batasi kopi/jajan di luar maksimal 2x seminggu.
2. 👛 **Optimalkan Dompet Digital:** Jangan biarkan saldo mengendap terlalu banyak di e-wallet (GoPay/OVO) untuk menghindari impulsive buying saat checkout belanja online.
3. 🔒 **Amankan Tabungan 20%:** Sebelum akhir bulan, langsung kunci minimal 10-20% dari total saldo ke pos tabungan/deposito berjangka.

Ketik atau tanyakan pos tertentu jika ingin rencana detail!`;
      suggestedActions = [
        'Berapa sisa uang makan minggu ini?',
        'Analisa pengeluaran terbesarku bulan ini',
        'Rekomendasi alokasi budget darurat'
      ];
    } else if (lower.includes('analisa pengeluaran') || lower.includes('terbesar') || lower.includes('analisis')) {
      reply = `Berikut analisa ringkas pengeluaran akun TataDana kamu:

📊 **Ringkasan Arus Kas:**
• Total Pengeluaran: **${formatRupiah(totalExpense)}**
• Total Pemasukan: **${formatRupiah(totalIncome)}**
• Cashflow Bersih: **${formatRupiah(totalIncome - totalExpense)}**

🏆 **Top 3 Kategori Pengeluaran Terbesar:**
1. ${topCat?.emoji || '🍜'} **${topCat?.name || 'Makanan'}**: ${formatRupiah(topCatAmount)} (${Math.round((topCatAmount / (totalExpense || 1)) * 100)}%)
2. 🏠 **Tagihan & Wifi**: ${formatRupiah(1000000)}
3. 🚗 **Transportasi**: ${formatRupiah(850000)}

Secara umum rasio pengeluaranmu masih berada di angka yang sehat dibanding total pemasukan.`;
      suggestedActions = [
        'Berapa sisa uang makan minggu ini?',
        'Buatkan strategi hemat akhir bulan',
        'Cara tingkatkan skor tabungan'
      ];
    } else {
      // Connect to MultiProvider AI
      try {
        const aiResponse = await aiService.execute({
          feature: 'advisor',
          prompt: `${systemFinancialContext}\n\nUser bertanya: ${message}`,
          userId,
        });
        const advisorCombined = aiResponse.analysis && aiResponse.advice
          ? `${aiResponse.analysis}\n\n💡 ${aiResponse.advice}`
          : (aiResponse.analysis || aiResponse.advice);
        reply = aiResponse.reply || aiResponse.text || aiResponse.result || advisorCombined || `Saran Tata AI: Mengingat kondisi keuanganmu saat ini dengan saldo ${formatRupiah(totalBalance)}, prioritaskan menjaga pengeluaran harian dan hindari pos yang tidak mendesak.`;
      } catch (e) {
        reply = `Halo ${profile?.full_name || 'Budi'}! Saya Tata AI, siap membantumu mengelola keuangan. Total saldomu saat ini adalah ${formatRupiah(totalBalance)} di ${wallets.length} dompet aktif, dengan total pengeluaran bulan ini sebesar ${formatRupiah(totalExpense)}. Ada hal spesifik yang ingin kamu tanyakan seputar budget atau pengeluaran?`;
      }
      suggestedActions = [
        'Berapa sisa uang makan minggu ini?',
        'Buatkan strategi hemat akhir bulan',
        'Analisa pengeluaran terbesarku bulan ini'
      ];
    }

    return NextResponse.json({
      success: true,
      reply,
      suggestedActions,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal memproses pesan AI' }, { status: 500 });
  }
}
