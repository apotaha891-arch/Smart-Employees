-- Update profiles table to handle credits and subscriptions precisely
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS total_credits INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0;

-- Comment for the admin: 
-- trial: 50 credits
-- starter: 500 credits ($29)
-- pro: 2500 credits ($79)
-- enterprise: Unlimited/Contact Us ($199)
