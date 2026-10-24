import { Transaction, Profile } from '@/types/database';
import { formatRupiah } from './currency';
import { formatDateOnlyWIB, formatIndonesianWIB } from './timezone';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export interface ReportSummary {
  totalIncome: number;
  totalExpense: number;
  netCashflow: number;
  transactionCount: number;
  topCategories: { name: string; amount: number; percentage: number }[];
}

/**
 * Generates genuine binary PDF buffer using jsPDF and jspdf-autotable
 * with Orange-White fintech styling, user summary, and itemized transaction table.
 */
export function generatePdfBuffer(
  transactions: Transaction[],
  summary: ReportSummary,
  user: Profile,
  periodStart: string,
  periodEnd: string
): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  // Primary brand header
  doc.setFillColor(249, 115, 22); // #f97316 (orange-500)
  doc.rect(0, 0, 210, 20, 'F');

  doc.setFontSize(15);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('TataDana — Laporan Keuangan Finansial', 14, 13);

  // Meta info
  doc.setFontSize(8);
  doc.setTextColor(71, 85, 105);
  doc.setFont('helvetica', 'normal');
  doc.text(`Pengguna: ${user.full_name} (${user.email || user.phone_number || '-'})`, 14, 27);
  doc.text(`Periode: ${periodStart} s/d ${periodEnd}`, 14, 32);
  doc.text(`Dicetak: ${formatIndonesianWIB(new Date())}`, 14, 37);

  // Summary box
  doc.setFillColor(255, 247, 237); // #fff7ed
  doc.roundedRect(14, 42, 182, 22, 2, 2, 'F');
  doc.setDrawColor(254, 215, 170);
  doc.roundedRect(14, 42, 182, 22, 2, 2, 'S');

  doc.setFontSize(7.5);
  doc.setTextColor(154, 52, 18);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL PEMASUKAN', 20, 49);
  doc.text('TOTAL PENGELUARAN', 65, 49);
  doc.text('NET CASHFLOW', 115, 49);
  doc.text('TOTAL TRANSAKSI', 160, 49);

  doc.setFontSize(9.5);
  doc.setTextColor(22, 163, 74);
  doc.text(formatRupiah(summary.totalIncome), 20, 57);

  doc.setTextColor(234, 88, 12);
  doc.text(formatRupiah(summary.totalExpense), 65, 57);

  if (summary.netCashflow >= 0) {
    doc.setTextColor(22, 163, 74);
  } else {
    doc.setTextColor(220, 38, 38);
  }
  doc.text(formatRupiah(summary.netCashflow), 115, 57);

  doc.setTextColor(37, 99, 235);
  doc.text(`${summary.transactionCount} Transaksi`, 160, 57);

  // Table rows
  const tableRows = transactions.map((t) => [
    formatDateOnlyWIB(t.transaction_time),
    t.description,
    t.category?.name || 'Umum',
    t.wallet?.name || 'Dompet Utama',
    `${t.type === 'expense' ? '-' : '+'}${formatRupiah(t.amount)}`,
  ]);

  autoTable(doc, {
    startY: 68,
    head: [['Tanggal', 'Deskripsi', 'Kategori', 'Dompet', 'Nominal']],
    body: tableRows,
    theme: 'striped',
    headStyles: {
      fillColor: [249, 115, 22],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5,
      textColor: [30, 41, 59],
    },
    alternateRowStyles: {
      fillColor: [250, 250, 249],
    },
    columnStyles: {
      0: { cellWidth: 26 },
      1: { cellWidth: 68 },
      2: { cellWidth: 30 },
      3: { cellWidth: 26 },
      4: { cellWidth: 32, halign: 'right', fontStyle: 'bold' },
    },
  });

  const arrayBuffer = doc.output('arraybuffer');
  return Buffer.from(arrayBuffer);
}

/**
 * Generates an HTML-based printable document / PDF representation
 * with Orange-White fintech styling, user summary, top categories, and itemized receipts.
 */
