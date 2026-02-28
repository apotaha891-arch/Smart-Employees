-- ============================================================
-- 24Shift MASTER INFRASTRUCTURE FIX (V2)
-- Run this in Supabase SQL Editor to sync your DB
-- ============================================================

-- 1. Create system_logs table
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
CREATE POLICY "Admins can read logs" ON system_logs FOR SELECT USING ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' );
CREATE POLICY "Anyone can insert logs" ON system_logs FOR INSERT WITH CHECK ( true );

-- 2. Ensure platform_settings exists and has default values
CREATE TABLE IF NOT EXISTS platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMPTZ DEFAULT now()
);

INSERT INTO platform_settings (key, value)
VALUES 
('system_sectors', '{"beauty": {"l": "تجميل", "e": "🌸", "c": "#EC4899", "on": true}, "medical": {"l": "طبي", "e": "🩺", "c": "#3B82F6", "on": true}, "restaurant": {"l": "مطاعم", "e": "🍽", "c": "#F59E0B", "on": true}, "fitness": {"l": "رياضة", "e": "🏋", "c": "#10B981", "on": false}, "real_estate": {"l": "عقارات", "e": "🏠", "c": "#8B5CF6", "on": false}, "general": {"l": "عام", "e": "🏢", "c": "#6B7280", "on": true}}'),
('system_roles', '{"booking": {"l": "منسقة حجوزات", "c": "#8B5CF6"}, "support": {"l": "خدمة عملاء", "c": "#10B981"}, "sales": {"l": "مبيعات", "c": "#F59E0B"}, "followup": {"l": "متابعة", "c": "#3B82F6"}}'),
('system_agent_apps', '[{"id": "email_notify", "label": "إشعار بريد إلكتروني", "desc": "رسالة للمدير عند كل حجز جديد"}, {"id": "sms_notify", "label": "إشعار SMS", "desc": "رسالة نصية للعميل بتأكيد حجزه"}, {"id": "reminder", "icon": "Bell", "label": "تذكير قبل الموعد", "desc": "تذكير آلي قبل الموعد بساعة"}, {"id": "followup", "icon": "Zap", "label": "متابعة بعد الخدمة", "desc": "رسالة متابعة بعد 24 ساعة من الموعد"}]')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3. Logging Function (Security Definer)
CREATE OR REPLACE FUNCTION log_system_event(p_level TEXT, p_category TEXT, p_message TEXT, p_details JSONB DEFAULT NULL, p_metadata JSONB DEFAULT NULL)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    INSERT INTO system_logs (level, category, message, details, metadata, user_id)
    VALUES (p_level, p_category, p_message, p_details, p_metadata, auth.uid());
END; $$;

-- 4. Fix Agent Schema
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'agents' AND COLUMN_NAME = 'metadata') THEN
        ALTER TABLE agents ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 5. Agent Templates Table
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
CREATE POLICY "Anyone can view active templates" ON agent_templates FOR SELECT USING ( is_active = true );
CREATE POLICY "Admins can manage templates" ON agent_templates FOR ALL USING ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' );

-- 6. Admin RPC Functions
DROP FUNCTION IF EXISTS get_admin_clients();
CREATE OR REPLACE FUNCTION get_admin_clients() RETURNS TABLE (id UUID, full_name TEXT, email TEXT, subscription_tier TEXT, created_at TIMESTAMPTZ, role TEXT)
LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN
    IF (auth.jwt() -> 'app_metadata' ->> 'role') != 'admin' THEN RAISE EXCEPTION 'Access denied'; END IF;
    RETURN QUERY SELECT p.id, p.full_name, p.email, p.subscription_tier, p.created_at, p.role FROM profiles p ORDER BY p.created_at DESC;
END; $$;

DROP FUNCTION IF EXISTS get_admin_agents();
CREATE OR REPLACE FUNCTION get_admin_agents() RETURNS TABLE (id UUID, name TEXT, specialty TEXT, status TEXT, business_type TEXT, salon_config_id UUID, metadata JSONB, created_at TIMESTAMPTZ)
LANGUAGE plpgsql SECURITY DEFINER AS $$ BEGIN
    IF (auth.jwt() -> 'app_metadata' ->> 'role') != 'admin' THEN RAISE EXCEPTION 'Access denied'; END IF;
    RETURN QUERY SELECT a.id, a.name, a.specialty, a.status, a.business_type, a.salon_config_id, a.metadata, a.created_at FROM agents a ORDER BY a.created_at DESC;
END; $$;

GRANT EXECUTE ON FUNCTION get_admin_clients() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_agents() TO authenticated;
GRANT EXECUTE ON FUNCTION log_system_event(TEXT, TEXT, TEXT, JSONB, JSONB) TO authenticated;
