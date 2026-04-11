-- AFFILIATE_SETUP.sql (Fixed Admin Check Version)

-- 1. Create Affiliates Table
CREATE TABLE IF NOT EXISTS academy_affiliates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES profiles(id) NOT NULL UNIQUE,
    affiliate_code TEXT NOT NULL UNIQUE,
    commission_rate_fixed NUMERIC DEFAULT 20.00,
    status TEXT DEFAULT 'active', -- active, suspended
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Update Academy Leads to track referrals
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='academy_leads' AND column_name='referrer_id') THEN
        ALTER TABLE academy_leads ADD COLUMN referrer_id UUID REFERENCES academy_affiliates(id);
    END IF;
END $$;

-- 3. Create Commissions Table to track payouts
CREATE TABLE IF NOT EXISTS academy_commissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lead_id UUID REFERENCES academy_leads(id) NOT NULL,
    affiliate_id UUID REFERENCES academy_affiliates(id) NOT NULL,
    amount NUMERIC NOT NULL DEFAULT 20.00,
    status TEXT DEFAULT 'pending', -- pending, paid, rejected
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Enable RLS
ALTER TABLE academy_affiliates ENABLE ROW LEVEL SECURITY;
ALTER TABLE academy_commissions ENABLE ROW LEVEL SECURITY;

-- 5. Clean and Re-create Policies with CORRECT Admin check
DROP POLICY IF EXISTS "Admins manage affiliates" ON academy_affiliates;
DROP POLICY IF EXISTS "Admins manage commissions" ON academy_commissions;
DROP POLICY IF EXISTS "Users view own affiliate profile" ON academy_affiliates;

CREATE POLICY "Admins manage affiliates" ON academy_affiliates FOR ALL 
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'email') IN ('tayaran442000@gmail.com', 'sabah@gajha.com')
);

CREATE POLICY "Admins manage commissions" ON academy_commissions FOR ALL 
USING (
    (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'email') IN ('tayaran442000@gmail.com', 'sabah@gajha.com')
);

CREATE POLICY "Users view own affiliate profile" ON academy_affiliates FOR SELECT 
USING (
    auth.uid() = user_id
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
);

-- Function to generate a random affiliate code if not provided
CREATE OR REPLACE FUNCTION generate_affiliate_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    result TEXT := '';
    i INTEGER := 0;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;
