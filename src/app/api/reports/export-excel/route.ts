import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/supabase/mockStore';
import { supabase, dataService } from '@/lib/supabase/client';
import { generateXlsxReport, generateCsvReport } from '@/lib/utils/excelGenerator';
import { ExportHistoryRecord } from '@/types/database';

export async function POST(req: Request) {
  try {
    const { userId = 'usr-budi-12345', periodStart, periodEnd, format = 'xlsx' } = await req.json();

    const profile = await dataService.getProfile(userId);
    if (!profile) {
      return NextResponse.json({ error: 'User tidak ditemukan' }, { status: 404 });
    }

    // Plan check: Starter cannot export PDF/Excel!
    if (profile.subscription_tier === 'starter') {
      return NextResponse.json({
        error: 'Fitur Export Laporan ke Excel hanya tersedia untuk paket Pro.',
        upgradeRequired: true,
      }, { status: 403 });
    }

    const transactions = await dataService.getTransactions(userId);
    const startDate = periodStart || '2026-10-01';
    const endDate = periodEnd || '2026-10-31';

    // Generate genuine Excel (.xlsx) file buffer via ExcelJS
    const xlsxBuffer = await generateXlsxReport(transactions);
    const csvContent = generateCsvReport(transactions);

    const isXlsx = format !== 'csv';
    const extension = isXlsx ? 'xlsx' : 'csv';
    const fileName = `Laporan_TataDana_${profile.full_name.replace(/\s+/g, '_')}_${startDate}_${endDate}.${extension}`;
    const exportId = `exp-excel-${Date.now()}`;
    const storagePath = `laporan-exports/${userId}/${fileName}`;

    const exportRecord: ExportHistoryRecord = {
      id: exportId,
      user_id: userId,
      file_type: 'excel',
      period_start: startDate,
      period_end: endDate,
      file_name: fileName,
      storage_path: storagePath,
      download_url: `/api/reports/download/${exportId}`,
      file_size_kb: Math.round((isXlsx ? xlsxBuffer.length : Buffer.byteLength(csvContent, 'utf8')) / 1024),
      created_at: new Date().toISOString(),
    };

    // Integrate with Supabase Storage
    try {
      if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
        await supabase.storage
          .from('reports')
          .upload(storagePath, isXlsx ? xlsxBuffer : Buffer.from(csvContent, 'utf-8'), {
            contentType: isXlsx 
              ? 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
              : 'text/csv; charset=utf-8',
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
      format: extension,
      downloadUrl: exportRecord.download_url
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal generate export Excel' }, { status: 500 });
  }
}
