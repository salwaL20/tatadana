'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Wallet, 
  TrendingUp, 
  ShieldCheck, 
  Plus, 
  ArrowRight, 
  CheckCircle, 
  AlertTriangle, 
  Search, 
  Filter, 
  Building2, 
  Sparkles,
  CreditCard,
  FileText,
  UserCheck,
  ChevronRight,
  X,
  Send,
  Lock,
  Layers,
  ArrowUpRight,
  ArrowDownLeft,
  DollarSign
} from 'lucide-react';
import { formatRupiah } from '@/lib/utils/currency';
import { Team, TeamMember } from '@/types/database';

interface SimulatedLedgerItem {
  id: string;
  description: string;
  amount: number;
  type: 'expense' | 'income';
  category: string;
  logged_by: string;
  date: string;
  status: 'approved' | 'pending';
}

export default function TeamworkPreviewPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeTeam, setActiveTeam] = useState<Team | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'ledger'>('overview');
  const [currentUser, setCurrentUser] = useState<string>('Salwa L');
  const [currentUserId, setCurrentUserId] = useState<string>('usr-salwa-001');

  // Interactive member invite form state
  const [newMemberName, setNewMemberName] = useState('');
  const [newMemberEmail, setNewMemberEmail] = useState('');
  const [newMemberRole, setNewMemberRole] = useState<'treasurer' | 'admin' | 'member'>('member');
  const [inviteSuccess, setInviteSuccess] = useState(false);

  // Interactive quick ledger transaction state
  const [newTxDesc, setNewTxDesc] = useState('');
  const [newTxAmount, setNewTxAmount] = useState('');
  const [newTxType, setNewTxType] = useState<'expense' | 'income'>('expense');
  const [newTxCategory, setNewTxCategory] = useState('Operasional');

  // Simulated Team Ledgers
  const [teamLedgers, setTeamLedgers] = useState<Record<string, SimulatedLedgerItem[]>>({
    'team-01': [
      { id: 'tx-t01-1', description: 'Belanja Sayur & Buah Mingguan Pasar Modern', amount: 850000, type: 'expense', category: 'Kebutuhan Dapur', logged_by: 'Salwa L', date: '2026-10-12 09:30', status: 'approved' },
      { id: 'tx-t01-2', description: 'Tagihan Listrik PLN Pascabayar', amount: 1250000, type: 'expense', category: 'Utilitas', logged_by: 'Budi Pratama', date: '2026-10-10 14:15', status: 'approved' },
      { id: 'tx-t01-3', description: 'Top-up Rekening Tabungan Bersama Keluarga', amount: 5000000, type: 'income', category: 'Setoran Rutin', logged_by: 'Budi Pratama', date: '2026-10-01 10:00', status: 'approved' }
    ],
    'team-02': [
      { id: 'tx-t02-1', description: 'Langganan Server Cloud AWS & Vercel Pro', amount: 3850000, type: 'expense', category: 'Infrastruktur', logged_by: 'Salwa L', date: '2026-10-11 11:00', status: 'approved' },
      { id: 'tx-t02-2', description: 'Langganan OpenAI & Claude API Gateway', amount: 4200000, type: 'expense', category: 'AI Tools', logged_by: 'Salwa L', date: '2026-10-08 16:45', status: 'approved' },
      { id: 'tx-t02-3', description: 'Pencairan Pendapatan Langganan Midtrans B2B', amount: 28500000, type: 'income', category: 'Revenue', logged_by: 'Budi Tech Lead', date: '2026-10-05 08:30', status: 'approved' }
    ],
    'team-03': [
      { id: 'tx-t03-1', description: 'Meta Ads & Instagram Promotion Campaign', amount: 6200000, type: 'expense', category: 'Digital Ads', logged_by: 'Salwa L', date: '2026-10-11 15:20', status: 'approved' },
      { id: 'tx-t03-2', description: 'Sponsor Podcast Fintech Indonesia', amount: 5000000, type: 'expense', category: 'Partnership', logged_by: 'Salwa L', date: '2026-10-06 10:10', status: 'approved' }
    ],
    'team-04': [
      { id: 'tx-t04-1', description: 'Pasokan Daging Sapi & Bahan Pokok Dapur', amount: 14500000, type: 'expense', category: 'Bahan Baku', logged_by: 'Salwa L', date: '2026-10-11 07:15', status: 'approved' },
      { id: 'tx-t04-2', description: 'Omset Penjualan Kasir Resto Shift Weekend', amount: 32000000, type: 'income', category: 'Penjualan', logged_by: 'Salwa L', date: '2026-10-09 23:00', status: 'approved' }
    ],
    'team-05': [
      { id: 'tx-t05-1', description: 'Biaya Server AWS Cluster Tokyo & Supabase DB', amount: 15400000, type: 'expense', category: 'Cloud Hosting', logged_by: 'Reza DevOps', date: '2026-10-12 14:00', status: 'approved' },
      { id: 'tx-t05-2', description: 'Lisensi GitHub Enterprise & Datadog APM', amount: 8200000, type: 'expense', category: 'Dev Tools', logged_by: 'Budi Pratama', date: '2026-10-08 10:30', status: 'approved' },
      { id: 'tx-t05-3', description: 'Alokasi Budget R&D Infrastruktur Q4', amount: 45000000, type: 'income', category: 'Budget R&D', logged_by: 'Salwa L', date: '2026-10-01 09:00', status: 'approved' }
    ],
    'team-06': [
      { id: 'tx-t06-1', description: 'Langganan Adobe Creative Cloud & Figma Org', amount: 4800000, type: 'expense', category: 'Software', logged_by: 'Maya Creative', date: '2026-10-10 11:20', status: 'approved' },
      { id: 'tx-t06-2', description: 'Pembayaran DP Desain Branding Fintech Client', amount: 12000000, type: 'income', category: 'Client Fee', logged_by: 'Salwa L', date: '2026-10-06 16:00', status: 'approved' }
    ],
    'team-07': [
      { id: 'tx-t07-1', description: 'DP Gedung Ballroom Grand Ballroom Sudirman', amount: 25000000, type: 'expense', category: 'Venue', logged_by: 'Sarah Wedding', date: '2026-10-09 13:00', status: 'approved' },
      { id: 'tx-t07-2', description: 'Pelunasan Paket Wedding Organizer Klien Dimas-Rara', amount: 48000000, type: 'income', category: 'Paket Wedding', logged_by: 'Salwa L', date: '2026-10-07 15:45', status: 'approved' }
    ],
    'team-08': [
      { id: 'tx-t08-1', description: 'Distribusi 200 Paket Sembako Dhuafa Cilincing', amount: 8400000, type: 'expense', category: 'Penyaluran', logged_by: 'Ustadz Hilman', date: '2026-10-12 08:00', status: 'approved' },
      { id: 'tx-t08-2', description: 'Infaq Donatur Tetap Jumat Berkah Yayasan', amount: 15600000, type: 'income', category: 'Donasi Infaq', logged_by: 'Salwa L (Bendahara Amal)', date: '2026-10-10 17:30', status: 'approved' }
    ],
    'team-09': [
      { id: 'tx-t09-1', description: 'Akumulasi Pembelian Saham BBCA & BMRI', amount: 45000000, type: 'expense', category: 'Investasi Saham', logged_by: 'Salwa L', date: '2026-10-11 10:15', status: 'approved' },
      { id: 'tx-t09-2', description: 'Pencairan Dividen Semester 1 PT Bank Mandiri', amount: 18500000, type: 'income', category: 'Dividen', logged_by: 'Salwa L', date: '2026-10-05 09:30', status: 'approved' }
    ],
    'team-10': [
      { id: 'tx-t10-1', description: 'Belanja Granit 60x60 & Cat Tembok Dulux', amount: 16800000, type: 'expense', category: 'Material', logged_by: 'Mandor Joko', date: '2026-10-12 11:00', status: 'approved' },
      { id: 'tx-t10-2', description: 'Upah Tukang Bangunan Borongan Minggu ke-2', amount: 9500000, type: 'expense', category: 'Upah Tukang', logged_by: 'Salwa L', date: '2026-10-10 16:30', status: 'approved' },
      { id: 'tx-t10-3', description: 'Talangan Termin 2 Pemilik Rumah Bapak Rudi', amount: 35000000, type: 'income', category: 'Termin Renov', logged_by: 'Salwa L', date: '2026-10-04 14:00', status: 'approved' }
    ]
  });

  const knownAccounts: Record<string, { id: string; full_name: string; email: string; avatar_url: string; subscription_tier: 'starter' | 'pro'; role: 'user' | 'superadmin' }> = {
    'usr-salwa-001': {
      id: 'usr-salwa-001',
      full_name: 'Salwa L',
      email: 'salwaL20@gmail.com',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
      subscription_tier: 'pro',
      role: 'superadmin',
    },
    'usr-budi-12345': {
      id: 'usr-budi-12345',
      full_name: 'Budi Pratama',
      email: 'budi@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150',
      subscription_tier: 'starter',
      role: 'user',
    },
    'usr-citra-99887': {
      id: 'usr-citra-99887',
      full_name: 'Citra Kirana',
      email: 'citra@example.com',
      avatar_url: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150',
      subscription_tier: 'starter',
      role: 'user',
    },
    'usr-admin-super': {
      id: 'usr-admin-super',
      full_name: 'Super Admin TataDana',
      email: 'admin@tatadana.id',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      subscription_tier: 'pro',
      role: 'superadmin',
    },
    'usr-guest-005': {
      id: 'usr-guest-005',
      full_name: 'Tamu / Demo User',
      email: 'guest@tatadana.id',
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      subscription_tier: 'starter',
      role: 'user',
    }
  };

  const loadTeams = async () => {
    const { dataService } = await import('@/lib/supabase/client');
    const allTeams = await dataService.getTeams();
    setTeams(allTeams);

    if (typeof window !== 'undefined') {
      const storedUser = localStorage.getItem('tatadana_current_user');
      const storedUserId = localStorage.getItem('tatadana_current_user_id');
      if (storedUser) {
        try {
          const parsed = JSON.parse(storedUser);
          setCurrentUser(parsed.full_name || parsed.name || 'Salwa L');
        } catch (e) {
          setCurrentUser(storedUser);
        }
      }
      if (storedUserId) setCurrentUserId(storedUserId);
    }
  };

  useEffect(() => {
    loadTeams();
    const handleUserSwitch = (e: any) => {
      loadTeams();
      if (e?.detail) {
        if (e.detail.id) setCurrentUserId(e.detail.id);
        if (e.detail.full_name) setCurrentUser(e.detail.full_name);
      }
    };
    window.addEventListener('tatadana_user_switched', handleUserSwitch);
    return () => window.removeEventListener('tatadana_user_switched', handleUserSwitch);
  }, []);

  // Quick switch user simulator
  const handleQuickSwitchUser = (name: string, id: string) => {
    const acc = knownAccounts[id] || {
      id,
      full_name: name,
      email: `${name.toLowerCase().replace(/\s+/g, '')}@tatadana.id`,
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150',
      subscription_tier: 'starter' as const,
      role: 'user' as const
    };

    setCurrentUser(acc.full_name);
    setCurrentUserId(acc.id);

    if (typeof window !== 'undefined') {
      localStorage.setItem('tatadana_current_user_id', acc.id);
      localStorage.setItem('tatadana_current_user', JSON.stringify(acc));
      localStorage.setItem('tatadana_profile_avatar', acc.avatar_url);
      window.dispatchEvent(new CustomEvent('tatadana_user_switched', { detail: { id: acc.id, full_name: acc.full_name, avatar_url: acc.avatar_url, user: acc } }));
      window.dispatchEvent(new CustomEvent('tatadana_profile_updated', { detail: { avatar_url: acc.avatar_url, full_name: acc.full_name } }));
    }
  };

  // Add Member
  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeam || !newMemberName.trim()) return;

    const newMember: TeamMember = {
      id: `m-${Date.now()}`,
      name: newMemberName.trim(),
      email: newMemberEmail.trim() || `${newMemberName.toLowerCase().replace(/\s+/g, '')}@tatadana.id`,
      role: newMemberRole,
      avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150`,
      joined_at: new Date().toISOString().split('T')[0]
    };

    const updatedTeam = {
      ...activeTeam,
      members_count: activeTeam.members_count + 1,
      members: [...activeTeam.members, newMember]
    };

    setTeams(prev => prev.map(t => t.id === activeTeam.id ? updatedTeam : t));
    setActiveTeam(updatedTeam);
    setNewMemberName('');
    setNewMemberEmail('');
    setInviteSuccess(true);
    setTimeout(() => setInviteSuccess(false), 3000);
  };

  // Switch role simulation for current user
  const handleRoleChange = (memberId: string, newRole: 'owner' | 'admin' | 'treasurer' | 'member') => {
    if (!activeTeam) return;
    const updatedMembers = activeTeam.members.map(m => m.id === memberId ? { ...m, role: newRole } : m);
    const updatedTeam = { ...activeTeam, members: updatedMembers };
    setTeams(prev => prev.map(t => t.id === activeTeam.id ? updatedTeam : t));
    setActiveTeam(updatedTeam);
  };

  // Add Ledger Transaction simulation
  const handleAddLedgerTx = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeTeam || !newTxDesc.trim() || !newTxAmount) return;

    const nominal = parseFloat(newTxAmount.replace(/[^0-9]/g, '')) || 0;
    if (nominal <= 0) return;

    const newTx: SimulatedLedgerItem = {
      id: `tx-sim-${Date.now()}`,
      description: newTxDesc.trim(),
      amount: nominal,
      type: newTxType,
      category: newTxCategory,
      logged_by: currentUser,
      date: new Date().toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' }).replace('T', ' ').slice(0, 16),
      status: 'approved'
    };

    // Update ledger state
    setTeamLedgers(prev => ({
      ...prev,
      [activeTeam.id]: [newTx, ...(prev[activeTeam.id] || [])]
    }));

    // Update team shared balance and spent
    const updatedSharedBalance = newTxType === 'income' 
      ? activeTeam.shared_balance + nominal 
      : activeTeam.shared_balance - nominal;
    const updatedSpent = newTxType === 'expense' 
      ? activeTeam.spent_this_month + nominal 
      : activeTeam.spent_this_month;

    const updatedTeam = {
      ...activeTeam,
      shared_balance: updatedSharedBalance,
      spent_this_month: updatedSpent
    };

    setTeams(prev => prev.map(t => t.id === activeTeam.id ? updatedTeam : t));
    setActiveTeam(updatedTeam);
    setNewTxDesc('');
    setNewTxAmount('');
  };

  // Aggregate Metrics
  const totalSharedBalance = teams.reduce((acc, t) => acc + t.shared_balance, 0);
  const totalMembers = teams.reduce((acc, t) => acc + t.members_count, 0);

  // Filter categories
  const categoriesList = [
    { key: 'all', label: 'Semua Tim' },
    { key: 'Keluarga', label: '👨‍👩‍👧 Keluarga' },
    { key: 'SaaS & Startup', label: '🚀 SaaS & Startup' },
    { key: 'Bisnis & UMKM', label: '🏪 Bisnis & UMKM' },
    { key: 'Event & Komunitas', label: '🎉 Event & Komunitas' },
    { key: 'Investasi & Proyek', label: '💎 Investasi & Proyek' },
  ];

  const filteredTeams = teams.filter(t => {
    if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">👥 Kolaborasi Finansial 10 Tim</h1>
            <span className="text-xs font-bold px-2.5 py-0.5 bg-orange-100 text-orange-700 rounded-full">
              Workspace Live Preview
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Kelola saldo bersama, pos anggaran kelompok, otorisasi bendahara, dan transparansi mutasi real-time.
          </p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-bold transition shadow-xs"
        >
          <span>Kembali ke Dashboard Pribadi</span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </Link>
      </div>

      {/* Multi-User Fast Account Switcher Bar */}
      <div className="bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border border-orange-200 rounded-2xl p-4 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center text-white shrink-0 shadow-xs">
            <UserCheck className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-orange-950">Akses Pengguna Aktif:</span>
              <span className="text-xs font-extrabold text-orange-700 bg-white px-2 py-0.5 rounded-md border border-orange-200">
                {currentUser}
              </span>
            </div>
            <p className="text-[11px] text-orange-900/80">
              Ganti akun simulasi untuk menguji hak akses Owner, Bendahara, atau Anggota di 10 tim.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold text-orange-800 mr-1">Pilih Akun:</span>
          <button
            onClick={() => handleQuickSwitchUser('Salwa L', 'usr-salwa-001')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
              currentUserId === 'usr-salwa-001'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white border border-orange-200 text-slate-700 hover:bg-orange-100/50'
            }`}
          >
            Salwa L (Pro)
          </button>
          <button
            onClick={() => handleQuickSwitchUser('Budi Pratama', 'usr-budi-12345')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
              currentUserId === 'usr-budi-12345'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white border border-orange-200 text-slate-700 hover:bg-orange-100/50'
            }`}
          >
            Budi Pratama
          </button>
          <button
            onClick={() => handleQuickSwitchUser('Citra Kirana', 'usr-citra-99887')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
              currentUserId === 'usr-citra-99887'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white border border-orange-200 text-slate-700 hover:bg-orange-100/50'
            }`}
          >
            Citra Kirana
          </button>
          <button
            onClick={() => handleQuickSwitchUser('Super Admin TataDana', 'usr-admin-super')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
              currentUserId === 'usr-admin-super'
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white border border-orange-200 text-slate-700 hover:bg-orange-100/50'
            }`}
          >
            Admin Super
          </button>
          <button
            onClick={() => handleQuickSwitchUser('Tamu / Demo User', 'usr-guest-005')}
            className={`px-2.5 py-1 text-xs font-bold rounded-lg transition ${
              currentUserId === 'usr-guest-005'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'bg-white border border-emerald-200 text-emerald-800 hover:bg-emerald-50'
            }`}
          >
            Akun Tamu
          </button>
        </div>
      </div>

      {/* Aggregate Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Tim Terdaftar</span>
            <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {teams.length} <span className="text-xs font-normal text-slate-400">Workspace</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Terdiri dari Keluarga, Startup, UMKM, Komunitas, & Investasi
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Saldo Bersama</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-emerald-600 tracking-tight">
            {formatRupiah(totalSharedBalance)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Terkonsolidasi di rekening escrow & rekening tim
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Kolaborator</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-black text-slate-900 tracking-tight">
            {totalMembers} <span className="text-xs font-normal text-slate-400">Anggota</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">
            Dengan peran Owner, Admin, Bendahara, dan Anggota
          </p>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pt-2">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
          {categoriesList.map(cat => (
            <button
              key={cat.key}
              onClick={() => setSelectedCategory(cat.key)}
              className={`px-3 py-1.5 text-xs font-bold rounded-xl whitespace-nowrap transition ${
                selectedCategory === cat.key
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Cari tim atau deskripsi..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* 10 Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTeams.map((team) => {
          const budgetPct = team.monthly_budget > 0 
            ? Math.round((team.spent_this_month / team.monthly_budget) * 100) 
            : 0;

          return (
            <div
              key={team.id}
              className="bg-white border border-slate-200 hover:border-orange-300 rounded-2xl p-5 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4 group"
            >
              <div className="space-y-3">
                {/* Team Top: Emoji, Name, Status */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5">
                    <span className="text-3xl p-2 bg-slate-50 border border-slate-100 rounded-xl shadow-xs group-hover:scale-105 transition">
                      {team.emoji}
                    </span>
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 leading-snug line-clamp-1">{team.name}</h3>
                      <span className="text-[11px] font-semibold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full inline-block mt-0.5">
                        {team.category}
                      </span>
                    </div>
                  </div>

                  <div>
                    {team.status === 'active' && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Aktif
                      </span>
                    )}
                    {team.status === 'warning' && (
                      <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                        Waspada Limit
                      </span>
                    )}
                    {team.status === 'audit' && (
                      <span className="text-[10px] font-bold text-purple-700 bg-purple-50 border border-purple-200 px-2 py-0.5 rounded-full">
                        Audit
                      </span>
                    )}
                  </div>
                </div>

                {/* Description */}
                <p className="text-xs text-slate-500 leading-relaxed line-clamp-2">
                  {team.description}
                </p>

                {/* Balances */}
                <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-[11px] text-slate-500 font-medium">Saldo Bersama</span>
                    <span className="text-sm font-black text-slate-900">{formatRupiah(team.shared_balance)}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px]">
                      <span className="text-slate-500">Realisasi Budget:</span>
                      <span className={`font-bold ${budgetPct >= 90 ? 'text-rose-600' : budgetPct >= 70 ? 'text-amber-600' : 'text-slate-700'}`}>
                        {budgetPct}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${
                          budgetPct >= 90 ? 'bg-rose-500' : budgetPct >= 70 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, budgetPct)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>{formatRupiah(team.spent_this_month)}</span>
                      <span>Target {formatRupiah(team.monthly_budget)}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom: Member Avatars and Action */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center -space-x-1.5 overflow-hidden">
                  {team.members.slice(0, 3).map((m, idx) => (
                    <img
                      key={m.id || idx}
                      src={m.avatar_url}
                      alt={m.name}
                      className="w-6 h-6 rounded-full border-2 border-white object-cover"
                      title={`${m.name} (${m.role})`}
                    />
                  ))}
                  {team.members_count > 3 && (
                    <span className="w-6 h-6 rounded-full bg-slate-200 border-2 border-white text-[10px] font-bold text-slate-600 flex items-center justify-center">
                      +{team.members_count - 3}
                    </span>
                  )}
                  <span className="text-[11px] font-semibold text-slate-500 ml-2">
                    {team.members_count} Anggota
                  </span>
                </div>

                <button
                  onClick={() => {
                    setActiveTeam(team);
                    setActiveTab('overview');
                  }}
                  className="px-3 py-1.5 bg-orange-50 hover:bg-orange-500 text-orange-700 hover:text-white rounded-xl text-xs font-bold transition flex items-center gap-1"
                >
                  <span>Detail & Ledger</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {filteredTeams.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl border border-slate-200">
          <p className="text-sm font-semibold text-slate-600">Tidak ada tim yang cocok dengan kriteria pencarian.</p>
          <button
            onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
            className="mt-2 text-xs font-bold text-orange-600 hover:underline"
          >
            Reset Filter
          </button>
        </div>
      )}

      {/* Interactive Team Detail Modal */}
      {activeTeam && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-start justify-between gap-4 bg-slate-50/70">
              <div className="flex items-center gap-3">
                <span className="text-4xl p-2.5 bg-white border border-slate-200 rounded-2xl shadow-xs">
                  {activeTeam.emoji}
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-black text-slate-900">{activeTeam.name}</h2>
                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                      {activeTeam.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 max-w-md">{activeTeam.description}</p>
                </div>
              </div>
              <button
                onClick={() => setActiveTeam(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Nav Tabs */}
            <div className="flex border-b border-slate-100 px-6 bg-white">
              <button
                onClick={() => setActiveTab('overview')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
                  activeTab === 'overview'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Ringkasan Finansial
              </button>
              <button
                onClick={() => setActiveTab('members')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
                  activeTab === 'members'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Anggota & Hak Akses ({activeTeam.members.length})
              </button>
              <button
                onClick={() => setActiveTab('ledger')}
                className={`py-3 px-4 text-xs font-bold border-b-2 transition ${
                  activeTab === 'ledger'
                    ? 'border-orange-500 text-orange-600'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                Buku Besar / Ledger ({teamLedgers[activeTeam.id]?.length || 0})
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-6 flex-1">
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Financial Stats in Team */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Saldo Bersama</span>
                      <div className="text-base font-black text-slate-900 mt-1">
                        {formatRupiah(activeTeam.shared_balance)}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Budget Bulanan</span>
                      <div className="text-base font-black text-slate-900 mt-1">
                        {formatRupiah(activeTeam.monthly_budget)}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Realisasi Bulan Ini</span>
                      <div className="text-base font-black text-amber-600 mt-1">
                        {formatRupiah(activeTeam.spent_this_month)}
                      </div>
                    </div>
                    <div className="bg-slate-50 rounded-2xl p-3.5 border border-slate-100">
                      <span className="text-[11px] font-bold text-slate-400 uppercase">Sisa Kuota</span>
                      <div className="text-base font-black text-emerald-600 mt-1">
                        {formatRupiah(Math.max(0, activeTeam.monthly_budget - activeTeam.spent_this_month))}
                      </div>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-2">
                    <div className="flex justify-between items-center text-xs font-bold">
                      <span className="text-slate-700">Tingkat Penyerapan Anggaran Tim</span>
                      <span className={activeTeam.spent_this_month > activeTeam.monthly_budget ? 'text-rose-600' : 'text-slate-900'}>
                        {Math.round((activeTeam.spent_this_month / activeTeam.monthly_budget) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
                      <div
                        className="h-3 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.round((activeTeam.spent_this_month / activeTeam.monthly_budget) * 100))}%` }}
                      ></div>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Otorisasi pengeluaran di atas Rp 5.000.000 memerlukan persetujuan ganda dari Owner & Bendahara.
                    </p>
                  </div>

                  {/* Quick Telegram Bot Integration Notice */}
                  <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 flex items-center justify-between gap-3">
                    <div className="text-xs text-orange-950">
                      <p className="font-bold">Bot Grup Telegram Terhubung</p>
                      <p className="text-orange-900/80 mt-0.5">
                        Anggota tim dapat mengetik <code>/tim catat 50rb bensin</code> langsung di grup Telegram tim ini.
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 bg-orange-200 text-orange-900 rounded-lg shrink-0">
                      Bot Aktif
                    </span>
                  </div>
                </div>
              )}

              {activeTab === 'members' && (
                <div className="space-y-6">
                  {/* Member List */}
                  <div className="space-y-3">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Daftar Anggota & Pengaturan Peran
                    </h3>

                    <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl bg-white overflow-hidden">
                      {activeTeam.members.map((member) => (
                        <div key={member.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition">
                          <div className="flex items-center gap-3">
                            <img
                              src={member.avatar_url}
                              alt={member.name}
                              className="w-10 h-10 rounded-full object-cover border border-slate-200"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-xs text-slate-900">{member.name}</span>
                                {member.name.toLowerCase().includes(currentUser.toLowerCase()) && (
                                  <span className="text-[10px] bg-orange-100 text-orange-700 font-bold px-1.5 py-0.2 rounded">
                                    Anda
                                  </span>
                                )}
                              </div>
                              <span className="text-[11px] text-slate-400">{member.email}</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {/* Role Switcher Dropdown Simulation */}
                            <select
                              value={member.role}
                              onChange={(e) => handleRoleChange(member.id, e.target.value as any)}
                              className="text-xs font-bold px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-orange-500"
                            >
                              <option value="owner">👑 Owner</option>
                              <option value="treasurer">💼 Bendahara</option>
                              <option value="admin">🛡️ Admin</option>
                              <option value="member">👤 Anggota</option>
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Add Member Form */}
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Plus className="w-4 h-4 text-orange-500" />
                      Undang Rekan ke Tim {activeTeam.name}
                    </h3>

                    {inviteSuccess && (
                      <div className="p-2.5 bg-emerald-100 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
                        <CheckCircle className="w-4 h-4 text-emerald-600" />
                        <span>Undangan berhasil ditambahkan ke tim!</span>
                      </div>
                    )}

                    <form onSubmit={handleAddMember} className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <input
                        type="text"
                        placeholder="Nama Lengkap"
                        value={newMemberName}
                        onChange={(e) => setNewMemberName(e.target.value)}
                        required
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-orange-500"
                      />
                      <input
                        type="email"
                        placeholder="Email Rekan (Opsional)"
                        value={newMemberEmail}
                        onChange={(e) => setNewMemberEmail(e.target.value)}
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-orange-500"
                      />
                      <div className="flex gap-2">
                        <select
                          value={newMemberRole}
                          onChange={(e) => setNewMemberRole(e.target.value as any)}
                          className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                        >
                          <option value="member">Anggota</option>
                          <option value="treasurer">Bendahara</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button
                          type="submit"
                          className="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shadow-xs"
                        >
                          Undang
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}

              {activeTab === 'ledger' && (
                <div className="space-y-6">
                  {/* Quick Add Ledger Transaction Form */}
                  <form onSubmit={handleAddLedgerTx} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-orange-500" />
                      Catat Transaksi Buku Besar Tim
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <input
                        type="text"
                        placeholder="Deskripsi Transaksi"
                        value={newTxDesc}
                        onChange={(e) => setNewTxDesc(e.target.value)}
                        required
                        className="sm:col-span-2 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-orange-500"
                      />
                      <input
                        type="number"
                        placeholder="Nominal (Rp)"
                        value={newTxAmount}
                        onChange={(e) => setNewTxAmount(e.target.value)}
                        required
                        className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-orange-500"
                      />
                      <div className="flex gap-2">
                        <select
                          value={newTxType}
                          onChange={(e) => setNewTxType(e.target.value as any)}
                          className="px-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-orange-500"
                        >
                          <option value="expense">Pengeluaran</option>
                          <option value="income">Pemasukan</option>
                        </select>
                        <button
                          type="submit"
                          className="px-3 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl text-xs font-bold transition shadow-xs flex-1"
                        >
                          Catat
                        </button>
                      </div>
                    </div>
                  </form>

                  {/* Ledger Table */}
                  <div className="space-y-2">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      Riwayat Mutasi & Otorisasi Transaksi
                    </h3>

                    {(!teamLedgers[activeTeam.id] || teamLedgers[activeTeam.id].length === 0) ? (
                      <div className="p-8 text-center text-xs text-slate-500 bg-white border border-slate-200 rounded-2xl">
                        Belum ada mutasi transaksi untuk tim ini. Catat transaksi pertama di atas!
                      </div>
                    ) : (
                      <div className="border border-slate-200 rounded-2xl bg-white divide-y divide-slate-100 overflow-hidden">
                        {teamLedgers[activeTeam.id].map((item) => (
                          <div key={item.id} className="p-3.5 flex items-center justify-between gap-3 hover:bg-slate-50 transition">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                                item.type === 'income' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                              }`}>
                                {item.type === 'income' ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-slate-900">{item.description}</p>
                                <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                                  <span>{item.date}</span>
                                  <span>•</span>
                                  <span>Oleh: <b className="text-slate-600">{item.logged_by}</b></span>
                                  <span>•</span>
                                  <span className="bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded text-[10px]">{item.category}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-right">
                              <div className={`text-xs font-black ${item.type === 'income' ? 'text-emerald-600' : 'text-slate-900'}`}>
                                {item.type === 'income' ? '+' : '-'}{formatRupiah(item.amount)}
                              </div>
                              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.2 rounded mt-0.5 inline-block">
                                Disetujui
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Workspace ID: <code className="font-mono text-[11px]">{activeTeam.id}</code>
              </span>
              <button
                onClick={() => setActiveTeam(null)}
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition"
              >
                Tutup Jendela
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
