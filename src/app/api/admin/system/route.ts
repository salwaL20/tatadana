import { NextResponse } from 'next/server';
import { mockStore } from '@/lib/supabase/mockStore';

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      settings: mockStore.systemSettings,
      metrics: {
        totalUsers: mockStore.profiles.length,
        totalWallets: mockStore.wallets.length,
        totalTransactions: mockStore.transactions.length,
        activeBots: mockStore.telegramBots.filter(b => b.webhook_status === 'connected').length,
        maintenanceMode: mockStore.systemSettings.maintenance_mode,
      },
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal memuat pengaturan sistem' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { 
      settings, 
      adminId = 'usr-salwa-001' 
    } = body;

    if (!settings || typeof settings !== 'object') {
      return NextResponse.json({ error: 'Data pengaturan sistem tidak valid' }, { status: 400 });
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
        { error: 'Akses Ditolak: Hanya Superadmin (Salwa L) yang berhak mengubah pengaturan sistem.' },
        { status: 403 }
      );
    }

    // Merge settings
    mockStore.systemSettings = {
      ...mockStore.systemSettings,
      ...settings,
      updated_at: new Date().toISOString(),
    };

    // Audit Log
    mockStore.auditLogs.unshift({
      id: `aud-sys-${Date.now()}`,
      admin_id: adminId,
      target_user_id: 'system_settings',
      action: 'update_system_settings',
      metadata: {
        updated_settings: settings,
        maintenance_mode: mockStore.systemSettings.maintenance_mode,
        starter_tx_limit: mockStore.systemSettings.starter_tx_limit,
        pro_price_idr: mockStore.systemSettings.pro_price_idr,
      },
      ip_address: '127.0.0.1 (Admin System Settings Panel)',
      created_at: new Date().toISOString(),
    });

    console.log(`[Admin Settings] Superadmin Salwa L memperbarui pengaturan sistem`);

    return NextResponse.json({
      success: true,
      message: 'Pengaturan sistem berhasil disimpan dan diperbarui!',
      settings: mockStore.systemSettings,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || 'Gagal menyimpan pengaturan sistem' }, { status: 500 });
  }
}
