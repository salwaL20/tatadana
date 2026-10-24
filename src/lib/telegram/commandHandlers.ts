import { dataService } from '../supabase/client';
import { formatRupiah } from '../utils/currency';
import { formatDateOnlyWIB, formatIndonesianWIB } from '../utils/timezone';
import { createProgressBar } from './formatter';

export async function handleBotCommand(command: string, userId: string = 'usr-budi-12345'): Promise<string> {
  const cleanCmd = command.toLowerCase().trim().split('@')[0]; // Strip bot username tag if present

  // 0. /start
  if (cleanCmd === '/start' || cleanCmd.startsWith('/start')) {
    return `Halo salwa L Bot TataDana siap mencatat keuanganmu.

💬 Cara Mencatat Transaksi:
• "Beli eskrim 10k tunai" ➔ Pengeluaran
• "gajian 8.5jt bca" ➔ Pemasukan
• Kirim Voice Note singkat (maks 60 detik)
• Kirim Foto Struk Belanja (TataDana Pro)

📋 Perintah / Commands:
/saldo — Cek saldo semua dompet
/hari ini — Rekap transaksi hari ini
/minggu ini — Rekap 7 hari terakhir
/bulan ini — Rekap bulan berjalan & breakdown kategori
/budget — Pantau sisa budget kategori
/kalender — Cek kalender & agenda tagihan rutin
/tataai — Konsultasi dengan asisten Tata AI
/sheet — Akses laporan & ekspor Excel/PDF
/bantuan — Menampilkan pusat bantuan`;
  }

  // 1. /saldo
  if (cleanCmd === '/saldo' || cleanCmd.startsWith('/saldo')) {
    const wallets = await dataService.getWallets(userId);
    const total = wallets.reduce((acc, w) => acc + w.balance, 0);

    const lines = wallets.map((w, i) => {
      const isLast = i === wallets.length - 1;
      const branch = isLast ? '└' : '├';
      const defTag = w.is_default ? ' (Default)' : '';
      return `${branch} 👛 ${w.name}${defTag} : ${formatRupiah(w.balance)}`;
    });

    return `🏦 Saldo Dompet TataDana
${lines.join('\n')}

💰 Total Saldo: ${formatRupiah(total)}`;
  }

  // 2. /hari ini
  if (cleanCmd === '/hari ini' || cleanCmd === '/hariini' || cleanCmd === '/hari_ini') {
    const txs = await dataService.getTransactions(userId);
    const todayStr = new Date().toISOString().split('T')[0];
    const todayTxs = txs.filter(t => t.transaction_time.startsWith(todayStr));

    const income = todayTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = todayTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    const list = todayTxs.length > 0 
      ? todayTxs.map(t => `• ${t.description}: ${t.type === 'expense' ? '-' : '+'}${formatRupiah(t.amount)}`).join('\n')
      : 'Belum ada transaksi hari ini.';

    return `📅 Rekap Hari Ini (${formatDateOnlyWIB(new Date())})
💰 Masuk: ${formatRupiah(income)}
💸 Keluar: ${formatRupiah(expense)}
─────────────────
${list}`;
  }

  // 3. /minggu ini
  if (cleanCmd === '/minggu ini' || cleanCmd === '/mingguini' || cleanCmd === '/minggu_ini') {
    const txs = await dataService.getTransactions(userId);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const weekTxs = txs.filter(t => new Date(t.transaction_time) >= sevenDaysAgo);
    const income = weekTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = weekTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    return `📊 Rekap 7 Hari Terakhir
💰 Total Pemasukan : ${formatRupiah(income)}
💸 Total Pengeluaran : ${formatRupiah(expense)}
📈 Net Cashflow     : ${formatRupiah(income - expense)}
📝 Transaksi        : ${weekTxs.length} catatan`;
  }

  // 4. /bulan ini
  if (cleanCmd === '/bulan ini' || cleanCmd === '/bulanini' || cleanCmd === '/bulan_ini') {
    const txs = await dataService.getTransactions(userId);
    const now = new Date();
    const currentYearMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const monthTxs = txs.filter(t => t.transaction_time.startsWith(currentYearMonth));

    const income = monthTxs.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const expense = monthTxs.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    // Category breakdown
    const catMap = new Map<string, number>();
    monthTxs.filter(t => t.type === 'expense').forEach(t => {
      const name = t.category?.name || 'Lainnya';
      catMap.set(name, (catMap.get(name) || 0) + t.amount);
    });

    const catLines = Array.from(catMap.entries()).map(([name, amt]) => {
      return `• ${name}: ${formatRupiah(amt)}`;
    }).join('\n');

    return `🗓️ Rekap Bulan Ini (${now.toLocaleString('id-ID', { month: 'long', year: 'numeric' })})
💰 Masuk : ${formatRupiah(income)}
💸 Keluar : ${formatRupiah(expense)}
─────────────────
Breakdown Kategori:
${catLines || 'Belum ada pengeluaran'}`;
  }

  // 5. /budget
  if (cleanCmd === '/budget') {
    const categories = await dataService.getCategories(userId);
    const txs = await dataService.getTransactions(userId);
    const expenseCats = categories.filter(c => c.type === 'expense' && c.monthly_budget > 0);

    if (expenseCats.length === 0) {
      return `🎯 Belum ada budget kategori yang diatur.\nBuka menu Target / Budget di Dashboard TataDana untuk mengaturnya!`;
    }

    const lines = expenseCats.map(c => {
      const spent = txs.filter(t => t.category_id === c.id && t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      const pct = Math.round((spent / c.monthly_budget) * 100);
      const bar = createProgressBar(pct, 8);
      const remaining = Math.max(0, c.monthly_budget - spent);
      return `${c.emoji} ${c.name}\n${bar} ${pct}% | Sisa: ${formatRupiah(remaining)}`;
    });

    return `🎯 Status Budget Bulan Ini:\n\n${lines.join('\n\n')}`;
  }

  // 6. /sheet, /export, /pdf, /excel
  if (cleanCmd === '/sheet' || cleanCmd === '/export' || cleanCmd === '/pdf' || cleanCmd === '/excel') {
    const baseUrl = process.env.APP_URL || 'http://localhost:3000';
    return `📊 Unduh File PDF & Excel Transaksi TataDana:

📄 Unduh Laporan PDF Lengkap:
👉 ${baseUrl}/api/transactions/export?format=pdf&userId=${userId}

📊 Unduh Laporan Excel (.xlsx) Lengkap:
👉 ${baseUrl}/api/transactions/export?format=excel&userId=${userId}

🌐 Buka & Cetak Struk per Transaksi di Web:
👉 ${baseUrl}/transactions`;
  }

  // 7. /kalender
  if (cleanCmd === '/kalender' || cleanCmd.startsWith('/kalender')) {
    const bills = await dataService.getRecurringBills(userId);
    const billsList = bills.length > 0 
      ? bills.map(b => `• ${b.name} (Tgl ${b.due_day}): ${formatRupiah(b.amount)}`).join('\n')
      : 'Tidak ada tagihan rutin terdaftar.';

    return `📅 Kalender Keuangan & Agenda Arus Kas:
Buka kalender interaktif di: https://tatadana.app/calendar

⏰ Tagihan Rutin Terdekat:
${billsList}`;
  }

  // 8. /tataai
  if (cleanCmd === '/tataai' || cleanCmd === '/ai' || cleanCmd.startsWith('/tataai')) {
    return `🧠 Tata AI — Asisten Finansial Interaktif:
Tanyakan strategi hemat dan konsultasi keuangan langsung di web app:
👉 https://tatadana.app/tata-ai`;
  }

  // 9. /bantuan or default help
  return `🤖 Pusat Bantuan TataDana Bot:

💬 Cara Mencatat:
• "beli bakso 15rb" ➔ Pengeluaran
• "gajian 8.5jt" ➔ Pemasukan
• Kirim Voice Note (maks 60 detik)
• Kirim Foto Struk Belanja (Paket Pro)

📋 Perintah / Commands:
/saldo — Cek saldo semua dompet
/hari ini — Rekap transaksi hari ini
/minggu ini — Rekap 7 hari terakhir
/bulan ini — Rekap bulan berjalan & breakdown
/budget — Pantau sisa budget kategori
/kalender — Cek kalender & agenda tagihan rutin
/tataai — Konsultasi dengan asisten Tata AI
/sheet — Link laporan keuangan lengkap
/bantuan — Menampilkan pesan ini`;
}
