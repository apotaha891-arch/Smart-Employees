-- UPDATE: Remove User-based branding resolution (Level 1)
-- Branding will now ONLY be resolved by Domain (Level 2)
CREATE OR REPLACE FUNCTION public.get_branding_config(
    p_domain    TEXT DEFAULT NULL,
    p_user_id   UUID DEFAULT NULL -- Kept for signature compatibility, but unused
)
RETURNS JSONB AS $$
DECLARE
    v_config     JSONB;
    v_agency_id  UUID;
BEGIN
    -- 1. Try resolving ONLY by custom domain
    -- Level 1 (Post-login / User ID) branding is now DISABLED.
    IF p_domain IS NOT NULL AND p_domain <> '' THEN
        SELECT id, white_label_config INTO v_agency_id, v_config
        FROM public.profiles
        WHERE custom_domain = p_domain AND is_agency = true
        LIMIT 1;
    END IF;

    -- 2. Prepare response with defaults if missing (always defaults for main domain)
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
