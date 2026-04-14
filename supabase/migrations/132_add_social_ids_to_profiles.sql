-- Migration: 132_add_social_ids_to_profiles.sql
-- Goal: Identify managers on Telegram/WhatsApp to enable secure admin tools

-- Add columns if they don't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'telegram_id') THEN
        ALTER TABLE public.profiles ADD COLUMN telegram_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'whatsapp_id') THEN
        ALTER TABLE public.profiles ADD COLUMN whatsapp_id TEXT;
    END IF;
END $$;

-- Create indexes for fast lookup
CREATE INDEX IF NOT EXISTS idx_profiles_telegram_id ON public.profiles(telegram_id);
CREATE INDEX IF NOT EXISTS idx_profiles_whatsapp_id ON public.profiles(whatsapp_id);

-- Note: No additional RLS needed as these are managed by the service role in Edge Functions or the user themselves.
