import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/supabase/mockStore';
import { Profile, UserApprovalStatus } from '@/types/database';

export async function GET() {
  try {
    const profiles = mockStore.profiles;
    const pendingUsers = profiles.filter(p => p.approval_status === 'pending');
    const approvedUsers = profiles.filter(p => !p.approval_status || p.approval_status === 'approved');
    const rejectedUsers = profiles.filter(p => p.approval_status === 'rejected');

    return NextResponse.json({
      success: true,
      stats: {
        total: profiles.length,
        pending: pendingUsers.length,
        approved: approvedUsers.length,
        rejected: rejectedUsers.length,
      },
      pendingUsers,
      users: profiles,
      recentApprovals: approvedUsers.slice(0, 5),
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal memuat data approval' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { userId, action, notes, adminId = 'usr-salwa-001' } = body;

    if (!userId || typeof userId !== 'string') {
      return NextResponse.json({ error: 'ID Pengguna wajib diisi' }, { status: 400 });
    }

    if (!['approve', 'verify', 'reject', 'reset'].includes(action)) {
      return NextResponse.json({ error: "Aksi tidak valid. Pilih 'approve', 'verify', 'reject', atau 'reset'." }, { status: 400 });
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
        { error: 'Akses Ditolak: Hanya Superadmin (Salwa L) yang berhak melakukan approval pengguna.' },
        { status: 403 }
      );
    }

    const userIndex = mockStore.profiles.findIndex(p => p.id === userId);
    if (userIndex === -1) {
      return NextResponse.json({ error: 'Pengguna tidak ditemukan' }, { status: 404 });
    }

    const targetUser = mockStore.profiles[userIndex];
    const previousStatus = targetUser.approval_status || 'approved';
    let newStatus: UserApprovalStatus = 'approved';

    if (action === 'approve' || action === 'verify') {
      newStatus = 'approved';
      targetUser.approval_status = 'approved';
      targetUser.phone_verified = true; // Nomor WhatsApp pendaftar resmi diverifikasi
      targetUser.approved_at = new Date().toISOString();
      targetUser.approved_by = adminId;
      targetUser.approval_notes = notes || 'Nomor WhatsApp diverifikasi & disetujui oleh Admin Salwa L';
    } else if (action === 'reject') {
      newStatus = 'rejected';
      targetUser.approval_status = 'rejected';
      targetUser.approved_at = null;
      targetUser.approved_by = adminId;
      targetUser.approval_notes = notes || 'Pendaftaran ditolak oleh Admin Salwa L';
    } else if (action === 'reset') {
      newStatus = 'pending';
      targetUser.approval_status = 'pending';
      targetUser.approved_at = null;
      targetUser.approved_by = null;
      targetUser.approval_notes = notes || 'Status approval dikembalikan ke peninjauan';
    }

    targetUser.updated_at = new Date().toISOString();

    // Record audit log
    const auditAction = (action === 'approve' || action === 'verify') 
      ? 'user_approval_approved' 
      : (action === 'reject' ? 'user_approval_rejected' : 'user_approval_reset');

    mockStore.auditLogs.unshift({
      id: `aud-appr-${Date.now()}`,
      admin_id: adminId,
      target_user_id: userId,
      action: auditAction,
      metadata: {
        target_name: targetUser.full_name,
        target_phone: targetUser.phone_number,
        phone_verified: targetUser.phone_verified,
        previous_status: previousStatus,
        new_status: newStatus,
        notes: targetUser.approval_notes,
      },
      ip_address: '127.0.0.1 (Admin User Approval Panel)',
      created_at: new Date().toISOString(),
    });

    console.log(`[Admin Approval] Pengguna ${targetUser.full_name} (${targetUser.id}) berhasil di-${action} oleh ${adminId}`);

    mockStore.saveToFile();

    return NextResponse.json({
      success: true,
      message: `Pengguna ${targetUser.full_name} berhasil ${(action === 'approve' || action === 'verify') ? 'diverifikasi & disetujui' : (action === 'reject' ? 'ditolak' : 'direset ke pending')}!`,
      user: targetUser,
      approvalStatus: newStatus,
      phoneVerified: targetUser.phone_verified,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal memproses approval pengguna' }, { status: 500 });
  }
}
