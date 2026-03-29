-- SCALABILITY & AUTOMATION UPGRADE

-- 1. Create a table for tracking automated notifications (Audit Trail)
CREATE TABLE IF NOT EXISTS notification_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE,
    session_id TEXT,
    status TEXT,
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    error_msg TEXT
);

-- 2. Function for automated notification triggering
CREATE OR REPLACE FUNCTION notify_on_booking_change()
RETURNS TRIGGER AS $$
BEGIN
    IF (OLD.status IS DISTINCT FROM NEW.status) AND (NEW.status IN ('confirmed', 'cancelled')) THEN
        INSERT INTO notification_logs (booking_id, session_id, status)
        VALUES (NEW.id, NEW.session_id, NEW.status);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger
DROP TRIGGER IF EXISTS tr_booking_notification ON bookings;
CREATE TRIGGER tr_booking_notification
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION notify_on_booking_change();

-- 4. Scalable tool management
ALTER TABLE agents ADD COLUMN IF NOT EXISTS tool_permissions JSONB DEFAULT '[]';
