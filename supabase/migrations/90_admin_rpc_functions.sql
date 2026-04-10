-- ============================================================
-- 24Shift Admin RPC Functions (FIXED SCHEMA & DROP FIRST)
-- Run these in Supabase SQL Editor
-- ============================================================

-- Drop functions first to allow changing return types
DROP FUNCTION IF EXISTS get_admin_clients();
DROP FUNCTION IF EXISTS get_admin_agents();
DROP FUNCTION IF EXISTS get_admin_bookings();
DROP FUNCTION IF EXISTS get_admin_salon_configs();
DROP FUNCTION IF EXISTS admin_update_client_plan(UUID, TEXT);

-- 1. Get all clients (profiles)
CREATE OR REPLACE FUNCTION get_admin_clients()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    subscription_tier TEXT,
    created_at TIMESTAMPTZ,
    role TEXT
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
        p.id, p.full_name, p.email,
        p.subscription_tier,
        p.created_at, p.role
    FROM profiles p
    ORDER BY p.created_at DESC;
END;
$$;

-- 2. Get all agents
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
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (auth.jwt() -> 'app_metadata' ->> 'role') != 'admin' THEN
        RAISE EXCEPTION 'Access denied: admin only';
    END IF;

    RETURN QUERY
    SELECT
        a.id, a.name, a.specialty, a.status,
        a.business_type, a.salon_config_id,
        a.metadata, a.created_at
    FROM agents a
    ORDER BY a.created_at DESC;
END;
$$;

-- 3. Get all bookings
CREATE OR REPLACE FUNCTION get_admin_bookings()
RETURNS TABLE (
    id UUID,
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
        b.id, b.customer_name, b.customer_phone,
        b.service_requested,
        b.booking_date::text, b.booking_time::text,
        b.status, b.salon_config_id, b.agent_id, b.created_at
    FROM bookings b
    ORDER BY b.created_at DESC
    LIMIT 500;
END;
$$;

-- 4. Get all salon_configs
CREATE OR REPLACE FUNCTION get_admin_salon_configs()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    business_type TEXT,
    agent_name TEXT,
    telegram_token TEXT,
    whatsapp_number TEXT,
    whatsapp_api_key TEXT,
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
        sc.id, sc.user_id, sc.business_type, sc.agent_name,
        sc.telegram_token, sc.whatsapp_number, sc.whatsapp_api_key,
        sc.created_at
    FROM salon_configs sc
    ORDER BY sc.created_at DESC;
END;
$$;

-- 5. Update client subscription
CREATE OR REPLACE FUNCTION admin_update_client_plan(client_id UUID, new_plan TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF (auth.jwt() -> 'app_metadata' ->> 'role') != 'admin' THEN
        RAISE EXCEPTION 'Access denied: admin only';
    END IF;
    UPDATE profiles SET subscription_tier = new_plan WHERE id = client_id;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_clients() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_agents() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_bookings() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_salon_configs() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_update_client_plan(UUID, TEXT) TO authenticated;
