import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/supabase/mockStore';
import { BroadcastRecord } from '@/types/database';

export async function GET() {
  try {
    const totalUsers = mockStore.profiles.length;
    const proUsers = mockStore.profiles.filter(p => p.subscription_tier === 'pro').length;
    const starterUsers = mockStore.profiles.filter(p => p.subscription_tier === 'starter').length;
    const pendingUsers = mockStore.profiles.filter(p => p.approval_status === 'pending').length;
    const tgConnectedUsers = mockStore.profiles.filter(p => Boolean(p.telegram_chat_id)).length;
    const waVerifiedUsers = mockStore.profiles.filter(p => p.phone_verified).length;

    return NextResponse.json({
      success: true,
      broadcasts: mockStore.broadcasts,
      stats: {
        total: totalUsers,
        pro: proUsers,
        starter: starterUsers,
        pending: pendingUsers,
        telegramConnected: tgConnectedUsers,
        whatsappVerified: waVerifiedUsers,
        totalBroadcastsSent: mockStore.broadcasts.length,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal mengambil data broadcast' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      title, 
      message, 
      target = 'all', 
      channel = 'all', 
      adminId = 'usr-salwa-001' 
    } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Judul broadcast wajib diisi' }, { status: 400 });
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Isi pesan broadcast wajib diisi' }, { status: 400 });
    }

    // Verify Admin Authorization
    const adminUser = mockStore.profiles.find(p => p.id === adminId);
    const isAuthorizedAdmin = Boolean(
      adminId === 'usr-salwa-001' || 
      adminId === 'usr-admin-super' ||
      adminUser?.role === 'superadmin' ||
      adminUser?.email?.toLowerCase() === 'salwal@gmail.com' ||
      adminUser?.email?.toLowerCase() === 'salwal20@gmail.com'
    );

    if (!isAuthorizedAdmin) {
      return NextResponse.json(
        { error: 'Akses Ditolak: Hanya Superadmin (Salwa L) yang berhak mengirim broadcast.' },
        { status: 403 }
      );
    }

    // Determine target recipient users
    let recipientUsers = [...mockStore.profiles];
    if (target === 'pro') {
      recipientUsers = recipientUsers.filter(p => p.subscription_tier === 'pro');
    } else if (target === 'starter') {
      recipientUsers = recipientUsers.filter(p => p.subscription_tier === 'starter');
    } else if (target === 'pending') {
      recipientUsers = recipientUsers.filter(p => p.approval_status === 'pending');
    }

    const newBroadcast: BroadcastRecord = {
      id: `bc-${Date.now()}`,
      title: title.trim(),
      message: message.trim(),
      target: target as any,
      channel: channel as any,
      sent_by: adminId,
      recipient_count: recipientUsers.length,
      status: 'sent',
      created_at: new Date().toISOString(),
    };

    mockStore.broadcasts.unshift(newBroadcast);

    // Audit Log
    mockStore.auditLogs.unshift({
      id: `aud-bc-${Date.now()}`,
      admin_id: adminId,
      target_user_id: 'all_recipients',
      action: 'send_broadcast_message',
      metadata: {
        broadcast_id: newBroadcast.id,
        title: newBroadcast.title,
        target: newBroadcast.target,
        channel: newBroadcast.channel,
        recipients_count: newBroadcast.recipient_count,
      },
      ip_address: '127.0.0.1 (Admin Broadcast Panel)',
      created_at: new Date().toISOString(),
    });

    console.log(`[Admin Broadcast] Salwa L mengirim broadcast: "${newBroadcast.title}" ke ${newBroadcast.recipient_count} pengguna`);

    return NextResponse.json({
      success: true,
      message: `Broadcast "${newBroadcast.title}" berhasil dikirimkan ke ${newBroadcast.recipient_count} pengguna (${target.toUpperCase()})!`,
      broadcast: newBroadcast,
      recipientCount: newBroadcast.recipient_count,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal memproses pengiriman broadcast' }, { status: 500 });
  }
}
