-- FINAL COMPREHENSIVE DATABASE FIX
-- Run this in Supabase SQL Editor to resolve all schema-cache and missing column errors.

-- 1. FIX 'profiles' TABLE
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer',
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free_tier',
ADD COLUMN IF NOT EXISTS total_credits INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS message_limit INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS knowledge_base TEXT;

-- 2. FIX 'salon_configs' TABLE (Used by EntitySetup/SalonSetup)
ALTER TABLE public.salon_configs 
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS welcome_message TEXT DEFAULT 'Hello! How can I help you?',
ADD COLUMN IF NOT EXISTS widget_color TEXT DEFAULT '#8B5CF6',
ADD COLUMN IF NOT EXISTS telegram_token TEXT,
ADD COLUMN IF NOT EXISTS whatsapp_api_key TEXT,
ADD COLUMN IF NOT EXISTS google_sheets_id TEXT,
ADD COLUMN IF NOT EXISTS google_calendar_id TEXT,
ADD COLUMN IF NOT EXISTS knowledge_base TEXT;

-- 3. FIX 'agents' TABLE (Crucial for Hire step)
ALTER TABLE public.agents 
ADD COLUMN IF NOT EXISTS avatar TEXT,
ADD COLUMN IF NOT EXISTS platform TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS knowledge_base TEXT;

-- 4. FIX 'agent_templates' TABLE
ALTER TABLE public.agent_templates 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS avatar TEXT;

-- 5. REFRESH PERMISSIONS
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;
