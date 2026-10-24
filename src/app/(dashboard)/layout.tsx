'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Home, 
  CreditCard, 
  BarChart3, 
  Target, 
  Wallet, 
  Settings, 
  LogOut, 
  Sparkles, 
  Menu, 
  X, 
  ShieldAlert,
  ArrowRight,
  Calendar,
  Bot,
  Shield,
  LogIn,
  Pencil,
  Users,
  BookOpen,
  Camera,
  UserCheck,
  Check,
  Megaphone,
  Layers
} from 'lucide-react';
import { Profile } from '@/types/database';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isImpersonating, setIsImpersonating] = useState(false);
  const [adminPanelName, setAdminPanelName] = useState('Panel Approval Salwa L');
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [tempRenameName, setTempRenameName] = useState('Panel Approval Salwa L');
  const [showAccountSwitcherModal, setShowAccountSwitcherModal] = useState(false);
  const [showAdminLockedModal, setShowAdminLockedModal] = useState(false);


  const [user, setUser] = useState<Profile>({
    id: 'usr-salwa-001',
    full_name: 'SALWA L',
    email: 'salwaL@gmail.com',
    phone_number: '+628815703360',
    phone_verified: true,
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    default_currency: 'IDR',
    role: 'superadmin',
    telegram_chat_id: 8112961346,
    telegram_username: 'tatadanasalwabot',
    subscription_tier: 'pro',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-10-10T05:00:00Z',
  });

  const availableAccounts: Profile[] = [
    {
      id: 'usr-salwa-001',
      full_name: 'SALWA L',
      email: 'salwaL@gmail.com',
      phone_number: '+628815703360',
      phone_verified: true,
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      default_currency: 'IDR',
      role: 'superadmin',
      telegram_chat_id: 8112961346,
      telegram_username: 'tatadanasalwabot',
      subscription_tier: 'pro',
      created_at: '2026-09-01T08:00:00Z',
      updated_at: '2026-10-10T05:00:00Z',
    },
    {
      id: 'usr-budi-12345',
      full_name: 'Budi Pratama',
      email: 'budi@example.com',
      phone_number: '+6281234567890',
      phone_verified: true,
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      default_currency: 'IDR',
      role: 'user',
      telegram_chat_id: 123456789,
      telegram_username: 'budipratama',
      subscription_tier: 'starter',
      created_at: '2026-09-01T08:00:00Z',
      updated_at: '2026-10-10T05:00:00Z',
    },
    {
      id: 'usr-citra-99887',
      full_name: 'Citra Kirana',
      email: 'citra@example.com',
      phone_number: '+6281398765432',
      phone_verified: true,
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      default_currency: 'IDR',
      role: 'user',
      telegram_chat_id: 654321987,
      telegram_username: 'citrakirana',
      subscription_tier: 'starter',
      created_at: '2026-09-15T10:00:00Z',
      updated_at: '2026-10-10T05:00:00Z',
    },
    {
      id: 'usr-admin-super',
      full_name: 'Super Admin TataDana',
      email: 'admin@tatadana.id',
      phone_number: '+6281199998888',
      phone_verified: true,
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      default_currency: 'IDR',
      role: 'superadmin',
      telegram_chat_id: 999888777,
      telegram_username: 'tatadana_admin',
      subscription_tier: 'pro',
      created_at: '2026-01-01T00:00:00Z',
      updated_at: '2026-10-10T05:00:00Z',
    },
    {
      id: 'usr-guest-005',
      full_name: 'Tamu / Demo User',
      email: 'guest@tatadana.id',
      phone_number: '+6281900001111',
      phone_verified: true,
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      default_currency: 'IDR',
      role: 'user',
      telegram_chat_id: null,
      telegram_username: 'tatadana_guest',
      subscription_tier: 'starter',
      approval_status: 'approved',
      created_at: '2026-10-01T00:00:00Z',
      updated_at: '2026-10-10T05:00:00Z',
    },
    {
      id: 'usr-pending-001',
      full_name: 'Rahmat Hidayat (Pendaftar Baru)',
      email: 'rahmat.hidayat@example.com',
      phone_number: '+6281299887766',
      phone_verified: true,
      avatar_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
      default_currency: 'IDR',
      role: 'user',
      telegram_chat_id: null,
      telegram_username: 'rahmathidayat',
      subscription_tier: 'starter',
      approval_status: 'pending',
      created_at: '2026-10-17T12:00:00Z',
      updated_at: '2026-10-17T12:00:00Z',
    }
  ];

  const [accountList, setAccountList] = useState<Profile[]>(availableAccounts);

  const handleSwitchAccount = (account: Profile) => {
    setUser(account);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tatadana_current_user_id', account.id);
      localStorage.setItem('tatadana_current_user', JSON.stringify(account));
      if (account.avatar_url) {
        localStorage.setItem('tatadana_profile_avatar', account.avatar_url);
      }
      window.dispatchEvent(new Event('tatadana_user_switched'));
      window.dispatchEvent(new Event('tatadana_profile_updated'));
    }
    setShowAccountSwitcherModal(false);
  };

  useEffect(() => {
    // Check if user or impersonation flag exists in storage
    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('tatadana_current_user');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setUser(parsed);
          setAccountList(prev => {
            const updated = prev.map(a => a.id === parsed.id ? { ...a, ...parsed } : a);
            if (!updated.some(a => a.id === parsed.id)) {
              return [parsed, ...updated];
            }
            return updated;
          });
        } catch (e) {}
      }
      const storedAvatar = localStorage.getItem('tatadana_profile_avatar');
      if (storedAvatar) {
        setUser(prev => ({ ...prev, avatar_url: storedAvatar }));
      }

      const savedName = localStorage.getItem('tatadana_admin_panel_name');
      if (savedName) {
        setAdminPanelName(savedName);
        setTempRenameName(savedName);
      }
      const imp = sessionStorage.getItem('tatadana_impersonating');
      if (imp === 'true') {
        setIsImpersonating(true);
      }

      const handleProfileUpdate = (e: any) => {
        const customAvatar = e?.detail?.avatar_url || localStorage.getItem('tatadana_profile_avatar');
        const customName = e?.detail?.full_name;
        setUser(prev => ({
          ...prev,
          ...(customAvatar ? { avatar_url: customAvatar } : {}),
          ...(customName ? { full_name: customName } : {})
        }));
        const curr = localStorage.getItem('tatadana_current_user');
        if (curr) {
          try { setUser(JSON.parse(curr)); } catch (err) {}
        }
      };

      const handleStorage = (e: StorageEvent) => {
        if (e.key === 'tatadana_admin_panel_name' && e.newValue) {
          setAdminPanelName(e.newValue);
          setTempRenameName(e.newValue);
        }
        if (e.key === 'tatadana_profile_avatar' && e.newValue) {
          setUser(prev => ({ ...prev, avatar_url: e.newValue || prev.avatar_url }));
        }
        if (e.key === 'tatadana_current_user' && e.newValue) {
          try { setUser(JSON.parse(e.newValue)); } catch (err) {}
        }
      };

      const handleCustom = () => {
        const updated = localStorage.getItem('tatadana_admin_panel_name');
        if (updated) {
          setAdminPanelName(updated);
          setTempRenameName(updated);
        }
      };

      window.addEventListener('storage', handleStorage);
      window.addEventListener('panelNameChanged', handleCustom);
      window.addEventListener('tatadana_profile_updated', handleProfileUpdate);
      window.addEventListener('tatadana_user_switched', handleProfileUpdate);

      return () => {
        window.removeEventListener('storage', handleStorage);
        window.removeEventListener('panelNameChanged', handleCustom);
        window.removeEventListener('tatadana_profile_updated', handleProfileUpdate);
        window.removeEventListener('tatadana_user_switched', handleProfileUpdate);
      };
    }
  }, []);

  // Check if current user is Superadmin (SALWA L)
  const isUserAdmin = Boolean(
    user && (
      user.role === 'superadmin' || 
      user.email?.toLowerCase() === 'salwal@gmail.com' ||
      user.email?.toLowerCase() === 'salwal20@gmail.com' ||
      user.email?.toLowerCase() === 'salwayoy@gmail.com' || 
      user.id === 'usr-salwa-001' || 
      user.id === 'usr-admin-super'
    )
  );

  const navItems = [
    { label: 'Beranda', href: '/dashboard', icon: Home, emoji: '🏠' },
    { label: 'Transaksi', href: '/transactions', icon: CreditCard, emoji: '💳' },
    { label: 'Kolaborasi Tim', href: '/teamwork-preview', icon: Users, emoji: '👥', badge: '10 Tim' },
    { label: 'Budget', href: '/budgets', icon: Target, emoji: '🎯' },
    { label: 'Wallet & Dompet', href: '/wallets', icon: Wallet, emoji: '👛' },
    { label: 'Laporan', href: '/reports', icon: BarChart3, emoji: '📊' },
    { label: 'Pusat Belajar', href: '/learn', icon: BookOpen, emoji: '🎓', badge: 'Panduan' },
    { label: 'Kalender Keuangan', href: '/calendar', icon: Calendar, emoji: '📅' },
    { label: 'Tata AI Bot', href: '/tata-ai', icon: Bot, emoji: '🧠' },
    { label: 'Settings', href: '/settings', icon: Settings, emoji: '⚙️' },
    { 
      label: 'Pusat Admin', 
      href: '/admin', 
      icon: Shield, 
      emoji: '⚡', 
      badge: isUserAdmin ? 'Superadmin' : '🔒 Khusus Admin' 
    },
    { 
      label: 'Approval Pengguna', 
      href: '/admin/user-approvals', 
      icon: UserCheck, 
      emoji: '👤', 
      badge: isUserAdmin ? 'Approve' : '🔒 Khusus Admin' 
    },
    { 
      label: adminPanelName, 
      href: '/admin/payments', 
      icon: CreditCard, 
      emoji: '🛡️', 
      badge: isUserAdmin ? 'Approve' : '🔒 Khusus Admin', 
      canRename: isUserAdmin 
    },
    { 
      label: 'Broadcast Notifikasi', 
      href: '/admin/broadcast', 
      icon: Megaphone, 
      emoji: '📢', 
      badge: isUserAdmin ? 'Broadcast' : '🔒 Khusus Admin' 
    },
    { 
      label: 'Transaksi Global', 
      href: '/admin/global-transactions', 
      icon: Layers, 
      emoji: '🌐', 
      badge: isUserAdmin ? 'Monitor' : '🔒 Khusus Admin' 
    },
    { label: 'Menu Log In', href: '/login', icon: LogIn, emoji: '🔑' },
  ];


  return (
    <div className="min-h-screen bg-slate-50 flex flex-col">
      {/* Impersonation Banner */}
      {isImpersonating && (
        <div className="bg-amber-500 text-slate-900 px-4 py-2 font-medium text-xs md:text-sm flex items-center justify-between shadow-sm sticky top-0 z-50">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-slate-950 animate-pulse" />
            <span>Mode Impersonasi Admin: Sedang menginspeksi akun <b>{user.full_name}</b> ({user.phone_number})</span>
          </div>
          <button 
            onClick={() => {
              sessionStorage.removeItem('tatadana_impersonating');
              window.location.href = '/admin/users';
            }}
            className="bg-slate-900 text-white text-xs px-3 py-1 rounded-md hover:bg-slate-800 transition font-semibold"
          >
            Kembali ke Admin
          </button>
        </div>
      )}

      {/* Pending Approval User Banner */}
      {user.approval_status === 'pending' && !isUserAdmin && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-slate-950 px-4 py-2.5 font-medium text-xs md:text-sm flex flex-col sm:flex-row items-center justify-between gap-2 shadow-sm sticky top-0 z-40 border-b border-amber-600/30">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-900 animate-ping shrink-0"></span>
            <span>
              <b>Status Akun: Menunggu Approval Admin Salwa L.</b> Akun Anda sedang dalam antrean verifikasi untuk perlindungan data finansial.
            </span>
          </div>
          <a
            href={`https://wa.me/628815703360?text=${encodeURIComponent(`Halo Admin Salwa L, mohon verifikasi dan approval akun TataDana saya atas nama ${user.full_name} (${user.phone_number}).`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-slate-950 hover:bg-slate-900 text-amber-300 hover:text-amber-200 text-xs px-3 py-1 rounded-lg transition font-bold shrink-0 flex items-center gap-1 shadow-xs"
          >
            <span>💬 Chat Admin Salwa WA (08815703360)</span>
          </a>
        </div>
      )}

      {/* Rejected Approval User Banner */}
      {user.approval_status === 'rejected' && !isUserAdmin && (
        <div className="bg-rose-600 text-white px-4 py-2.5 font-medium text-xs md:text-sm flex flex-col sm:flex-row items-center justify-between gap-2 shadow-sm sticky top-0 z-40">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-white shrink-0" />
            <span>
              <b>Status Akun Ditolak:</b> Pendaftaran akun Anda tidak disetujui ({user.approval_notes || 'Silakan hubungi admin'}).
            </span>
          </div>
          <a
            href={`https://wa.me/628815703360?text=${encodeURIComponent(`Halo Admin Salwa L, akun TataDana saya (${user.full_name}) ditolak. Mohon info lebih lanjut.`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white text-rose-700 hover:bg-rose-50 text-xs px-3 py-1 rounded-lg transition font-bold shrink-0 flex items-center gap-1"
          >
            <span>Hubungi Admin Salwa (08815703360)</span>
          </a>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row">
        {/* Desktop Sidebar */}
        <aside className="hidden md:flex flex-col w-64 bg-white border-r border-slate-200 p-4 sticky top-0 h-screen justify-between">
          <div className="space-y-6">
            {/* Brand Logo */}
            <div className="flex items-center justify-between px-2 pt-2">
              <Link href="/dashboard" className="flex items-center gap-2.5 group">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center shadow-md shadow-orange-500/20 text-white font-black text-xl group-hover:scale-105 transition-transform">
                  TD
                </div>
                <div>
                  <div className="font-bold text-lg text-slate-900 tracking-tight leading-none">TataDana</div>
                  <div className="text-[10px] text-orange-600 font-semibold mt-0.5">Fintech Telegram</div>
                </div>
              </Link>
              <ThemeSwitcher />
            </div>

            {/* Navigation links */}
            <nav className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => {
                      if (item.href.startsWith('/admin') && !isUserAdmin) {
                        e.preventDefault();
                        setShowAdminLockedModal(true);
                      }
                    }}
                    className={`group/item flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition ${
                      isActive
                        ? 'bg-orange-50 text-orange-600 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-orange-600' : 'text-slate-500'}`} />
                    <span className="flex items-center gap-1.5 flex-1 min-w-0">
                      <span className="text-sm shrink-0">{item.emoji}</span>
                      <span className="truncate">{item.label}</span>
                    </span>
                    {(item as any).badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700 border border-orange-200 shrink-0">
                        {(item as any).badge}
                      </span>
                    )}
                    {(item as any).canRename && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          setTempRenameName(adminPanelName);
                          setShowRenameModal(true);
                        }}
                        title="Ganti nama panel sendiri"
                        className="p-1 rounded-md text-slate-400 hover:text-orange-600 hover:bg-orange-100/70 transition shrink-0 opacity-70 group-hover/item:opacity-100"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </Link>
                );
              })}
            </nav>
          </div>

          {/* User profile & Plan Badge card */}
          <div className="space-y-3 pt-4 border-t border-slate-100">
            {/* Plan Card */}
            <div className="p-3 rounded-xl bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-bold text-orange-900 flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                  Paket {user.subscription_tier.toUpperCase()}
                </span>
                <span className="text-[10px] bg-orange-200/80 text-orange-800 font-semibold px-2 py-0.5 rounded-full">
                  {user.subscription_tier === 'pro' ? 'Lifetime' : 'Bulan 1'}
                </span>
              </div>
              <p className="text-[11px] text-slate-600 leading-tight">
                {user.subscription_tier === 'pro' 
                  ? 'Akses penuh tanpa batas transaksi & OCR struk.'
                  : 'Batas 50 transaksi/bln. Tingkatkan ke Pro sekarang!'}
              </p>
              {user.subscription_tier === 'starter' && (
                <Link
                  href="/settings?tab=subscription"
                  className="mt-2.5 w-full flex items-center justify-center gap-1.5 py-1.5 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-bold transition shadow-sm"
                >
                  <span>Upgrade Rp99rb</span>
                  <ArrowRight className="w-3 h-3" />
                </Link>
              )}
            </div>

            {/* User Avatar & Account Switcher Trigger */}
            <div className="flex items-center justify-between px-1 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="relative group/avatar shrink-0">
                  <img
                    src={user.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'}
                    alt={user.full_name}
                    className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs"
                  />
                  <Link
                    href="/settings?tab=profile"
                    title="Ganti Foto Profil"
                    className="absolute -bottom-1 -right-1 p-1 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-xs transition"
                  >
                    <Camera className="w-2.5 h-2.5" />
                  </Link>
                </div>
                <div 
                  onClick={() => setShowAccountSwitcherModal(true)}
                  className="overflow-hidden cursor-pointer hover:opacity-80 transition text-left"
                  title="Klik untuk beralih akun"
                >
                  <div className="text-xs font-bold text-slate-900 truncate flex items-center gap-1">
                    <span>{user.full_name}</span>
                    <span className="text-[9px] bg-orange-100 text-orange-700 px-1 rounded font-bold">Ganti</span>
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">{user.email || user.phone_number}</div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  type="button"
                  onClick={() => setShowAccountSwitcherModal(true)}
                  title="Ganti Akun Pengguna"
                  className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition"
                >
                  <Users className="w-4 h-4" />
                </button>
                <Link
                  href="/login"
                  title="Keluar"
                  className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                >
                  <LogOut className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </aside>

        {/* Mobile Header Bar */}
        <div className="md:hidden flex items-center justify-between p-4 bg-white border-b border-slate-200 sticky top-0 z-40">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white font-black text-sm">
              TD
            </div>
            <span className="font-bold text-base text-slate-900">TataDana</span>
          </Link>
          <div className="flex items-center gap-2">
            <ThemeSwitcher />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-600 hover:text-slate-900 rounded-lg border border-slate-200"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-end">
            <div className="w-4/5 max-w-sm bg-white h-full p-5 flex flex-col justify-between shadow-2xl">
              <div>
                <div className="flex justify-between items-center pb-4 border-b border-slate-100">
                  <div className="font-bold text-slate-900">Menu TataDana</div>
                  <button onClick={() => setMobileMenuOpen(false)} className="p-1 text-slate-500">
                    <X className="w-5 h-5" />
                  </button>
                </div>
                <nav className="mt-4 space-y-1">
                  {navItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        onClick={(e) => {
                          if (item.href.startsWith('/admin') && !isUserAdmin) {
                            e.preventDefault();
                            setMobileMenuOpen(false);
                            setShowAdminLockedModal(true);
                            return;
                          }
                          setMobileMenuOpen(false);
                        }}
                        className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition ${
                          isActive
                            ? 'bg-orange-50 text-orange-600'
                            : 'text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        <Icon className="w-4 h-4 shrink-0" />
                        <span className="flex items-center gap-1.5 flex-1 min-w-0">
                          <span className="text-sm shrink-0">{item.emoji}</span>
                          <span className="truncate">{item.label}</span>
                        </span>
                        {(item as any).badge && (
                          <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-orange-100 text-orange-700 border border-orange-200 shrink-0">
                            {(item as any).badge}
                          </span>
                        )}
                        {(item as any).canRename && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              setTempRenameName(adminPanelName);
                              setShowRenameModal(true);
                              setMobileMenuOpen(false);
                            }}
                            title="Ganti nama panel sendiri"
                            className="p-1 rounded-md text-slate-400 hover:text-orange-600 hover:bg-orange-100/70 transition shrink-0"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </Link>
                    );
                  })}
                </nav>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <Link
                  href="/login"
                  className="flex items-center justify-center gap-2 py-2.5 w-full bg-slate-100 text-slate-700 font-bold rounded-xl text-sm"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Keluar Akun</span>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 p-4 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>
      </div>

      {/* Rename Modal */}
      {showRenameModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-orange-100 text-orange-600 flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-base">Ganti Nama Approval Panel Sendiri</h3>
              </div>
              <button 
                onClick={() => setShowRenameModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-4 space-y-3">
              <label className="text-xs font-semibold text-slate-700 block">
                Nama Tampilan Menu / Panel Anda:
              </label>
              <input
                type="text"
                value={tempRenameName}
                onChange={(e) => setTempRenameName(e.target.value)}
                placeholder="Contoh: Panel Approval Salwa L"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-sm focus:outline-hidden focus:ring-2 focus:ring-orange-500 font-medium text-slate-900"
                autoFocus
              />
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Tulis nama yang Anda inginkan (misal: <b>Panel Approval Salwa L</b>, <b>Persetujuan Salwa</b>, atau nama Anda sendiri). Nama ini otomatis tersimpan di peramban Anda.
              </p>
              
              <div className="pt-2 flex flex-wrap gap-1.5">
                <span className="text-[10px] text-slate-400 font-medium w-full">Saran Cepat:</span>
                <button
                  type="button"
                  onClick={() => setTempRenameName('Panel Approval Salwa L')}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200"
                >
                  Panel Approval Salwa L
                </button>
                <button
                  type="button"
                  onClick={() => setTempRenameName('Persetujuan Pembayaran')}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                >
                  Persetujuan Pembayaran
                </button>
                <button
                  type="button"
                  onClick={() => setTempRenameName('Admin Approval Panel')}
                  className="text-[11px] px-2.5 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200"
                >
                  Admin Approval Panel
                </button>
              </div>
            </div>

            <div className="mt-6 flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => {
                  setTempRenameName('Panel Approval Salwa L');
                }}
                className="text-xs text-orange-600 hover:text-orange-700 font-semibold"
              >
                Reset ke Salwa L
              </button>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setShowRenameModal(false)}
                  className="px-3.5 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const nameToSave = tempRenameName.trim() || 'Panel Approval Salwa L';
                    setAdminPanelName(nameToSave);
                    if (typeof window !== 'undefined') {
                      localStorage.setItem('tatadana_admin_panel_name', nameToSave);
                      window.dispatchEvent(new Event('panelNameChanged'));
                    }
                    setShowRenameModal(false);
                  }}
                  className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
                >
                  Simpan Nama
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Account Switcher Modal (Multi-User Access) */}
      {showAccountSwitcherModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Beralih Akun (Multi-User)</h3>
                  <p className="text-[11px] text-slate-500">Pilih profil untuk berpindah workspace tanpa logout</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAccountSwitcherModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {accountList.map((acc) => {
                const isCurrent = user.id === acc.id;
                return (
                  <button
                    key={acc.id}
                    type="button"
                    onClick={() => handleSwitchAccount(acc)}
                    className={`w-full p-3 rounded-2xl border text-left transition flex items-center justify-between group ${
                      isCurrent 
                        ? 'border-orange-500 bg-orange-50/80 ring-2 ring-orange-500/20' 
                        : 'border-slate-200 bg-slate-50 hover:bg-slate-100/80'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={acc.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={acc.full_name}
                        className="w-10 h-10 rounded-full object-cover border border-slate-200 shadow-xs shrink-0"
                      />
                      <div className="overflow-hidden">
                        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                          <span className="truncate">{acc.full_name}</span>
                          {isCurrent && (
                            <span className="text-[9px] bg-orange-500 text-white font-bold px-1.5 py-0.2 rounded-full">
                              Sedang Aktif
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 truncate">{acc.email || acc.phone_number}</div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Paket: <b className="text-orange-700 capitalize">{acc.subscription_tier}</b>
                        </div>
                      </div>
                    </div>
                    {isCurrent ? (
                      <Check className="w-4 h-4 text-orange-600 shrink-0 ml-2" />
                    ) : (
                      <span className="text-[11px] font-bold text-slate-400 group-hover:text-orange-600 transition shrink-0 ml-2">
                        Pilih →
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
              <Link
                href="/settings?tab=profile"
                onClick={() => setShowAccountSwitcherModal(false)}
                className="text-orange-600 font-bold hover:underline flex items-center gap-1"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>Ganti Foto di Settings</span>
              </Link>

              <button
                type="button"
                onClick={() => setShowAccountSwitcherModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold transition"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Panel Restricted Modal */}
      {showAdminLockedModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-rose-200 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0">
                <ShieldAlert className="w-6 h-6" />
              </div>
              <div>
                <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider bg-rose-50 px-2.5 py-0.5 rounded-full border border-rose-200">
                  Akses Dibatasi Khusus Superadmin
                </span>
                <h3 className="font-extrabold text-slate-900 text-base mt-0.5">Admin Panel Terkunci</h3>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Admin Panel TataDana dikunci untuk keamanan sistem dan hanya dapat diakses oleh Superadmin (<b>SALWA L</b> / <span className="font-mono text-slate-800">salwaL@gmail.com</span>).
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs space-y-1">
              <div className="text-[10px] text-slate-400 font-medium">Akun Anda Saat Ini:</div>
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>{user.full_name}</span>
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md uppercase font-bold">
                  Role: {user.role || 'user'}
                </span>
              </div>
              <div className="text-[11px] text-slate-500 font-mono">{user.email || user.phone_number || '-'}</div>
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  handleSwitchAccount(availableAccounts[0]); // Switch to Salwa L
                  setShowAdminLockedModal(false);
                }}
                className="w-full py-2.5 bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                <span>Beralih ke Akun Salwa L (Superadmin)</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAdminLockedModal(false)}
                className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs rounded-xl transition"
              >
                Tutup & Kembali ke Dashboard
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
