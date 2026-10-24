/**
 * Currency utilities for TataDana (IDR / Rupiah)
 */

export function formatRupiah(amount: number, prefix: string = 'Rp'): string {
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('id-ID').format(rounded);
  return prefix ? `${prefix}${formatted}` : formatted;
}

export function formatRupiahWithSpace(amount: number): string {
  return `Rp ${new Intl.NumberFormat('id-ID').format(Math.round(amount))}`;
}

/**
 * Parses Indonesian currency strings like "15rb", "1.5jt", "1,25jt", "500k", "25.000", "7.500.000", "Rp100.000", "setengah juta", "seratus ribu"
 */
export function parseIndonesianNominal(input: string): number | null {
  if (!input) return null;
  const clean = input.toLowerCase().trim().replace(/rp\.?\s*/g, '').trim();

  // Word-based numbers
  if (clean === 'setengah juta' || clean === 'setengah jt') return 500_000;
  if (clean === 'satu juta' || clean === '1 juta') return 1_000_000;
  if (clean === 'dua juta' || clean === '2 juta') return 2_000_000;
  if (clean === 'seratus ribu' || clean === '100 ribu') return 100_000;
  if (clean === 'dua ratus ribu' || clean === '200 ribu') return 200_000;
  if (clean === 'lima puluh ribu' || clean === '50 ribu') return 50_000;
  if (clean === 'dua puluh ribu' || clean === '20 ribu') return 20_000;
  if (clean === 'sepuluh ribu' || clean === '10 ribu') return 10_000;
  if (clean === 'lima ribu' || clean === '5 ribu') return 5_000;

  // Match "1.5jt", "1,5jt", "1.25jt", "2jt", "2 juta"
  const matchJt = clean.match(/^([0-9]+(?:[.,][0-9]+)?)\s*(?:jt|juta)$/);
  if (matchJt) {
    const val = parseFloat(matchJt[1].replace(',', '.'));
    return Math.round(val * 1_000_000);
  }

  // Match "15rb", "15ribu", "1.5rb"
  const matchRb = clean.match(/^([0-9]+(?:[.,][0-9]+)?)\s*(?:rb|ribu)$/);
  if (matchRb) {
    const val = parseFloat(matchRb[1].replace(',', '.'));
    return Math.round(val * 1_000);
  }

  // Match "500k" or "2.5k"
  const matchK = clean.match(/^([0-9]+(?:[.,][0-9]+)?)\s*k$/);
  if (matchK) {
    const val = parseFloat(matchK[1].replace(',', '.'));
    return Math.round(val * 1_000);
  }

  // Match formatted numbers with multiple thousand dots or commas: "7.500.000", "10.000.000", "50.000"
  // If string contains multiple dots e.g. 7.500.000
  if (/^[0-9]{1,3}(?:\.[0-9]{3})+$/.test(clean)) {
    const num = parseInt(clean.replace(/\./g, ''), 10);
    if (!isNaN(num) && num > 0) return num;
  }

  if (/^[0-9]{1,3}(?:,[0-9]{3})+$/.test(clean)) {
    const num = parseInt(clean.replace(/,/g, ''), 10);
    if (!isNaN(num) && num > 0) return num;
  }

  // Single dot or comma with 3 digits at end (likely thousand separator like 50.000)
  if (/^[0-9]+\.[0-9]{3}$/.test(clean)) {
    const num = parseInt(clean.replace(/\./g, ''), 10);
    if (!isNaN(num) && num > 0) return num;
  }

  // Plain digits
  const plainDigits = clean.replace(/[^0-9]/g, '');
  if (plainDigits.length > 0) {
    const parsed = parseInt(plainDigits, 10);
    if (!isNaN(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
}
