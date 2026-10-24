-- ==============================================================================
-- TATADANA DATABASE SCHEMA
-- Migration: 20261010000001_initial_schema.sql
-- All timestamps are handled with timezone Asia/Jakarta (WIB)
-- Includes all 12 core tables + supporting tables & compatibility views
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ------------------------------------------------------------------------------
-- 1. Profiles Table (linked to Supabase Auth & phone verification)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL DEFAULT '',
    phone_number TEXT UNIQUE,
    phone_verified BOOLEAN NOT NULL DEFAULT FALSE,
    avatar_url TEXT,
    default_currency TEXT NOT NULL DEFAULT 'IDR',
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'superadmin')),
    telegram_chat_id BIGINT UNIQUE,
    telegram_username TEXT,
    subscription_tier TEXT NOT NULL DEFAULT 'starter' CHECK (subscription_tier IN ('starter', 'pro')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')
);

CREATE INDEX IF NOT EXISTS idx_profiles_telegram_chat_id ON public.profiles(telegram_chat_id);
CREATE INDEX IF NOT EXISTS idx_profiles_phone ON public.profiles(phone_number);

-- ------------------------------------------------------------------------------
-- 2. Wallets Table (Multi-wallet with 1 default for Telegram bot)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.wallets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    type TEXT NOT NULL DEFAULT 'bank' CHECK (type IN ('bank', 'ewallet', 'cash', 'other')),
    balance NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    color TEXT NOT NULL DEFAULT '#F97316',
    created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')
);

-- Unique index to ensure only 1 default wallet per user
CREATE UNIQUE INDEX IF NOT EXISTS unique_user_default_wallet 
ON public.wallets (user_id) 
WHERE (is_default = TRUE);

CREATE INDEX IF NOT EXISTS idx_wallets_user_id ON public.wallets(user_id);

-- ------------------------------------------------------------------------------
-- 3. Categories Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    emoji TEXT NOT NULL DEFAULT '💰',
    type TEXT NOT NULL CHECK (type IN ('income', 'expense')),
    color TEXT NOT NULL DEFAULT '#F97316',
    monthly_budget NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')
);

CREATE INDEX IF NOT EXISTS idx_categories_user_id ON public.categories(user_id);
CREATE INDEX IF NOT EXISTS idx_categories_type ON public.categories(type);

-- ------------------------------------------------------------------------------
-- 4. Budgets Table (Dedicated Budget Tracking with Alert Thresholds)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.budgets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    category_id UUID NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
    amount NUMERIC(15, 2) NOT NULL CHECK (amount >= 0),
    period TEXT NOT NULL DEFAULT 'monthly',
    alert_threshold_percent INT NOT NULL DEFAULT 80 CHECK (alert_threshold_percent BETWEEN 1 AND 100),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta'),
    CONSTRAINT unique_user_category_budget_period UNIQUE (user_id, category_id, period)
);

CREATE INDEX IF NOT EXISTS idx_budgets_user_id ON public.budgets(user_id);
CREATE INDEX IF NOT EXISTS idx_budgets_category_id ON public.budgets(category_id);

-- ------------------------------------------------------------------------------
-- 5. Transactions Table
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    wallet_id UUID NOT NULL REFERENCES public.wallets(id) ON DELETE RESTRICT,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    destination_wallet_id UUID REFERENCES public.wallets(id) ON DELETE RESTRICT,
    type TEXT NOT NULL CHECK (type IN ('income', 'expense', 'transfer')),
    amount NUMERIC(15, 2) NOT NULL CHECK (amount > 0),
    description TEXT NOT NULL DEFAULT '',
    source TEXT NOT NULL DEFAULT 'web_manual' CHECK (source IN ('telegram_text', 'telegram_voice', 'telegram_receipt', 'web_manual')),
    receipt_data JSONB DEFAULT NULL,
    transaction_time TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta'),
    created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_time ON public.transactions(user_id, transaction_time DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON public.transactions(category_id);
CREATE INDEX IF NOT EXISTS idx_transactions_wallet ON public.transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_transactions_dest_wallet ON public.transactions(destination_wallet_id);

-- ------------------------------------------------------------------------------
-- 6. Transaction Items Table (Itemized breakdown for OCR/Receipt purchases)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transaction_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL DEFAULT 1 CHECK (quantity > 0),
    price NUMERIC(15, 2) NOT NULL CHECK (price >= 0),
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')
);

CREATE INDEX IF NOT EXISTS idx_transaction_items_transaction_id ON public.transaction_items(transaction_id);

-- ------------------------------------------------------------------------------
-- 7. Bot Connections Table (User-connected bots / shared bot mapping)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.bot_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    bot_token TEXT NOT NULL UNIQUE,
    bot_username TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    webhook_url TEXT,
    webhook_status TEXT NOT NULL DEFAULT 'disconnected' CHECK (webhook_status IN ('connected', 'disconnected', 'testing', 'error')),
    last_tested_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')
);

