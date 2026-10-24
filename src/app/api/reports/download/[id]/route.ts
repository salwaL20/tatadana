import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/supabase/mockStore';
import { dataService } from '@/lib/supabase/client';
import { generateHtmlReport, generatePdfBuffer, ReportSummary } from '@/lib/utils/pdfGenerator';
import { generateCsvReport, generateXlsxReport } from '@/lib/utils/excelGenerator';

export async function GET(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  mockStore.loadFromFile();
  const resolvedParams = await Promise.resolve(params);
  const exportId = resolvedParams.id;
  let record = mockStore.exportHistories.find(e => e.id === exportId);

  if (!record) {
    const isExcel = exportId.includes('excel') || exportId.includes('xlsx');
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || 'usr-salwa-001';
    const profile = await dataService.getProfile(userId) || mockStore.profiles[0];
    record = {
      id: exportId,
      user_id: profile.id,
      file_type: isExcel ? 'excel' : 'pdf',
      period_start: '2026-10-01',
      period_end: new Date().toISOString().slice(0, 10),
      file_name: isExcel
        ? `Laporan_TataDana_${profile.full_name.replace(/\s+/g, '_')}.xlsx`
        : `Laporan_TataDana_${profile.full_name.replace(/\s+/g, '_')}.pdf`,
      storage_path: `laporan-exports/${profile.id}/${exportId}`,
      file_size_kb: 50,
      download_url: `/api/reports/download/${exportId}`,
      created_at: new Date().toISOString(),
    };
  }

  const finalRecord = record as import('@/types/database').ExportHistoryRecord;
  const profile = (await dataService.getProfile(finalRecord.user_id)) || mockStore.profiles[0];
  const transactions = await dataService.getTransactions(finalRecord.user_id);

  if (finalRecord.file_type === 'excel') {
    if (finalRecord.file_name.endsWith('.xlsx')) {
      const xlsxBuffer = await generateXlsxReport(transactions);
      return new NextResponse(new Uint8Array(xlsxBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${finalRecord.file_name}"`,
        },
      });
    }

    const csv = generateCsvReport(transactions);
    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${finalRecord.file_name}"`,
      },
    });
  } else {
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const summary: ReportSummary = {
      totalIncome,
      totalExpense,
      netCashflow: totalIncome - totalExpense,
      transactionCount: transactions.length,
      topCategories: []
    };

    if (finalRecord.file_name.endsWith('.pdf')) {
      const pdfBuffer = generatePdfBuffer(transactions, summary, profile, finalRecord.period_start, finalRecord.period_end);
      return new NextResponse(new Uint8Array(pdfBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${finalRecord.file_name}"`,
        },
      });
    }

    const html = generateHtmlReport(transactions, summary, profile, finalRecord.period_start, finalRecord.period_end);
    return new NextResponse(html, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
        'Content-Disposition': `inline; filename="${finalRecord.file_name}"`,
      },
    });
  }
}
