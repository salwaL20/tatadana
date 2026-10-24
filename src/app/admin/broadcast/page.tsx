'use client';

import React, { useState, useEffect } from 'react';
import { 
  Megaphone, 
  Send, 
  Users, 
  MessageCircle, 
  Bot, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  ExternalLink,
  Copy,
  Check,
  RefreshCw,
  Search,
  Filter
} from 'lucide-react';
import { mockStore } from '@/lib/supabase/mockStore';
import { BroadcastRecord, Profile } from '@/types/database';

export default function AdminBroadcastPage() {
  const [broadcasts, setBroadcasts] = useState<BroadcastRecord[]>(mockStore.broadcasts);
  const [profiles, setProfiles] = useState<Profile[]>(mockStore.profiles);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [target, setTarget] = useState<'all' | 'pro' | 'starter' | 'pending'>('all');
  const [channel, setChannel] = useState<'all' | 'whatsapp' | 'telegram'>('all');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const refreshData = () => {
    setBroadcasts([...mockStore.broadcasts]);
    setProfiles([...mockStore.profiles]);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 3000);
    return () => clearInterval(interval);
  }, []);

  const recipientUsers = profiles.filter(p => {
    if (target === 'pro') return p.subscription_tier === 'pro';
    if (target === 'starter') return p.subscription_tier === 'starter';
    if (target === 'pending') return p.approval_status === 'pending';
    return true;
  });

  const templates = [
    {
      name: 'Verifikasi WhatsApp',
      title: 'Pemberitahuan Verifikasi Akun TataDana',
      message: 'Halo Kak {nama}, akun TataDana Anda memerlukan verifikasi WhatsApp resmi ke Admin Salwa L (08815703360). Balas pesan ini untuk memverifikasi akun Anda.',
      target: 'pending' as const,
    },
    {
      name: 'Promo PRO Rp99rb',
      title: 'Penawaran Spesial: TataDana PRO Lifetime',
      message: 'Halo Kak {nama}! Dapatkan akses tanpa batas transaksi, multi-dompet tanpa batas, dan OCR struk otomatis dengan upgrade ke TataDana PRO hanya Rp99.000 seumur hidup!',
      target: 'starter' as const,
    },
    {
      name: 'Fitur Baru Rilis',
      title: 'Fitur Baru TataDana: Panel Approval & AI Advisor',
      message: 'Halo Kak {nama}, kini TataDana menghadirkan fitur terbaru: Panel Keuangan Cerdas dan Integrasi Bot Telegram @tatadanasalwabot yang semakin cepat!',
      target: 'all' as const,
    },
    {
      name: 'Jadwal Pemeliharaan',
      title: 'Pemberitahuan Pemeliharaan Sistem TataDana',
      message: 'Halo Kak {nama}, kami akan melakukan peningkatan performa server malam ini pukul 23:00 - 23:30 WIB. Layanan akan kembali normal segera.',
      target: 'all' as const,
    }
  ];

  const handleApplyTemplate = (tpl: typeof templates[0]) => {
    setTitle(tpl.title);
    setMessage(tpl.message);
    setTarget(tpl.target);
  };

  const handleInsertTag = (tag: string) => {
    setMessage(prev => prev + tag);
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      setFeedback({ type: 'error', message: 'Judul dan pesan broadcast tidak boleh kosong.' });
      return;
    }

    setSending(true);
    setFeedback(null);

    try {
      const res = await fetch('/api/admin/broadcast', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          message,
          target,
          channel,
          adminId: 'usr-salwa-001',
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeedback({ type: 'success', message: data.message });
        setTitle('');
        setMessage('');
        refreshData();
      } else {
        setFeedback({ type: 'error', message: data.error || 'Gagal mengirim broadcast' });
      }
    } catch {
      // Local fallback
      const newBc: BroadcastRecord = {
        id: `bc-${Date.now()}`,
        title: title.trim(),
        message: message.trim(),
        target,
        channel,
        sent_by: 'usr-salwa-001',
        recipient_count: recipientUsers.length,
        status: 'sent',
        created_at: new Date().toISOString(),
      };
      mockStore.broadcasts.unshift(newBc);
      setFeedback({ type: 'success', message: `Broadcast "${title}" berhasil dikirim ke ${recipientUsers.length} pengguna!` });
      setTitle('');
      setMessage('');
      refreshData();
    } finally {
      setSending(false);
      setTimeout(() => setFeedback(null), 5000);
    }
  };

  const previewSampleUser = recipientUsers[0] || profiles[0] || {
    full_name: 'Budi Pratama',
    subscription_tier: 'starter',
    phone_number: '+6281234567890',
  };

  const previewText = message
    .replace(/{nama}/g, previewSampleUser.full_name)
    .replace(/{paket}/g, previewSampleUser.subscription_tier.toUpperCase())
    .replace(/{kontak}/g, previewSampleUser.phone_number || '-')
    .replace(/{admin}/g, 'Salwa L (08815703360)');

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2">
            <Megaphone className="w-7 h-7 text-orange-500" />
            <span>Panel Broadcast & Notifikasi Pengguna</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Kirimkan siaran pengumuman, promosi, atau informasi verifikasi ke WhatsApp dan Telegram seluruh pengguna TataDana.
          </p>
        </div>
      </div>

      {/* Feedback Toast */}
      {feedback && (
        <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 animate-in fade-in ${
          feedback.type === 'success' 
            ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-200' 
            : 'bg-rose-950/80 border border-rose-500/50 text-rose-200'
        }`}>
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Audience Overview Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Total Pengguna</span>
            <Users className="w-3.5 h-3.5 text-orange-400" />
          </div>
          <div className="text-xl font-bold text-white mt-1">{profiles.length} Akun</div>
          <div className="text-[10px] text-slate-500 mt-0.5">Semua data terdaftar</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Penerima Dipilih</span>
            <Megaphone className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{recipientUsers.length} Kontak</div>
          <div className="text-[10px] text-emerald-500/80 mt-0.5">Target: {target.toUpperCase()}</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>WhatsApp Terverifikasi</span>
            <MessageCircle className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">
            {profiles.filter(p => p.phone_verified).length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Dapat menerima blast WA</div>
        </div>

        <div className="bg-slate-950 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="text-[11px] font-semibold text-slate-400 flex items-center justify-between">
            <span>Bot Telegram Terhubung</span>
            <Bot className="w-3.5 h-3.5 text-blue-400" />
          </div>
          <div className="text-xl font-bold text-blue-400 mt-1">
            {profiles.filter(p => Boolean(p.telegram_chat_id)).length}
          </div>
          <div className="text-[10px] text-slate-500 mt-0.5">Aktif di Telegram bot</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Kolom Kiri: Form Buat Broadcast (2 Cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Send className="w-4 h-4 text-orange-400" />
                <span>Buat Pesan Siaran (Broadcast)</span>
              </h2>
              <span className="text-[10px] bg-orange-500/20 text-orange-400 px-2 py-0.5 rounded-full font-bold">
                Admin Salwa L
              </span>
            </div>

            {/* Quick Templates */}
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-orange-400" />
                <span>Template Cepat Siap Pakai:</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {templates.map(t => (
                  <button
                    key={t.name}
                    type="button"
                    onClick={() => handleApplyTemplate(t)}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition flex items-center gap-1"
                  >
                    <span>{t.name}</span>
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleSendBroadcast} className="space-y-4">
              {/* Target & Saluran */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Target Penerima:
                  </label>
                  <select
                    value={target}
                    onChange={(e) => setTarget(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="all">Semua Pengguna ({profiles.length})</option>
                    <option value="pro">Pengguna PRO Lifetime ({profiles.filter(p => p.subscription_tier === 'pro').length})</option>
                    <option value="starter">Pengguna Starter ({profiles.filter(p => p.subscription_tier === 'starter').length})</option>
                    <option value="pending">Pengguna Menunggu Approval ({profiles.filter(p => p.approval_status === 'pending').length})</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">
                    Saluran Pengiriman:
                  </label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="all">Semua Saluran (WhatsApp & Telegram)</option>
                    <option value="whatsapp">Khusus WhatsApp (wa.me blast)</option>
                    <option value="telegram">Khusus Bot Telegram</option>
                  </select>
                </div>
              </div>

              {/* Judul Pesan */}
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">
                  Judul Pengumuman:
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Pembaruan Sistem & Fitur Verifikasi WhatsApp"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>

              {/* Variable Helper Tags */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-300">
                    Isi Pesan Broadcast:
                  </label>
                  <div className="flex items-center gap-1 text-[10px] text-slate-400">
                    <span>Variabel dinamis:</span>
                    {['{nama}', '{paket}', '{kontak}', '{admin}'].map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleInsertTag(tag)}
                        className="px-1.5 py-0.5 rounded bg-slate-900 border border-slate-700 text-orange-400 hover:bg-orange-500/10 font-mono"
                        title={`Sisipkan variabel ${tag}`}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  rows={4}
                  placeholder="Tuliskan isi pesan pengumuman Anda di sini..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  required
                  className="w-full p-3.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500 leading-relaxed font-sans"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <span className="text-[11px] text-slate-400">
                  Akan dikirim ke <b className="text-orange-400">{recipientUsers.length}</b> akun target.
                </span>

                <button
                  type="submit"
                  disabled={sending}
                  className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold text-xs rounded-xl shadow-lg shadow-orange-600/30 transition flex items-center gap-2"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{sending ? 'Mengirim Broadcast...' : 'Kirim Broadcast Sekarang'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Quick Click-to-WhatsApp Blast List */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-emerald-400" />
                <span>Kirim Cepat via WhatsApp Langsung ke Pengguna:</span>
              </h3>
              <span className="text-[10px] text-slate-500">Buka link chat otomatis</span>
            </div>

            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {recipientUsers.slice(0, 8).map(u => {
                const userMsg = message
                  ? message.replace(/{nama}/g, u.full_name).replace(/{paket}/g, u.subscription_tier).replace(/{admin}/g, 'Salwa L')
                  : `Halo Kak ${u.full_name}, kami dari Admin TataDana Salwa L.`;
                const cleanPhone = u.phone_number ? u.phone_number.replace(/[^0-9]/g, '') : '';
                const waUrl = cleanPhone ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(userMsg)}` : '#';

                return (
                  <div key={u.id} className="p-2.5 bg-slate-900 border border-slate-800/80 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={u.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150'}
                        alt={u.full_name}
                        className="w-7 h-7 rounded-full object-cover border border-slate-700 shrink-0"
                      />
                      <div className="truncate">
                        <div className="font-bold text-white text-[11px] truncate">{u.full_name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{u.phone_number || '-'}</div>
                      </div>
                    </div>

                    {cleanPhone ? (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 shrink-0 transition"
                      >
                        <MessageCircle className="w-3 h-3" />
                        <span>Kirim WA</span>
                        <ExternalLink className="w-2.5 h-2.5" />
                      </a>
                    ) : (
                      <span className="text-[10px] text-slate-600 italic">No Phone</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Kolom Kanan: Live Preview & Riwayat Broadcast */}
        <div className="space-y-4">
          {/* Live Preview Card */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5 text-orange-400" />
              <span>Pratinjau Pesan Penerima</span>
            </div>

            <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 text-xs space-y-2">
              <div className="flex items-center justify-between text-[10px] text-slate-400 pb-2 border-b border-slate-800">
                <span>Simulasi: <b>{previewSampleUser.full_name}</b></span>
                <span className="font-mono text-emerald-400">WhatsApp / Bot</span>
              </div>

              <div className="font-bold text-white text-xs">
                {title || 'Judul Siaran Anda'}
              </div>

              <div className="text-slate-300 text-[11px] leading-relaxed whitespace-pre-line bg-slate-900/60 p-3 rounded-xl border border-slate-800 font-mono">
                {previewText || 'Isi pesan broadcast yang telah dipersonalisasi dengan data pengguna akan muncul di sini...'}
              </div>
            </div>
          </div>

          {/* Riwayat Broadcast Terkirim */}
          <div className="bg-slate-950 border border-slate-800 rounded-3xl p-5 shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <h3 className="text-xs font-bold text-slate-300 flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-400" />
                <span>Riwayat Broadcast ({broadcasts.length})</span>
              </h3>
              <button onClick={refreshData} className="p-1 text-slate-400 hover:text-white" title="Refresh">
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
              {broadcasts.length > 0 ? (
                broadcasts.map(bc => {
                  const timeWIB = new Date(bc.created_at).toLocaleString('id-ID', {
                    timeZone: 'Asia/Jakarta',
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  }) + ' WIB';

                  return (
                    <div key={bc.id} className="p-3 bg-slate-900 border border-slate-800 rounded-2xl text-xs space-y-1.5 hover:border-slate-700 transition">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white text-[11px] truncate max-w-[180px]">{bc.title}</span>
                        <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          {bc.status}
                        </span>
                      </div>
                      <p className="text-[10px] text-slate-400 line-clamp-2 leading-relaxed">
                        {bc.message}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-500 pt-1 border-t border-slate-800/60">
                        <span>Penerima: <b className="text-slate-300">{bc.recipient_count} akun</b> ({bc.target})</span>
                        <span className="font-mono">{timeWIB}</span>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-6 text-slate-500 text-xs">
                  Belum ada riwayat broadcast.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
