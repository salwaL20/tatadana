import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/supabase/mockStore';

export async function GET() {
  const subscriptions = mockStore.subscriptions.map(sub => {
    const user = mockStore.profiles.find(p => p.id === sub.user_id);
    return {
      ...sub,
      user_name: user?.full_name || 'Pengguna Tidak Diketahui',
      user_phone: user?.phone_number || '-',
      current_user_plan: user?.subscription_tier || 'starter',
    };
  });

  return NextResponse.json({
    subscriptions,
    total: subscriptions.length,
    pendingCount: subscriptions.filter(s => s.status === 'pending_approval').length,
    activeCount: subscriptions.filter(s => s.status === 'active').length,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { action, id, rejectionReason } = body;

    const sub = mockStore.subscriptions.find(s => s.id === id);
    if (!sub) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const user = mockStore.profiles.find(p => p.id === sub.user_id);

    const adminId = body.adminId || 'usr-salwa-001';

    if (action === 'approve') {
      sub.status = 'active';
      sub.updated_at = new Date().toISOString();
      sub.approved_by = adminId;

      if (user) {
        user.subscription_tier = 'pro';
        user.updated_at = new Date().toISOString();
      }

      mockStore.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        admin_id: adminId,
        target_user_id: sub.user_id,
        action: 'approve_subscription_pro',
        metadata: {
          subscription_id: sub.id,
          order_id: sub.midtrans_order_id,
          amount: sub.amount,
          payment_method: sub.payment_method,
        },
        ip_address: '127.0.0.1 (Internal Admin)',
        created_at: new Date().toISOString(),
      });

      mockStore.saveToFile();

      return NextResponse.json({
        success: true,
        message: 'Pembayaran disetujui, akun berhasil diupgrade ke PRO!',
        subscription: sub,
        user,
      });
    }

    if (action === 'reject') {
      sub.status = 'rejected';
      sub.rejection_reason = rejectionReason || 'Bukti transfer tidak valid atau nominal tidak sesuai';
      sub.updated_at = new Date().toISOString();

      mockStore.auditLogs.unshift({
        id: `aud-${Date.now()}`,
        admin_id: adminId,
        target_user_id: sub.user_id,
        action: 'reject_subscription',
        metadata: {
          subscription_id: sub.id,
          order_id: sub.midtrans_order_id,
          reason: sub.rejection_reason,
        },
        ip_address: '127.0.0.1 (Internal Admin)',
        created_at: new Date().toISOString(),
      });

      mockStore.saveToFile();

      return NextResponse.json({
        success: true,
        message: 'Pembayaran ditolak',
        subscription: sub,
      });
    }

    if (action === 'sync_midtrans') {
      // Simulate real Midtrans status check
      const midtransStatuses = ['settlement', 'pending', 'expire', 'deny'];
      const statusSimulated = sub.amount > 0 ? 'settlement' : 'pending';

      if (statusSimulated === 'settlement') {
        sub.status = 'active';
        if (user) user.subscription_tier = 'pro';
      }

      return NextResponse.json({
        success: true,
        orderId: sub.midtrans_order_id,
        transactionStatus: statusSimulated,
        fraudStatus: 'accept',
        paymentType: sub.payment_method === 'midtrans' ? 'qris' : 'bank_transfer',
        settlementTime: new Date().toISOString(),
        subscription: sub,
      });
    }

    return NextResponse.json({ error: 'Aksi tidak dikenal' }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
