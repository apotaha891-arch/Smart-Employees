-- ============================================================
-- 113_credit_buckets_and_renewal.sql
-- Implements separate credit buckets (Package vs Top-up) 
-- and subscription renewal logic.
-- ============================================================

BEGIN;

-- 1. Update wallet_credits table with buckets
ALTER TABLE public.wallet_credits 
ADD COLUMN IF NOT EXISTS package_balance INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS topup_balance INT DEFAULT 0;

-- 2. Update profiles with renewal metadata
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS subscription_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS last_renewal_date TIMESTAMPTZ;

-- 3. Function to add Top-up credits (Purchased)
CREATE OR REPLACE FUNCTION public.fn_add_topup_credits(
    p_user_id UUID,
    p_amount INT
) RETURNS VOID AS $$
BEGIN
    UPDATE public.wallet_credits 
    SET 
        topup_balance = topup_balance + p_amount,
        balance = (package_balance + topup_balance + p_amount),
        updated_at = NOW()
    WHERE user_id = p_user_id;
    
    -- Ensure record exists (fallback)
    IF NOT FOUND THEN
        INSERT INTO public.wallet_credits (user_id, topup_balance, balance)
        VALUES (p_user_id, p_amount, p_amount);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to renew subscription credits (Monthly reset)
CREATE OR REPLACE FUNCTION public.fn_renew_user_subscription(
    p_user_id UUID,
    p_plan_id TEXT
) RETURNS JSONB AS $$
DECLARE
    v_quota INT;
    v_new_balance INT;
BEGIN
    -- Determine quota based on plan
    v_quota := CASE 
        WHEN p_plan_id = 'starter' THEN 2000
        WHEN p_plan_id = 'pro' THEN 5000
        WHEN p_plan_id = 'agency_silver' THEN 12000
        WHEN p_plan_id = 'agency_gold' THEN 40000
        ELSE 0
    END;

    -- Update wallet: Reset package portion, keep topup portion
    UPDATE public.wallet_credits
    SET 
        package_balance = v_quota,
        balance = (v_quota + topup_balance),
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Update profile metadata
    UPDATE public.profiles
    SET 
        subscription_plan = p_plan_id,
        subscription_period_end = NOW() + INTERVAL '1 month',
        last_renewal_date = NOW(),
        updated_at = NOW()
    WHERE id = p_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'new_package_balance', v_quota,
        'subscription_period_end', NOW() + INTERVAL '1 month'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Updated SMART Deduction Logic (Consumes package first)
CREATE OR REPLACE FUNCTION public.deduct_wallet_credits(
    p_user_id UUID,
    p_amount INT,
    p_reason TEXT,
    p_platform TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_pkg_bal INT;
    v_top_bal INT;
    v_deduct_from_pkg INT := 0;
    v_deduct_from_top INT := 0;
    v_total_available INT;
BEGIN
    -- Get current balances
    SELECT package_balance, topup_balance INTO v_pkg_bal, v_top_bal
    FROM public.wallet_credits WHERE user_id = p_user_id;

    v_total_available := COALESCE(v_pkg_bal, 0) + COALESCE(v_top_bal, 0);

    -- Check if total is enough
    IF v_total_available < p_amount THEN
        RETURN jsonb_build_object('success', false, 'error', 'Insufficient balance', 'current_balance', v_total_available);
    END IF;

    -- Calculate split logic
    IF v_pkg_bal >= p_amount THEN
        v_deduct_from_pkg := p_amount;
    ELSE
        v_deduct_from_pkg := v_pkg_bal;
        v_deduct_from_top := p_amount - v_pkg_bal;
    END IF;

    -- Execute Update
    UPDATE public.wallet_credits
    SET 
        package_balance = package_balance - v_deduct_from_pkg,
        topup_balance = topup_balance - v_deduct_from_top,
        balance = balance - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- Record Ledger Entry
    INSERT INTO public.wallet_ledger (user_id, amount, reason, platform, metadata)
    VALUES (p_user_id, -p_amount, p_reason, p_platform, p_metadata);

    RETURN jsonb_build_object('success', true, 'remaining_balance', v_total_available - p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
