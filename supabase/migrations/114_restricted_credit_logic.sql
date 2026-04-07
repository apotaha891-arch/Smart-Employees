-- ============================================================
-- 114_restricted_credit_logic.sql
-- Implements restricted usage for Top-up credits.
-- Top-up = Chat ONLY. 
-- Package = Setup + Chat.
-- ============================================================

BEGIN;

-- Update the Smart Deduction Logic to handle restricted buckets
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
    v_is_setup BOOLEAN;
BEGIN
    -- 1. Identify Deduction Type (Setup vs Usage)
    -- Default to usage if not specified
    v_is_setup := COALESCE((p_metadata->>'deduction_type' = 'setup'), FALSE);

    -- 2. Get current balances
    SELECT package_balance, topup_balance INTO v_pkg_bal, v_top_bal
    FROM public.wallet_credits WHERE user_id = p_user_id;

    -- Handle missing wallet record
    IF v_pkg_bal IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Wallet not found');
    END IF;

    -- 3. Logic based on Type
    IF v_is_setup THEN
        -- SETUP FEE (Hiring/Tools): Must use Package Balance ONLY
        IF v_pkg_bal < p_amount THEN
            RETURN jsonb_build_object(
                'success', false, 
                'error', 'يطلب هذا الإجراء اشتراكاً نشطاً في باقة. رصيد الشحن مخصص للمحادثات فقط.',
                'error_en', 'Subscription required for setup actions. Top-up credits are for chat usage only.',
                'package_balance', v_pkg_bal
            );
        END IF;
        v_deduct_from_pkg := p_amount;
    ELSE
        -- USAGE (Chat): Use Package first, then Top-up
        v_total_available := v_pkg_bal + v_top_bal;
        IF v_total_available < p_amount THEN
            RETURN jsonb_build_object('success', false, 'error', 'Insufficient total balance', 'current_balance', v_total_available);
        END IF;

        IF v_pkg_bal >= p_amount THEN
            v_deduct_from_pkg := p_amount;
        ELSE
            v_deduct_from_pkg := v_pkg_bal;
            v_deduct_from_top := p_amount - v_pkg_bal;
        END IF;
    END IF;

    -- 4. Execute Update
    UPDATE public.wallet_credits
    SET 
        package_balance = package_balance - v_deduct_from_pkg,
        topup_balance = topup_balance - v_deduct_from_top,
        balance = balance - p_amount,
        updated_at = NOW()
    WHERE user_id = p_user_id;

    -- 5. Record Ledger Entry
    INSERT INTO public.wallet_ledger (user_id, amount, reason, platform, metadata)
    VALUES (p_user_id, -p_amount, p_reason, p_platform, p_metadata);

    RETURN jsonb_build_object(
        'success', true, 
        'remaining_total', (v_pkg_bal + v_top_bal) - p_amount,
        'remaining_package', v_pkg_bal - v_deduct_from_pkg
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
