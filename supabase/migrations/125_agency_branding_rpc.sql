-- ============================================================
-- 125_agency_branding_rpc.sql
-- Unified RPC to fetch branding config by Domain or User ID.
-- This is the core engine for White Label Level 1 & 2.
-- ============================================================

CREATE OR REPLACE FUNCTION public.get_branding_config(
    p_domain    TEXT DEFAULT NULL,
    p_user_id   UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_config     JSONB;
    v_agency_id  UUID;
    v_brand_name TEXT;
BEGIN
    -- 1. Try resolving by custom domain (Pre-login / Level 2)
    IF p_domain IS NOT NULL AND p_domain <> '' THEN
        SELECT id, white_label_config INTO v_agency_id, v_config
        FROM public.profiles
        WHERE custom_domain = p_domain AND is_agency = true
        LIMIT 1;
    END IF;

    -- 2. If not found by domain, try resolving by current user's agency (Post-login / Level 1)
    IF v_config IS NULL AND p_user_id IS NOT NULL THEN
        -- Check if the user themselves is an agency
        SELECT id, white_label_config INTO v_agency_id, v_config
        FROM public.profiles
        WHERE id = p_user_id AND is_agency = true;

        -- If not an agency, check if their parent account is an agency
        IF v_config IS NULL THEN
            SELECT p.agency_id, a.white_label_config INTO v_agency_id, v_config
            FROM public.profiles p
            JOIN public.profiles a ON a.id = p.agency_id
            WHERE p.id = p_user_id AND a.is_agency = true;
        END IF;
    END IF;

    -- 3. Prepare response with defaults if missing
    IF v_config IS NULL THEN
        RETURN jsonb_build_object(
            'is_custom', false,
            'brand_name', '24Shift',
            'logo_url', '/logo.png',
            'primary_color', '#8B5CF6',
            'hide_credits', false
        );
    END IF;

    -- Merge config with defaults to ensure all keys exist
    RETURN jsonb_build_object(
        'is_custom', true,
        'agency_id', v_agency_id,
        'brand_name', COALESCE(v_config->>'brand_name', '24Shift'),
        'logo_url', COALESCE(v_config->>'logo_url', '/logo.png'),
        'primary_color', COALESCE(v_config->>'primary_color', '#8B5CF6'),
        'hide_credits', COALESCE((v_config->>'hide_credits')::boolean, false)
    );

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant access to both anonymous (for domain lookup) and authenticated users
GRANT EXECUTE ON FUNCTION public.get_branding_config(TEXT, UUID) TO anon;
GRANT EXECUTE ON FUNCTION public.get_branding_config(TEXT, UUID) TO authenticated;
