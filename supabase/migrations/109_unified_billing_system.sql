-- ============================================================
-- 109_unified_billing_system.sql
-- Implements the Unified Credit Economy for Agents, Tools, and Messages
-- ============================================================

BEGIN;

-- 1. Add Default Billing Rates to Platform Settings
INSERT INTO public.platform_settings (key, value)
VALUES ('billing_rates', '{
    "agent_provision_fee": 1000,
    "tool_setup_fees": {
        "telegram": 250,
        "whatsapp_byot": 500,
        "whatsapp_managed": 2000,
        "instagram": 1000,
        "web_widget": 100
    },
    "message_rates": {
        "telegram": 1,
        "web_widget": 2,
        "whatsapp_byot": 3,
        "whatsapp_managed": 15,
        "instagram": 5,
        "email": 1
    }
}'::jsonb)
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 2. Wallet Ledger Table for Full Transparency
CREATE TABLE IF NOT EXISTS public.wallet_ledger (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INT NOT NULL, -- Negative for expenses, Positive for top-ups
    reason TEXT NOT NULL, -- e.g., 'agent_hire', 'message_sent', 'tool_link', 'top_up'
    platform TEXT, -- e.g., 'whatsapp', 'telegram'
    metadata JSONB, -- Additional info like agent_id, session_id
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS for ledger
ALTER TABLE public.wallet_ledger ENABLE ROW LEVEL SECURITY;

-- Clients can see their own history
CREATE POLICY "Users can view their own ledger history" 
ON public.wallet_ledger FOR SELECT 
USING (auth.uid() = user_id);

-- Agencies can see their sub-accounts' history
CREATE POLICY "Agencies can view sub-account ledger history" 
ON public.wallet_ledger FOR SELECT 
USING (
    user_id IN (SELECT id FROM public.profiles WHERE agency_id = auth.uid())
);

-- 3. Universal Deduction RPC (Security Definer)
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
            -- Check if caller is admin
            SELECT 1 FROM auth.users WHERE id = v_current_user_id AND (raw_app_metadata->>'role') = 'admin'
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
    PERFORM log_system_event(
        'audit', 
        'billing', 
        p_reason || ' credits deducted', 
        jsonb_build_object('amount', p_amount, 'platform', p_platform), 
        p_metadata
    );
    
    RETURN jsonb_build_object(
        'success', true, 
        'remaining_balance', v_balance - p_amount
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution to authenticated users
GRANT EXECUTE ON FUNCTION deduct_wallet_credits(UUID, INT, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_wallet_credits(UUID, INT, TEXT, TEXT, JSONB) TO service_role;

COMMIT;
