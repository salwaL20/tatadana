import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/supabase/mockStore';
import { dataService } from '@/lib/supabase/client';
import { generatePdfBuffer, ReportSummary } from '@/lib/utils/pdfGenerator';
import { generateXlsxReport, generateCsvReport } from '@/lib/utils/excelGenerator';

export async function GET(req: Request) {
  try {
    mockStore.loadFromFile();
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'usr-salwa-001';
    const format = (searchParams.get('format') || 'pdf').toLowerCase();
    const timeframe = searchParams.get('timeframe') || 'semua';

    const profile = await dataService.getProfile(userId) || mockStore.profiles[0];
    let transactions = await dataService.getTransactions(userId);

    if (transactions.length === 0 && userId === 'usr-salwa-001') {
      transactions = await dataService.getTransactions('usr-budi-12345');
    }

    const now = new Date();
    const startDate = searchParams.get('startDate') || '2026-10-01';
    const endDate = searchParams.get('endDate') || now.toISOString().slice(0, 10);

    if (format === 'excel' || format === 'xlsx') {
      const xlsxBuffer = await generateXlsxReport(transactions);
      const fileName = `Daftar_Transaksi_TataDana_${profile.full_name.replace(/\s+/g, '_')}_${startDate}_${endDate}.xlsx`;
      return new NextResponse(new Uint8Array(xlsxBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    if (format === 'csv') {
      const csv = generateCsvReport(transactions);
      const fileName = `Daftar_Transaksi_TataDana_${profile.full_name.replace(/\s+/g, '_')}.csv`;
      return new NextResponse(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv; charset=utf-8',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    // Default: PDF
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

    const summary: ReportSummary = {
      totalIncome,
      totalExpense,
      netCashflow: totalIncome - totalExpense,
      transactionCount: transactions.length,
      topCategories: [],
    };

    const pdfBuffer = generatePdfBuffer(transactions, summary, profile, startDate, endDate);
    const fileName = `Daftar_Transaksi_TataDana_${profile.full_name.replace(/\s+/g, '_')}_${startDate}_${endDate}.pdf`;

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal export transaksi' }, { status: 500 });
  }
}
