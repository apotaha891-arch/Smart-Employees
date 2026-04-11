-- DROP existing functions first to avoid return type conflicts
DROP FUNCTION IF EXISTS get_agency_clients(uuid);
DROP FUNCTION IF EXISTS get_agency_stats(uuid);

-- 1. Create function to get agency clients with full details (business name, counts)
CREATE OR REPLACE FUNCTION get_agency_clients(p_agency_id UUID)
RETURNS TABLE (
    id UUID,
    email TEXT,
    full_name TEXT,
    phone TEXT,
    business_name TEXT, -- This is the entity-level business name
    business_type TEXT,
    created_at TIMESTAMPTZ,
    subscription_tier TEXT,
    wallet_balance NUMERIC,
    agents_count BIGINT,
    bookings_count BIGINT
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        p.id,
        p.email,
        p.full_name,
        p.phone,
        e.business_name,
        COALESCE(e.business_type, p.business_type) as business_type,
        p.created_at,
        p.subscription_tier,
        COALESCE(w.balance, 0) as wallet_balance,
        (SELECT COUNT(*) FROM agents a WHERE a.user_id = p.id) as agents_count,
        (SELECT COUNT(*) FROM bookings b WHERE b.user_id = p.id) as bookings_count
    FROM profiles p
    LEFT JOIN entities e ON e.user_id = p.id
    LEFT JOIN wallet_credits w ON w.user_id = p.id
    WHERE p.agency_id = p_agency_id
    ORDER BY p.created_at DESC;
END;
$$;

-- 2. Create function to get aggregate stats for the agency
CREATE OR REPLACE FUNCTION get_agency_stats(p_agency_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total_clients BIGINT;
    v_total_agents BIGINT;
    v_total_bookings BIGINT;
BEGIN
    -- Total Clients
    SELECT COUNT(*) INTO v_total_clients 
    FROM profiles 
    WHERE agency_id = p_agency_id;

    -- Total Agents across all clients
    SELECT COUNT(*) INTO v_total_agents 
    FROM agents 
    WHERE user_id IN (SELECT id FROM profiles WHERE agency_id = p_agency_id);

    -- Total Bookings across all clients
    SELECT COUNT(*) INTO v_total_bookings 
    FROM bookings 
    WHERE user_id IN (SELECT id FROM profiles WHERE agency_id = p_agency_id);

    RETURN json_build_object(
        'total_clients', v_total_clients,
        'total_agents', v_total_agents,
        'total_bookings', v_total_bookings
    );
END;
$$;
