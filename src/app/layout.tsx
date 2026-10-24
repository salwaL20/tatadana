import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TataDana — Catat Keuangan Semudah Chat dari Telegram Kamu',
  description: 'Aplikasi manajemen keuangan pribadi SaaS Fintech Indonesia yang terintegrasi langsung dengan Telegram Bot, AI multi-modal, dan Supabase.',
  keywords: ['keuangan', 'fintech', 'catat pengeluaran', 'telegram bot', 'tatadana', 'ai finance'],
  authors: [{ name: 'TataDana Inc.' }],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased selection:bg-orange-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
