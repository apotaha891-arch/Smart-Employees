-- ============================================================
-- 122_transfer_wallet_credits.sql
-- Creates the MISSING RPC that the Agency uses to top-up
-- client wallets. Without this, all top-up attempts fail silently.
-- ============================================================

CREATE OR REPLACE FUNCTION public.transfer_wallet_credits(
    p_client_id UUID,
    p_amount    INT
)
RETURNS JSONB AS $$
DECLARE
    v_agency_id     UUID;
    v_agency_bal    INT;
    v_client_bal    INT;
BEGIN
    -- 1. Identify the calling agency
    v_agency_id := auth.uid();

    IF v_agency_id IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Not authenticated');
    END IF;

    -- 2. Verify amount is positive
    IF p_amount <= 0 THEN
        RETURN jsonb_build_object('success', false, 'error', 'Amount must be positive');
    END IF;

    -- 3. Lock and read agency balance
    SELECT COALESCE(balance, 0) INTO v_agency_bal
    FROM public.wallet_credits
    WHERE user_id = v_agency_id
    FOR UPDATE;

    IF v_agency_bal IS NULL OR v_agency_bal < p_amount THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'رصيد الوكالة غير كافٍ',
            'agency_balance', COALESCE(v_agency_bal, 0)
        );
    END IF;

    -- 4. Deduct from agency
    UPDATE public.wallet_credits
    SET 
        balance       = balance - p_amount,
        topup_balance = GREATEST(0, topup_balance - p_amount)
    WHERE user_id = v_agency_id;

    -- 5. Add to client (upsert in case wallet row doesn't exist)
    INSERT INTO public.wallet_credits (user_id, balance, topup_balance, package_balance)
    VALUES (p_client_id, p_amount, p_amount, 0)
    ON CONFLICT (user_id)
    DO UPDATE SET
        balance       = wallet_credits.balance + p_amount,
        topup_balance = wallet_credits.topup_balance + p_amount;

    -- 6. Log both sides in ledger
    INSERT INTO public.wallet_ledger (user_id, amount, reason, platform, metadata)
    VALUES 
        (v_agency_id, -p_amount, 'agency_topup_sent',    'agency', jsonb_build_object('recipient', p_client_id)),
        (p_client_id,  p_amount, 'agency_topup_received', 'agency', jsonb_build_object('sender',    v_agency_id));

    -- 7. Return success with updated balances
    SELECT balance INTO v_agency_bal FROM public.wallet_credits WHERE user_id = v_agency_id;
    SELECT balance INTO v_client_bal FROM public.wallet_credits WHERE user_id = p_client_id;

    RETURN jsonb_build_object(
        'success',         true,
        'agency_balance',  v_agency_bal,
        'client_balance',  v_client_bal,
        'transferred',     p_amount
    );

EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object('success', false, 'error', SQLERRM);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.transfer_wallet_credits(UUID, INT) TO authenticated;