export function generateHtmlReport(
  transactions: Transaction[],
  summary: ReportSummary,
  user: Profile,
  periodStart: string,
  periodEnd: string
): string {
  const rows = transactions.map((t, index) => {
    const isExpense = t.type === 'expense';
    const nominalClass = isExpense ? 'color: #ea580c;' : 'color: #16a34a;';
    const typeLabel = isExpense ? 'Pengeluaran' : t.type === 'income' ? 'Pemasukan' : 'Transfer';
    
    let itemsHtml = '';
    if (t.receipt_data && t.receipt_data.items && t.receipt_data.items.length > 0) {
      itemsHtml = `
        <div style="margin-top: 6px; font-size: 11px; background: #f8fafc; padding: 6px 10px; border-radius: 6px; border: 1px dashed #cbd5e1;">
          <div style="font-weight: 600; color: #475569; margin-bottom: 3px;">🧾 Rincian Item Struk (${t.receipt_data.merchant || 'Merchant'}):</div>
          ${t.receipt_data.items.map(item => `
            <div style="display: flex; justify-content: space-between; color: #64748b; padding: 2px 0;">
              <span>• ${item.name} (${item.qty}x)</span>
              <span>${formatRupiah(item.price * item.qty)}</span>
            </div>
          `).join('')}
        </div>
      `;
    }

    return `
      <tr style="border-bottom: 1px solid #f1f5f9; ${index % 2 === 1 ? 'background-color: #fafaf9;' : ''}">
        <td style="padding: 10px 12px; font-size: 12px; color: #334155;">${formatDateOnlyWIB(t.transaction_time)}</td>
        <td style="padding: 10px 12px; font-size: 12px; font-weight: 500; color: #1e293b;">
          ${t.description}
          ${itemsHtml}
        </td>
        <td style="padding: 10px 12px; font-size: 12px; color: #475569;">${t.category?.emoji || '🏷️'} ${t.category?.name || 'Umum'}</td>
        <td style="padding: 10px 12px; font-size: 12px; color: #475569;">${t.wallet?.name || 'Dompet Utama'}</td>
        <td style="padding: 10px 12px; font-size: 12px; font-weight: 600; ${nominalClass}">
          ${isExpense ? '-' : '+'}${formatRupiah(t.amount)}
        </td>
      </tr>
    `;
  }).join('');

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Laporan Keuangan TataDana - ${user.full_name}</title>
  <style>
    @page { size: A4; margin: 15mm; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; margin: 0; padding: 20px; }
    .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #f97316; padding-bottom: 15px; }
    .logo { font-size: 24px; font-weight: 800; color: #f97316; letter-spacing: -0.5px; }
    .brand-tag { font-size: 11px; color: #64748b; }
    .meta-box { text-align: right; font-size: 12px; color: #64748b; }
    .summary-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin: 20px 0; }
    .card { background: #fff7ed; border: 1px solid #fed7aa; padding: 12px 14px; border-radius: 10px; }
    .card-label { font-size: 11px; font-weight: 600; color: #9a3412; text-transform: uppercase; }
    .card-value { font-size: 16px; font-weight: 700; color: #7c2d12; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th { background: #f8fafc; border-bottom: 2px solid #e2e8f0; font-size: 12px; font-weight: 600; color: #475569; text-align: left; padding: 10px 12px; }
    .footer { margin-top: 30px; font-size: 11px; color: #94a3b8; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 10px; }
  </style>
</head>
<body>
  <div class="header">
    <div>
      <div class="logo">TataDana</div>
      <div class="brand-tag">Catat keuangan semudah chat — langsung dari Telegram kamu</div>
    </div>
    <div class="meta-box">
      <div><b>Pengguna:</b> ${user.full_name} (${user.phone_number || '-'})</div>
      <div><b>Periode:</b> ${periodStart} s/d ${periodEnd}</div>
      <div><b>Dicetak pada:</b> ${formatIndonesianWIB(new Date())}</div>
    </div>
  </div>

  <div class="summary-grid">
    <div class="card">
      <div class="card-label">Total Pemasukan</div>
      <div class="card-value" style="color: #16a34a;">${formatRupiah(summary.totalIncome)}</div>
    </div>
    <div class="card">
      <div class="card-label">Total Pengeluaran</div>
      <div class="card-value" style="color: #ea580c;">${formatRupiah(summary.totalExpense)}</div>
    </div>
    <div class="card">
      <div class="card-label">Net Cashflow</div>
      <div class="card-value" style="color: ${summary.netCashflow >= 0 ? '#16a34a' : '#dc2626'};">${formatRupiah(summary.netCashflow)}</div>
    </div>
    <div class="card">
      <div class="card-label">Jumlah Transaksi</div>
      <div class="card-value" style="color: #2563eb;">${summary.transactionCount} transaksi</div>
    </div>
  </div>

  <h3 style="font-size: 14px; margin: 20px 0 10px 0; color: #334155;">Daftar Transaksi Lengkap</h3>
  <table>
    <thead>
      <tr>
        <th>Tanggal</th>
        <th>Deskripsi / Merchant</th>
        <th>Kategori</th>
        <th>Dompet</th>
        <th>Nominal</th>
      </tr>
    </thead>
    <tbody>
      ${rows}
    </tbody>
  </table>

  <div class="footer">
    Dokumen ini digenerate secara otomatis oleh TataDana Fintech Platform • Timestamps: Waktu Indonesia Barat (WIB)
  </div>
</body>
</html>
  `;
}

/**
 * Generates an official single-transaction PDF receipt (voucher format)
 */
export function generateSingleReceiptPdf(
  tx: Transaction,
  user: Profile
): Buffer {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: [105, 170], // A6 / thermal voucher size
  });

  // Header banner
  doc.setFillColor(249, 115, 22); // Orange #f97316
  doc.rect(0, 0, 105, 20, 'F');

  doc.setFontSize(14);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('TataDana', 10, 13);

  doc.setFontSize(7.5);
  doc.setFont('helvetica', 'normal');
  doc.text('BUKTI TRANSAKSI RESMI', 55, 13);

  // Status Badge
  doc.setFillColor(240, 253, 244);
  doc.roundedRect(10, 24, 85, 8, 1.5, 1.5, 'F');
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(22, 163, 74);
  doc.text('✓ STATUS: TRANSAKSI BERHASIL (SUKSES)', 16, 29.5);

  // Big Amount Display
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.setFont('helvetica', 'normal');
  doc.text(
    tx.type === 'expense'
      ? 'TOTAL PENGELUARAN'
      : tx.type === 'income'
      ? 'TOTAL PEMASUKAN'
      : 'TOTAL TRANSFER',
    10,
    38
  );

  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  if (tx.type === 'expense') {
    doc.setTextColor(234, 88, 12);
    doc.text(`-${formatRupiah(tx.amount)}`, 10, 46);
  } else if (tx.type === 'income') {
    doc.setTextColor(22, 163, 74);
    doc.text(`+${formatRupiah(tx.amount)}`, 10, 46);
  } else {
    doc.setTextColor(37, 99, 235);
    doc.text(`⇄ ${formatRupiah(tx.amount)}`, 10, 46);
  }

  // Divider
  doc.setDrawColor(226, 232, 240);
  doc.line(10, 50, 95, 50);

  // Detail rows
  let y = 56;
  const addDetailRow = (label: string, value: string) => {
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'normal');
    doc.text(label, 10, y);

    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.setFont('helvetica', 'bold');
    doc.text(value, 95, y, { align: 'right' });
    y += 6.5;
  };

  addDetailRow('No. Referensi / ID', tx.id);
  addDetailRow('Tanggal Transaksi', formatDateOnlyWIB(tx.transaction_time));
  addDetailRow('Waktu Transaksi', `${formatIndonesianWIB(new Date(tx.transaction_time)).split(',')[1]?.trim() || ''}`);
  addDetailRow('Akun Pemilik', user.full_name);
  addDetailRow('Metode / Dompet', tx.wallet?.name || 'Dompet Utama');
  if (tx.type === 'transfer' && tx.destination_wallet) {
    addDetailRow('Dompet Tujuan', tx.destination_wallet.name);
  }
  addDetailRow('Kategori', tx.category?.name || 'Umum');
  const srcLabel =
    tx.source === 'telegram_text'
      ? 'Telegram Bot (@tatadanasalwabot)'
      : tx.source === 'telegram_voice'
      ? 'Telegram Voice Note'
      : tx.source === 'telegram_receipt'
      ? 'Telegram Foto Struk'
      : 'Web TataDana';
  addDetailRow('Sumber Pencatatan', srcLabel);

  // Description / Note
  y += 2;
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(10, y, 85, 13, 1.5, 1.5, 'F');
  doc.setFontSize(7);
  doc.setTextColor(100, 116, 139);
  doc.text('Catatan / Keterangan:', 13, y + 4.5);
  doc.setFontSize(7.5);
  doc.setTextColor(30, 41, 59);
  doc.setFont('helvetica', 'bold');
  const splitDesc = doc.splitTextToSize(tx.description, 78);
  doc.text(splitDesc, 13, y + 9);
  y += 17;

  // Struk Items if available
  if (tx.receipt_data && tx.receipt_data.items && tx.receipt_data.items.length > 0) {
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.setFont('helvetica', 'bold');
    doc.text(`Rincian Item Struk (${tx.receipt_data.merchant || 'Merchant'}):`, 10, y);
    y += 4;

    const receiptRows = tx.receipt_data.items.slice(0, 5).map((item) => [
      `${item.name} (${item.qty}x)`,
      formatRupiah(item.price * item.qty),
    ]);

    autoTable(doc, {
      startY: y,
      margin: { left: 10, right: 10 },
      body: receiptRows,
      theme: 'plain',
      styles: { fontSize: 7, cellPadding: 1 },
      columnStyles: { 0: { cellWidth: 55 }, 1: { halign: 'right', fontStyle: 'bold' } },
    });

    y = (doc as any).lastAutoTable?.finalY ? (doc as any).lastAutoTable.finalY + 4 : y + 20;
  }

  // Footer seal
  doc.setDrawColor(226, 232, 240);
  doc.line(10, 154, 95, 154);
  doc.setFontSize(6.5);
  doc.setTextColor(148, 163, 184);
  doc.setFont('helvetica', 'normal');
  doc.text('Dokumen ini sah diterbitkan otomatis oleh TataDana Fintech.', 52, 158, { align: 'center' });
  doc.text('Terverifikasi Enkripsi Digital • Timestamps Asia/Jakarta (WIB)', 52, 162, { align: 'center' });

  return Buffer.from(doc.output('arraybuffer'));
}

/**
 * Generates single transaction HTML receipt for browser viewing/printing
 */
export function generateSingleReceiptHtml(tx: Transaction, user: Profile): string {
  const isExpense = tx.type === 'expense';
  const isTransfer = tx.type === 'transfer';
  const nominalColor = isExpense ? '#ea580c' : isTransfer ? '#2563eb' : '#16a34a';

  let itemsHtml = '';
  if (tx.receipt_data?.items && tx.receipt_data.items.length > 0) {
    itemsHtml = `
      <div style="margin-top: 16px; padding: 12px; background: #f8fafc; border-radius: 8px;">
        <div style="font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 8px;">
          RINCIAN ITEM STRUK (${tx.receipt_data.merchant || 'Merchant'}):
        </div>
        ${tx.receipt_data.items.map(it => `
          <div style="display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 4px; color: #334155;">
            <span>${it.name} (${it.qty}x)</span>
            <span style="font-weight: 600;">${formatRupiah(it.price * it.qty)}</span>
          </div>
        `).join('')}
      </div>
    `;
  }

  return `
<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <title>Bukti Transaksi - ${tx.id}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; background: #f1f5f9; display: flex; justify-content: center; padding: 20px; }
    .receipt-card { background: white; width: 100%; max-width: 440px; border-radius: 16px; box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1); border: 1px solid #e2e8f0; overflow: hidden; }
    .header { background: #f97316; padding: 16px 20px; color: white; display: flex; justify-content: space-between; align-items: center; }
    .body { padding: 24px; }
    .badge { background: #dcfce7; color: #15803d; font-size: 11px; font-weight: 700; padding: 4px 10px; border-radius: 9999px; display: inline-block; }
    .amount { font-size: 28px; font-weight: 800; color: ${nominalColor}; margin: 12px 0 20px 0; font-family: monospace; }
    .row { display: flex; justify-content: space-between; font-size: 12px; margin-bottom: 10px; border-bottom: 1px dashed #f1f5f9; padding-bottom: 6px; }
    .label { color: #64748b; }
    .value { font-weight: 600; color: #0f172a; text-align: right; }
    .footer { text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0; padding: 14px 20px; background: #fafafa; }
    @media print { body { background: white; padding: 0; } .receipt-card { box-shadow: none; border: none; } }
  </style>
</head>
<body>
  <div class="receipt-card">
    <div class="header">
      <div style="font-size: 18px; font-weight: 800;">TataDana</div>
      <div style="font-size: 11px; font-weight: 600;">BUKTI TRANSAKSI RESMI</div>
    </div>
    <div class="body">
      <span class="badge">✓ TRANSAKSI BERHASIL</span>
      <div class="amount">${isExpense ? '-' : isTransfer ? '⇄ ' : '+'}${formatRupiah(tx.amount)}</div>
      
      <div class="row">
        <span class="label">ID Transaksi</span>
        <span class="value">${tx.id}</span>
      </div>
      <div class="row">
        <span class="label">Waktu</span>
        <span class="value">${formatIndonesianWIB(new Date(tx.transaction_time))}</span>
      </div>
      <div class="row">
        <span class="label">Nama Akun</span>
        <span class="value">${user.full_name}</span>
      </div>
      <div class="row">
        <span class="label">Metode / Dompet</span>
        <span class="value">${tx.wallet?.name || 'Dompet Utama'}</span>
      </div>
      <div class="row">
        <span class="label">Kategori</span>
        <span class="value">${tx.category?.emoji || ''} ${tx.category?.name || 'Umum'}</span>
      </div>
      <div class="row">
        <span class="label">Catatan</span>
        <span class="value">${tx.description}</span>
      </div>
      <div class="row">
        <span class="label">Sumber</span>
        <span class="value">${tx.source}</span>
      </div>

      ${itemsHtml}
    </div>
    <div class="footer">
      Terverifikasi Resmi oleh TataDana Fintech • Struk Sah Waktu Indonesia Barat
    </div>
  </div>
</body>
</html>
  `;
}

