'use client';

import React, { useState, useEffect } from 'react';
import { Palette, Check, Sparkles } from 'lucide-react';

export type AppTheme = 'blue-dark' | 'orange' | 'blue-light';

export default function ThemeSwitcher({ className = '' }: { className?: string }) {
  const [theme, setTheme] = useState<AppTheme>('blue-dark');
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = (localStorage.getItem('tatadana_theme') as AppTheme) || 'blue-dark';
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);

      const handleThemeEvent = (e: any) => {
        const nextTheme = e?.detail?.theme || localStorage.getItem('tatadana_theme') || 'blue-dark';
        setTheme(nextTheme);
        document.documentElement.setAttribute('data-theme', nextTheme);
      };

      window.addEventListener('tatadana_theme_changed', handleThemeEvent);
      return () => window.removeEventListener('tatadana_theme_changed', handleThemeEvent);
    }
  }, []);

  const changeTheme = (newTheme: AppTheme) => {
    setTheme(newTheme);
    if (typeof window !== 'undefined') {
      localStorage.setItem('tatadana_theme', newTheme);
      document.documentElement.setAttribute('data-theme', newTheme);
      window.dispatchEvent(new CustomEvent('tatadana_theme_changed', { detail: { theme: newTheme } }));
    }
    setIsOpen(false);
  };

  const themeOptions: { id: AppTheme; label: string; badge: string; color: string; desc: string }[] = [
    {
      id: 'blue-dark',
      label: 'Biru & Hitam',
      badge: 'Cyber Fintech',
      color: 'bg-blue-600',
      desc: 'Modern blue glow & dark theme elegan',
    },
    {
      id: 'orange',
      label: 'Oranye & Putih',
      badge: 'Klasik Fintech',
      color: 'bg-orange-500',
      desc: 'Warna oranye hangat & putih bersih',
    },
    {
      id: 'blue-light',
      label: 'Biru & Putih',
      badge: 'Light Modern',
      color: 'bg-sky-500',
      desc: 'Biru profesional & background terang',
    },
  ];

  const currentOption = themeOptions.find(t => t.id === theme) || themeOptions[0];

  return (
    <div className={`relative inline-block text-left ${className}`}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border border-slate-200/80 bg-white/80 dark:bg-slate-900/80 text-slate-800 dark:text-slate-100 hover:border-blue-500/50 hover:bg-slate-50 transition text-xs font-semibold shadow-xs"
        title="Ganti Tema Tampilan (Biru & Hitam / Oranye)"
      >
        <span className={`w-2.5 h-2.5 rounded-full ${currentOption.color} shrink-0 animate-pulse`} />
        <Palette className="w-3.5 h-3.5 text-slate-500" />
        <span className="hidden sm:inline font-bold">{currentOption.label}</span>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute right-0 mt-2 w-64 rounded-2xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 p-2 z-50 animate-in fade-in zoom-in-95">
            <div className="px-2 py-1.5 border-b border-slate-100 dark:border-slate-800 mb-1 flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-blue-500" />
                Pilih Tema Visual
              </span>
              <span className="text-[10px] text-slate-400">Instan</span>
            </div>

            <div className="space-y-1">
              {themeOptions.map((opt) => {
                const isSelected = theme === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => changeTheme(opt.id)}
                    className={`w-full p-2 rounded-xl text-left transition flex items-center justify-between text-xs ${
                      isSelected
                        ? 'bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/80 text-blue-700 dark:text-blue-300 font-bold'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-800/60 text-slate-700 dark:text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${opt.color} shrink-0 shadow-xs`} />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span>{opt.label}</span>
                          <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 font-medium">
                            {opt.badge}
                          </span>
                        </div>
                        <div className="text-[10px] text-slate-400 font-normal">{opt.desc}</div>
                      </div>
                    </div>
                    {isSelected && <Check className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 ml-1" />}
                  </button>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
