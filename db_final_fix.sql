-- Comprehensive Database Schema Fix
-- Ensure all required columns exist in profiles, salon_configs, and agent_templates

-- 1. Fix profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS role VARCHAR(50) DEFAULT 'customer',
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free_tier',
ADD COLUMN IF NOT EXISTS total_credits INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS message_limit INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- 2. Fix salon_configs table
ALTER TABLE public.salon_configs 
ADD COLUMN IF NOT EXISTS website TEXT,
ADD COLUMN IF NOT EXISTS welcome_message TEXT DEFAULT 'Hello! How can I help you?',
ADD COLUMN IF NOT EXISTS widget_color TEXT DEFAULT '#8B5CF6';

-- 3. Fix agent_templates table
ALTER TABLE public.agent_templates 
ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT TRUE;

-- 4. Grant permissions (just in case they were lost or not set)
GRANT ALL ON ALL TABLES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO anon, authenticated, service_role;

-- 5. Seed some initial templates if table is empty (Helper for development)
INSERT INTO public.agent_templates (name, description, specialty, business_type, is_public, is_active)
SELECT 'Support Agent', 'Polite support expert', 'support', 'general', true, true
WHERE NOT EXISTS (SELECT 1 FROM public.agent_templates WHERE name = 'Support Agent');
