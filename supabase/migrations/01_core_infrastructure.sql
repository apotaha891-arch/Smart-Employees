-- ============================================================
-- 24Shift Core Infrastructure Migration
-- ============================================================

-- 1. Centralized System Logs
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    level TEXT DEFAULT 'info', -- info, warn, error, audit
    category TEXT, -- auth, agent, booking, rpc, system
    message TEXT,
    details JSONB, -- error stack, payload, context
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    metadata JSONB -- browser info, ip, etc.
);

-- Enable RLS for logs
ALTER TABLE system_logs ENABLE ROW LEVEL SECURITY;

-- Allow admins to read logs
CREATE POLICY "Admins can read logs" ON system_logs
    FOR SELECT USING ( (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin' );

-- Allow authenticated users (and RPCs) to insert logs
CREATE POLICY "Anyone can insert logs" ON system_logs
    FOR INSERT WITH CHECK ( true );

-- 2. Initialize Platform Settings with Dynamic Constants
CREATE TABLE IF NOT EXISTS platform_settings (
    key TEXT PRIMARY KEY,
    value JSONB,
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Sectors Configuration
INSERT INTO platform_settings (key, value)
VALUES ('system_sectors', '{
    "beauty": { "l": "تجميل", "e": "🌸", "c": "#EC4899", "on": true },
    "medical": { "l": "طبي", "e": "🩺", "c": "#3B82F6", "on": true },
    "restaurant": { "l": "مطاعم", "e": "🍽", "c": "#F59E0B", "on": true },
    "fitness": { "l": "رياضة", "e": "🏋", "c": "#10B981", "on": false },
    "real_estate": { "l": "عقارات", "e": "🏠", "c": "#8B5CF6", "on": false },
    "general": { "l": "عام", "e": "🏢", "c": "#6B7280", "on": true }
}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Roles Configuration
INSERT INTO platform_settings (key, value)
VALUES ('system_roles', '{
    "booking": { "l": "منسقة حجوزات", "c": "#8B5CF6" },
    "support": { "l": "خدمة عملاء", "c": "#10B981" },
    "sales": { "l": "مبيعات", "c": "#F59E0B" },
    "followup": { "l": "متابعة", "c": "#3B82F6" }
}')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- Agent Apps Configuration
INSERT INTO platform_settings (key, value)
VALUES ('system_agent_apps', '[
    { "id": "email_notify", "label": "إشعار بريد إلكتروني", "desc": "رسالة للمدير عند كل حجز جديد" },
    { "id": "sms_notify", "label": "إشعار SMS", "desc": "رسالة نصية للعميل بتأكيد حجزه" },
    { "id": "reminder", "icon": "Bell", "label": "تذكير قبل الموعد", "desc": "تذكير آلي قبل الموعد بساعة" },
    { "id": "followup", "icon": "Zap", "label": "متابعة بعد الخدمة", "desc": "رسالة متابعة بعد 24 ساعة من الموعد" }
]')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- 3. Security Definer Function for Logging (to ensure system can log even if RLS is tight)
CREATE OR REPLACE FUNCTION log_system_event(
    p_level TEXT,
    p_category TEXT,
    p_message TEXT,
    p_details JSONB DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    INSERT INTO system_logs (level, category, message, details, metadata, user_id)
    VALUES (p_level, p_category, p_message, p_details, p_metadata, auth.uid());
END;
$$;
