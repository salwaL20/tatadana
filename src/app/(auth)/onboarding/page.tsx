'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Sparkles, Check, ArrowRight, Wallet, Tag, Loader2 } from 'lucide-react';
import { aiService } from '@/lib/ai/multiProvider';
import { formatRupiah } from '@/lib/utils/currency';

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2>(1);
  const [profession, setProfession] = useState('karyawan');
  const [primaryWalletName, setPrimaryWalletName] = useState('BCA Tahapan');
  const [initialBalance, setInitialBalance] = useState('5000000');
  const [isGenerating, setIsGenerating] = useState(false);
  const [recommendedCategories, setRecommendedCategories] = useState<any[]>([]);

  const handleGenerateCategories = async () => {
    setIsGenerating(true);
    // Call AI service for personalized onboarding categories
    const categories = await aiService.execute({
      feature: 'onboarding_category',
      prompt: `Profesi: ${profession}, Wallet: ${primaryWalletName}`,
    });

    setRecommendedCategories(categories);
    setIsGenerating(false);
    setStep(2);
  };

  const handleFinishOnboarding = async () => {
    setIsGenerating(true);
    const { dataService } = await import('@/lib/supabase/client');

    // Create default wallet
    await dataService.addWallet({
      user_id: 'usr-budi-12345',
      name: primaryWalletName,
      type: 'bank',
      balance: parseFloat(initialBalance) || 0,
      is_default: true,
      color: '#3B82F6',
    });

    // Seed AI categories
    for (const cat of recommendedCategories) {
      await dataService.addCategory({
        user_id: 'usr-budi-12345',
        name: cat.name,
        emoji: cat.emoji,
        type: cat.type,
        color: cat.color,
        monthly_budget: cat.budget,
      });
    }

    router.push('/dashboard');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="bg-white border border-slate-200 rounded-3xl shadow-xl max-w-xl w-full p-6 sm:p-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-orange-50 border border-orange-200 text-orange-600 flex items-center justify-center mx-auto shadow-sm">
            <Sparkles className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Personalisasi Akun TataDana</h1>
          <p className="text-xs text-slate-500">
            {step === 1 ? 'Ceritakan sedikit profil keuanganmu agar AI menyiapkan kategori yang sesuai.' : 'AI telah menyiapkan kategori anggaran khusus untukmu!'}
          </p>
        </div>

        {/* STEP 1: Pertanyaan Profil */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Status atau Profesi Saat Ini</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'karyawan', label: '💼 Karyawan' },
                  { id: 'freelancer', label: '💻 Freelancer' },
                  { id: 'mahasiswa', label: '🎓 Mahasiswa' },
                ].map(p => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setProfession(p.id)}
                    className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition ${
                      profession === p.id
                        ? 'border-orange-500 bg-orange-50 text-orange-600 shadow-sm'
                        : 'border-slate-200 bg-white text-slate-600'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Nama Dompet Utama (Default Telegram)</label>
              <input
                type="text"
                placeholder="Contoh: BCA Tahapan, Mandiri, GoPay"
                value={primaryWalletName}
                onChange={(e) => setPrimaryWalletName(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Saldo Awal Dompet (Rp)</label>
              <input
                type="number"
                placeholder="Contoh: 5000000"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-orange-500"
              />
            </div>

            <button
              onClick={handleGenerateCategories}
              disabled={isGenerating}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>AI Sedang Meracik Kategori...</span>
                </>
              ) : (
                <>
                  <span>Lanjut & Buat Rekomendasi Kategori AI</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}

        {/* STEP 2: Hasil Kategori AI */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="text-xs font-bold text-slate-700">Kategori Anggaran Rekomendasi AI:</div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto pr-1">
                {recommendedCategories.map((c, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{c.emoji}</span>
                      <div>
                        <div className="font-bold text-slate-800">{c.name}</div>
                        <div className="text-[10px] text-slate-400 capitalize">{c.type}</div>
                      </div>
                    </div>
                    {c.budget > 0 && (
                      <span className="font-bold text-orange-600">{formatRupiah(c.budget)}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-800 flex items-center gap-2">
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Dompet <b>{primaryWalletName}</b> ({formatRupiah(parseFloat(initialBalance) || 0)}) siap digunakan!</span>
            </div>

            <button
              onClick={handleFinishOnboarding}
              disabled={isGenerating}
              className="w-full py-3 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center gap-2"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyiapkan Dashboard...</span>
                </>
              ) : (
                <>
                  <span>Buka Dashboard TataDana Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
