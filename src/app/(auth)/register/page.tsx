'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Phone, 
  Mail, 
  Lock, 
  User, 
  ArrowRight, 
  ShieldCheck, 
  Loader2, 
  CheckCircle2, 
  Eye, 
  EyeOff,
  MessageCircle,
  AlertCircle,
  ExternalLink,
  Sparkles,
  Copy,
  Check,
  Clock
} from 'lucide-react';
import { Profile } from '@/types/database';

export default function RegisterPage() {
  const router = useRouter();
  const [authMethod, setAuthMethod] = useState<'whatsapp' | 'email'>('whatsapp');
  
  // Registration Form state
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreeTerms, setAgreeTerms] = useState(true);

  // Status & UI state
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [successUser, setSuccessUser] = useState<Profile | null>(null);
  const [whatsappAdminUrl, setWhatsappAdminUrl] = useState('https://wa.me/628815703360?text=Halo%20Admin%20Salwa%20L%2C%20saya%20baru%20mendaftar%20di%20TataDana.%20Mohon%20verifikasi%20akun%20saya.');
  const [adminPhone, setAdminPhone] = useState('08815703360');

  // Handle Direct Registration without OTP
  const handleDirectRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!fullName.trim()) {
      setErrorMsg('Nama lengkap wajib diisi.');
      return;
    }

    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 8) {
      setErrorMsg('Nomor WhatsApp tidak valid. Format: +628... atau 08...');
      return;
    }

    if (authMethod === 'email') {
      if (!email.trim() || !email.includes('@')) {
        setErrorMsg('Format email tidak valid.');
        return;
      }
      if (password.length < 6) {
        setErrorMsg('Password minimal 6 karakter.');
        return;
      }
      if (password !== confirmPassword) {
        setErrorMsg('Konfirmasi password tidak cocok.');
        return;
      }
    }

    if (!agreeTerms) {
      setErrorMsg('Anda harus menyetujui Syarat & Ketentuan TataDana.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullName.trim(),
          email: email.trim() || undefined,
          password: password || undefined,
          phoneNumber: cleanPhone,
        }),
      });

      const data = await res.json();

      if (res.ok && data.user) {
        setSuccessUser(data.user);
        if (data.whatsappAdminUrl) setWhatsappAdminUrl(data.whatsappAdminUrl);
        if (data.adminPhone) setAdminPhone(data.adminPhone);

        // Store active user session in localStorage
        if (typeof window !== 'undefined') {
          localStorage.setItem('tatadana_current_user', JSON.stringify(data.user));
          localStorage.setItem('tatadana_current_user_id', data.user.id);
          if (data.user.avatar_url) {
            localStorage.setItem('tatadana_profile_avatar', data.user.avatar_url);
          }
          try {
            const raw = localStorage.getItem('tatadana_registered_users');
            const list: Profile[] = raw ? JSON.parse(raw) : [];
            const updated = [data.user, ...list.filter(u => u.id !== data.user.id && u.phone_number !== data.user.phone_number)];
            localStorage.setItem('tatadana_registered_users', JSON.stringify(updated));
          } catch (e) {}
          window.dispatchEvent(new Event('tatadana_user_switched'));
          window.dispatchEvent(new Event('tatadana_profile_updated'));
          window.dispatchEvent(new Event('tatadana_user_registered'));
        }
      } else {
        setErrorMsg(data.error || 'Gagal memproses pendaftaran. Silakan coba lagi.');
      }
    } catch (err) {
      setErrorMsg('Koneksi terputus. Silakan coba lagi.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    setOauthLoading(true);
    setErrorMsg('');
    setTimeout(() => {
      setOauthLoading(false);
      setAuthMethod('whatsapp');
      setFullName('Pengguna Google');
      setErrorMsg('Silakan lengkapi nomor WhatsApp untuk konfirmasi akun langsung via WhatsApp.');
    }, 700);
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-slate-50">
      {/* KIRI (40%): Branding & WhatsApp Direct Contact Guarantee */}
      <div className="hidden md:flex md:w-5/12 bg-gradient-to-br from-emerald-600 via-emerald-500 to-teal-600 p-12 text-white flex-col justify-between relative overflow-hidden">
        <div className="space-y-4">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-white text-emerald-600 flex items-center justify-center font-black text-xl shadow-lg">
              TD
            </div>
            <span className="font-extrabold text-2xl tracking-tight">TataDana</span>
          </Link>

          <div className="pt-16 space-y-3">
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider inline-flex items-center gap-1.5">
              <MessageCircle className="w-3.5 h-3.5" />
              Verifikasi via WhatsApp Admin
            </span>
            <h2 className="text-4xl font-black tracking-tight leading-tight">
              Daftar Akun. <br />Verifikasi via WA Admin.
            </h2>
            <p className="text-emerald-100 text-sm leading-relaxed max-w-sm">
              Setelah mendaftar, kirim pesan verifikasi ke WhatsApp Admin Salwa L (<b>08815703360</b>). Akun Anda akan segera diverifikasi dan siap digunakan.
            </p>
          </div>
        </div>

        <div className="space-y-3 text-xs text-emerald-100/90 border-t border-white/20 pt-6">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>Pendaftaran cepat tanpa menunggu kode SMS OTP</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>Tercatat otomatis di antrean verifikasi Admin Panel</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>Verifikasi resmi WhatsApp Admin: <b>08815703360</b></span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200 shrink-0" />
            <span>Dompet starter BCA & GoPay langsung disiapkan</span>
          </div>
        </div>
      </div>

      {/* KANAN (60%): Register & WhatsApp Direct Contact Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Registrasi TataDana
              </span>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Buat Akun TataDana</h1>
            <p className="text-xs text-slate-500 mt-1">
              Daftar akun baru dan minta verifikasi langsung ke Admin Salwa L via WhatsApp (08815703360).
            </p>
          </div>

          {/* Panduan Minta Verifikasi Akun Baru via WhatsApp Admin */}
          {successUser && (
            <div className="bg-white border-2 border-emerald-400 rounded-3xl p-6 shadow-xl space-y-5 animate-in fade-in">
              <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black shrink-0">
                  <ShieldCheck className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-slate-900 leading-tight">
                    Langkah Wajib: Minta Verifikasi Akun
                  </h2>
                  <p className="text-[11px] text-slate-500">
                    Data Anda diterima. Ikuti panduan di bawah untuk memverifikasi akun Anda.
                  </p>
                </div>
              </div>

              {/* Step 1: Info Terdaftar */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <div className="font-bold text-slate-800 flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Langkah 1: Formulir Pendaftaran Terkirim</span>
                  </div>
                  <div className="text-[11px] text-slate-500 pl-5.5">
                    {successUser.full_name} • <span className="font-mono">{successUser.phone_number}</span>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Menunggu Verifikasi 🟡
                </span>
              </div>

              {/* Step 2: WAJIB CHAT ADMIN */}
              <div className="p-4 bg-gradient-to-br from-emerald-50 via-teal-50 to-emerald-50 border-2 border-emerald-500/50 rounded-2xl space-y-3">
                <div className="flex items-start gap-2">
                  <span className="w-5 h-5 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                    2
                  </span>
                  <div>
                    <h3 className="font-extrabold text-xs text-emerald-950">
                      Langkah 2 (WAJIB): Chat Admin untuk Meminta Verifikasi
                    </h3>
                    <p className="text-[11px] text-emerald-900/90 leading-relaxed mt-0.5">
                      Kirim pesan verifikasi ke WhatsApp Admin Salwa L (<b>08815703360</b>). Kami telah menyiapkan draf pesan agar Anda tinggal kirim:
                    </p>
                  </div>
                </div>

                {/* Draft Pesan Box */}
                <div className="bg-white/95 border border-emerald-300 rounded-xl p-3 text-[11px] font-mono text-slate-700 relative">
                  <div className="pr-16 text-xs select-all">
                    &ldquo;Halo Admin Salwa L, saya baru mendaftar akun TataDana atas nama <b>{successUser.full_name}</b> ({successUser.phone_number}). Mohon lakukan verifikasi dan approval akun saya. Terima kasih!&rdquo;
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      const msg = `Halo Admin Salwa L, saya baru mendaftar akun TataDana atas nama ${successUser.full_name} (${successUser.phone_number}). Mohon lakukan verifikasi dan approval akun saya. Terima kasih!`;
                      navigator.clipboard.writeText(msg);
                      setCopiedMessage(true);
                      setTimeout(() => setCopiedMessage(false), 2500);
                    }}
                    className="absolute top-2.5 right-2.5 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 text-[10px] font-bold rounded-lg border border-slate-300 transition flex items-center gap-1"
                  >
                    {copiedMessage ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedMessage ? 'Disalin' : 'Salin'}</span>
                  </button>
                </div>

                {/* BIG GREEN WHATSAPP BUTTON */}
                <a
                  href={`https://wa.me/628815703360?text=${encodeURIComponent(
                    `Halo Admin Salwa L, saya baru mendaftar akun TataDana atas nama ${successUser.full_name} (${successUser.phone_number}). Mohon lakukan verifikasi dan approval akun saya agar bisa mulai menggunakan TataDana. Terima kasih!`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs rounded-xl shadow-lg shadow-emerald-600/30 transition flex items-center justify-center gap-2 border border-emerald-500 hover:scale-[1.01]"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>👉 Buka WhatsApp & Minta Verifikasi (08815703360)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Step 3: Verifikasi Selesai */}
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-2xl flex items-center gap-2.5 text-xs text-slate-600">
                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                <span className="text-[11px] leading-relaxed">
                  <b>Langkah 3:</b> Setelah Admin Salwa L mengklik <i>&quot;Verifikasi Pendaftar&quot;</i> di Panel Admin, akun Anda akan langsung <b>Aktif 🟢</b> dan siap digunakan secara penuh.
                </span>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-2">
                <button
                  type="button"
                  onClick={() => router.push('/dashboard')}
                  className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl shadow-sm transition flex items-center justify-center gap-1.5"
                >
                  <span>Cek Status / Buka Dashboard</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <Link
                  href="/login"
                  className="py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition text-center"
                >
                  Ke Halaman Login
                </Link>
              </div>
            </div>
          )}

          {!successUser && (
            <>
              {/* Toggle Register Method */}
              <div className="grid grid-cols-2 gap-2 bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setAuthMethod('whatsapp'); setErrorMsg(''); }}
                  className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                    authMethod === 'whatsapp' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
                  <span>WhatsApp Cepat</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setAuthMethod('email'); setErrorMsg(''); }}
                  className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                    authMethod === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5 text-blue-600" />
                  <span>Email & WhatsApp</span>
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Direct Form Input (No OTP required) */}
              <form onSubmit={handleDirectRegister} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nama Lengkap <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Contoh: Budi Pratama"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Nomor WhatsApp <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="+6281234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                  <span className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Bebas OTP: Akun langsung aktif & terhubung ke WhatsApp Admin.
                  </span>
                </div>

                {authMethod === 'email' && (
                  <>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Alamat Email <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                        <input
                          type="email"
                          placeholder="budi@example.com"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          required
                          className="w-full pl-10 pr-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-medium focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Min. 6 digit"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>

                      <div>
                        <label className="block text-xs font-bold text-slate-700 mb-1">Konfirmasi</label>
                        <div className="relative">
                          <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                          <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Ulangi"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                            className="w-full pl-10 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20"
                          />
                        </div>
                      </div>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="agreeTerms"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                    className="rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="agreeTerms" className="text-[11px] text-slate-600">
                    Saya menyetujui Syarat & Ketentuan dan Kebijakan Privasi TataDana
                  </label>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <MessageCircle className="w-4 h-4" />
                      <span>Daftar Akun & Hubungi Admin via WhatsApp</span>
                    </>
                  )}
                </button>
              </form>

              {/* Direct WhatsApp Contact Pill */}
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-[11px] text-emerald-950 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Ada pertanyaan seputar akun?</span>
                </div>
                <a
                  href={`https://wa.me/628815703360?text=${encodeURIComponent('Halo Admin TataDana Salwa L (08815703360), saya ingin bertanya seputar pendaftaran akun.')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
                >
                  <span>Chat Admin WA (08815703360)</span>
                  <ExternalLink className="w-2.5 h-2.5" />
                </a>
              </div>

              {/* Google OAuth Section */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-200"></div>
                </div>
                <div className="relative flex justify-center text-[11px] uppercase tracking-wider text-slate-400 bg-slate-50 px-2">
                  Atau daftar dengan
                </div>
              </div>

              <button
                type="button"
                onClick={handleGoogleAuth}
                disabled={oauthLoading}
                className="w-full py-2.5 bg-white hover:bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-700 transition flex items-center justify-center gap-2 shadow-xs"
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
                <span>{oauthLoading ? 'Menghubungkan...' : 'Daftar Akun dengan Google'}</span>
              </button>
            </>
          )}

          <p className="text-center text-xs text-slate-500">
            Sudah punya akun terdaftar?{' '}
            <Link href="/login" className="font-bold text-emerald-600 hover:underline">
              Masuk di sini
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
