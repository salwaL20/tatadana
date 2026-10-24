'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Phone, Mail, CheckCircle2, Loader2, Sparkles } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [resetMethod, setResetMethod] = useState<'phone' | 'email'>('phone');
  const [phone, setPhone] = useState('+6281234567890');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'input' | 'otp' | 'success'>('input');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSendReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    if (resetMethod === 'phone') {
      try {
        const res = await fetch('/api/auth/otp-send', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phoneNumber: phone }),
        });
        if (res.ok) {
          setStep('otp');
        } else {
          setErrorMsg('Gagal mengirim kode pemulihan WhatsApp');
        }
      } catch (e) {
        setErrorMsg('Koneksi terputus');
      } finally {
        setLoading(false);
      }
    } else {
      // Email method
      setTimeout(() => {
        setLoading(false);
        setStep('success');
      }, 600);
    }
  };

  const handleVerifyResetOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');

    try {
      const res = await fetch('/api/auth/otp-verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phoneNumber: phone, code: otp }),
      });
      if (res.ok) {
        setStep('success');
      } else {
        setErrorMsg('Kode OTP pemulihan tidak valid (Gunakan 123456)');
      }
    } catch (e) {
      setErrorMsg('Gagal memverifikasi OTP');
    } finally {
      setLoading(false);
    }
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
          <div className="pt-16 space-y-3">
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
              Pemulihan Akun
            </span>
            <h2 className="text-4xl font-black tracking-tight leading-tight">
              Aman & Mudah. <br />Pulihkan Aksesmu.
            </h2>
            <p className="text-orange-100 text-sm leading-relaxed max-w-sm">
              Kami akan mengirimkan instruksi pemulihan langsung ke nomor WhatsApp terverifikasi atau email terdaftar Anda.
            </p>
          </div>
        </div>

        <div className="text-xs text-orange-200/80 border-t border-white/20 pt-4">
          © 2026 TataDana Inc. Privasi dan keamanan data finansial Anda adalah prioritas utama.
        </div>
      </div>

      {/* KANAN (60%): Reset Form */}
      <div className="flex-1 flex items-center justify-center p-6 md:p-12">
        <div className="w-full max-w-md space-y-6">
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-orange-600 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Kembali ke Halaman Masuk</span>
          </Link>

          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Lupa Kata Sandi?</h1>
            <p className="text-xs text-slate-500 mt-1">
              Pilih metode pemulihan yang Anda inginkan untuk mengatur ulang kata sandi akun Anda.
            </p>
          </div>

          {step === 'input' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 bg-slate-200/70 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => { setResetMethod('phone'); setErrorMsg(''); }}
                  className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                    resetMethod === 'phone' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>WhatsApp OTP</span>
                </button>
                <button
                  type="button"
                  onClick={() => { setResetMethod('email'); setErrorMsg(''); }}
                  className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition ${
                    resetMethod === 'email' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600'
                  }`}
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email Reset Link</span>
                </button>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <form onSubmit={handleSendReset} className="space-y-4">
                {resetMethod === 'phone' ? (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Nomor HP / WhatsApp Terdaftar
                    </label>
                    <input
                      type="text"
                      placeholder="Contoh: +6281234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Alamat Email Terdaftar
                    </label>
                    <input
                      type="email"
                      placeholder="budi@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Kirim Instruksi Pemulihan</span>}
                </button>
              </form>
            </div>
          )}

          {step === 'otp' && (
            <form onSubmit={handleVerifyResetOtp} className="space-y-4">
              <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-xl text-xs text-orange-950">
                Kode OTP pemulihan telah dikirim ke nomor <b>{phone}</b>.<br />
                <span className="font-bold text-orange-600">Mode Dev Test: Masukkan kode 123456</span>
              </div>

              {errorMsg && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Masukkan 6 Digit Kode OTP
                </label>
                <input
                  type="text"
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength={6}
                  required
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-300 rounded-xl text-center text-lg font-mono font-bold tracking-widest focus:outline-none focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 transition"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <span>Verifikasi & Pulihkan Akun</span>}
              </button>
            </form>
          )}

          {step === 'success' && (
            <div className="space-y-4 text-center">
              <div className="w-12 h-12 bg-emerald-50 border border-emerald-200 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Instruksi Berhasil Dikirim!</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Silakan cek pesan masuk Anda. Tautan untuk menyetel ulang kata sandi telah aktif selama 15 menit.
              </p>
              <Link
                href="/login"
                className="inline-block w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition shadow"
              >
                Kembali ke Halaman Masuk
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
