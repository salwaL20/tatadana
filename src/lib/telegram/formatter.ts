import { formatIndonesianWIB, formatShortTimeWIB } from '../utils/timezone';
import { formatRupiah } from '../utils/currency';
import { Category, Wallet } from '@/types/database';

/**
 * Creates visual ASCII progress bar e.g. "██████░░░░"
 */
export function createProgressBar(percentage: number, length: number = 10): string {
  const clamped = Math.max(0, Math.min(100, percentage));
  const filledCount = Math.round((clamped / 100) * length);
  const emptyCount = length - filledCount;
  return '█'.repeat(filledCount) + '░'.repeat(emptyCount);
}

/**
 * Format reply bot for Expense (Pengeluaran)
 * Follows exact template from Part 4.4
 */
export function formatExpenseReply(options: {
  amount: number;
  category: Category;
  wallet: Wallet;
  description: string;
  newBalance: number;
  monthlySpent: number;
  monthlyBudget: number;
  transcript?: string;
  financialAdvisorNote?: string;
}): string {
  const { amount, category, wallet, description, newBalance, monthlySpent, monthlyBudget, transcript, financialAdvisorNote } = options;
  const now = new Date();
  const timeHeader = formatIndonesianWIB(now);

  const budgetPercentage = monthlyBudget > 0 ? Math.round((monthlySpent / monthlyBudget) * 100) : 0;
  const remainingBudget = Math.max(0, monthlyBudget - monthlySpent);
  const progressBar = createProgressBar(budgetPercentage);

  let budgetMotivation = '💡 Budget masih aman, pertahankan ya!';
  if (budgetPercentage >= 100) {
    budgetMotivation = '🚨 Perhatian: Budget kategori ini sudah TERLAMPAUI (100%+)! Rem pengeluaranmu ya.';
  } else if (budgetPercentage >= 80) {
    budgetMotivation = '⚠️ Waspada: Budget kategori ini sudah mencapai 80%! Berhematlah sampai akhir bulan.';
  }

  let text = `📅 ${timeHeader}
💸 Pengeluaran tercatat!
├ Nominal : ${formatRupiah(amount)}
├ Kategori : ${category.emoji} ${category.name}
├ Dompet : 👛 ${wallet.name}
├ Catatan : ${description}
└ Saldo : ${formatRupiah(newBalance)}`;

  if (transcript) {
    text = `🎙️ Transkrip: "${transcript}"\n\n` + text;
  }

  if (monthlyBudget > 0) {
    text += `\n\n📊 Budget ${category.name} bulan ini:
${progressBar} ${budgetPercentage}% — sisa ${formatRupiah(remainingBudget)}
${budgetMotivation}`;
  }

  if (financialAdvisorNote) {
    text += `\n\n${financialAdvisorNote}`;
  }

  return text;
}

/**
 * Format reply bot for Income (Pemasukan)
 * Follows exact template from Part 4.5
 */
export function formatIncomeReply(options: {
  amount: number;
  wallet: Wallet;
  newBalance: number;
  transcript?: string;
}): string {
  const { amount, wallet, newBalance, transcript } = options;
  const now = new Date();
  const timeHeader = formatIndonesianWIB(now);

  let text = `📅 ${timeHeader}
💰 Pemasukan tercatat!
├ Nominal : ${formatRupiah(amount)}
├ Kategori : 💼 Pemasukan
├ Dompet : 👛 ${wallet.name}
└ Saldo baru : ${formatRupiah(newBalance)}

💪 Semangat terus! Jangan lupa sisihkan untuk tabungan ya.`;

  if (transcript) {
    text = `🎙️ Transkrip: "${transcript}"\n\n` + text;
  }

  return text;
}

/**
 * Format Pro Financial Advisor alert (Part 4.7)
 */
export function formatAdvisorAlert(userName: string, analysis: string, actionAdvice: string): string {
  return `🤖 Financial Advisor
Hei ${userName}! ${analysis}
💡 Saran: ${actionAdvice}`;
}

/**
 * Format Starter plan limit reached message (Part 4.9)
 */
export function formatLimitReachedReply(usedCount: number, maxLimit: number = 50): string {
  return `⚠️ Kuota Transaksi Bulanan Tercapai!
Kamu sudah mencatat ${usedCount}/${maxLimit} transaksi bulan ini pada paket Starter.

🚀 Upgrade ke TataDana Pro (Hanya Rp99.000 Sekali Bayar seumur hidup) untuk transaksi unlimited, scan foto struk OCR otomatis, dan AI Financial Advisor!

Kunjungi: https://tatadana.app/settings?tab=subscription`;
}

/**
 * Format Receipt OCR multi-item reply
 */
export function formatReceiptReply(options: {
  merchant: string;
  total: number;
  itemCount: number;
  category: Category;
  wallet: Wallet;
  newBalance: number;
  items?: Array<{ name: string; qty: number; price: number; category?: string }>;
}): string {
  const { merchant, total, itemCount, category, wallet, newBalance, items } = options;
  const now = new Date();
  const timeHeader = formatIndonesianWIB(now);

  let itemsDetail = '';
  if (items && items.length > 0) {
    const list = items.map(it => `│  • ${it.name} (${it.qty}x) : ${formatRupiah(it.price)}`).join('\n');
    itemsDetail = `\n${list}`;
  }

  return `📅 ${timeHeader}
🧾 Struk Berhasil Diproses! (TataDana Pro)
├ Merchant : 🏪 ${merchant}
├ Rincian : ${itemCount} item tersimpan${itemsDetail}
├ Total : ${formatRupiah(total)}
├ Kategori : ${category.emoji} ${category.name}
├ Dompet : 👛 ${wallet.name}
└ Saldo : ${formatRupiah(newBalance)}

✨ Struk tercatat rapi di database. Buka Dashboard Web TataDana untuk melihat rincian item!`;
}
