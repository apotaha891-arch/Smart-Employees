-- ============================================================
-- 09_wallet_and_customers_fix.sql
-- Fixes 404/400 errors for wallet_credits and customers tables
-- ============================================================

-- 1. Create wallet_credits table if missing
CREATE TABLE IF NOT EXISTS wallet_credits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    balance INT DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Enable RLS for wallet_credits
ALTER TABLE wallet_credits ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own wallet balance
DROP POLICY IF EXISTS "Users can view their own wallet balance" ON wallet_credits;
CREATE POLICY "Users can view their own wallet balance"
ON wallet_credits FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to update their own wallet (or deduct credits via RPC)
DROP POLICY IF EXISTS "Users can update their own wallet" ON wallet_credits;
CREATE POLICY "Users can update their own wallet"
ON wallet_credits FOR UPDATE
USING (auth.uid() = user_id);

-- 2. Create customers table if missing
CREATE TABLE IF NOT EXISTS customers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    salon_config_id UUID REFERENCES salon_configs(id) ON DELETE CASCADE,
    customer_name TEXT,
    customer_phone TEXT,
    instagram_id TEXT,
    telegram_id TEXT,
    last_service_date DATE,
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Ensure user_id column exists for easy filtering (fixes status 400 issues)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'customers' AND COLUMN_NAME = 'user_id') THEN
        ALTER TABLE customers ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- Enable RLS for customers
ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

-- Allow users to manage customers for their salon
DROP POLICY IF EXISTS "Users can manage their own salon customers" ON customers;
CREATE POLICY "Users can manage their own salon customers"
ON customers FOR ALL
USING (
    auth.uid() = user_id OR 
    salon_config_id IN (SELECT id FROM salon_configs WHERE user_id = auth.uid())
);

-- 3. Trigger for updated_at (reuse if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS set_updated_at_wallet_credits ON wallet_credits;
CREATE TRIGGER set_updated_at_wallet_credits
BEFORE UPDATE ON wallet_credits
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS set_updated_at_customers ON customers;
CREATE TRIGGER set_updated_at_customers
BEFORE UPDATE ON customers
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
