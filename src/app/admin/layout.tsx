'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  ShieldCheck, 
  Users, 
  Cpu, 
  CreditCard, 
  Activity, 
  Database, 
  Search, 
  ArrowLeft,
  ShieldAlert,
  Lock,
  LogIn,
  UserCheck,
  Megaphone,
  Layers,
  Settings
} from 'lucide-react';
import { Profile } from '@/types/database';
import { mockStore } from '@/lib/supabase/mockStore';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [adminPanelName, setAdminPanelName] = useState('Panel Approval Salwa L');
  const [currentUser, setCurrentUser] = useState<Profile | null>(null);
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('tatadana_admin_panel_name');
      if (saved) setAdminPanelName(saved);

      const handleStorage = (e: StorageEvent) => {
        if (e.key === 'tatadana_admin_panel_name' && e.newValue) {
          setAdminPanelName(e.newValue);
        }
      };
      const handleCustom = () => {
        const updated = localStorage.getItem('tatadana_admin_panel_name');
        if (updated) setAdminPanelName(updated);
      };

      window.addEventListener('storage', handleStorage);
      window.addEventListener('panelNameChanged', handleCustom);

      // Verify Admin Authorization
      const checkAuth = () => {
        const storedUser = localStorage.getItem('tatadana_current_user');
        const storedUserId = localStorage.getItem('tatadana_current_user_id');

        let user: Profile | null = null;
        if (storedUser) {
          try {
            user = JSON.parse(storedUser);
          } catch (e) {}
        }
        if (!user && storedUserId) {
          user = mockStore.profiles.find(p => p.id === storedUserId) || null;
        }
        setCurrentUser(user);

        // Authorization rule: Only Superadmin (SALWA L or usr-admin-super) is allowed
        const isAdmin = Boolean(
          user && (
            user.role === 'superadmin' || 
            user.email?.toLowerCase() === 'salwal@gmail.com' ||
            user.email?.toLowerCase() === 'salwal20@gmail.com' ||
            user.email?.toLowerCase() === 'salwayoy@gmail.com' || 
            user.id === 'usr-salwa-001' || 
            user.id === 'usr-admin-super'
          )
        );

        setIsAuthorized(isAdmin);
      };

      checkAuth();
      window.addEventListener('tatadana_user_switched', checkAuth);

      return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener('panelNameChanged', handleCustom);
        window.removeEventListener('tatadana_user_switched', checkAuth);
      };
    }
  }, []);

  const adminNav = [
    { label: 'Ringkasan Admin', href: '/admin', icon: ShieldCheck },
    { label: 'Kelola Pengguna', href: '/admin/users', icon: Users },
    { label: 'Approval Pengguna', href: '/admin/user-approvals', icon: UserCheck },
    { label: 'Broadcast & Notifikasi', href: '/admin/broadcast', icon: Megaphone },
    { label: 'Transaksi Global', href: '/admin/global-transactions', icon: Layers },
    { label: 'Konfigurasi AI Provider', href: '/admin/ai-config', icon: Cpu },
    { label: 'Log Aktivitas AI', href: '/admin/ai-logs', icon: Activity },
    { label: adminPanelName, href: '/admin/payments', icon: CreditCard },
    { label: 'Inspeksi Transaksi & Audit', href: '/admin/inspect', icon: Search },
    { label: 'Pengaturan Sistem', href: '/admin/system-settings', icon: Settings },
    { label: 'Ekspor Data Sistem', href: '/admin/export', icon: Database },
  ];

  // 1. Loading check
  if (isAuthorized === null) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center">
        <div className="flex items-center gap-3 text-orange-500 font-bold text-sm">
          <span className="w-4 h-4 rounded-full border-2 border-orange-500 border-t-transparent animate-spin"></span>
          <span>Memverifikasi Otorisasi Superadmin...</span>
        </div>
      </div>
    );
  }

  // 2. Access Denied Screen if user is not authorized
  if (isAuthorized === false) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-slate-900 border border-rose-500/30 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="w-16 h-16 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-500 mx-auto flex items-center justify-center shadow-lg shadow-rose-500/10">
            <ShieldAlert className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
              <Lock className="w-3 h-3" />
              Akses Dibatasi Khusus Superadmin
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">Akses Ditolak (403)</h1>
            <p className="text-xs text-slate-400 leading-relaxed pt-1">
              Admin Panel TataDana dikunci dan hanya dapat digunakan oleh Superadmin (<b>Salwa L</b>).
              Akun Anda (<b>{currentUser?.full_name || 'Pengguna Lain'}</b>) tidak memiliki hak akses administratif.
            </p>
          </div>

          <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-left text-xs space-y-1">
            <div className="text-slate-400 text-[10px]">Akun Terdeteksi Saat Ini:</div>
            <div className="font-bold text-white flex items-center justify-between">
              <span>{currentUser?.full_name || 'Tamu'}</span>
              <span className="text-[10px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded uppercase font-bold">
                Role: {currentUser?.role || 'user'}
              </span>
            </div>
            <div className="text-slate-500 text-[11px]">{currentUser?.email || currentUser?.phone_number || '-'}</div>
          </div>

          <div className="pt-2 flex flex-col gap-2.5">
            <Link
              href="/dashboard"
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/30 transition flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Kembali ke Dashboard Pengguna</span>
            </Link>
            <Link
              href="/login"
              className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold text-xs rounded-xl transition flex items-center justify-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Masuk dengan Akun Admin (Salwa L)</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 3. Authorized Superadmin View
  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col md:flex-row">
      {/* Admin Sidebar */}
      <aside className="w-full md:w-64 bg-slate-950 border-r border-slate-800 p-5 flex flex-col justify-between">
        <div className="space-y-6">
          {/* Logo & Superadmin Badge */}
          <div>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-orange-600 flex items-center justify-center font-black text-white text-lg shadow-md shadow-orange-600/30">
                  TD
                </div>
                <div>
                  <div className="font-bold text-base text-white tracking-tight">Superadmin Salwa L</div>
                  <div className="text-[10px] text-orange-400 font-semibold uppercase tracking-wider">TataDana Console</div>
                </div>
              </div>
              <ThemeSwitcher />
            </div>
            <div className="mt-3 px-3 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[11px] font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
              Akses Penuh Superadmin
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {adminNav.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                    isActive
                      ? 'bg-orange-600 text-white shadow-md shadow-orange-600/20'
                      : 'text-slate-400 hover:text-white hover:bg-slate-900'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Back to User Dashboard */}
        <div className="pt-4 border-t border-slate-800 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center justify-center gap-2 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl text-xs font-semibold transition border border-slate-800"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Tampilan User App</span>
          </Link>
        </div>
      </aside>

      {/* Main Admin Content */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto max-w-7xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}
