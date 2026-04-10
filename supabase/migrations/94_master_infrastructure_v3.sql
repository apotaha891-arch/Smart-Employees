-- ============================================================
-- 24Shift MASTER INFRASTRUCTURE FIX (V3 - Final)
-- Run this in Supabase SQL Editor to fix 400 & Structure Errors
-- ============================================================

-- 1. Ensure extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Fix profiles table (Add missing columns safely)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'full_name') THEN
        ALTER TABLE profiles ADD COLUMN full_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'subscription_tier') THEN
        ALTER TABLE profiles ADD COLUMN subscription_tier TEXT DEFAULT 'basic';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;

-- 3. Create agent_templates table
CREATE TABLE IF NOT EXISTS agent_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    description TEXT,
    specialty TEXT,
    business_type TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true
);
ALTER TABLE agent_templates ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone can view active templates" ON agent_templates;
CREATE POLICY "Anyone can view active templates" ON agent_templates FOR SELECT USING ( is_active = true );
DROP POLICY IF EXISTS "Admins can manage templates" ON agent_templates;
CREATE POLICY "Admins can manage templates" ON agent_templates FOR ALL USING ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' );

-- 4. Create system_logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    level TEXT DEFAULT 'info',
    category TEXT,
    message TEXT,
    details JSONB,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB
);
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Admins can read logs" ON system_logs;
CREATE POLICY "Admins can read logs" ON system_logs FOR SELECT USING ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' );
DROP POLICY IF EXISTS "Anyone can insert logs" ON system_logs;
CREATE POLICY "Anyone can insert logs" ON system_logs FOR INSERT WITH CHECK ( true );

-- 5. Fix Agent Schema
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'agents' AND COLUMN_NAME = 'metadata') THEN
        ALTER TABLE agents ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 6. RPC Functions (JOINING auth.users for Email)
DROP FUNCTION IF EXISTS get_admin_clients();
CREATE OR REPLACE FUNCTION get_admin_clients() 
RETURNS TABLE (id UUID, full_name TEXT, email TEXT, subscription_tier TEXT, created_at TIMESTAMPTZ, role TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$ 
BEGIN
    IF (auth.jwt() -> 'app_metadata' ->> 'role') != 'admin' THEN RAISE EXCEPTION 'Access denied'; END IF;
    RETURN QUERY 
    SELECT 
        p.id, 
        COALESCE(p.full_name, '—'), 
        COALESCE(u.email, '—'), -- Email comes from auth.users
        COALESCE(p.subscription_tier, 'basic'), 
        p.created_at, 
        COALESCE(p.role, 'user')
    FROM profiles p 
    LEFT JOIN auth.users u ON p.id = u.id
    ORDER BY p.created_at DESC;
END; $$;

DROP FUNCTION IF EXISTS get_admin_agents();
CREATE OR REPLACE FUNCTION get_admin_agents() 
RETURNS TABLE (id UUID, name TEXT, specialty TEXT, status TEXT, business_type TEXT, salon_config_id UUID, metadata JSONB, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN
    IF (auth.jwt() -> 'app_metadata' ->> 'role') != 'admin' THEN RAISE EXCEPTION 'Access denied'; END IF;
    RETURN QUERY SELECT a.id, a.name, a.specialty, a.status, a.business_type, a.salon_config_id, a.metadata, a.created_at FROM agents a ORDER BY a.created_at DESC;
END; $$;

GRANT EXECUTE ON FUNCTION get_admin_clients() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_agents() TO authenticated;
