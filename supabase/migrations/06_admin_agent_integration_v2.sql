-- ============================================================
-- 24Shift Admin & Agent Integration Fix
-- Run this in Supabase SQL Editor
-- ============================================================

-- 1. Ensure Agent Templates columns exist
ALTER TABLE IF EXISTS agent_templates ADD COLUMN IF NOT EXISTS name_en TEXT;
ALTER TABLE IF EXISTS agent_templates ADD COLUMN IF NOT EXISTS description_en TEXT;
ALTER TABLE IF EXISTS agent_templates ADD COLUMN IF NOT EXISTS avatar TEXT DEFAULT '👩';

-- 2. Ensure Agents table has the new multi-tenant columns
ALTER TABLE IF EXISTS agents ADD COLUMN IF NOT EXISTS telegram_token TEXT;
ALTER TABLE IF EXISTS agents ADD COLUMN IF NOT EXISTS whatsapp_settings JSONB DEFAULT '{}'::jsonb;

-- 3. Update get_admin_agents RPC to return all necessary columns
DROP FUNCTION IF EXISTS get_admin_agents();

CREATE OR REPLACE FUNCTION get_admin_agents()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    name TEXT,
    specialty TEXT,
    status TEXT,
    business_type TEXT,
    telegram_token TEXT,
    whatsapp_settings JSONB,
    salon_config_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (auth.jwt() -> 'app_metadata' ->> 'role') != 'admin' THEN
        RAISE EXCEPTION 'Access denied: admin only';
    END IF;

    RETURN QUERY
    SELECT
        a.id, a.user_id, a.name::TEXT, a.specialty::TEXT, a.status::TEXT,
        a.business_type::TEXT, a.telegram_token::TEXT, a.whatsapp_settings,
        a.salon_config_id, COALESCE(a.metadata, '{}'::jsonb), a.created_at
    FROM agents a
    ORDER BY a.created_at DESC;
END;
$$;

-- 4. Update get_admin_bookings RPC to include user_id mapping
DROP FUNCTION IF EXISTS get_admin_bookings();

CREATE OR REPLACE FUNCTION get_admin_bookings()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    customer_name TEXT,
    customer_phone TEXT,
    service_requested TEXT,
    booking_date TEXT,
    booking_time TEXT,
    status TEXT,
    salon_config_id UUID,
    agent_id UUID,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (auth.jwt() -> 'app_metadata' ->> 'role') != 'admin' THEN
        RAISE EXCEPTION 'Access denied: admin only';
    END IF;

    RETURN QUERY
    SELECT
        b.id, b.user_id, b.customer_name::TEXT, b.customer_phone::TEXT,
        b.service_requested::TEXT,
        b.booking_date::text, b.booking_time::text,
        b.status::TEXT, b.salon_config_id, b.agent_id, b.created_at
    FROM bookings b
    ORDER BY b.created_at DESC
    LIMIT 500;
END;
$$;

-- 5. Grant permissions
GRANT EXECUTE ON FUNCTION get_admin_agents() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_bookings() TO authenticated;
