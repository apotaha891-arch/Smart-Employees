-- 14_notifications.sql
-- Create platform_notifications table to store system-wide alerts

CREATE TABLE IF NOT EXISTS platform_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    type TEXT NOT NULL, -- 'new_chat', 'new_booking', 'system_error', etc.
    title TEXT NOT NULL,
    message TEXT,
    link TEXT, -- Internal dashboard link
    metadata JSONB DEFAULT '{}'::jsonb,
    is_read BOOLEAN DEFAULT false,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE -- Optional: if targetted to specific user
);

-- Enable RLS
ALTER TABLE platform_notifications ENABLE ROW LEVEL SECURITY;

-- Policies for Admins
CREATE POLICY "Admins can view all notifications" ON platform_notifications 
FOR SELECT USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can update notifications" ON platform_notifications 
FOR UPDATE USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

CREATE POLICY "Admins can delete notifications" ON platform_notifications 
FOR DELETE USING ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

-- Allow service_role to insert (for edge functions/RPCs)
CREATE POLICY "Service role can insert notifications" ON platform_notifications 
FOR INSERT WITH CHECK (true);

-- Utility function to notify admin
CREATE OR REPLACE FUNCTION notify_admin(
    p_type TEXT,
    p_title TEXT,
    p_message TEXT,
    p_link TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
    v_id UUID;
BEGIN
    INSERT INTO platform_notifications (type, title, message, link, metadata)
    VALUES (p_type, p_title, p_message, p_link, p_metadata)
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
