-- ============================================================
-- 107_agency_subaccounts_model.sql
-- Enables the B2B2B Agency model with Sub-Accounts and Wallet distribution
-- ============================================================

BEGIN;

-- 1. Extend profiles to support agency roles
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS is_agency BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS agency_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS agency_max_clients INT DEFAULT 0;

-- 2. Extend Wallet Credits Security
-- Allow an agency to view the wallet balance of their sub-accounts
CREATE POLICY "Agencies can view their sub-account wallet balances" 
ON wallet_credits FOR SELECT 
USING (
    user_id IN (SELECT id FROM profiles WHERE agency_id = auth.uid())
);

-- Allow an agency to insert/update the wallet balance of their sub-accounts (for top-ups)
CREATE POLICY "Agencies can manage sub-account wallet balances" 
ON wallet_credits FOR UPDATE 
USING (
    user_id IN (SELECT id FROM profiles WHERE agency_id = auth.uid())
);

-- 3. Extend Entities Security
-- Agencies can manage their sub-clients' entities
CREATE POLICY "Agencies can select sub-client entities" 
ON entities FOR SELECT 
USING (
    user_id IN (SELECT id FROM profiles WHERE agency_id = auth.uid())
);
CREATE POLICY "Agencies can modify sub-client entities" 
ON entities FOR UPDATE 
USING (
    user_id IN (SELECT id FROM profiles WHERE agency_id = auth.uid())
);
CREATE POLICY "Agencies can insert sub-client entities" 
ON entities FOR INSERT 
WITH CHECK (
    user_id IN (SELECT id FROM profiles WHERE agency_id = auth.uid()) OR user_id = auth.uid()
);

-- 4. Secure Wallet Transfer RPC
CREATE OR REPLACE FUNCTION transfer_wallet_credits(
    p_client_id UUID, 
    p_amount INT
) RETURNS JSONB AS $$
DECLARE
    v_agency_balance INT;
    v_is_valid_client BOOLEAN;
BEGIN
    -- Only execute if the amount is positive
    IF p_amount <= 0 THEN
        RAISE EXCEPTION 'Amount must be greater than zero';
    END IF;

    -- Verify this client actually belongs to this agency
    SELECT EXISTS(
        SELECT 1 FROM profiles 
        WHERE id = p_client_id AND agency_id = auth.uid()
    ) INTO v_is_valid_client;

    IF NOT v_is_valid_client THEN
        RAISE EXCEPTION 'Unauthorized: Client does not belong to your agency';
    END IF;

    -- Verify agency has enough balance
    SELECT balance INTO v_agency_balance 
    FROM wallet_credits 
    WHERE user_id = auth.uid() 
    FOR UPDATE; -- Lock row to prevent race conditions

    IF v_agency_balance IS NULL OR v_agency_balance < p_amount THEN
        RAISE EXCEPTION 'Insufficient agency balance';
    END IF;

    -- Deduct from agency
    UPDATE wallet_credits 
    SET balance = balance - p_amount, updated_at = NOW() 
    WHERE user_id = auth.uid();

    -- Add to client
    INSERT INTO wallet_credits (user_id, balance)
    VALUES (p_client_id, p_amount)
    ON CONFLICT (user_id) 
    DO UPDATE SET balance = wallet_credits.balance + p_amount, updated_at = NOW();

    -- Log the transfer (optional but highly recommended for financial traceability)
    INSERT INTO system_logs (level, category, message, user_id, details)
    VALUES ('audit', 'wallet_transfer', 'Agency transferred credits to client', auth.uid(), jsonb_build_object('client_id', p_client_id, 'amount', p_amount));

    RETURN jsonb_build_object('success', true, 'transferred', p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Expose RPC to authenticated users
GRANT EXECUTE ON FUNCTION transfer_wallet_credits(UUID, INT) TO authenticated;

COMMIT;
