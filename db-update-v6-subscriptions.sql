-- UPGRADE PROFILES FOR SUBSCRIPTIONS
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS subscription_plan TEXT DEFAULT 'free_tier',
ADD COLUMN IF NOT EXISTS message_limit INTEGER DEFAULT 50, -- Free trial limit
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Update existing profiles to starter with 2000 messages (as an initial grace / grand-father period)
UPDATE public.profiles
SET subscription_plan = 'starter', message_limit = 2000
WHERE subscription_plan = 'free_tier';

-- Secure Edge Functions access to view these fields
GRANT SELECT, UPDATE ON public.profiles TO anon, authenticated, service_role;
