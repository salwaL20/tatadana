import { mockStore } from '../supabase/mockStore';
import { SubscriptionRecord } from '@/types/database';
import { formatRupiah } from '../utils/currency';

export interface TelegramOrderResponse {
  ok: boolean;
  order?: SubscriptionRecord;
  replyMessage: string;
}

/**
 * Checks if the user's message is an order or subscription command.
 */
export function isOrderIntent(text: string): { isOrder: boolean; isStatusCheck: boolean } {
  const clean = text.toLowerCase().trim().replace(/[@/]/g, '');

  const statusKeywords = [
    'pesanan', 'status pesanan', 'cek pesanan', 'pesanan saya',
    'status_pesanan', 'status order', 'cek order'
  ];

  if (statusKeywords.some(kw => clean === kw || clean.startsWith(kw))) {
    return { isOrder: true, isStatusCheck: true };
  }

  const orderKeywords = [
    'order', 'pesan', 'upgrade', 'beli pro', 'order pro', 'pesan pro',
    'upgrade pro', 'beli paket pro', 'pesan paket pro', 'order paket pro',
    'langganan', 'langganan pro', 'mau upgrade', 'daftar pro'
  ];

  const isOrder = orderKeywords.some(kw => clean === kw || clean.startsWith(kw));
  return { isOrder, isStatusCheck: false };
}

/**
 * Creates a new subscription order initiated from Telegram Bot and connects to Localhost database.
 */
export function createTelegramSubscriptionOrder(userId: string): TelegramOrderResponse {
  const user = mockStore.profiles.find(p => p.id === userId) || 
               mockStore.profiles.find(p => p.id === 'usr-salwa-001') || 
               mockStore.profiles[0];

  const orderNumber = Math.floor(10000 + Math.random() * 90000);
  const orderId = `ORDER-TD-${orderNumber}`;
  const subId = `sub-tg-${Date.now()}`;

  const newSub: SubscriptionRecord = {
    id: subId,
    user_id: user.id,
    plan: 'pro',
    status: 'pending_approval',
    payment_method: 'midtrans',
    midtrans_order_id: orderId,
    midtrans_transaction_id: `tg-midtrans-${Date.now()}`,
    amount: 99000,
    proof_image_url: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=400',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // Add to beginning of mockStore subscriptions so it's top on Admin Panel
  mockStore.subscriptions.unshift(newSub);

  // Record audit log
  mockStore.auditLogs.unshift({
    id: `aud-${Date.now()}`,
    admin_id: user.id,
    target_user_id: user.id,
    action: 'create_telegram_order',
    metadata: {
      order_id: orderId,
      amount: 99000,
      plan: 'pro',
      source: 'telegram_bot',
      user_name: user.full_name,
    },
    ip_address: '127.0.0.1 (Telegram Polling Localhost)',
    created_at: new Date().toISOString(),
  });

  console.log(`[Telegram Order] Pesanan baru berhasil disambungkan ke localhost! Kode: ${orderId} | Pemesan: ${user.full_name} (${user.id})`);

  const replyMessage = `🎉 <b>PESANAN UPGRADE TATA DANA PRO DITERIMA!</b>

📋 <b>Detail Pesanan:</b>
• No. Pesanan : <code>${orderId}</code>
• Pemesan     : ${user.full_name}
• Paket       : <b>TataDana PRO (Lifetime Access)</b>
• Nominal     : <b>${formatRupiah(99000)}</b>
• Status      : 🟡 <b>Menunggu Persetujuan Admin di Localhost</b>
• Pembayaran  : QRIS / Virtual Account Midtrans

✨ <b>Fitur Unggulan PRO yang Akan Aktif:</b>
├ 📷 Scan OCR Struk Belanja Otomatis via AI
├ 🎙️ Voice Note Pencatatan Tanpa Batas
├ 📊 Ekspor Laporan Finansial Excel & PDF
└ 👛 Kelola Multi-Wallet & Multi-Target Budget

🔗 <b>Tersambung Langsung ke Localhost:</b>
Pesanan Anda telah otomatis tersambung ke server localhost!
Admin dapat melihat dan menyetujui pesanan ini langsung di:
👉 <code>http://localhost:3000/admin/payments</code>

Ketik <b>/pesanan</b> untuk mengecek status persetujuan pesanan Anda.`;

  return {
    ok: true,
    order: newSub,
    replyMessage,
  };
}

/**
 * Retrieves the current order and subscription status for the Telegram user.
 */
export function getTelegramOrderStatus(userId: string): TelegramOrderResponse {
  const user = mockStore.profiles.find(p => p.id === userId) || 
               mockStore.profiles.find(p => p.id === 'usr-salwa-001') || 
               mockStore.profiles[0];

  const userSubs = mockStore.subscriptions.filter(s => s.user_id === user.id);
  const latestSub = userSubs[0]; // Most recent

  if (!latestSub || latestSub.plan === 'starter') {
    const replyMessage = `ℹ️ <b>Status Pesanan TataDana</b>

Halo Kak <b>${user.full_name}</b>, saat ini belum ada pesanan upgrade PRO aktif untuk akun Anda.
Paket aktif: <b>Starter (Gratis)</b>

🚀 <b>Ingin Upgrade ke TataDana PRO?</b>
Cukup ketik perintah:
👉 <b>/upgrade</b> atau <b>pesan pro</b>

Nominal: Rp 99.000 (Sekali Bayar Lifetime)
Pesanan akan otomatis disambungkan ke Localhost untuk persetujuan Admin!`;

    return { ok: true, replyMessage };
  }

  if (latestSub.status === 'pending_approval') {
    const replyMessage = `📋 <b>STATUS PESANAN TERBARU ANDA</b>

• No. Pesanan : <code>${latestSub.midtrans_order_id || latestSub.id}</code>
• Paket       : <b>TataDana PRO</b>
• Nominal     : ${formatRupiah(latestSub.amount || 99000)}
• Status      : 🟡 <b>MENUNGGU PERSETUJUAN ADMIN</b>
• Waktu Order : ${new Date(latestSub.created_at).toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' })} WIB

🔗 <b>Tersambung ke Localhost:</b>
Pesanan Anda sedang menunggu persetujuan Admin di:
👉 <code>http://localhost:3000/admin/payments</code>

Segera setelah Admin menyetujui di localhost, fitur PRO akan langsung aktif!`;

    return { ok: true, order: latestSub, replyMessage };
  }

  if (latestSub.status === 'active') {
    const replyMessage = `🎉 <b>STATUS PESANAN: DISETUJUI & AKTIF!</b>

• No. Pesanan : <code>${latestSub.midtrans_order_id || latestSub.id}</code>
• Paket       : <b>TataDana PRO</b>
• Status      : 🟢 <b>AKTIF (Telah Disetujui Admin)</b>
• Tipe Akun   : <b>PRO Member</b>

✨ Semua fitur Pro sudah dapat digunakan:
• Kirim foto struk belanja untuk scan otomatis
• Kirim voice note tanpa batas kuota
• Ekspor laporan Excel/PDF di web app:
👉 <code>http://localhost:3000/reports</code>`;

    return { ok: true, order: latestSub, replyMessage };
  }

  const replyMessage = `⚠️ <b>Status Pesanan: DITOLAK</b>
• No. Pesanan : <code>${latestSub.midtrans_order_id || latestSub.id}</code>
• Alasan      : ${latestSub.rejection_reason || 'Bukti transfer tidak valid atau belum masuk.'}

Silakan buat pesanan baru dengan mengetik <b>/upgrade</b>.`;

  return { ok: true, order: latestSub, replyMessage };
}
