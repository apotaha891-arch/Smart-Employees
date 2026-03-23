-- 1. Add Instagram fields to salon_configs
ALTER TABLE IF EXISTS salon_configs ADD COLUMN IF NOT EXISTS instagram_token TEXT;
ALTER TABLE IF EXISTS salon_configs ADD COLUMN IF NOT EXISTS instagram_settings JSONB DEFAULT '{}'::jsonb;

-- 2. Update get_admin_salon_configs RPC
DROP FUNCTION IF EXISTS get_admin_salon_configs();

CREATE OR REPLACE FUNCTION get_admin_salon_configs()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    business_type TEXT,
    agent_name TEXT,
    telegram_token TEXT,
    whatsapp_number TEXT,
    whatsapp_api_key TEXT,
    instagram_token TEXT,
    instagram_settings JSONB,
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
        sc.instagram_token, sc.instagram_settings,
        sc.created_at
    FROM salon_configs sc
    ORDER BY sc.created_at DESC;
END;
$$;

GRANT EXECUTE ON FUNCTION get_admin_salon_configs() TO authenticated;
