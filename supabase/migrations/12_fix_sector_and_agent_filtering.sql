-- Add business_type to salon_configs if missing
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'salon_configs' AND COLUMN_NAME = 'business_type') THEN
        ALTER TABLE salon_configs ADD COLUMN business_type TEXT;
    END IF;
    
    -- Ensure profiles also has it
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'business_type') THEN
        ALTER TABLE profiles ADD COLUMN business_type TEXT;
    END IF;
END $$;

-- Fix Agent Policies to ensure proper filtering if RLS is on
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can manage their own agents" ON agents;
CREATE POLICY "Users can manage their own agents" ON agents
    FOR ALL USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view all agents" ON agents;
CREATE POLICY "Admins can view all agents" ON agents
    FOR SELECT USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
