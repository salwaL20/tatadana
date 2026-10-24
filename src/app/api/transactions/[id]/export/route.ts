import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/supabase/mockStore';
import { dataService } from '@/lib/supabase/client';
import { generateSingleReceiptPdf, generateSingleReceiptHtml } from '@/lib/utils/pdfGenerator';
import { generateSingleTransactionXlsx } from '@/lib/utils/excelGenerator';

export async function GET(
  req: Request,
  { params }: { params: { id: string } | Promise<{ id: string }> }
) {
  try {
    mockStore.loadFromFile();
    const resolvedParams = await Promise.resolve(params);
    const txId = resolvedParams.id;

    // Search transaction
    let tx = mockStore.transactions.find(t => t.id === txId);
    if (!tx) {
      // Search in all profiles
      for (const p of mockStore.profiles) {
        const txs = await dataService.getTransactions(p.id);
        const found = txs.find(t => t.id === txId);
        if (found) {
          tx = found;
          break;
        }
      }
    }

    if (!tx) {
      return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
    }

    // Populate relations if missing
    if (!tx.wallet) {
      tx.wallet = mockStore.wallets.find(w => w.id === tx.wallet_id);
    }
    if (!tx.category) {
      tx.category = mockStore.categories.find(c => c.id === tx.category_id);
    }
    if (tx.destination_wallet_id && !tx.destination_wallet) {
      tx.destination_wallet = mockStore.wallets.find(w => w.id === tx.destination_wallet_id);
    }

    const user = await dataService.getProfile(tx.user_id) || mockStore.profiles[0];

    const { searchParams } = new URL(req.url);
    const format = (searchParams.get('format') || 'pdf').toLowerCase();
    const isPreview = searchParams.get('preview') === '1';

    if (format === 'excel' || format === 'xlsx') {
      const xlsxBuffer = await generateSingleTransactionXlsx(tx);
      const fileName = `Transaksi_${tx.id}.xlsx`;
      return new NextResponse(new Uint8Array(xlsxBuffer), {
        status: 200,
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="${fileName}"`,
        },
      });
    }

    if (format === 'html') {
      const html = generateSingleReceiptHtml(tx, user);
      return new NextResponse(html, {
        status: 200,
        headers: {
          'Content-Type': 'text/html; charset=utf-8',
          'Content-Disposition': isPreview ? `inline; filename="Struk_${tx.id}.html"` : `attachment; filename="Struk_${tx.id}.html"`,
        },
      });
    }

    // Default: PDF
    const pdfBuffer = generateSingleReceiptPdf(tx, user);
    const fileName = `Struk_TataDana_${tx.id}.pdf`;
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': isPreview ? `inline; filename="${fileName}"` : `attachment; filename="${fileName}"`,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal export transaksi' }, { status: 500 });
  }
}
