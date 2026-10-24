-- ==============================================================================
-- TATADANA ROW LEVEL SECURITY (RLS), POLICIES, & AUTOMATED TRIGGERS
-- Migration: 20261010000002_rls_policies.sql
-- All timestamps are handled with timezone Asia/Jakarta (WIB)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Enable RLS on all 12 core tables and supporting tables
-- ------------------------------------------------------------------------------
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bot_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.telegram_updates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reminders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.export_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_logs ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 2. Helper Functions
-- ------------------------------------------------------------------------------

-- Helper: Check if current user has superadmin role
CREATE OR REPLACE FUNCTION public.is_superadmin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'superadmin'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Helper: Update updated_at timestamp in Asia/Jakarta timezone
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = (now() AT TIME ZONE 'Asia/Jakarta');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------------------------
-- 3. Row Level Security Policies
-- ------------------------------------------------------------------------------

-- 3.1 Profiles
CREATE POLICY "Users can view own profile or admin"
ON public.profiles FOR SELECT
USING (auth.uid() = id OR public.is_superadmin());

CREATE POLICY "Users can update own profile or admin"
ON public.profiles FOR UPDATE
USING (auth.uid() = id OR public.is_superadmin());

CREATE POLICY "Users can insert own profile or admin"
ON public.profiles FOR INSERT
WITH CHECK (auth.uid() = id OR public.is_superadmin());

CREATE POLICY "Superadmin can delete profile"
ON public.profiles FOR DELETE
USING (public.is_superadmin());

-- 3.2 Wallets
CREATE POLICY "Users can manage own wallets"
ON public.wallets FOR ALL
USING (auth.uid() = user_id OR public.is_superadmin())
WITH CHECK (auth.uid() = user_id OR public.is_superadmin());

-- 3.3 Categories
CREATE POLICY "Users can manage own categories"
ON public.categories FOR ALL
USING (auth.uid() = user_id OR public.is_superadmin())
WITH CHECK (auth.uid() = user_id OR public.is_superadmin());

-- 3.4 Budgets
CREATE POLICY "Users can manage own budgets"
ON public.budgets FOR ALL
USING (auth.uid() = user_id OR public.is_superadmin())
WITH CHECK (auth.uid() = user_id OR public.is_superadmin());

-- 3.5 Transactions
CREATE POLICY "Users can manage own transactions"
ON public.transactions FOR ALL
USING (auth.uid() = user_id OR public.is_superadmin())
WITH CHECK (auth.uid() = user_id OR public.is_superadmin());

-- 3.6 Transaction Items
CREATE POLICY "Users can manage items of own transactions"
ON public.transaction_items FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.transactions t 
        WHERE t.id = transaction_items.transaction_id 
          AND (t.user_id = auth.uid() OR public.is_superadmin())
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.transactions t 
        WHERE t.id = transaction_items.transaction_id 
          AND (t.user_id = auth.uid() OR public.is_superadmin())
    )
);

-- 3.7 Bot Connections
CREATE POLICY "Users can manage own bot connection"
ON public.bot_connections FOR ALL
USING (auth.uid() = user_id OR public.is_superadmin())
WITH CHECK (auth.uid() = user_id OR public.is_superadmin());

-- 3.8 Telegram Updates
CREATE POLICY "Users and service can access updates"
ON public.telegram_updates FOR ALL
USING (auth.uid() = user_id OR public.is_superadmin() OR user_id IS NULL)
WITH CHECK (auth.uid() = user_id OR public.is_superadmin() OR user_id IS NULL);

-- 3.9 Reminders
CREATE POLICY "Users can manage own reminders"
ON public.reminders FOR ALL
USING (auth.uid() = user_id OR public.is_superadmin())
WITH CHECK (auth.uid() = user_id OR public.is_superadmin());

-- 3.10 Order Payments (Subscriptions)
CREATE POLICY "Users can view own order payments"
ON public.order_payments FOR SELECT
USING (auth.uid() = user_id OR public.is_superadmin());

CREATE POLICY "Users can create own order payment"
ON public.order_payments FOR INSERT
WITH CHECK (auth.uid() = user_id OR public.is_superadmin());

CREATE POLICY "Superadmin can manage order payments"
ON public.order_payments FOR ALL
USING (public.is_superadmin())
WITH CHECK (public.is_superadmin());

-- 3.11 AI Providers
CREATE POLICY "Authenticated users can view active AI providers"
ON public.ai_providers FOR SELECT
USING (is_active = TRUE OR public.is_superadmin());

