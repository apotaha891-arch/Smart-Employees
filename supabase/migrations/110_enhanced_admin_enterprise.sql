-- ============================================================
-- 110_enhanced_admin_enterprise.sql
-- Enhanced Admin Dashboard capabilities: Multi-dimensional Client metrics & Identity control
-- ============================================================

BEGIN;

-- 1. Create Enriched RPC for Client Management
DROP FUNCTION IF EXISTS get_admin_clients_v2();

CREATE OR REPLACE FUNCTION get_admin_clients_v2()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    email TEXT,
    business_name TEXT,
    business_type TEXT,
    subscription_tier TEXT,
    is_agency BOOLEAN,
    agency_id UUID,
    agency_name TEXT,
    wallet_balance INT,
    agents_count BIGINT,
    bookings_count BIGINT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF (auth.jwt() -> 'app_metadata' ->> 'role') != 'admin' THEN RAISE EXCEPTION 'Access denied'; END IF;

    RETURN QUERY 
    SELECT 
        p.id, 
        COALESCE(p.full_name, '—')::TEXT, 
        COALESCE(p.email, '—')::TEXT, 
        COALESCE(p.business_name, '—')::TEXT,
        COALESCE(p.business_type, 'general')::TEXT,
        COALESCE(p.subscription_tier, 'basic')::TEXT,
        p.is_agency,
        p.agency_id,
        (SELECT ap.business_name FROM profiles ap WHERE ap.id = p.agency_id)::TEXT as agency_name,
        COALESCE(w.balance, 0)::INT as wallet_balance,
        (SELECT COUNT(*) FROM agents a WHERE a.user_id = p.id)::BIGINT as agents_count,
        (SELECT COUNT(*) FROM bookings b WHERE b.entity_id IN (SELECT id FROM entities e WHERE e.user_id = p.id))::BIGINT as bookings_count,
        p.created_at
    FROM profiles p 
    LEFT JOIN wallet_credits w ON p.id = w.user_id
    ORDER BY p.created_at DESC;
END; $$;

-- 2. Identity Control RPCs
CREATE OR REPLACE FUNCTION admin_change_client_identity(
    p_client_id UUID,
    p_is_agency BOOLEAN,
    p_agency_id UUID DEFAULT NULL
) RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF (auth.jwt() -> 'app_metadata' ->> 'role') != 'admin' THEN RAISE EXCEPTION 'Access denied'; END IF;

    UPDATE profiles 
    SET 
        is_agency = p_is_agency,
        agency_id = p_agency_id,
        agency_max_clients = CASE WHEN p_is_agency THEN 100 ELSE 0 END
    WHERE id = p_client_id;
END; $$;

GRANT EXECUTE ON FUNCTION get_admin_clients_v2() TO authenticated;
GRANT EXECUTE ON FUNCTION admin_change_client_identity(UUID, BOOLEAN, UUID) TO authenticated;

COMMIT;
