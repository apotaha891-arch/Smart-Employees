-- ============================================================
-- 112_welcome_reward_credits.sql
-- Grants a 2,000 pt Welcome Reward to new users upon signup
-- Fix: Ensures wallet and ledger tables exist before insertion
-- ============================================================

BEGIN;

-- 0. Infrastructure Check (Self-healing)
CREATE TABLE IF NOT EXISTS public.wallet_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    balance INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

CREATE TABLE IF NOT EXISTS public.wallet_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INT NOT NULL,
    reason TEXT NOT NULL,
    platform TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS (if not already enabled)
ALTER TABLE public.wallet_credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;

-- 1. Function to handle setup for new users (Credits/Wallet)
CREATE OR REPLACE FUNCTION public.handle_new_user_setup()
RETURNS TRIGGER AS $$
BEGIN
    -- A. Create/Update Wallet with 2000 points
    INSERT INTO public.wallet_credits (user_id, balance)
    VALUES (NEW.id, 2000)
    ON CONFLICT (user_id) DO UPDATE SET balance = GREATEST(public.wallet_credits.balance, 2000);
    
    -- B. Record the grant in the Ledger for transparency
    IF NOT EXISTS (SELECT 1 FROM public.wallet_ledger WHERE user_id = NEW.id AND reason = 'welcome_reward') THEN
        INSERT INTO public.wallet_ledger (user_id, amount, reason)
        VALUES (NEW.id, 2000, 'welcome_reward');
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Trigger to run on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created_welcome_reward ON auth.users;
CREATE TRIGGER on_auth_user_created_welcome_reward
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user_setup();

-- 3. Apply retroactively to existing users who have 0 credits (optional but helpful for testing)
INSERT INTO public.wallet_credits (user_id, balance)
SELECT id, 2000 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

INSERT INTO public.wallet_ledger (user_id, amount, reason)
SELECT id, 2000, 'welcome_reward' FROM auth.users
WHERE id NOT IN (SELECT user_id FROM public.wallet_ledger WHERE reason = 'welcome_reward')
ON CONFLICT DO NOTHING;

COMMIT;
