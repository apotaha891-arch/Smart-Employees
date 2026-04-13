-- ============================================================
-- 131_fix_deduct_credits_rpc.sql
-- Fixes the typo in raw_app_meta_data column name
-- ============================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.deduct_wallet_credits(
    p_user_id UUID,
    p_amount INT,
    p_reason TEXT,
    p_platform TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
) RETURNS JSONB AS $$
DECLARE
    v_balance INT;
    v_current_user_id UUID;
BEGIN
    -- Security Check: Only allow the user themselves OR their managing agency to deduct
    v_current_user_id := auth.uid();
    
    -- Verify authorized caller (self, agency, or service_role)
    IF v_current_user_id IS NOT NULL THEN
        IF v_current_user_id != p_user_id AND NOT EXISTS (
            SELECT 1 FROM public.profiles WHERE id = p_user_id AND agency_id = v_current_user_id
        ) AND NOT EXISTS (
            -- FIX: Changed raw_app_metadata to raw_app_meta_data
            SELECT 1 FROM auth.users WHERE id = v_current_user_id AND (raw_app_meta_data->>'role') = 'admin'
        ) THEN
            RAISE EXCEPTION 'Unauthorized credit deduction attempt';
        END IF;
    END IF;

    -- 1. Ensure wallet exists
    INSERT INTO public.wallet_credits (user_id, balance)
    VALUES (p_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

    -- 2. Get current balance and LOCK
    SELECT balance INTO v_balance 
    FROM public.wallet_credits 
    WHERE user_id = p_user_id 
    FOR UPDATE;
    
    -- 3. Check sufficiency
    IF v_balance < p_amount THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Insufficient credits',
            'error_ar', 'رصيدك غير كافٍ لإتمام هذه العملية',
            'current_balance', v_balance,
            'required', p_amount
        );
    END IF;
    
    -- 4. Deduct from wallet
    UPDATE public.wallet_credits 
    SET balance = balance - p_amount, updated_at = NOW() 
    WHERE user_id = p_user_id;
    
    -- 5. Record in Ledger
    INSERT INTO public.wallet_ledger (user_id, amount, reason, platform, metadata)
    VALUES (p_user_id, -p_amount, p_reason, p_platform, p_metadata);
    
    RETURN jsonb_build_object(
        'success', true, 
        'remaining_balance', v_balance - p_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
