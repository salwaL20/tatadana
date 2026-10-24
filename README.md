# TataDana — Fintech SaaS Manajemen Keuangan Terintegrasi Telegram Bot

> **Tagline**: Catat keuangan semudah chat — langsung dari Telegram kamu.  
> **Brand Aesthetic**: Orange-White (#F97316) Modern Fintech Clean Interface.  
> **Timezone**: 100% Asia/Jakarta (WIB, UTC+7).

---

## 🌟 Spesifikasi & Cakupan Fitur (Part 1 — Part 11)

### Part 1: Skema Database Postgres & RLS (Supabase)
- 12 Tabel Postgres relasional lengkap: `profiles`, `wallets`, `categories`, `budgets`, `transactions`, `transaction_items`, `bot_connections`, `telegram_updates`, `reminders`, `order_payments`, `ai_providers`, `audit_logs`.
- Row Level Security (RLS) diaktifkan pada semua tabel dengan helper function `is_superadmin()`.
- Trigger otomatis sinkronisasi mutasi saldo dompet (`handle_transaction_balance_change`) saat transaksi di-`INSERT`, `UPDATE`, atau `DELETE`.
- Trigger otomatis inisialisasi profil pengguna baru, dompet utama default, 9 kategori default, dan reminder harian via auth hook (`handle_new_user`).

### Part 2: Mesin Telegram Bot Multi-Tenant & Webhook Idempoten
- Multi-tenant bot berbagi: 1 bot Telegram melayani banyak pengguna via pemetaan nomor HP atau chat ID terverifikasi.
- Strict Idempotency pada webhook (`/api/telegram/webhook`) berbasis `update_id` Telegram mencegah duplikasi saldo saat retry network.
- Parser bahasa natural nominal slang Indonesia: `15rb`, `1.5jt`, `1,25jt`, `500k`, `50.000`, `7.500.000`, `setengah juta`.
- Voice Note STT (speech-to-text hingga 60 detik) dengan validasi durasi dan konversi ke transaksi.
- Foto Struk Belanja OCR (Paket Pro) mengekstrak merchant, unit item belanja, kuantitas, subtotal, dan total belanja.

### Part 3: Verifikasi Bot Connection & Enkripsi AES-256 GCM
- Enkripsi token bot simetris AES-256-GCM dengan Initialization Vector (IV) dan Authentication Tag di `src/lib/utils/encryption.ts`.
- Validasi keunikan token bot di seluruh pengguna (1 token = 1 bot terhubung).
- Pipeline otomatis `getMe` dan `setWebhook` saat pengguna menghubungkan bot di menu Pengaturan.

### Part 4: Format Visual Telegram & AI Financial Advisor
- Format balasan Rupiah rapi standar Indonesia dengan header waktu Waktu Indonesia Barat (`Asia/Jakarta`).
- Progress bar visual ASCII budget bulanan (`██████░░░░ 60% — sisa Rp400.000`).
- Pro AI Financial Advisor triggers:
  1. Pembelian tunggal > 20% budget kategori sekaligus.
  2. Kenaikan pengeluaran kategori > 50% dibanding minggu sebelumnya.
  3. Total pengeluaran > 80% dari total pemasukan bulan berjalan.
  4. Pengeluaran kategori mencapai >= 80% dari pagu budget.

### Part 5: Web Application Dashboard & Transaksi
- 4 Kartu Statistik Ringkasan: Saldo Total, Pemasukan Bulan Ini, Pengeluaran Bulan Ini, Sisa Budget Aktif.
- Visualisasi Grafik Arus Kas 6 Bulan (Bar Chart) dan Breakdown Pengeluaran Kategori (Donut Chart).
- Pencatatan transaksi lengkap (Pemasukan, Pengeluaran, Transfer Antar Wallet) dan accordion rincian item struk belanja OCR.

### Part 6: Multi-Wallet & Target Budget
- Multi-wallet: rekening bank (BCA, Mandiri), e-wallet (GoPay, OVO), dan uang tunai fisik.
- Proteksi indeks unik: hanya 1 wallet berstatus default sebagai dompet penampung bot Telegram.
- Pengaturan target budget per kategori dengan alert threshold 80% dan 100%.

### Part 7: Landing Page Fintech Modern (#F97316)
- 15 Section interaktif: Navigation, Hero dengan Live Preview, Stats Counter, Problem vs Solution, Core Features, Interactive Simulator, How It Works, OCR Showcase, Multi-Wallet, Budgeting, Testimonials, Pricing, FAQ, CTA Banner, Footer.
- Simulator Interaktif Web & Chat Preview Telegram langsung di browser tanpa login.

### Part 8: Split-Layout Authentication & Onboarding
- Split-screen autentikasi bertema orange-putih modern dengan value proposition di sisi kiri.
- Email/Password login, registrasi, Google OAuth, dan verifikasi No HP WhatsApp via OTP 6-digit (`/api/auth/otp-verify`).
- Onboarding AI untuk personalisasi profil finansial dan saran kategori otomatis.

### Part 9: Laporan Native & On-Demand PDF / Excel Exporter
- Modul laporan native dengan pencarian teks, rentang tanggal custom WIB, filter dompet & jenis transaksi, serta paginasi.
- On-demand PDF Export Generator: dokumen resmi HTML/PDF dengan kop resmi TataDana, ringkasan arus kas, dan rincian item struk belanja.
- On-demand Excel/CSV Export Generator: ekspor 10 kolom standar keuangan dengan proteksi escape cell formula injection.
- Integrasi Supabase Storage bucket `laporan-exports` dengan signed download URL.

### Part 10: Multi-Provider AI Router (Gemini, OpenAI, DeepSeek)
- Dynamic router multi-AI: Google Gemini 1.5 Flash, OpenAI GPT-4o-mini, dan DeepSeek Chat V3.
- Mode orkestrasi dinamis: `Single` (provider utama), `Failover` (fallback otomatis berurutan), dan `Parallel` (eksekusi paralel dan memilih respons tercepat).
- Telemetri menyeluruh: pencatatan latensi (ms), token usage, status keberhasilan, dan ringkasan audit log.

### Part 11: Superadmin Console & Midtrans Payment Gateway
- Superadmin dashboard dengan ringkasan telemetri AI, total pengguna, dan volume transaksi.
- 1-Klik Mode Impersonasi: Superadmin dapat melihat dashboard sebagai pengguna tertentu untuk bantuan teknis.
- Audit Log privasi kepatuhan: pencatatan setiap aksi inspeksi data pengguna oleh admin dengan IP address dan timestamp WIB.
- Manajemen pembayaran: pelacakan status pesanan Midtrans (Settlement, Pending, Expire) dan persetujuan/penolakan manual bukti transfer dengan audit trail.

---

## 🏗️ Struktur Arsitektur & Direktori

```
tatadana/
├── supabase/
│   └── migrations/
│       ├── 20261010000001_initial_schema.sql  # 12 Tabel Postgres & Index
│       ├── 20261010000002_rls_policies.sql    # Row Level Security & Triggers
│       └── 20261010000003_seed_data.sql       # AI config & Storage buckets
├── src/
│   ├── app/
│   │   ├── page.tsx                           # 15-Section Landing Page + Simulator
│   │   ├── (auth)/                            # Login, Register, Onboarding AI
│   │   ├── (dashboard)/                       # Beranda, Transaksi, Laporan, Budget, Wallet, Settings
│   │   ├── admin/                             # Superadmin Console & Impersonation
│   │   └── api/
│   │       ├── telegram/webhook/              # Strict Idempotent Webhook
│   │       ├── telegram/test-connection/      # Token Verification & setWebhook
│   │       ├── reports/export-pdf/            # On-demand PDF Generator
│   │       ├── reports/export-excel/          # On-demand Excel (.xlsx) Generator
│   │       ├── auth/otp-verify/               # Phone WhatsApp OTP Verification
│   │       └── test/run/                      # Comprehensive Test Suite Endpoint
│   ├── lib/
│   │   ├── telegram/                          # Parser, Formatter ASCII, Commands, BotClient
│   │   ├── ai/                                # Multi-provider AI router (Gemini/OpenAI/DeepSeek)
│   │   ├── supabase/                          # Database Client & Local Store Fallback
│   │   └── utils/                             # Timezone WIB, Currency & Encryption Helpers
│   └── test/                                  # 8 Automated Test Suites (186 tests)
```

---

## 🧪 Verifikasi & Pengujian Otomatis

Jalankan test suite menggunakan:
```powershell
npm.cmd test
```
Atau akses endpoint API:
- `GET /api/test/run` — Mengembalikan hasil JSON seluruh 8 test suites.

### Rincian 8 Test Suites (186 Pengujian — 100% Lulus):
1. **Telegram Natural Language & Nominal Parser** (44 tests) — Format nominal Indonesia (`15rb`, `1.5jt`, `1,25jt`, `500k`, `50.000`, `7.500.000`, kata bilangan) dan klasifikasi kategori transaksi.
2. **Telegram Webhook Idempotency & HTTP Handler** (8 tests) — Deduplikasi `update_id`, proteksi retry Telegram, pencegahan mutasi saldo ganda, dan validasi status 400.
3. **Asia/Jakarta Timezone (WIB) Accuracy** (10 tests) — Konversi UTC ke WIB (UTC+7), format tanggal Indonesia, format jam, dan konsistensi offset tanpa drift.
4. **Subscription Plan Restrictions & Midtrans** (38 tests) — Quota limit 50 transaksi Starter, fitur Pro (OCR & Advisor), approval & rejection Midtrans order, Multi-AI Single/Failover/Parallel modes, dan telemetri latensi/token.
5. **In-App Laporan & Export Generation** (9 tests) — Format HTML/PDF resmi TataDana, rincian item struk belanja, dan 10-kolom CSV/Excel dengan escaping formula injection.
6. **Telegram Phone Linking & AI Advisor Triggers** (9 tests) — Normalisasi nomor HP Indonesia, deep-link `/start link_...`, dan 4 trigger AI Financial Advisor Pro.
7. **Telegram Bot Connection & Token Encryption** (13 tests) — Format token bot, validasi token unik, simulasi `getMe`/`setWebhook`/`sendMessage`, AES-256 GCM authenticated encryption/decryption, dan masking token UI.
8. **Supabase Database Migrations & Schema Integrity** (55 tests) — 12 tabel Postgres, constraint unik, index komposit, trigger mutasi saldo dompet otomatis, trigger profil baru, RLS policies, dan validasi sintaks SQL.
