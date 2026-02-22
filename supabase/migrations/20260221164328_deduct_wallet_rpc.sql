-- Function to safely deduct wallet credits
CREATE OR REPLACE FUNCTION deduct_wallet_credits(p_user_id UUID, amount INT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated privileges
AS $$
BEGIN
    UPDATE wallet_credits
    SET balance = balance - amount
    WHERE user_id = p_user_id;
    
    -- Optional: We could add a check here to prevent negative balances, 
    -- but for now, we'll allow it to go negative until they recharge.
END;
$$;
