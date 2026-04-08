-- ============================================================
-- 120_admin_wallet_access.sql
-- Enables Admins to view client balances via a secure RPC,
-- bypassing RLS during support/impersonation sessions.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_user_wallet_balance(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_balance INT;
    v_pkg_bal INT;
    v_top_bal INT;
    v_is_admin BOOLEAN;
BEGIN
    -- Authorization logic: 
    -- User can see their own wallet, or user with 'admin' role can see any wallet.
    v_is_admin := (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' 
                  OR (auth.jwt() ->> 'role') = 'service_role'
                  OR (auth.jwt() ->> 'email') IN ('apotaha891@gmail.com', 'sabah@gajha.com');

    IF NOT (auth.uid() = p_user_id OR v_is_admin) THEN
        RETURN jsonb_build_object('success', false, 'error', 'Unauthorized access');
    END IF;

    -- Fetch from unified source
    SELECT balance, package_balance, topup_balance 
    INTO v_balance, v_pkg_bal, v_top_bal
    FROM public.wallet_credits 
    WHERE user_id = p_user_id;

    -- Return combined and bucketed data
    RETURN jsonb_build_object(
        'success', true, 
        'balance', COALESCE(v_balance, (COALESCE(v_pkg_bal, 0) + COALESCE(v_top_bal, 0))),
        'package_balance', COALESCE(v_pkg_bal, 0),
        'topup_balance', COALESCE(v_top_bal, 0),
        'user_id', p_user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_wallet_balance(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_wallet_balance(UUID) TO service_role;
