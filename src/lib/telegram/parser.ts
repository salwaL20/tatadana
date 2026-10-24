import { parseIndonesianNominal } from '../utils/currency';

export interface ParsedTransaction {
  type: 'income' | 'expense';
  amount: number;
  categoryName: string;
  categoryEmoji: string;
  description: string;
}

export interface ParseResult {
  success: boolean;
  data?: ParsedTransaction;
  errorMessage?: string;
}

/**
 * Robust Indonesian Natural Language Parser for TataDana
 * Handles colloquial Indonesian text, slang nominals (15rb, 1.5jt, 500k),
 * and categorizes transactions intelligently.
 */
export function parseIndonesianText(text: string): ParseResult {
  if (!text || typeof text !== 'string') {
    return {
      success: false,
      errorMessage: 'Pesan kosong. Ketik contoh: "beli bakso 15rb" atau "gajian 5jt"',
    };
  }

  const raw = text.trim();
  const lower = raw.toLowerCase();

  let amount: number | null = null;

  // 1. Check for Indonesian worded numbers first
  if (lower.includes('setengah juta') || lower.includes('setengah jt')) {
    amount = 500_000;
  } else if (lower.includes('satu juta') || lower.includes('1 juta')) {
    amount = 1_000_000;
  } else if (lower.includes('dua juta') || lower.includes('2 juta')) {
    amount = 2_000_000;
  } else if (lower.includes('seratus ribu')) {
    amount = 100_000;
  } else if (lower.includes('dua ratus ribu')) {
    amount = 200_000;
  } else if (lower.includes('lima puluh ribu')) {
    amount = 50_000;
  } else if (lower.includes('dua puluh ribu')) {
    amount = 20_000;
  }

  // 2. Check for numbers with explicit units (e.g., 1.5jt, 1,25jt, 500k, 15rb, 15ribu)
  if (!amount) {
    const unitRegex = /(?:rp\.?\s*)?([0-9]+(?:[.,][0-9]+)?)\s*(jt|juta|rb|ribu|k)\b/i;
    const unitMatch = lower.match(unitRegex);
    if (unitMatch) {
      const rawNum = unitMatch[1];
      const unit = unitMatch[2].toLowerCase();
      const val = parseFloat(rawNum.replace(',', '.'));
      if (unit === 'jt' || unit === 'juta') {
        amount = Math.round(val * 1_000_000);
      } else if (unit === 'rb' || unit === 'ribu' || unit === 'k') {
        amount = Math.round(val * 1_000);
      }
    }
  }

  // 3. Check for formatted numbers with thousand separators (e.g., 7.500.000, 10.000.000, 50.000)
  if (!amount) {
    const thousandRegex = /(?:rp\.?\s*)?([0-9]{1,3}(?:\.[0-9]{3})+|[0-9]{1,3}(?:,[0-9]{3})+)\b/i;
    const thousandMatch = lower.match(thousandRegex);
    if (thousandMatch) {
      const cleanNum = thousandMatch[1].replace(/\./g, '').replace(/,/g, '');
      const val = parseInt(cleanNum, 10);
      if (!isNaN(val) && val > 0) {
        amount = val;
      }
    }
  }

  // 4. Check for plain digits with Rp or 4+ digits (e.g. 50000, 15000, rp 25000)
  if (!amount) {
    const plainRegex = /(?:rp\.?\s*)?([0-9]{3,12})\b/i;
    const plainMatch = lower.match(plainRegex);
    if (plainMatch) {
      const val = parseInt(plainMatch[1], 10);
      if (!isNaN(val) && val >= 500) {
        amount = val;
      }
    }
  }

  if (!amount || amount <= 0) {
    return {
      success: false,
      errorMessage: `Format nominal tidak dikenali pada pesan: "${text}".\nContoh yang benar:\n• beli bakso 15rb\n• gajian 5jt\n• bensin motor 30k\n• beli laptop 7.500.000`,
    };
  }

  // Determine income vs expense
  const incomeKeywords = [
    'gajian', 'gaji', 'bonus', 'dapat uang', 'dapet uang', 'terima uang', 
    'transfer masuk', 'omset', 'penjualan', 'uang saku', 'infaq masuk', 'freelance'
  ];
  const isIncome = incomeKeywords.some(kw => lower.includes(kw));

  if (isIncome) {
    return {
      success: true,
      data: {
        type: 'income',
        amount,
        categoryName: 'Gaji & Pendapatan',
        categoryEmoji: '💼',
        description: raw,
      },
    };
  }

  // Expense categorization
  let categoryName = 'Lain-lain';
  let categoryEmoji = '🏷️';

  if (
    lower.includes('bakso') || lower.includes('makan') || lower.includes('kopi') || 
    lower.includes('starbucks') || lower.includes('ayam') || lower.includes('nasi') ||
    lower.includes('warteg') || lower.includes('mie') || lower.includes('sate') ||
    lower.includes('sarapan') || lower.includes('snack') || lower.includes('minum') ||
    lower.includes('eskrim') || lower.includes('es krim') || lower.includes('ice cream') ||
    lower.includes('cilok') || lower.includes('cireng') || lower.includes('seblak') ||
    lower.includes('martabak') || lower.includes('roti') || lower.includes('kue')
  ) {
    categoryName = 'Makanan & Minuman';
    categoryEmoji = '🍜';
  } else if (
    lower.includes('bensin') || lower.includes('pertalite') || lower.includes('pertamax') ||
    lower.includes('gojek') || lower.includes('grab') || lower.includes('parkir') ||
    lower.includes('tol') || lower.includes('kereta') || lower.includes('angkot') || lower.includes('mrt')
  ) {
    categoryName = 'Transportasi';
    categoryEmoji = '🚗';
  } else if (
    lower.includes('listrik') || lower.includes('pln') || lower.includes('token') ||
    lower.includes('wifi') || lower.includes('indihome') || lower.includes('pulsa') ||
    lower.includes('paket data') || lower.includes('pdam') || lower.includes('air') || lower.includes('bpjs')
  ) {
    categoryName = 'Tagihan & Wifi';
    categoryEmoji = '🏠';
  } else if (
    lower.includes('baju') || lower.includes('sepatu') || lower.includes('celana') ||
    lower.includes('shopee') || lower.includes('tokped') || lower.includes('tokopedia') ||
    lower.includes('belanja') || lower.includes('mall') || lower.includes('superindo') || lower.includes('indomaret')
  ) {
    categoryName = 'Belanja Kebutuhan';
    categoryEmoji = '👕';
  } else if (
    lower.includes('obat') || lower.includes('apotek') || lower.includes('dokter') ||
    lower.includes('vitamin') || lower.includes('klinik')
  ) {
    categoryName = 'Kesehatan';
    categoryEmoji = '💊';
  } else if (
    lower.includes('nonton') || lower.includes('bioskop') || lower.includes('cinema') ||
    lower.includes('game') || lower.includes('steam') || lower.includes('netflix') || lower.includes('spotify')
  ) {
    categoryName = 'Hiburan';
    categoryEmoji = '🎮';
  }

  return {
    success: true,
    data: {
      type: 'expense',
      amount,
      categoryName,
      categoryEmoji,
      description: raw,
    },
  };
}