CREATE POLICY "Superadmin can manage AI providers"
ON public.ai_providers FOR ALL
USING (public.is_superadmin())
WITH CHECK (public.is_superadmin());

-- 3.12 Audit Logs
CREATE POLICY "Superadmin can manage audit logs"
ON public.audit_logs FOR ALL
USING (public.is_superadmin())
WITH CHECK (public.is_superadmin());

-- 3.13 Export History
CREATE POLICY "Users can manage own export history"
ON public.export_history FOR ALL
USING (auth.uid() = user_id OR public.is_superadmin())
WITH CHECK (auth.uid() = user_id OR public.is_superadmin());

-- 3.14 AI Logs
CREATE POLICY "Users can read own AI logs, superadmin read all"
ON public.ai_logs FOR SELECT
USING (auth.uid() = user_id OR public.is_superadmin());

CREATE POLICY "Superadmin can manage AI logs"
ON public.ai_logs FOR ALL
USING (public.is_superadmin())
WITH CHECK (public.is_superadmin());

-- ------------------------------------------------------------------------------
-- 4. Automated Triggers: updated_at Maintenance
-- ------------------------------------------------------------------------------
CREATE OR REPLACE TRIGGER trg_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_wallets_updated_at
BEFORE UPDATE ON public.wallets
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_categories_updated_at
BEFORE UPDATE ON public.categories
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_budgets_updated_at
BEFORE UPDATE ON public.budgets
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_bot_connections_updated_at
BEFORE UPDATE ON public.bot_connections
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_reminders_updated_at
BEFORE UPDATE ON public.reminders
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_order_payments_updated_at
BEFORE UPDATE ON public.order_payments
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE OR REPLACE TRIGGER trg_ai_providers_updated_at
BEFORE UPDATE ON public.ai_providers
FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ------------------------------------------------------------------------------
-- 5. User Creation Hook: Synchronize Profile, Default Wallet, Categories, Reminders
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    new_wallet_id UUID;
BEGIN
    -- 1. Insert Profile
    INSERT INTO public.profiles (
        id, 
        full_name, 
        role, 
        subscription_tier, 
        default_currency,
        created_at, 
        updated_at
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
        'user',
        'starter',
        'IDR',
        (now() AT TIME ZONE 'Asia/Jakarta'),
        (now() AT TIME ZONE 'Asia/Jakarta')
    )
    ON CONFLICT (id) DO NOTHING;

    -- 2. Create Default Wallet
    INSERT INTO public.wallets (
        user_id,
        name,
        type,
        balance,
        is_default,
        color,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        'Dompet Utama',
        'bank',
        0.00,
        TRUE,
        '#F97316',
        (now() AT TIME ZONE 'Asia/Jakarta'),
        (now() AT TIME ZONE 'Asia/Jakarta')
    )
    RETURNING id INTO new_wallet_id;

    -- 3. Create Default Indonesian Categories
    INSERT INTO public.categories (user_id, name, emoji, type, color, monthly_budget)
    VALUES
        (NEW.id, 'Makanan & Minuman', '🍜', 'expense', '#EF4444', 1500000.00),
        (NEW.id, 'Transportasi', '🚗', 'expense', '#F59E0B', 500000.00),
        (NEW.id, 'Belanja', '🛍️', 'expense', '#3B82F6', 750000.00),
        (NEW.id, 'Tagihan & Utilitas', '💡', 'expense', '#8B5CF6', 600000.00),
        (NEW.id, 'Hiburan', '🎬', 'expense', '#EC4899', 300000.00),
        (NEW.id, 'Kesehatan', '💊', 'expense', '#10B981', 200000.00),
        (NEW.id, 'Gaji & Pendapatan', '💼', 'income', '#10B981', 0.00),
        (NEW.id, 'Freelance / Bisnis', '💻', 'income', '#06B6D4', 0.00),
        (NEW.id, 'Investasi & Bonus', '📈', 'income', '#6366F1', 0.00);

    -- 4. Create Default Reminder
    INSERT INTO public.reminders (user_id, is_enabled, frequency, time_1, time_2, preview_message)
    VALUES (
        NEW.id, 
        TRUE, 
        1, 
        '12:00:00', 
        '20:00:00', 
        '⏰ Reminder Keuangan! Jangan lupa catat pengeluaran hari ini ya 📝'
    );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users for new signups
