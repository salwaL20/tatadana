'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  ArrowRight, 
  Phone, 
  Mail, 
  Lock, 
  ShieldCheck, 
  Sparkles, 
  Loader2, 
  Eye, 
  EyeOff, 
  CheckCircle2, 
  UserCheck, 
  Users,
  Zap,
  Check,
  AlertCircle
} from 'lucide-react';
import { Profile } from '@/types/database';

export default function LoginPage() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<'phone' | 'email'>('phone');
  
  // Phone login state
  const [phone, setPhone] = useState('');
  
  // Email / Username state (starts empty for security)
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  // Status
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  // Registered users state for quick direct login
  const [registeredUsersList, setRegisteredUsersList] = useState<Profile[]>([]);

  // Salwa L superadmin profile definition for authenticated login
  const salwaUser: Profile = {
    id: 'usr-salwa-001',
    full_name: 'SALWA L',
    email: 'salwaL@gmail.com',
    phone_number: '+6281288887777',
    phone_verified: true,
    avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    default_currency: 'IDR',
    role: 'superadmin',
    telegram_chat_id: 8112961346,
    telegram_username: 'tatadanasalwabot',
    subscription_tier: 'pro',
    approval_status: 'approved',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-10-10T05:00:00Z',
  };

  const budiUser: Profile = {
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
    approval_status: 'approved',
    created_at: '2026-09-01T08:00:00Z',
    updated_at: '2026-10-10T05:00:00Z',
  };

  const citraUser: Profile = {
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
    approval_status: 'approved',
    created_at: '2026-09-15T10:00:00Z',
    updated_at: '2026-10-10T05:00:00Z',
  };

  const guestUser: Profile = {
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
  };

  // Load recently registered accounts from localStorage and API
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Check registered users in localStorage
      try {
        const rawLocal = localStorage.getItem('tatadana_registered_users');
        if (rawLocal) {
          const parsed = JSON.parse(rawLocal);
          if (Array.isArray(parsed) && parsed.length > 0) {
            // Filter out admin accounts from client listing
            const regularRegistered = parsed.filter(u => u.role !== 'superadmin' && u.id !== 'usr-salwa-001');
            setRegisteredUsersList(regularRegistered);
            if (regularRegistered[0]?.phone_number) {
              setPhone(regularRegistered[0].phone_number);
            }
          }
        }
      } catch (err) {}

      // Fetch latest users from API
      fetch('/api/auth/login?recent=true')
        .then(res => res.json())
        .then(data => {
          if (data.success && Array.isArray(data.users)) {
            setRegisteredUsersList(prev => {
              const combined = [...prev];
              data.users.forEach((u: Profile) => {
                // Ensure no superadmin appears in client lists
                if (u.role !== 'superadmin' && u.id !== 'usr-salwa-001' && u.id !== 'usr-admin-super') {
                  if (!combined.some(existing => existing.id === u.id || (existing.phone_number && existing.phone_number === u.phone_number))) {
                    combined.push(u);
                  }
                }
              });
              return combined;
            });
          }
        })
        .catch(() => {});
    }
  }, []);

  const loginAsUser = (userData: Profile) => {
    // Ensure the user is directly approved & verified upon login (Bypass approval)
    const approvedUser: Profile = {
      ...userData,
      approval_status: 'approved',
      phone_verified: true,
      approved_at: userData.approved_at || new Date().toISOString(),
      approved_by: userData.approved_by || (userData.role === 'superadmin' ? 'superadmin_auth' : 'system_direct_login'),
    };

    if (typeof window !== 'undefined') {
      localStorage.setItem('tatadana_current_user_id', approvedUser.id);
      localStorage.setItem('tatadana_current_user', JSON.stringify(approvedUser));
      if (approvedUser.avatar_url) {
        localStorage.setItem('tatadana_profile_avatar', approvedUser.avatar_url);
      }

      // Update registered users cache in localStorage with approved status
      try {
        const raw = localStorage.getItem('tatadana_registered_users');
        const list: Profile[] = raw ? JSON.parse(raw) : [];
        const updated = [
          approvedUser, 
          ...list.filter(u => u.id !== approvedUser.id && u.phone_number !== approvedUser.phone_number)
        ];
        localStorage.setItem('tatadana_registered_users', JSON.stringify(updated));
      } catch (e) {}

      window.dispatchEvent(new Event('tatadana_user_switched'));
      window.dispatchEvent(new Event('tatadana_profile_updated'));
    }

    const isAdmin = approvedUser.role === 'superadmin' || 
                    approvedUser.email?.toLowerCase() === 'salwal@gmail.com' ||
                    approvedUser.email?.toLowerCase() === 'salwal20@gmail.com' ||
                    approvedUser.id === 'usr-salwa-001';

    if (isAdmin) {
      approvedUser.role = 'superadmin';
      approvedUser.full_name = 'SALWA L';
      approvedUser.email = 'salwaL@gmail.com';
      setSuccessNotice(`Berhasil masuk sebagai Admin SALWA L! Mengarahkan langsung ke panel admin...`);
      setTimeout(() => {
        router.push('/admin');
      }, 300);
    } else {
      setSuccessNotice(`Berhasil masuk sebagai ${approvedUser.full_name}! Mengarahkan ke dashboard...`);
      setTimeout(() => {
        router.push('/dashboard');
      }, 400);
    }
  };

  // Handle direct login for registered WhatsApp phone numbers
  const handlePhoneLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = phone.trim();
    if (!cleanPhone) {
      setErrorMsg('Nomor WhatsApp wajib diisi');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    try {
      // 1. Try server-side direct login API
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: cleanPhone })
      });

      const data = await res.json();

      if (res.ok && data.success && data.user) {
        loginAsUser(data.user);
        return;
      }

      // 2. Client-side local fallback: Check localStorage.tatadana_registered_users
      if (typeof window !== 'undefined') {
        const rawLocal = localStorage.getItem('tatadana_registered_users');
        if (rawLocal) {
          const list: Profile[] = JSON.parse(rawLocal);
          const cleanDigits = cleanPhone.replace(/[^0-9]/g, '');
          const localUser = list.find(p => {
            if (!p.phone_number) return false;
            const pDigits = p.phone_number.replace(/[^0-9]/g, '');
            return pDigits === cleanDigits || pDigits.endsWith(cleanDigits.slice(-8)) || cleanDigits.endsWith(pDigits.slice(-8));
          });

          if (localUser) {
            loginAsUser(localUser);
            return;
          }
        }
      }

      // 3. Client-side mockStore fallback
      const { mockStore } = await import('@/lib/supabase/mockStore');
      const cleanDigits = cleanPhone.replace(/[^0-9]/g, '');
      const user = mockStore.profiles.find(p => {
        if (!p.phone_number) return false;
        const pDigits = p.phone_number.replace(/[^0-9]/g, '');
        return pDigits === cleanDigits || pDigits.endsWith(cleanDigits.slice(-8)) || cleanDigits.endsWith(pDigits.slice(-8));
      });

      if (user) {
        loginAsUser(user);
      } else {
        setErrorMsg(`Nomor WhatsApp "${cleanPhone}" belum terdaftar. Silakan daftar baru terlebih dahulu.`);
      }
    } catch (err: any) {
      setErrorMsg('Koneksi terputus. Silakan coba lagi atau pastikan nomor Anda sudah terdaftar.');
    } finally {
      setLoading(false);
    }
  };

  // Handle Login via Email or Username (e.g. salwaL / salwaL20@gmail.com with ss2002)
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = email.trim().toLowerCase();
    if (!cleanInput) {
      setErrorMsg('Email atau nama pengguna wajib diisi');
      return;
    }
    if (!password) {
      setErrorMsg('Password wajib diisi');
      return;
    }
    setLoading(true);
    setErrorMsg('');

    // Specific verification for Admin SALWA L:
    // User enters name "SALWA L" (or "salwaL") or email "salwaL@gmail.com" (or legacy "salwaL20@gmail.com") with password "ss2002"
    const isSalwaIdentifier = 
      cleanInput === 'salwal' || 
      cleanInput === 'salwa l' || 
      cleanInput === 'salwal@gmail.com' || 
      cleanInput === 'salwal20@gmail.com' ||
      cleanInput === 'salwayoy@gmail.com';

    if (isSalwaIdentifier) {
      if (password !== 'ss2002' && password !== 'ss20' && password !== 'kimo20') {
        setLoading(false);
        setErrorMsg('Password untuk akun admin SALWA L salah.');
        return;
      }
      setTimeout(() => {
        setLoading(false);
        loginAsUser(salwaUser);
      }, 200);
      return;
    }

    // Call server-side direct login API for other accounts
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier: cleanInput, password })
      });
      const data = await res.json();
      if (res.ok && data.success && data.user) {
        loginAsUser(data.user);
        return;
      } else if (data.error) {
        setErrorMsg(data.error);
        setLoading(false);
        return;
      }
    } catch (err) {}

    // Hardcoded demo users check
    if (cleanInput === 'budi@example.com') {
      setTimeout(() => {
        setLoading(false);
        loginAsUser(budiUser);
      }, 300);
      return;
    }

    if (cleanInput === 'citra@example.com') {
      setTimeout(() => {
        setLoading(false);
        loginAsUser(citraUser);
      }, 300);
      return;
    }

    // Fallback error
    setLoading(false);
    setErrorMsg('Kombinasi email/nama pengguna dan password tidak ditemukan.');
  };

  const handleGoogleLogin = () => {
    setOauthLoading(true);
    setErrorMsg('');
    setTimeout(() => {
      setOauthLoading(false);
      loginAsUser(guestUser);
    }, 600);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* KIRI (40%): Branding Panel */}
      <div className="hidden md:flex md:w-5/12 bg-gradient-to-br from-orange-600 via-orange-500 to-amber-500 p-12 text-white flex-col justify-between relative overflow-hidden">
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white text-orange-600 flex items-center justify-center font-black text-xl shadow-lg">
              TD
            </div>
            <span className="font-extrabold text-2xl tracking-tight">TataDana</span>
          </Link>
          <div className="pt-12 space-y-3">
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-amber-200" />
              Fintech Terpadu Telegram
            </span>
            <h2 className="text-4xl font-black tracking-tight leading-tight">
              Keuanganmu. <br />Terkontrol.
            </h2>
            <p className="text-orange-100 text-sm leading-relaxed max-w-sm">
              Nomor WhatsApp dan akun yang telah terdaftar dapat langsung masuk ke aplikasi tanpa harus menunggu approval admin.
            </p>
          </div>
        </div>

        {/* Security Assurance Panel */}
        <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-200">
            <ShieldCheck className="w-4 h-4" />
            <span>Keamanan & Privasi Data:</span>
          </div>
          <p className="text-xs text-orange-100/90 leading-relaxed">
            Data keuangan Anda dilindungi enkripsi multi-layer. Akses dashboard langsung aktif untuk nomor WhatsApp yang telah terdaftar.
          </p>
          <div className="flex gap-2 pt-1">
            <Link 
              href="/teamwork-preview" 
              className="text-[11px] text-white hover:underline flex items-center gap-1 font-semibold"
            >
              <span>👥 Preview 10 Tim →</span>
            </Link>
            <span className="text-white/40">•</span>
            <Link 
              href="/learn" 
              className="text-[11px] text-white hover:underline flex items-center gap-1 font-semibold"
            >
              <span>🎓 Pusat Belajar →</span>
            </Link>
          </div>
        </div>

        <div className="space-y-3 text-xs text-orange-100/90 border-t border-white/20 pt-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-200 shrink-0" />
            <span>Nomor terdaftar langsung masuk ke dashboard</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-200 shrink-0" />
            <span>Otomatis aktif tanpa perlu verifikasi approval manual</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-amber-200 shrink-0" />
            <span>Sinkronisasi instan Telegram Bot & Web Dashboard</span>
          </div>
        </div>
      </div>

      {/* KANAN (60%): Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-5">
          {/* Mobile Landing Header */}
          <div className="md:hidden space-y-3 pb-2 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <Link href="/" className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 text-white flex items-center justify-center font-black text-sm shadow">
                  TD
                </div>
                <div>
                  <span className="font-extrabold text-lg text-slate-900 tracking-tight">TataDana</span>
                  <span className="ml-1.5 text-[10px] font-bold text-orange-600">Fintech Telegram</span>
                </div>
              </Link>
              <Link href="/" className="text-xs font-bold text-orange-600 hover:underline">
                ← Beranda
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Masuk ke TataDana</h1>
              <p className="text-xs text-slate-500 mt-0.5">
                Nomor terdaftar bisa langsung masuk ke aplikasi tanpa verifikasi approval.
              </p>
            </div>
            <span className="px-2.5 py-1 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded-full flex items-center gap-1 border border-emerald-300">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              Akses Langsung ⚡
            </span>
          </div>

          {/* Toggle Login Method */}
          <div className="grid grid-cols-2 gap-2 bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
            <button
              type="button"
              onClick={() => { setAuthMethod('phone'); setErrorMsg(''); }}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                authMethod === 'phone' ? 'bg-white text-emerald-700 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Phone className="w-3.5 h-3.5" />
              <span>Nomor WhatsApp (Langsung Masuk)</span>
            </button>
            <button
              type="button"
              onClick={() => { setAuthMethod('email'); setErrorMsg(''); }}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                authMethod === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
              }`}
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Email / Username</span>
            </button>
          </div>

          {successNotice && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <div className="flex-1">
                <span>{errorMsg}</span>
                {errorMsg.includes('belum terdaftar') && (
                  <div className="mt-1">
                    <Link href="/register" className="font-bold underline text-rose-800 hover:text-rose-950">
                      Klik di sini untuk Mendaftar Akun Baru →
                    </Link>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Method 1: Direct WhatsApp Phone Login (No Admin Approval Needed) */}
          {authMethod === 'phone' && (
            <div className="space-y-4">
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-900">
                  <Zap className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Fitur Login Langsung (Bypass Approval)</span>
                </div>
                <p className="text-[11px] text-emerald-800 leading-relaxed">
                  Masukkan nomor WhatsApp yang telah Anda daftarkan. Akun Anda langsung aktif dan diarahkan ke dashboard tanpa harus menunggu verifikasi manual dari admin.
                </p>
              </div>

              <form onSubmit={handlePhoneLogin} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp yang Telah Terdaftar
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Contoh: +62812... atau 0812..."
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 font-medium mt-1">
                    Format: +628... atau 08... (Mendukung semua format nomor Indonesia)
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Memverifikasi & Masuk Langsung...</span>
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4" />
                      <span>Masuk Langsung ke Aplikasi</span>
                    </>
                  )}
                </button>
              </form>

              {/* List of Registered User Accounts on this device (Regular Users Only) */}
              {registeredUsersList.length > 0 && (
                <div className="p-3 bg-slate-100/80 border border-slate-200 rounded-xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <UserCheck className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Akun Terdaftar di Perangkat Ini:</span>
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {registeredUsersList.length} Akun
                    </span>
                  </div>

                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {registeredUsersList.slice(0, 4).map((u) => (
                      <div 
                        key={u.id}
                        className="p-2 bg-white border border-slate-200 rounded-lg flex items-center justify-between text-xs hover:border-emerald-400 transition"
                      >
                        <div className="truncate mr-2">
                          <div className="font-bold text-slate-800 text-[11px] truncate flex items-center gap-1.5">
                            <span>{u.full_name}</span>
                            <span className="text-[9px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1 rounded font-semibold">
                              Terdaftar
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-500 font-mono truncate">
                            {u.phone_number || u.email}
                          </div>
                        </div>

                        <button
                          type="button"
                          onClick={() => loginAsUser(u)}
                          className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-[10px] font-bold transition shrink-0 flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Masuk</span>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Direct WhatsApp Contact to Admin */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-[11px] text-slate-700 flex items-center justify-between">
                <div>
                  <span className="font-bold text-slate-900 block">Butuh Bantuan Akun?</span>
                  <span className="text-slate-500">Hubungi Admin langsung via WhatsApp.</span>
                </div>
                <a
                  href={`https://wa.me/628815703360?text=${encodeURIComponent('Halo Admin TataDana, saya butuh bantuan untuk login/akses akun saya.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[10px] shrink-0"
                >
                  Chat WA Admin ➔
                </a>
              </div>
            </div>
          )}

          {/* Method 2: Email or Username + Password (Used by Admin Salwa L or regular email users) */}
          {authMethod === 'email' && (
            <form onSubmit={handleEmailLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Email atau Nama Pengguna (Username)
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    placeholder="Contoh: salwaL@gmail.com atau SALWA L"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-bold text-slate-700">Password</label>
                  <Link href="/forgot-password" className="text-[11px] font-semibold text-orange-600 hover:underline">
                    Lupa password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan password akun"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full pl-10 pr-10 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px]">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="rememberMe"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-slate-300 text-orange-500 focus:ring-orange-400"
                  />
                  <label htmlFor="rememberMe" className="text-slate-600">
                    Ingat saya di perangkat ini
                  </label>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Masuk ke Akun</span>}
              </button>
            </form>
          )}

          {/* Regular Demo User Switcher (No Admin exposed) */}
          <div className="pt-2">
            <div className="relative">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-slate-200"></div></div>
              <div className="relative flex justify-center text-[10px] uppercase tracking-wider text-slate-400 bg-slate-50 px-2 font-bold">
                Atau masuk akun demo biasa
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mt-3">
              <button
                type="button"
                onClick={() => loginAsUser(budiUser)}
                className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition text-xs shadow-xs"
              >
                <div className="font-bold text-slate-800 text-[11px] truncate">Budi Pratama</div>
                <div className="text-[10px] text-slate-500 truncate">budi@example.com</div>
                <span className="inline-block mt-1 text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">User Starter</span>
              </button>

              <button
                type="button"
                onClick={() => loginAsUser(citraUser)}
                className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition text-xs shadow-xs"
              >
                <div className="font-bold text-slate-800 text-[11px] truncate">Citra Kirana</div>
                <div className="text-[10px] text-slate-500 truncate">citra@example.com</div>
                <span className="inline-block mt-1 text-[9px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-semibold">User Starter</span>
              </button>

              <button
                type="button"
                onClick={() => loginAsUser(guestUser)}
                className="p-2.5 bg-white hover:bg-slate-100 border border-slate-200 rounded-xl text-left transition text-xs shadow-xs"
              >
                <div className="font-bold text-slate-800 text-[11px] truncate">Akun Tamu</div>
                <div className="text-[10px] text-slate-500 truncate">guest@tatadana.id</div>
                <span className="inline-block mt-1 text-[9px] bg-emerald-50 text-emerald-700 px-1.5 py-0.2 rounded font-semibold">Guest Mode</span>
              </button>
            </div>
          </div>

          {/* Google OAuth Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={oauthLoading}
            className="w-full py-2.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition flex items-center justify-center gap-2 shadow-sm"
          >
            {oauthLoading ? (
              <Loader2 className="w-4 h-4 animate-spin text-orange-500" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            )}
            <span>{oauthLoading ? 'Menghubungkan ke Google...' : 'Masuk dengan Akun Google'}</span>
          </button>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
            <span>Belum punya akun? <Link href="/register" className="font-bold text-orange-600 hover:underline">Daftar sekarang</Link></span>
            <Link href="/teamwork-preview" className="font-semibold text-slate-600 hover:text-orange-600">Akses 10 Tim →</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
