import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/supabase/mockStore';
import { supabase, dataService } from '@/lib/supabase/client';
import { generateHtmlReport, generatePdfBuffer, ReportSummary } from '@/lib/utils/pdfGenerator';
import { ExportHistoryRecord } from '@/types/database';

export async function POST(req: Request) {
  try {
    const { userId = 'usr-budi-12345', periodStart, periodEnd } = await req.json();

    const profile = await dataService.getProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Plan check: Starter cannot export PDF/Excel!
    if (profile.subscription_tier === 'starter') {
      return NextResponse.json({
        error: 'Fitur Export Laporan ke PDF hanya tersedia untuk paket Pro.',
        upgradeRequired: true,
      }, { status: 403 });
    }

    const transactions = await dataService.getTransactions(userId);
    
    // Calculate summary
    const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    
    // Top categories
    const catMap = new Map<string, number>();
    transactions.filter(t => t.type === 'expense').forEach(t => {
      const name = t.category?.name || 'Lainnya';
      catMap.set(name, (catMap.get(name) || 0) + t.amount);
    });

    const topCategories = Array.from(catMap.entries()).map(([name, amount]) => ({
      name,
      amount,
      percentage: totalExpense > 0 ? Math.round((amount / totalExpense) * 100) : 0
    })).sort((a, b) => b.amount - a.amount).slice(0, 5);

    const summary: ReportSummary = {
      totalIncome,
      totalExpense,
      netCashflow: totalIncome - totalExpense,
      transactionCount: transactions.length,
      topCategories
    };

    const startDate = periodStart || '2026-10-01';
    const endDate = periodEnd || '2026-10-31';

    const pdfBuffer = generatePdfBuffer(transactions, summary, profile, startDate, endDate);
    const htmlContent = generateHtmlReport(transactions, summary, profile, startDate, endDate);
    const fileName = `Laporan_TataDana_${profile.full_name.replace(/\s+/g, '_')}_${startDate}_${endDate}.pdf`;
    const exportId = `exp-pdf-${Date.now()}`;

    const storagePath = `laporan-exports/${userId}/${fileName}`;

    const exportRecord: ExportHistoryRecord = {
      id: exportId,
      user_id: userId,
      file_type: 'pdf',
      period_start: startDate,
      period_end: endDate,
      file_name: fileName,
      storage_path: storagePath,
      download_url: `/api/reports/download/${exportId}`,
      file_size_kb: Math.round(pdfBuffer.length / 1024),
      created_at: new Date().toISOString(),
    };

    // Integrate with Supabase Storage
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        await supabase.storage
          .from('reports')
          .upload(storagePath, pdfBuffer, {
            contentType: 'application/pdf',
            upsert: true,
          });
      }
    } catch (storageErr) {
      console.warn('Supabase storage upload fallback/skipped in mock mode:', storageErr);
    }

    mockStore.exportHistories.unshift(exportRecord);
    mockStore.saveToFile();

    return NextResponse.json({
      success: true,
      export: exportRecord,
      htmlContent,
      downloadUrl: exportRecord.download_url
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal generate export PDF' }, { status: 500 });
  }
}
