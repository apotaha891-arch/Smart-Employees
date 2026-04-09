-- 1. Add custom_domain column to profiles if it doesn't exist
-- This allows for B-tree indexing on domains for sub-millisecond lookups
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pf_get_column_info('profiles', 'custom_domain')) THEN
        ALTER TABLE public.profiles ADD COLUMN custom_domain TEXT UNIQUE;
    END IF;
END $$;

-- 2. Update the branding RPC to be more robust and use the column
CREATE OR REPLACE FUNCTION public.get_branding_config(
    p_domain    TEXT DEFAULT NULL,
    p_user_id   UUID DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
    v_config     JSONB;
    v_agency_id  UUID;
BEGIN
    -- 1. Try resolving by custom domain (Pre-login)
    IF p_domain IS NOT NULL AND p_domain <> '' THEN
        -- Check column first (index-optimized)
        SELECT id, white_label_config INTO v_agency_id, v_config
        FROM public.profiles
        WHERE custom_domain = p_domain AND is_agency = true
        LIMIT 1;

        -- Fallback: check inside JSONB if column sync lag exists
        IF v_config IS NULL THEN
            SELECT id, white_label_config INTO v_agency_id, v_config
            FROM public.profiles
            WHERE (white_label_config->>'custom_domain') = p_domain AND is_agency = true
            LIMIT 1;
        END IF;
    END IF;

    -- 2. If not found by domain, try resolving by current user's agency (Post-login)
    IF v_config IS NULL AND p_user_id IS NOT NULL THEN
        SELECT id, white_label_config INTO v_agency_id, v_config
        FROM public.profiles
        WHERE id = p_user_id AND is_agency = true;

        IF v_config IS NULL THEN
            SELECT p.agency_id, a.white_label_config INTO v_agency_id, v_config
            FROM public.profiles p
            JOIN public.profiles a ON a.id = p.agency_id
            WHERE p.id = p_user_id AND a.is_agency = true;
        END IF;
    END IF;

    -- 3. Return object
    IF v_config IS NULL THEN
        RETURN jsonb_build_object(
            'is_custom', false,
            'brand_name', '24Shift',
            'logo_url', '/logo.png',
            'primary_color', '#8B5CF6',
            'hide_credits', false
        );
    END IF;

    RETURN jsonb_build_object(
        'is_custom', true,
        'agency_id', v_agency_id,
        'brand_name', COALESCE(v_config->>'brand_name', '24Shift'),
        'logo_url', COALESCE(v_config->>'logo_url', '/logo.png'),
        'primary_color', COALESCE(v_config->>'primary_color', '#8B5CF6'),
        'hide_credits', COALESCE((v_config->>'hide_credits')::boolean, false),
        'custom_domain', COALESCE(v_config->>'custom_domain', '')
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Add trigger to automatically sync the column from JSONB updates
CREATE OR REPLACE FUNCTION sync_custom_domain_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.custom_domain := NEW.white_label_config->>'custom_domain';
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_sync_custom_domain ON public.profiles;
CREATE TRIGGER tr_sync_custom_domain
BEFORE INSERT OR UPDATE OF white_label_config ON public.profiles
FOR EACH ROW EXECUTE FUNCTION sync_custom_domain_column();

-- 4. Initial sync for existing records
UPDATE public.profiles 
SET custom_domain = white_label_config->>'custom_domain'
WHERE is_agency = true AND white_label_config->>'custom_domain' IS NOT NULL;
