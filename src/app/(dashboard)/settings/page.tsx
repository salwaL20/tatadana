'use client';

import React, { useState, useEffect } from 'react';
import { 
  User, 
  Bot, 
  Bell, 
  Tag, 
  CreditCard, 
  Check, 
  AlertCircle, 
  ExternalLink, 
  Loader2, 
  Sparkles,
  ShieldCheck,
  Clock,
  Camera,
  Upload,
  Image as ImageIcon,
  CheckCircle2
} from 'lucide-react';
import { Profile, TelegramBotRecord, ReminderSetting, Category } from '@/types/database';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<'profile' | 'telegram' | 'reminders' | 'categories' | 'subscription'>('telegram');

  // Profile states
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [currency, setCurrency] = useState('IDR');
  const [profileSaved, setProfileSaved] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150');
  const [avatarInputUrl, setAvatarInputUrl] = useState('');
  const [avatarSaved, setAvatarSaved] = useState(false);
  const [activePreset, setActivePreset] = useState<string | null>(null);

  // Telegram states
  const [botRecord, setBotRecord] = useState<TelegramBotRecord | null>(null);
  const [botToken, setBotToken] = useState('');
  const [testState, setTestState] = useState<'idle' | 'testing' | 'connected' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');
  const [pollingMode, setPollingMode] = useState<'polling' | 'webhook'>('polling');
  const [pollingInfo, setPollingInfo] = useState<{ isRunning: boolean; processedCount: number; lastMessageText: string | null; botName?: string; botUsername?: string } | null>(null);

  // Reminder states
  const [reminder, setReminder] = useState<ReminderSetting | null>(null);
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const [frequency, setFrequency] = useState<1 | 2>(2);
  const [time1, setTime1] = useState('12:00');
  const [time2, setTime2] = useState('20:00');
  const [reminderSaved, setReminderSaved] = useState(false);

  // Category states
  const [categories, setCategories] = useState<Category[]>([]);
  const [newCatName, setNewCatName] = useState('');
  const [newCatEmoji, setNewCatEmoji] = useState('🍜');
  const [newCatColor, setNewCatColor] = useState('#F97316');

  // Subscription states
  const [midtransLoading, setMidtransLoading] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const avatarPresets = [
    { id: 'p1', name: 'Salwa L Hijabi', url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150' },
    { id: 'p2', name: 'Business Executive', url: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150' },
    { id: 'p3', name: 'Creative Casual', url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150' },
    { id: 'p4', name: 'Techie Lead', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150' },
    { id: 'p5', name: 'Minimalist 3D', url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150' },
    { id: 'p6', name: 'Energetic Founder', url: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150' },
    { id: 'p7', name: 'Smart Analyst', url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150' },
    { id: 'p8', name: 'Modern Finance', url: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150' },
  ];

  const loadData = async () => {
    const { dataService } = await import('@/lib/supabase/client');
    const activeUserId = typeof window !== 'undefined'
      ? localStorage.getItem('tatadana_current_user_id') || 'usr-salwa-001'
      : 'usr-salwa-001';

    let [prof, bot, rem, cats] = await Promise.all([
      dataService.getProfile(activeUserId),
      dataService.getBotByUserId(activeUserId).catch(() => dataService.getBotByUserId()),
      dataService.getReminder(activeUserId).catch(() => dataService.getReminder()),
      dataService.getCategories(activeUserId).catch(() => dataService.getCategories()),
    ]);

    if (!prof) {
      prof = await dataService.getProfile('usr-budi-12345');
    }

    if (prof) {
      setProfile(prof);
      setFullName(prof.full_name);
      setEmail(prof.email || (prof.id === 'usr-salwa-001' ? 'salwaL20@gmail.com' : ''));
      setCurrency(prof.default_currency);
      const savedAvatar = typeof window !== 'undefined' ? localStorage.getItem('tatadana_profile_avatar') : null;
      setAvatarUrl(savedAvatar || prof.avatar_url || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150');
    }
    if (bot) {
      setBotRecord(bot);
      setBotToken(bot.bot_token);
      setTestState(bot.webhook_status === 'connected' ? 'connected' : 'idle');
    }
    if (rem) {
      setReminder(rem);
      setReminderEnabled(rem.is_enabled);
      setFrequency(rem.frequency);
      setTime1(rem.time_1.slice(0, 5));
      if (rem.time_2) setTime2(rem.time_2.slice(0, 5));
    }
    setCategories(cats && cats.length > 0 ? cats : await dataService.getCategories('usr-budi-12345'));
  };

  const loadPollingStatus = async () => {
    try {
      const res = await fetch('/api/telegram/polling');
      const json = await res.json();
      if (json.ok && json.data) {
        setPollingInfo(json.data);
      }
    } catch (e) {}
  };

  useEffect(() => {
    loadData();
    loadPollingStatus();
    const interval = setInterval(loadPollingStatus, 3000);
    // Check url search params for tab
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') as any;
      if (['profile', 'telegram', 'reminders', 'categories', 'subscription'].includes(tabParam)) {
        setActiveTab(tabParam);
      }
    }

    const handleUserSwitch = () => {
      loadData();
    };
    window.addEventListener('tatadana_user_switched', handleUserSwitch);

    return () => {
      clearInterval(interval);
      window.removeEventListener('tatadana_user_switched', handleUserSwitch);
    };
  }, []);

  // 1. Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    const { dataService } = await import('@/lib/supabase/client');
    const activeUserId = profile?.id || 'usr-salwa-001';
    try {
      await dataService.updateProfile(activeUserId, {
        full_name: fullName,
        default_currency: currency,
        avatar_url: avatarUrl,
      });
    } catch (e) {}

    if (typeof window !== 'undefined') {
      localStorage.setItem('tatadana_profile_avatar', avatarUrl);
      const stored = localStorage.getItem('tatadana_current_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.full_name = fullName;
          parsed.avatar_url = avatarUrl;
          localStorage.setItem('tatadana_current_user', JSON.stringify(parsed));
        } catch (e) {}
      }
      window.dispatchEvent(new CustomEvent('tatadana_profile_updated', { detail: { avatar_url: avatarUrl, full_name: fullName } }));
    }
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 2500);
  };

  // Avatar Upload / Select
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        alert('Ukuran file maksimal 5MB');
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setAvatarUrl(result);
        setActivePreset(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleApplyAvatarUrl = () => {
    if (avatarInputUrl.trim()) {
      setAvatarUrl(avatarInputUrl.trim());
      setActivePreset(null);
      setAvatarInputUrl('');
    }
  };

  const handleSaveAvatar = async (urlToSave?: string) => {
    const targetUrl = urlToSave || avatarUrl;
    const { dataService } = await import('@/lib/supabase/client');
    const activeUserId = profile?.id || 'usr-salwa-001';
    try {
      await dataService.updateProfile(activeUserId, { avatar_url: targetUrl });
    } catch (e) {}

    if (typeof window !== 'undefined') {
      localStorage.setItem('tatadana_profile_avatar', targetUrl);
      const stored = localStorage.getItem('tatadana_current_user');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          parsed.avatar_url = targetUrl;
          localStorage.setItem('tatadana_current_user', JSON.stringify(parsed));
        } catch (e) {}
      }
      window.dispatchEvent(new CustomEvent('tatadana_profile_updated', { detail: { avatar_url: targetUrl } }));
    }
    setAvatarSaved(true);
    setTimeout(() => setAvatarSaved(false), 2500);
  };

  const handleTestConnection = async () => {
    setTestState('testing');
    setTestMessage('⏳ Menghubungkan ke bot Telegram...');

    try {
      const res = await fetch('/api/telegram/test-connection', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: botToken.trim() || undefined,
          userId: profile?.id || 'usr-budi-12345',
          mode: pollingMode,
        }),
      });

      const data = await res.json();
      if (data.ok) {
        setTestState('connected');
        setTestMessage(`🟢 ${data.message}`);
        loadData();
        loadPollingStatus();
      } else {
        setTestState('error');
        setTestMessage(`🔴 Gagal: ${data.error}`);
      }
    } catch (err: any) {
      setTestState('error');
      setTestMessage(`🔴 Error: ${err.message || 'Gagal menghubungi server'}`);
    }
  };

  const handleTogglePolling = async () => {
    try {
      const nextAction = pollingInfo?.isRunning ? 'stop' : 'start';
      const res = await fetch('/api/telegram/polling', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: nextAction,
          token: botToken.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.ok) {
        setTestMessage(`🟢 ${data.message}`);
        loadPollingStatus();
      } else {
        setTestMessage(`🔴 ${data.error}`);
      }
    } catch (err: any) {
      setTestMessage(`🔴 Error: ${err.message}`);
    }
  };

  // 3. Save Reminder
  const handleSaveReminder = async (e: React.FormEvent) => {
    e.preventDefault();
    const { dataService } = await import('@/lib/supabase/client');
    await dataService.updateReminder('usr-budi-12345', {
      is_enabled: reminderEnabled,
      frequency,
      time_1: `${time1}:00`,
      time_2: frequency === 2 ? `${time2}:00` : null,
    });
    setReminderSaved(true);
    setTimeout(() => setReminderSaved(false), 2500);
  };

  // 4. Add Category
  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;

    const { dataService } = await import('@/lib/supabase/client');
    await dataService.addCategory({
      user_id: 'usr-budi-12345',
      name: newCatName.trim(),
      emoji: newCatEmoji || '🏷️',
      type: 'expense',
      color: newCatColor,
      monthly_budget: 500000,
    });

    setNewCatName('');
    loadData();
  };

  // 5. Upgrade Pro via Midtrans / Manual
  const handleUpgradePro = async () => {
    setMidtransLoading(true);
    setTimeout(async () => {
      const { dataService } = await import('@/lib/supabase/client');
      await dataService.updateProfile('usr-budi-12345', {
        subscription_tier: 'pro',
      });
      setMidtransLoading(false);
      setPaymentSuccess(true);
      loadData();
    }, 1500);
  };

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Pengaturan & Konfigurasi</h1>
          <p className="text-sm text-slate-500">Atur integrasi bot Telegram, jadwal reminder WIB, preferensi profil, dan paket langganan.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-500 hidden sm:inline">Tema Visual:</span>
          <ThemeSwitcher />
        </div>
      </div>

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-2">
        <button
          onClick={() => setActiveTab('telegram')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'telegram'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bot className="w-4 h-4" />
          <span>Telegram Bot & Webhook</span>
        </button>

        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'profile'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profil Pengguna</span>
        </button>

        <button
          onClick={() => setActiveTab('reminders')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'reminders'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Bell className="w-4 h-4" />
          <span>Pengingat Harian (WIB)</span>
        </button>

        <button
          onClick={() => setActiveTab('categories')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'categories'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Kategori Transaksi</span>
        </button>

        <button
          onClick={() => setActiveTab('subscription')}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition whitespace-nowrap ${
            activeTab === 'subscription'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-slate-600 hover:text-slate-900'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          <span>Langganan (Starter / Pro)</span>
        </button>
      </div>

      {/* TAB 1: TELEGRAM BOT */}
      {activeTab === 'telegram' && (
        <div className="space-y-6">
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900">Setup Token Bot Telegram</h2>
                <p className="text-xs text-slate-500">Hubungkan bot Telegram kamu agar bisa mencatat transaksi real-time.</p>
              </div>

              {/* Status Badge */}
              <div>
                {testState === 'connected' || botRecord?.webhook_status === 'connected' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                    🟢 Terhubung ({botRecord?.bot_username ? `@${botRecord.bot_username}` : 'Bot Aktif'})
                  </span>
                ) : testState === 'testing' ? (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ⏳ Testing...
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                    🔴 Tidak terhubung
                  </span>
                )}
              </div>
            </div>

            {/* Active Telegram Bot Connection Banner */}
            <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-200 rounded-xl p-4 space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    <span>Bot Telegram Aktif: &ldquo;{pollingInfo?.botName || botRecord?.bot_username || 'tatadana digital'}&rdquo; (@{pollingInfo?.botUsername || botRecord?.bot_username || 'tatadanasalwabot'})</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Buka bot di Telegram HP Anda, lalu ketik <code className="bg-white px-1.5 py-0.5 rounded border border-orange-200 font-bold text-orange-700">/start</code> atau langsung ketik <code className="bg-white px-1.5 py-0.5 rounded border border-orange-200 font-bold text-orange-700">beli makan malam 15k tunai</code>.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`https://t.me/${pollingInfo?.botUsername || botRecord?.bot_username || 'tatadanasalwabot'}?start=link_${profile?.id || 'usr-budi-12345'}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-sm transition whitespace-nowrap flex items-center justify-center gap-1.5"
                  >
                    <span>Buka di Telegram HP</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>

            {/* Inline BotFather Step-by-Step Guide for Custom Private Bot */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs text-slate-700">
              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                <span>Opsi 2: Setup Bot Pribadi Khusus dari @BotFather</span>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1 leading-relaxed">
                <li>Buka aplikasi Telegram dan cari bot resmi <a href="https://t.me/BotFather" target="_blank" className="font-bold text-orange-600 hover:underline">@BotFather</a></li>
                <li>Ketik perintah <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-mono">/newbot</code> lalu beri nama dan username bot kamu (contoh: <i>MyTataDana_bot</i>)</li>
                <li>Salin token HTTP API yang diberikan (format: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-mono">123456789:ABCdefGHI...</code>)</li>
                <li>Tempel token pada kotak input di bawah ini, lalu klik <b>Test Koneksi</b>.</li>
              </ol>
            </div>

            {/* Live Long Polling Monitor & Mode Selector */}
            <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="font-bold text-sm text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    <span>Mode Penerimaan Pesan Telegram (Localhost)</span>
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    Di localhost:3000, gunakan <b>Long Polling</b> agar server lokal langsung menjemput pesan dari Telegram tanpa perlu HTTPS / ngrok.
                  </p>
                </div>

                <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-orange-200">
                  <button
                    type="button"
                    onClick={() => setPollingMode('polling')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                      pollingMode === 'polling'
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    ⚡ Long Polling
                  </button>
                  <button
                    type="button"
                    onClick={() => setPollingMode('webhook')}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                      pollingMode === 'webhook'
                        ? 'bg-orange-500 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    🌐 Webhook
                  </button>
                </div>
              </div>

              {/* Polling Live Status */}
              <div className="bg-white/90 border border-orange-100 rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-1">
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <span className="text-slate-500">Status Polling:</span>
                    {pollingInfo?.isRunning ? (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-800">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse"></span>
                        Aktif Menjemput Pesan HP 🟢
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600">
                        Belum Berjalan
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Bot: <b className="text-slate-800">{pollingInfo?.botName || 'tatadana digital'}</b> (@{pollingInfo?.botUsername || 'tatadanasalwabot'}) • Total Pesan Diterima: <b className="text-orange-600">{pollingInfo?.processedCount || 0}</b>
                    {pollingInfo?.lastMessageText && (
                      <span className="block mt-0.5 text-emerald-700">Pesan terakhir: &ldquo;{pollingInfo.lastMessageText}&rdquo;</span>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleTogglePolling}
                  className={`px-4 py-2 font-bold text-xs rounded-xl shadow-xs transition flex items-center justify-center gap-1.5 whitespace-nowrap ${
                    pollingInfo?.isRunning
                      ? 'bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  }`}
                >
                  {pollingInfo?.isRunning ? 'Hentikan Polling' : '⚡ Mulai Long Polling'}
                </button>
              </div>
            </div>

            {/* BotFather Guide for Tata dana siti hawa */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2 text-xs text-slate-700">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span>Setup Bot Telegram: &ldquo;Tata dana siti hawa&rdquo; dari @BotFather</span>
                <a
                  href="https://t.me/BotFather"
                  target="_blank"
                  rel="noreferrer"
                  className="text-orange-600 font-bold hover:underline flex items-center gap-1"
                >
                  <span>Buka @BotFather</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1 leading-relaxed">
                <li>Buka aplikasi Telegram di HP Anda dan cari bot <a href="https://t.me/BotFather" target="_blank" className="font-bold text-orange-600 hover:underline">@BotFather</a></li>
                <li>Pilih bot <b>Tata dana siti hawa</b> (atau ketik <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-mono">/token</code> lalu pilih bot tersebut)</li>
                <li>Salin token HTTP API yang diberikan (format: <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-900 font-mono">123456789:ABCdefGHI...</code>)</li>
                <li>Tempel token pada kotak di bawah ini, lalu klik <b>Simpan & Test Koneksi</b>.</li>
                <li>Kirim pesan dari HP Anda (misal: <code className="bg-orange-100 text-orange-800 px-1 py-0.5 rounded font-bold">beli makan malam 15k tunai</code>) — bot akan membalas struk dan transaksi langsung muncul di web!</li>
              </ol>
            </div>

            {/* Input Token & Test Button */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-slate-700">Token Bot HTTP API (@BotFather)</label>
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="Contoh: 123456789:ABCdefGHIjklMNOpqrSTUvwxYZ..."
                  value={botToken}
                  onChange={(e) => setBotToken(e.target.value)}
                  className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:border-orange-500"
                />
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={testState === 'testing'}
                  className="px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition shadow-sm flex items-center justify-center gap-2 whitespace-nowrap"
                >
                  {testState === 'testing' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>⏳ Menghubungkan...</span>
                    </>
                  ) : (
                    <span>Simpan & Test Koneksi</span>
                  )}
                </button>
              </div>

              {testMessage && (
                <div className={`p-3 rounded-xl text-xs font-medium ${
                  testState === 'connected' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
                }`}>
                  {testMessage}
                </div>
              )}
            </div>

            {/* Webhook & Timezone info */}
            <div className="pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-slate-500">Mode Komunikasi Aktif</div>
                <div className="font-mono text-slate-800 font-bold mt-0.5 break-all">
                  {pollingMode === 'polling' ? '⚡ Long Polling (getUpdates API)' : '🌐 Webhook (POST /api/telegram/webhook)'}
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                <div className="text-slate-500">Zona Waktu Transaksi</div>
                <div className="font-mono text-slate-800 font-bold mt-0.5">
                  Asia/Jakarta (WIB) • UTC+7
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROFIL PENGGUNA */}
      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Card 1: Ganti Foto Profil */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
            <div className="border-b border-slate-100 pb-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                  <Camera className="w-5 h-5 text-orange-500" />
                  <span>Foto Profil Pengguna</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ubah avatar Anda dengan upload foto lokal, input link URL, atau pilih avatar preset instan.
                </p>
              </div>
              <span className="text-[11px] bg-orange-50 text-orange-700 border border-orange-200 px-2.5 py-0.5 rounded-full font-bold">
                Tersinkron ke Dashboard
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-start">
              {/* Preview Avatar Kiri */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-6 bg-slate-50 border border-slate-200 rounded-2xl text-center space-y-3">
                <div className="relative group">
                  <img
                    src={avatarUrl}
                    alt={fullName || 'Avatar'}
                    className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg ring-2 ring-orange-400 group-hover:scale-105 transition-transform"
                  />
                  <label 
                    htmlFor="avatar-file-upload"
                    className="absolute bottom-1 right-1 p-2 bg-orange-500 hover:bg-orange-600 text-white rounded-full shadow-md cursor-pointer transition transform hover:scale-110"
                    title="Upload Foto Baru"
                  >
                    <Camera className="w-4 h-4" />
                  </label>
                  <input
                    id="avatar-file-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-sm">{fullName || 'Salwa L'}</div>
                  <div className="text-[11px] text-slate-500">{email || 'salwaL20@gmail.com'}</div>
                </div>

                <button
                  type="button"
                  onClick={() => handleSaveAvatar()}
                  className="w-full py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow flex items-center justify-center gap-1.5"
                >
                  {avatarSaved ? <CheckCircle2 className="w-4 h-4 text-white" /> : <Camera className="w-4 h-4" />}
                  <span>{avatarSaved ? 'Foto Tersimpan!' : 'Simpan Foto Ini'}</span>
                </button>

                {avatarSaved && (
                  <div className="text-[11px] text-emerald-600 font-bold animate-pulse">
                    ✓ Foto profil berhasil diperbarui di seluruh aplikasi!
                  </div>
                )}
              </div>

              {/* Opsi Upload & URL & Presets Kanan */}
              <div className="md:col-span-8 space-y-5">
                {/* Method A: Upload & URL */}
                <div className="space-y-3">
                  <label className="block text-xs font-bold text-slate-700">
                    1. Upload File atau Masukkan URL Gambar:
                  </label>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <label 
                      htmlFor="avatar-file-upload-btn" 
                      className="px-4 py-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center justify-center gap-1.5 shadow-xs"
                    >
                      <Upload className="w-3.5 h-3.5 text-orange-500" />
                      <span>Pilih Foto dari Komputer</span>
                    </label>
                    <input
                      id="avatar-file-upload-btn"
                      type="file"
                      accept="image/*"
                      onChange={handleFileUpload}
                      className="hidden"
                    />

                    <div className="flex-1 flex gap-1.5">
                      <input
                        type="url"
                        placeholder="Tempel link URL foto (https://...)"
                        value={avatarInputUrl}
                        onChange={(e) => setAvatarInputUrl(e.target.value)}
                        className="flex-1 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:border-orange-500"
                      />
                      <button
                        type="button"
                        onClick={handleApplyAvatarUrl}
                        className="px-3 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition"
                      >
                        Pasang
                      </button>
                    </div>
                  </div>
                </div>

                {/* Method B: Quick Avatar Presets */}
                <div className="space-y-2">
                  <label className="block text-xs font-bold text-slate-700 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-orange-500" />
                    <span>2. Pilihan Avatar Cepat (Klik untuk memilih):</span>
                  </label>
                  <div className="grid grid-cols-4 sm:grid-cols-4 gap-2.5">
                    {avatarPresets.map((preset) => {
                      const isSelected = avatarUrl === preset.url;
                      return (
                        <button
                          key={preset.id}
                          type="button"
                          onClick={() => {
                            setAvatarUrl(preset.url);
                            setActivePreset(preset.id);
                            handleSaveAvatar(preset.url);
                          }}
                          className={`p-2 rounded-xl border text-center transition flex flex-col items-center gap-1.5 group ${
                            isSelected 
                              ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500/20 shadow-xs' 
                              : 'border-slate-200 bg-slate-50 hover:bg-white'
                          }`}
                        >
                          <img
                            src={preset.url}
                            alt={preset.name}
                            className={`w-12 h-12 rounded-full object-cover transition transform group-hover:scale-105 ${
                              isSelected ? 'ring-2 ring-orange-500' : 'ring-1 ring-slate-200'
                            }`}
                          />
                          <span className="text-[10px] font-bold text-slate-700 truncate w-full text-center">
                            {preset.name}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Informasi Identitas */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
            <div className="border-b border-slate-100 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Data Identitas Akun</h3>
              <p className="text-xs text-slate-500">Nama tampilan dan mata uang utama pembukuan.</p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4 max-w-lg">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nama Lengkap</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Alamat Email Terdaftar</label>
                <input
                  type="email"
                  value={email || 'salwaL20@gmail.com'}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-hidden focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nomor WhatsApp / HP Terverifikasi</label>
                <input
                  type="text"
                  disabled
                  value={profile?.phone_number || '+6281288887777'}
                  className="w-full px-3.5 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 cursor-not-allowed"
                />
                <span className="text-[10px] text-emerald-600 font-bold mt-1 flex items-center gap-1">
                  <Check className="w-3 h-3" /> Nomor terverifikasi OTP (Kunci bot Telegram)
                </span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mata Uang Default</label>
                <select
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  <option value="IDR">Rupiah Indonesia (IDR - Rp)</option>
                  <option value="USD">US Dollar (USD - $)</option>
                  <option value="SGD">Singapore Dollar (SGD - S$)</option>
                </select>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow flex items-center gap-1.5"
                >
                  {profileSaved && <Check className="w-3.5 h-3.5" />}
                  <span>{profileSaved ? 'Perubahan Tersimpan!' : 'Simpan Perubahan Akun'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* TAB 3: REMINDERS */}
      {activeTab === 'reminders' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Pengingat Harian Otomatis</h2>
            <p className="text-xs text-slate-500">
              Bot Telegram akan mengirim pesan pengingat catat pengeluaran rutin setiap hari (maksimal 2x per hari).
            </p>
          </div>

          <form onSubmit={handleSaveReminder} className="space-y-5 max-w-md">
            <div className="flex items-center justify-between p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
              <div>
                <div className="text-xs font-bold text-slate-900">Aktifkan Pengingat Harian</div>
                <div className="text-[11px] text-slate-500">Kirim reminder otomatis ke chat Telegram</div>
              </div>
              <input
                type="checkbox"
                checked={reminderEnabled}
                onChange={(e) => setReminderEnabled(e.target.checked)}
                className="w-5 h-5 accent-orange-500 rounded cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Frekuensi Pengingat</label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFrequency(1)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    frequency === 1
                      ? 'border-orange-500 bg-orange-50 text-orange-600'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  1x Sehari
                </button>
                <button
                  type="button"
                  onClick={() => setFrequency(2)}
                  className={`py-2 px-3 rounded-xl text-xs font-bold border transition ${
                    frequency === 2
                      ? 'border-orange-500 bg-orange-50 text-orange-600'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  2x Sehari (Siang & Malam)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Jam Pengingat 1 (WIB)</label>
                <input
                  type="time"
                  value={time1}
                  onChange={(e) => setTime1(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              {frequency === 2 && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Jam Pengingat 2 (WIB)</label>
                  <input
                    type="time"
                    value={time2}
                    onChange={(e) => setTime2(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              )}
            </div>

            {/* Preview Pesan Reminder */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Preview Pesan Reminder di Telegram:</label>
              <div className="bg-[#122b4a] text-blue-100 p-4 rounded-xl text-xs font-mono leading-relaxed border border-blue-900">
                ⏰ <b>Reminder Keuangan!</b><br />
                Jangan lupa catat pengeluaran hari ini ya 📝<br />
                Pencatatan rutin = keuangan lebih terkontrol 💪<br />
                Ketik transaksimu sekarang!
              </div>
            </div>

            <button
              type="submit"
              className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold rounded-xl transition shadow-sm flex items-center gap-1.5"
            >
              {reminderSaved && <Check className="w-3.5 h-3.5" />}
              <span>{reminderSaved ? 'Pengingat Disimpan!' : 'Simpan Pengaturan Reminder'}</span>
            </button>
          </form>
        </div>
      )}

      {/* TAB 4: KATEGORI */}
      {activeTab === 'categories' && (
        <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
          <div className="border-b border-slate-100 pb-4">
            <h2 className="text-base font-bold text-slate-900">Kelola Kategori Custom</h2>
            <p className="text-xs text-slate-500">Atur kategori pemasukan dan pengeluaran kamu sesuai kebutuhan gaya hidup.</p>
          </div>

          {/* Form Tambah Kategori */}
          <form onSubmit={handleAddCategory} className="flex flex-wrap items-end gap-3 p-4 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Emoji</label>
              <input
                type="text"
                value={newCatEmoji}
                onChange={(e) => setNewCatEmoji(e.target.value)}
                className="w-14 px-3 py-2 bg-white border border-slate-200 rounded-xl text-center text-sm"
              />
            </div>

            <div className="flex-1 min-w-[200px]">
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Nama Kategori</label>
              <input
                type="text"
                placeholder="Contoh: Kebutuhan Hewan Peliharaan"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 mb-1">Warna</label>
              <input
                type="color"
                value={newCatColor}
                onChange={(e) => setNewCatColor(e.target.value)}
                className="w-12 h-9 p-1 bg-white border border-slate-200 rounded-xl cursor-pointer"
              />
            </div>

            <button
              type="submit"
              className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl transition"
            >
              + Tambah Kategori
            </button>
          </form>

          {/* Categories List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {categories.map((c) => (
              <div key={c.id} className="p-3 bg-white border border-slate-200 rounded-xl flex items-center justify-between shadow-sm">
                <div className="flex items-center gap-2.5">
                  <span className="text-xl">{c.emoji}</span>
                  <div>
                    <div className="text-xs font-bold text-slate-900">{c.name}</div>
                    <div className="text-[10px] text-slate-400 capitalize">{c.type}</div>
                  </div>
                </div>
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: c.color }}
                ></div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: SUBSCRIPTION */}
      {activeTab === 'subscription' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Starter Plan */}
            <div className={`bg-white border rounded-2xl p-6 shadow-sm space-y-4 ${
              profile?.subscription_tier === 'starter' ? 'border-orange-500 ring-2 ring-orange-500/10' : 'border-slate-200'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-base text-slate-900">TataDana Starter</h3>
                  <p className="text-xs text-slate-500">Untuk individu yang baru mulai mencatat</p>
                </div>
                {profile?.subscription_tier === 'starter' && (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 text-orange-700">
                    Paket Aktif
                  </span>
                )}
              </div>

              <div className="text-2xl font-black text-slate-900">
                Rp 49.000 <span className="text-xs font-normal text-slate-500">/ bulan</span>
              </div>

              <ul className="space-y-2 text-xs text-slate-600">
                <li className="flex items-center gap-2">✓ Catat transaksi via teks Telegram</li>
                <li className="flex items-center gap-2">✓ Dashboard web lengkap</li>
                <li className="flex items-center gap-2">✓ Maksimal 50 transaksi / bulan</li>
                <li className="flex items-center gap-2">✓ Maksimal 3 wallet & 5 budget</li>
                <li className="flex items-center gap-2 text-slate-400">✗ Tidak ada input foto struk OCR</li>
                <li className="flex items-center gap-2 text-slate-400">✗ Tidak ada AI Financial Advisor</li>
                <li className="flex items-center gap-2 text-slate-400">✗ Tidak ada export PDF/Excel</li>
              </ul>
            </div>

            {/* Pro Plan */}
            <div className={`bg-gradient-to-br from-orange-50 to-amber-50 border rounded-2xl p-6 shadow-sm space-y-4 relative overflow-hidden ${
              profile?.subscription_tier === 'pro' ? 'border-orange-500 ring-2 ring-orange-500/20' : 'border-orange-300'
            }`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4 text-orange-500" />
                    <h3 className="font-bold text-base text-orange-950">TataDana Pro</h3>
                  </div>
                  <p className="text-xs text-orange-700">Solusi tanpa batas seumur hidup</p>
                </div>
                {profile?.subscription_tier === 'pro' ? (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700">
                    Paket Aktif Seumur Hidup
                  </span>
                ) : (
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-500 text-white">
                    Rekomendasi
                  </span>
                )}
              </div>

              <div className="text-2xl font-black text-slate-900">
                Rp 99.000 <span className="text-xs font-normal text-slate-600">Sekali Bayar (Lifetime)</span>
              </div>

              <ul className="space-y-2 text-xs text-slate-700">
                <li className="flex items-center gap-2">✓ <b>Unlimited</b> transaksi, wallet, dan kategori</li>
                <li className="flex items-center gap-2">✓ <b>Input Foto Struk</b> dengan AI OCR otomatis</li>
                <li className="flex items-center gap-2">✓ <b>AI Financial Advisor</b> personal & saran hemat</li>
                <li className="flex items-center gap-2">✓ <b>Laporan & Export unlimited</b> ke PDF dan Excel</li>
                <li className="flex items-center gap-2">✓ Pengingat custom & prioritas support</li>
              </ul>

              {profile?.subscription_tier === 'starter' && (
                <button
                  onClick={handleUpgradePro}
                  disabled={midtransLoading}
                  className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow transition flex items-center justify-center gap-2"
                >
                  {midtransLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Menghubungkan Midtrans...</span>
                    </>
                  ) : (
                    <span>Bayar Rp99.000 (Midtrans / Transfer)</span>
                  )}
                </button>
              )}

              {paymentSuccess && (
                <div className="p-3 bg-emerald-100 text-emerald-800 rounded-xl text-xs font-bold text-center">
                  🎉 Selamat! Akun Anda telah di-upgrade ke TataDana Pro seumur hidup!
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
