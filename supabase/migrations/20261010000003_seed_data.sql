-- ==============================================================================
-- TATADANA SEED DATA & INITIAL CONFIG
-- Migration: 20261010000003_seed_data.sql
-- All timestamps are handled with timezone Asia/Jakarta (WIB)
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. Seed Multi-Provider AI Configurations
-- ------------------------------------------------------------------------------
INSERT INTO public.ai_providers (provider, display_name, model_name, api_key_encrypted, is_active, priority, mode)
VALUES 
    ('gemini', 'Google Gemini 1.5 Flash', 'gemini-1.5-flash', 'AIzaSyExampleGeminiKeyTataDanaProduction', TRUE, 1, 'single'),
    ('openai', 'OpenAI GPT-4o-mini', 'gpt-4o-mini', 'sk-example-openai-key-tatadana', TRUE, 2, 'failover'),
    ('deepseek', 'DeepSeek Chat V3', 'deepseek-chat', 'sk-example-deepseek-key-tatadana', TRUE, 3, 'failover')
ON CONFLICT (provider) DO UPDATE 
SET display_name = EXCLUDED.display_name,
    model_name = EXCLUDED.model_name,
    is_active = EXCLUDED.is_active,
    priority = EXCLUDED.priority,
    mode = EXCLUDED.mode;

-- ------------------------------------------------------------------------------
-- 2. Storage Setup: Exported Reports (PDF & Excel)
-- ------------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public)
VALUES ('laporan-exports', 'laporan-exports', FALSE)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Users can only read & write to their own user_id directory
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow individual user storage access'
    ) THEN
        CREATE POLICY "Allow individual user storage access"
        ON storage.objects FOR ALL
        USING (bucket_id = 'laporan-exports' AND auth.uid()::text = (storage.foldername(name))[1])
        WITH CHECK (bucket_id = 'laporan-exports' AND auth.uid()::text = (storage.foldername(name))[1]);
    END IF;
END $$;