CREATE OR REPLACE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ------------------------------------------------------------------------------
-- 6. Automated Wallet Balance Trigger (INSERT, UPDATE, DELETE)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_transaction_balance_change()
RETURNS TRIGGER AS $$
BEGIN
    -- Handle DELETE
    IF (TG_OP = 'DELETE') THEN
        IF OLD.type = 'income' THEN
            UPDATE public.wallets 
            SET balance = balance - OLD.amount, updated_at = (now() AT TIME ZONE 'Asia/Jakarta')
            WHERE id = OLD.wallet_id;
        ELSIF OLD.type = 'expense' THEN
            UPDATE public.wallets 
            SET balance = balance + OLD.amount, updated_at = (now() AT TIME ZONE 'Asia/Jakarta')
            WHERE id = OLD.wallet_id;
        ELSIF OLD.type = 'transfer' THEN
            -- Revert source wallet
            UPDATE public.wallets 
            SET balance = balance + OLD.amount, updated_at = (now() AT TIME ZONE 'Asia/Jakarta')
            WHERE id = OLD.wallet_id;
            -- Revert destination wallet
            IF OLD.destination_wallet_id IS NOT NULL THEN
                UPDATE public.wallets 
                SET balance = balance - OLD.amount, updated_at = (now() AT TIME ZONE 'Asia/Jakarta')
                WHERE id = OLD.destination_wallet_id;
            END IF;
        END IF;
        RETURN OLD;
    END IF;

    -- Handle UPDATE: Revert OLD then apply NEW
    IF (TG_OP = 'UPDATE') THEN
        -- Revert OLD
        IF OLD.type = 'income' THEN
            UPDATE public.wallets 
            SET balance = balance - OLD.amount, updated_at = (now() AT TIME ZONE 'Asia/Jakarta')
            WHERE id = OLD.wallet_id;
        ELSIF OLD.type = 'expense' THEN
            UPDATE public.wallets 
            SET balance = balance + OLD.amount, updated_at = (now() AT TIME ZONE 'Asia/Jakarta')
            WHERE id = OLD.wallet_id;
        ELSIF OLD.type = 'transfer' THEN
            UPDATE public.wallets 
            SET balance = balance + OLD.amount, updated_at = (now() AT TIME ZONE 'Asia/Jakarta')
            WHERE id = OLD.wallet_id;
            IF OLD.destination_wallet_id IS NOT NULL THEN
                UPDATE public.wallets 
                SET balance = balance - OLD.amount, updated_at = (now() AT TIME ZONE 'Asia/Jakarta')
                WHERE id = OLD.destination_wallet_id;
            END IF;
        END IF;

        -- Apply NEW
        IF NEW.type = 'income' THEN
            UPDATE public.wallets 
            SET balance = balance + NEW.amount, updated_at = (now() AT TIME ZONE 'Asia/Jakarta')
            WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'expense' THEN
            UPDATE public.wallets 
            SET balance = balance - NEW.amount, updated_at = (now() AT TIME ZONE 'Asia/Jakarta')
            WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'transfer' THEN
            UPDATE public.wallets 
            SET balance = balance - NEW.amount, updated_at = (now() AT TIME ZONE 'Asia/Jakarta')
            WHERE id = NEW.wallet_id;
            IF NEW.destination_wallet_id IS NOT NULL THEN
                UPDATE public.wallets 
                SET balance = balance + NEW.amount, updated_at = (now() AT TIME ZONE 'Asia/Jakarta')
                WHERE id = NEW.destination_wallet_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;

    -- Handle INSERT
    IF (TG_OP = 'INSERT') THEN
        IF NEW.type = 'income' THEN
            UPDATE public.wallets 
            SET balance = balance + NEW.amount, updated_at = (now() AT TIME ZONE 'Asia/Jakarta')
            WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'expense' THEN
            UPDATE public.wallets 
            SET balance = balance - NEW.amount, updated_at = (now() AT TIME ZONE 'Asia/Jakarta')
            WHERE id = NEW.wallet_id;
        ELSIF NEW.type = 'transfer' THEN
            -- Decrease source wallet
            UPDATE public.wallets 
            SET balance = balance - NEW.amount, updated_at = (now() AT TIME ZONE 'Asia/Jakarta')
            WHERE id = NEW.wallet_id;
            -- Increase destination wallet
            IF NEW.destination_wallet_id IS NOT NULL THEN
                UPDATE public.wallets 
                SET balance = balance + NEW.amount, updated_at = (now() AT TIME ZONE 'Asia/Jakarta')
                WHERE id = NEW.destination_wallet_id;
            END IF;
        END IF;
        RETURN NEW;
    END IF;

    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER trg_transaction_balance
AFTER INSERT OR UPDATE OR DELETE ON public.transactions
FOR EACH ROW EXECUTE FUNCTION public.handle_transaction_balance_change();
