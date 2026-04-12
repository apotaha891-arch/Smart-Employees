-- DB_FIXES.sql (Fixed Indempotent Version)

-- 1. Explicitly name the Foreign Key for white_label_requests to help Supabase Join logic
-- First, drop the unnamed reference if it exists
ALTER TABLE IF EXISTS white_label_requests 
DROP CONSTRAINT IF EXISTS white_label_requests_user_id_fkey;

ALTER TABLE IF EXISTS white_label_requests
ADD CONSTRAINT white_label_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 2. Add an RPC to fetch Academy Leads with profile join
CREATE OR REPLACE FUNCTION get_admin_academy_leads()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    whatsapp TEXT,
    email TEXT,
    user_type TEXT,
    industry TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    referrer_code TEXT,
    referrer_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.full_name,
        al.whatsapp,
        al.email,
        al.user_type,
        al.industry,
        al.status,
        al.created_at,
        af.affiliate_code as referrer_code,
        p.full_name as referrer_name
    FROM academy_leads al
    LEFT JOIN academy_affiliates af ON al.referrer_id = af.id
    LEFT JOIN profiles p ON af.user_id = p.id
    ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Fix deduct_wallet_credits function (Removing raw_app_metadata dependency)
CREATE OR REPLACE FUNCTION deduct_wallet_credits(
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
    -- service_role doesn't have auth.uid(), so we allow it if identity is null (from background functions)
    IF v_current_user_id IS NOT NULL THEN
        IF v_current_user_id != p_user_id AND NOT EXISTS (
            SELECT 1 FROM public.profiles WHERE id = p_user_id AND agency_id = v_current_user_id
        ) AND NOT EXISTS (
            -- FIX: Check if caller is admin using profiles table instead of auth.users metadata
            SELECT 1 FROM public.profiles WHERE id = v_current_user_id AND role = 'admin'
        ) THEN
            RAISE EXCEPTION 'Unauthorized credit deduction attempt';
        END IF;
    END IF;

    -- 1. Get current balance and LOCK ROW to prevent race conditions
    -- Ensure wallet exists, create if missing (legacy support)
    INSERT INTO public.wallet_credits (user_id, balance)
    VALUES (p_user_id, 0)
    ON CONFLICT (user_id) DO NOTHING;

    SELECT balance INTO v_balance 
    FROM public.wallet_credits 
    WHERE user_id = p_user_id 
    FOR UPDATE;
    
    -- 2. Check sufficiency
    IF v_balance < p_amount THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'Insufficient credits',
            'error_ar', 'رصيدك غير كافٍ لإتمام هذه العملية',
            'current_balance', v_balance,
            'required', p_amount
        );
    END IF;
    
    -- 3. Deduct from wallet
    UPDATE public.wallet_credits 
    SET balance = balance - p_amount, updated_at = NOW() 
    WHERE user_id = p_user_id;
    
    -- 4. Record in Ledger
    INSERT INTO public.wallet_ledger (user_id, amount, reason, platform, metadata)
    VALUES (p_user_id, -p_amount, p_reason, p_platform, p_metadata);
    
    -- 5. Audit Log (System Event)
    -- Using a check for log_system_event to avoid crashes if it doesn't exist
    BEGIN
        PERFORM log_system_event(
            'audit', 
            'billing', 
            p_reason || ' credits deducted', 
            jsonb_build_object('amount', p_amount, 'platform', p_platform), 
            p_metadata
        );
    EXCEPTION WHEN undefined_function THEN
        -- Ignore if system logger is not present
    END;
    
    RETURN jsonb_build_object(
        'success', true, 
        'remaining_balance', v_balance - p_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
