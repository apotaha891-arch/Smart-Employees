-- Migration 129: Dynamic System Settings
-- This allows the Admin to control platform prices (like White Label) via DB

-- 1. Create the settings table
CREATE TABLE IF NOT EXISTS public.system_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add an automatic updated_at trigger
CREATE OR REPLACE FUNCTION update_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_update_settings_time ON public.system_settings;
CREATE TRIGGER tr_update_settings_time
BEFORE UPDATE ON public.system_settings
FOR EACH ROW EXECUTE FUNCTION update_settings_updated_at();

-- 3. Seed with the White Label Price ID
-- Note: Replace 'price_placeholder_wl_50' with your actual Stripe Price ID via DB Manager
INSERT INTO public.system_settings (key, value, description)
VALUES (
    'agency_white_label_price_id', 
    'price_placeholder_wl_50', 
    'Stripe Price ID for the Agency White Label monthly subscription ($50/mo)'
)
ON CONFLICT (key) DO NOTHING;

-- 4. Enable RLS (Only service_role can write, anon/authenticated can read if needed)
-- Since it's for Edge Functions, we typically use service_role, but let's be safe.
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow service role full access" ON public.system_settings
FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow authenticated read-only access" ON public.system_settings
FOR SELECT TO authenticated USING (true);
