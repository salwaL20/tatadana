import { generateHtmlReport, ReportSummary } from '../lib/utils/pdfGenerator';
import { generateCsvReport, generateXlsxReport } from '../lib/utils/excelGenerator';
import { mockStore } from '../lib/supabase/mockStore';

export async function runReportGeneratorTests(): Promise<{ passed: number; failed: number; errors: string[] }> {
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

  const sampleProfile = mockStore.profiles[0];
  const sampleTransactions = mockStore.transactions;

  const summary: ReportSummary = {
    totalIncome: 18500000,
    totalExpense: 3650000,
    netCashflow: 14850000,
    transactionCount: sampleTransactions.length,
    topCategories: [
      { name: 'Makanan & Minuman', amount: 1450000, percentage: 40 },
      { name: 'Belanja Kebutuhan', amount: 900000, percentage: 25 },
    ]
  };

  // Test 1: HTML/PDF report generator
  const htmlOutput = generateHtmlReport(sampleTransactions, summary, sampleProfile, '2026-10-01', '2026-10-31');
  assert(htmlOutput.includes('TataDana'), 'HTML report contains TataDana brand logo header');
  assert(htmlOutput.includes(sampleProfile.full_name), 'HTML report contains user full name');
  assert(htmlOutput.includes('Net Cashflow'), 'HTML report contains net cashflow summary');
  assert(htmlOutput.includes('Rincian Item Struk'), 'HTML report renders itemized receipt breakdown');
  assert(htmlOutput.includes('Waktu Indonesia Barat (WIB)'), 'HTML report certifies WIB timestamp usage');

  // Test 2: CSV/Excel report generator
  const csvOutput = generateCsvReport(sampleTransactions);
  assert(csvOutput.includes('ID Transaksi'), 'CSV report includes ID Transaksi header');
  assert(csvOutput.includes('Tanggal (WIB)'), 'CSV report includes Tanggal (WIB) header');
  assert(csvOutput.includes('Rincian Item Struk'), 'CSV report includes Rincian Item Struk column');
  assert(csvOutput.includes('Superindo Express') || csvOutput.includes('Makan siang'), 'CSV report includes transaction contents');

  // Test 3: Genuine ExcelJS XLSX report generator
  const xlsxBuffer = await generateXlsxReport(sampleTransactions);
  assert(Buffer.isBuffer(xlsxBuffer) && xlsxBuffer.length > 500, 'XLSX report generates non-empty binary buffer');
  assert(xlsxBuffer[0] === 0x50 && xlsxBuffer[1] === 0x4B, 'XLSX report begins with standard PK zip/xlsx magic bytes');

  return { passed, failed, errors };
}
