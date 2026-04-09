-- ============================================================
-- 124_agency_white_label_schema.sql
-- Adds support for White Label branding and Agency pricing tiers.
-- ============================================================

-- 1. Add white_label_config to profiles
-- This stores the branding identity (logo, name, colors)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS white_label_config JSONB DEFAULT '{}'::jsonb;

-- 2. Add agency_tier to profiles
-- Tracks which agency level they are on (starter, pro, elite)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS agency_tier TEXT DEFAULT 'starter';

-- 3. Add custom_domain to profiles (for Level 2)
-- We add a dedicated indexed column for fast domain lookup
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS custom_domain TEXT UNIQUE;

-- 4. Create index for performance
CREATE INDEX IF NOT EXISTS idx_profiles_custom_domain ON public.profiles(custom_domain) WHERE custom_domain IS NOT NULL;

-- 5. Update RLS for profiles to ensure agencies can update their own config
DROP POLICY IF EXISTS "Agencies can update their own config" ON public.profiles;
CREATE POLICY "Agencies can update their own config"
ON public.profiles FOR UPDATE
USING (auth.uid() = id AND is_agency = true)
WITH CHECK (auth.uid() = id AND is_agency = true);

COMMENT ON COLUMN public.profiles.white_label_config IS 'Stores agency branding settings: {brand_name, logo_url, primary_color, hide_credits}';
