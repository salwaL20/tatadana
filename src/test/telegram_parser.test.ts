import { parseIndonesianText } from '../lib/telegram/parser';
import { parseIndonesianNominal } from '../lib/utils/currency';

export function runTelegramParserTests(): { passed: number; failed: number; errors: string[] } {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
    } else {
      failed++;
      errors.push(`FAIL: ${testName}`);
    }
  }

  // Test 1: Indonesian nominal units
  assert(parseIndonesianNominal('15rb') === 15000, 'Nominal 15rb -> 15000');
  assert(parseIndonesianNominal('15ribu') === 15000, 'Nominal 15ribu -> 15000');
  assert(parseIndonesianNominal('1.5jt') === 1500000, 'Nominal 1.5jt -> 1500000');
  assert(parseIndonesianNominal('1,5jt') === 1500000, 'Nominal 1,5jt -> 1500000');
  assert(parseIndonesianNominal('1,25jt') === 1250000, 'Nominal 1,25jt -> 1250000');
  assert(parseIndonesianNominal('500k') === 500000, 'Nominal 500k -> 500000');
  assert(parseIndonesianNominal('50.000') === 50000, 'Nominal 50.000 -> 50000');
  assert(parseIndonesianNominal('7.500.000') === 7500000, 'Nominal 7.500.000 -> 7500000');
  assert(parseIndonesianNominal('10.000.000') === 10000000, 'Nominal 10.000.000 -> 10000000');
  assert(parseIndonesianNominal('setengah juta') === 500000, 'Nominal setengah juta -> 500000');
  assert(parseIndonesianNominal('seratus ribu') === 100000, 'Nominal seratus ribu -> 100000');

  // Test 2: Natural text expense parsing
  const res1 = parseIndonesianText('beli bakso 15rb');
  assert(res1.success === true, 'Parse "beli bakso 15rb" success');
  assert(res1.data?.amount === 15000, '"beli bakso 15rb" amount == 15000');
  assert(res1.data?.type === 'expense', '"beli bakso 15rb" type == expense');
  assert(res1.data?.categoryName === 'Makanan & Minuman', '"beli bakso 15rb" category == Makanan');

  // Multi-dot thousand nominals in full sentence
  const resLaptop = parseIndonesianText('beli laptop 7.500.000');
  assert(resLaptop.success === true, 'Parse "beli laptop 7.500.000" success');
  assert(resLaptop.data?.amount === 7500000, '"beli laptop 7.500.000" amount == 7500000');
  assert(resLaptop.data?.type === 'expense', '"beli laptop 7.500.000" type == expense');

  const resKosan = parseIndonesianText('bayar kosan 1,2jt');
  assert(resKosan.success === true, 'Parse "bayar kosan 1,2jt" success');
  assert(resKosan.data?.amount === 1200000, '"bayar kosan 1,2jt" amount == 1200000');

  // Test 3: Natural text income parsing
  const res2 = parseIndonesianText('gajian kantor 8.5jt');
  assert(res2.success === true, 'Parse "gajian kantor 8.5jt" success');
  assert(res2.data?.amount === 8500000, '"gajian kantor 8.5jt" amount == 8500000');
  assert(res2.data?.type === 'income', '"gajian kantor 8.5jt" type == income');

  const resGajiBesar = parseIndonesianText('gaji 10.000.000');
  assert(resGajiBesar.success === true, 'Parse "gaji 10.000.000" success');
  assert(resGajiBesar.data?.amount === 10000000, '"gaji 10.000.000" amount == 10000000');

  const resBonus = parseIndonesianText('dapat bonus setengah juta');
  assert(resBonus.success === true, 'Parse "dapat bonus setengah juta" success');
  assert(resBonus.data?.amount === 500000, '"dapat bonus setengah juta" amount == 500000');

  // Test 4: Transport and bill keywords
  const res3 = parseIndonesianText('isi pertalite 30k');
  assert(res3.data?.amount === 30000, 'Isi pertalite 30k -> 30000');
  assert(res3.data?.categoryName === 'Transportasi', 'Isi pertalite category == Transportasi');

  const res4 = parseIndonesianText('bayar token listrik pln 200rb');
  assert(res4.data?.amount === 200000, 'Token listrik 200rb -> 200000');
  assert(res4.data?.categoryName === 'Tagihan & Wifi', 'Token listrik category == Tagihan');

  const resKopi = parseIndonesianText('beli kopi 25.000');
  assert(resKopi.data?.amount === 25000, 'Beli kopi 25.000 -> 25000');

  // Test 5: Invalid/ambiguous and edge cases
  const res5 = parseIndonesianText('halo apa kabar');
  assert(res5.success === false, 'Ambiguous message returns success: false');
  assert(Boolean(res5.errorMessage), 'Ambiguous message provides clear error message with examples');

  // Empty and whitespace input
  const resEmpty = parseIndonesianText('');
  assert(resEmpty.success === false, 'Empty string returns success: false');

  const resWhitespace = parseIndonesianText('   ');
  assert(resWhitespace.success === false, 'Whitespace-only returns success: false');

  // Uppercase input
  const resUpper = parseIndonesianText('BELI NASI PADANG 25RB');
  assert(resUpper.success === true, 'Uppercase text parsing success');
  assert(resUpper.data?.amount === 25000, 'Uppercase 25RB parsed to 25000');
  assert(resUpper.data?.categoryName === 'Makanan & Minuman', 'Uppercase category mapped to Makanan');

  // Spaced unit input ("350 rb", "2.5 jt")
  const resSpaced = parseIndonesianText('bayar tagihan 350 rb');
  assert(resSpaced.success === true, 'Spaced unit "350 rb" success');
  assert(resSpaced.data?.amount === 350000, '"350 rb" amount == 350000');

  // Specific categories
  const resObat = parseIndonesianText('beli obat di apotek 75rb');
  assert(resObat.data?.categoryName === 'Kesehatan', 'Apotek maps to Kesehatan');

  const resBioskop = parseIndonesianText('nonton bioskop xxi 60k');
  assert(resBioskop.data?.categoryName === 'Hiburan', 'Bioskop maps to Hiburan');

  const resSepatu = parseIndonesianText('beli sepatu baru 450rb');
  assert(resSepatu.data?.categoryName === 'Belanja Kebutuhan', 'Sepatu maps to Belanja Kebutuhan');

  // Test 6: IDR Slang & nominal test cases from specification
  const resStarbucks = parseIndonesianText('kopi starbucks 50k');
  assert(resStarbucks.success === true, 'Parse "kopi starbucks 50k" success');
  assert(resStarbucks.data?.amount === 50000, '"kopi starbucks 50k" amount == 50000');
  assert(resStarbucks.data?.categoryName === 'Makanan & Minuman', '"kopi starbucks 50k" category == Makanan & Minuman');

  const res15rb = parseIndonesianText('15rb');
  assert(res15rb.success === true && res15rb.data?.amount === 15000, 'Standalone "15rb" parsed to 15000');

  const res15jt = parseIndonesianText('1.5jt');
  assert(res15jt.success === true && res15jt.data?.amount === 1500000, 'Standalone "1.5jt" parsed to 1500000');

  const res500k = parseIndonesianText('500k');
  assert(res500k.success === true && res500k.data?.amount === 500000, 'Standalone "500k" parsed to 500000');

  const res50kFormatted = parseIndonesianText('50.000');
  assert(res50kFormatted.success === true && res50kFormatted.data?.amount === 50000, 'Standalone "50.000" parsed to 50000');

  return { passed, failed, errors };
}