CREATE INDEX IF NOT EXISTS idx_bot_connections_user_id ON public.bot_connections(user_id);
CREATE INDEX IF NOT EXISTS idx_bot_connections_token ON public.bot_connections(bot_token);

-- Backward-compatible view for telegram_bots
CREATE OR REPLACE VIEW public.telegram_bots AS 
SELECT * FROM public.bot_connections;

-- ------------------------------------------------------------------------------
-- 8. Telegram Updates Table (Strict Idempotency Table)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.telegram_updates (
    update_id BIGINT PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    chat_id BIGINT NOT NULL,
    message_text TEXT,
    message_type TEXT NOT NULL CHECK (message_type IN ('text', 'photo', 'voice', 'audio', 'command')),
    status TEXT NOT NULL DEFAULT 'processed' CHECK (status IN ('processed', 'failed', 'skipped_duplicate')),
    error_message TEXT,
    processed_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')
);

CREATE INDEX IF NOT EXISTS idx_telegram_updates_chat_id ON public.telegram_updates(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_updates_status ON public.telegram_updates(status);

-- ------------------------------------------------------------------------------
-- 9. Reminders Table (Daily reminder settings, max 2x/day)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.reminders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    is_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    frequency INT NOT NULL DEFAULT 1 CHECK (frequency IN (1, 2)),
    time_1 TIME NOT NULL DEFAULT '12:00:00',
    time_2 TIME DEFAULT '20:00:00',
    preview_message TEXT NOT NULL DEFAULT '⏰ Reminder Keuangan! Jangan lupa catat pengeluaran hari ini ya 📝',
    created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')
);

CREATE INDEX IF NOT EXISTS idx_reminders_user_id ON public.reminders(user_id);

-- ------------------------------------------------------------------------------
-- 10. Order Payments Table (Subscriptions, Midtrans & Manual transfer)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.order_payments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    plan TEXT NOT NULL DEFAULT 'starter' CHECK (plan IN ('starter', 'pro')),
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_approval', 'expired', 'rejected')),
    payment_method TEXT NOT NULL CHECK (payment_method IN ('midtrans', 'manual_transfer', 'free')),
    midtrans_order_id TEXT UNIQUE,
    midtrans_transaction_id TEXT,
    amount NUMERIC(15, 2) NOT NULL DEFAULT 0.00,
    approved_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    proof_image_url TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')
);

CREATE INDEX IF NOT EXISTS idx_order_payments_user_id ON public.order_payments(user_id);
CREATE INDEX IF NOT EXISTS idx_order_payments_midtrans_order ON public.order_payments(midtrans_order_id);

-- Backward-compatible view for subscriptions
CREATE OR REPLACE VIEW public.subscriptions AS 
SELECT * FROM public.order_payments;

-- ------------------------------------------------------------------------------
-- 11. AI Providers Table (Dynamic Multi-provider management in Admin Dashboard)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    provider TEXT NOT NULL UNIQUE CHECK (provider IN ('gemini', 'openai', 'deepseek')),
    display_name TEXT NOT NULL,
    model_name TEXT NOT NULL,
    api_key_encrypted TEXT NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    priority INT NOT NULL DEFAULT 1,
    mode TEXT NOT NULL DEFAULT 'single' CHECK (mode IN ('single', 'failover', 'parallel')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta'),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')
);

CREATE INDEX IF NOT EXISTS idx_ai_providers_provider ON public.ai_providers(provider);

-- Backward-compatible view for ai_configs
CREATE OR REPLACE VIEW public.ai_configs AS 
SELECT * FROM public.ai_providers;

-- ------------------------------------------------------------------------------
-- 12. Audit Logs Table (Admin viewing user transactions and system audits)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    target_user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_admin_id ON public.audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_target_user ON public.audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- ------------------------------------------------------------------------------
-- 13. Supporting: Export History Table (PDF & Excel generation records)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.export_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_type TEXT NOT NULL CHECK (file_type IN ('pdf', 'excel')),
    period_start DATE NOT NULL,
    period_end DATE NOT NULL,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    download_url TEXT,
    file_size_kb NUMERIC(10, 2) NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')
);

CREATE INDEX IF NOT EXISTS idx_export_history_user_id ON public.export_history(user_id);

-- ------------------------------------------------------------------------------
-- 14. Supporting: AI Logs Table (Monitoring cost, latency, provider usage)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    provider TEXT NOT NULL,
    feature TEXT NOT NULL CHECK (feature IN ('nlp_parser', 'voice_stt', 'receipt_ocr', 'advisor', 'onboarding_category')),
    prompt_summary TEXT,
    response_status TEXT NOT NULL CHECK (response_status IN ('success', 'failed')),
    latency_ms INT NOT NULL DEFAULT 0,
    tokens_used INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT (now() AT TIME ZONE 'Asia/Jakarta')
);

CREATE INDEX IF NOT EXISTS idx_ai_logs_user_id ON public.ai_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_logs_created_at ON public.ai_logs(created_at DESC);
