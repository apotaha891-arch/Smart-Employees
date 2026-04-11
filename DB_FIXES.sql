-- DB_FIXES.sql (Fixed Indempotent Version)

-- 1. Explicitly name the Foreign Key for white_label_requests to help Supabase Join logic
-- First, drop the unnamed reference if it exists
ALTER TABLE IF EXISTS white_label_requests 
DROP CONSTRAINT IF EXISTS white_label_requests_user_id_fkey;

ALTER TABLE IF EXISTS white_label_requests
ADD CONSTRAINT white_label_requests_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;

-- 2. Add an RPC to fetch Academy Leads with profile join
CREATE OR REPLACE FUNCTION get_admin_academy_leads()
RETURNS TABLE (
    id UUID,
    full_name TEXT,
    whatsapp TEXT,
    email TEXT,
    user_type TEXT,
    industry TEXT,
    status TEXT,
    created_at TIMESTAMPTZ,
    referrer_code TEXT,
    referrer_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id,
        al.full_name,
        al.whatsapp,
        al.email,
        al.user_type,
        al.industry,
        al.status,
        al.created_at,
        af.affiliate_code as referrer_code,
        p.full_name as referrer_name
    FROM academy_leads al
    LEFT JOIN academy_affiliates af ON al.referrer_id = af.id
    LEFT JOIN profiles p ON af.user_id = p.id
    ORDER BY al.created_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
