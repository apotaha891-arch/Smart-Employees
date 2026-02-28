-- ============================================================
-- 24Shift DEFINITIVE DATABASE SYNC (Run this in SQL Editor)
-- This script fixes all 400 errors and RPC structure mismatches.
-- ============================================================

-- A. Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- B. Force Create Tables (Recreates if structure was broken)
-- Note: We use IF NOT EXISTS for existing tables unless we need to force columns.

-- 1. Profiles (Add columns one by one safely)
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'basic';
ALTER TABLE IF EXISTS profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';

-- 2. Agents (Ensure metadata exists)
ALTER TABLE IF EXISTS agents ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE IF EXISTS agents ADD COLUMN IF NOT EXISTS business_type TEXT;

-- 3. Agent Templates (DROP AND RECREATE to be 100% sure of structure)
DROP TABLE IF EXISTS agent_templates CASCADE;
CREATE TABLE agent_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    description TEXT,
    specialty TEXT,
    business_type TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true
);

-- 4. System Logs
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    level TEXT DEFAULT 'info',
    category TEXT,
    message TEXT,
    details JSONB,
    user_id UUID,
    metadata JSONB
);

-- C. RLS POLICIES
ALTER TABLE agent_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view templates" ON agent_templates;
CREATE POLICY "Anyone can view templates" ON agent_templates FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins can manage templates" ON agent_templates;
CREATE POLICY "Admins can manage templates" ON agent_templates FOR ALL USING ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' );

ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can insert logs" ON system_logs;
CREATE POLICY "Anyone can insert logs" ON system_logs FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Admins can read logs" ON system_logs;
CREATE POLICY "Admins can read logs" ON system_logs FOR SELECT USING ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' );

-- D. RPC FUNCTIONS (EXACT STRUCTURE MATCH)
-- We drop first to ensure the return signature is updated.

DROP FUNCTION IF EXISTS get_admin_clients();
CREATE OR REPLACE FUNCTION get_admin_clients() 
RETURNS TABLE (
    id UUID, 
    full_name TEXT, 
    email TEXT, 
    subscription_tier TEXT, 
    created_at TIMESTAMPTZ, 
    role TEXT
)
LANGUAGE plpgsql SECURITY DEFINER AS $$ 
BEGIN
    IF (auth.jwt() -> 'app_metadata' ->> 'role') != 'admin' THEN RAISE EXCEPTION 'Access denied'; END IF;
    RETURN QUERY 
    SELECT 
        p.id, 
        COALESCE(p.full_name, '—')::TEXT, 
        COALESCE(u.email, p.email, '—')::TEXT, 
        COALESCE(p.subscription_tier, 'basic')::TEXT, 
        p.created_at, 
        COALESCE(p.role, 'user')::TEXT
    FROM profiles p 
    LEFT JOIN auth.users u ON p.id = u.id
    ORDER BY p.created_at DESC;
END; $$;

DROP FUNCTION IF EXISTS get_admin_agents();
CREATE OR REPLACE FUNCTION get_admin_agents() 
RETURNS TABLE (
    id UUID, 
    name TEXT, 
    specialty TEXT, 
    status TEXT, 
    business_type TEXT, 
    salon_config_id UUID, 
    metadata JSONB, 
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$ 
BEGIN
    IF (auth.jwt() -> 'app_metadata' ->> 'role') != 'admin' THEN RAISE EXCEPTION 'Access denied'; END IF;
    RETURN QUERY 
    SELECT 
        a.id, 
        a.name::TEXT, 
        a.specialty::TEXT, 
        a.status::TEXT, 
        a.business_type::TEXT, 
        a.salon_config_id, 
        COALESCE(a.metadata, '{}'::jsonb), 
        a.created_at 
    FROM agents a 
    ORDER BY a.created_at DESC;
END; $$;

CREATE OR REPLACE FUNCTION log_system_event(p_level TEXT, p_category TEXT, p_message TEXT, p_details JSONB DEFAULT NULL, p_metadata JSONB DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO system_logs (level, category, message, details, metadata, user_id)
    VALUES (p_level, p_category, p_message, p_details, p_metadata, auth.uid());
END; $$;

GRANT EXECUTE ON FUNCTION get_admin_clients() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_agents() TO authenticated;
GRANT EXECUTE ON FUNCTION log_system_event(TEXT, TEXT, TEXT, JSONB, JSONB) TO authenticated;
