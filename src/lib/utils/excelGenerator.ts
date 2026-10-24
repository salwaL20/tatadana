import { Transaction } from '@/types/database';
import { formatDateOnlyWIB, formatShortTimeWIB } from './timezone';
import ExcelJS from 'exceljs';

export function generateCsvReport(transactions: Transaction[]): string {
  const headers = [
    'ID Transaksi',
    'Tanggal (WIB)',
    'Jam (WIB)',
    'Jenis',
    'Kategori',
    'Dompet',
    'Nominal (IDR)',
    'Catatan / Merchant',
    'Rincian Item Struk',
    'Sumber Transaksi'
  ];

  const escapeCell = (val: string | number | undefined | null) => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  const rows = transactions.map(t => {
    let receiptDetails = '';
    if (t.receipt_data?.items) {
      receiptDetails = t.receipt_data.items.map(i => `${i.name} (${i.qty}x Rp${i.price})`).join('; ');
    }

    return [
      escapeCell(t.id),
      escapeCell(formatDateOnlyWIB(t.transaction_time)),
      escapeCell(formatShortTimeWIB(t.transaction_time)),
      escapeCell(t.type === 'expense' ? 'Pengeluaran' : t.type === 'income' ? 'Pemasukan' : 'Transfer'),
      escapeCell(t.category?.name || 'Umum'),
      escapeCell(t.wallet?.name || 'Dompet Utama'),
      escapeCell(t.amount),
      escapeCell(t.description),
      escapeCell(receiptDetails),
      escapeCell(t.source)
    ].join(',');
  });

  return [headers.join(','), ...rows].join('\r\n');
}

/**
 * Generates genuine Excel (.xlsx) workbook using ExcelJS
 * with TataDana brand styling, colored headers, and currency formatting.
 */
export async function generateXlsxReport(transactions: Transaction[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'TataDana Fintech SaaS';
  workbook.lastModifiedBy = 'TataDana Generator';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('Laporan Transaksi');

  worksheet.columns = [
    { header: 'ID Transaksi', key: 'id', width: 16 },
    { header: 'Tanggal (WIB)', key: 'date', width: 16 },
    { header: 'Jam (WIB)', key: 'time', width: 12 },
    { header: 'Jenis', key: 'type', width: 14 },
    { header: 'Kategori', key: 'category', width: 22 },
    { header: 'Dompet', key: 'wallet', width: 18 },
    { header: 'Nominal (IDR)', key: 'amount', width: 18 },
    { header: 'Catatan / Merchant', key: 'description', width: 32 },
    { header: 'Rincian Item Struk', key: 'receipt_items', width: 45 },
    { header: 'Sumber Transaksi', key: 'source', width: 18 },
  ];

  // Header styling (Orange & White Fintech)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF97316' }, // #F97316 Brand Orange
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      bottom: { style: 'medium', color: { argb: 'FFEA580C' } }
    };
  });

  transactions.forEach((t) => {
    let receiptDetails = '';
    if (t.receipt_data?.items) {
      receiptDetails = t.receipt_data.items.map(i => `${i.name} (${i.qty}x Rp${i.price})`).join('; ');
    }

    const row = worksheet.addRow({
      id: t.id,
      date: formatDateOnlyWIB(t.transaction_time),
      time: formatShortTimeWIB(t.transaction_time),
      type: t.type === 'expense' ? 'Pengeluaran' : t.type === 'income' ? 'Pemasukan' : 'Transfer',
      category: t.category?.name || 'Umum',
      wallet: t.wallet?.name || 'Dompet Utama',
      amount: t.amount,
      description: t.description,
      receipt_items: receiptDetails,
      source: t.source,
    });

    row.height = 20;
    // Format amount cell
    const amountCell = row.getCell('amount');
    amountCell.numFmt = '#,##0';
    amountCell.font = {
      bold: true,
      color: { argb: t.type === 'expense' ? 'FFDC2626' : 'FF16A34A' }
    };
  });

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Generates an Excel (.xlsx) file for a single transaction with full metadata and receipt items
 */
export async function generateSingleTransactionXlsx(tx: Transaction): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'TataDana Fintech SaaS';
  workbook.created = new Date();

  const worksheet = workbook.addWorksheet('Bukti Transaksi');

  worksheet.columns = [
    { header: 'Parameter', key: 'key', width: 24 },
    { header: 'Nilai Transaksi', key: 'value', width: 50 },
  ];

  const headerRow = worksheet.getRow(1);
  headerRow.height = 24;
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFF97316' },
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
  });

  worksheet.addRow({ key: 'ID Transaksi', value: tx.id });
  worksheet.addRow({ key: 'Tanggal (WIB)', value: formatDateOnlyWIB(tx.transaction_time) });
  worksheet.addRow({ key: 'Waktu (WIB)', value: `${formatShortTimeWIB(tx.transaction_time)} WIB` });
  worksheet.addRow({
    key: 'Jenis Transaksi',
    value: tx.type === 'expense' ? 'Pengeluaran' : tx.type === 'income' ? 'Pemasukan' : 'Transfer',
  });
  worksheet.addRow({ key: 'Nominal (IDR)', value: tx.amount });
  worksheet.addRow({
    key: 'Kategori',
    value: `${tx.category?.emoji || ''} ${tx.category?.name || 'Umum'}`,
  });
  worksheet.addRow({ key: 'Dompet / Akun', value: tx.wallet?.name || 'Dompet Utama' });
  if (tx.destination_wallet) {
    worksheet.addRow({ key: 'Dompet Tujuan', value: tx.destination_wallet.name });
  }
  worksheet.addRow({ key: 'Deskripsi / Catatan', value: tx.description });
  worksheet.addRow({ key: 'Sumber Pencatatan', value: tx.source });
  if (tx.receipt_data?.merchant) {
    worksheet.addRow({ key: 'Merchant Struk', value: tx.receipt_data.merchant });
  }

  // Format amount cell
  const amountRow = worksheet.getRow(6);
  amountRow.getCell(2).numFmt = '"Rp"#,##0';
  amountRow.getCell(2).font = {
    bold: true,
    color: { argb: tx.type === 'expense' ? 'FFDC2626' : 'FF16A34A' },
  };

  // If receipt items exist, add a second sheet
  if (tx.receipt_data?.items && tx.receipt_data.items.length > 0) {
    const itemSheet = workbook.addWorksheet('Rincian Item Struk');
    itemSheet.columns = [
      { header: 'No', key: 'no', width: 8 },
      { header: 'Nama Item', key: 'name', width: 32 },
      { header: 'Kuantitas (Qty)', key: 'qty', width: 16 },
      { header: 'Harga Satuan (IDR)', key: 'price', width: 20 },
      { header: 'Subtotal (IDR)', key: 'subtotal', width: 22 },
    ];

    const itemHeader = itemSheet.getRow(1);
    itemHeader.height = 24;
    itemHeader.eachCell((c) => {
      c.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      c.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF97316' } };
      c.alignment = { vertical: 'middle', horizontal: 'center' };
    });

    tx.receipt_data.items.forEach((it, idx) => {
      const r = itemSheet.addRow({
        no: idx + 1,
        name: it.name,
        qty: it.qty,
        price: it.price,
        subtotal: it.qty * it.price,
      });
      r.getCell('price').numFmt = '#,##0';
      r.getCell('subtotal').numFmt = '#,##0';
    });
  }

  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
}

