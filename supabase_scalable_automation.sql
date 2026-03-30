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
CREATE OR REPLACE FUNCTION notify_on_booking_event()
RETURNS TRIGGER AS $$
DECLARE
    v_salon_name TEXT;
BEGIN
    -- Get Business Name for the notification
    SELECT business_name INTO v_salon_name FROM salon_configs WHERE id = NEW.salon_config_id;

    -- Handle NEW BOOKING (INSERT)
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO platform_notifications (type, title, message, user_id, metadata)
        VALUES (
            'new_booking',
            'حجز جديد: ' || NEW.customer_name,
            'تم تسجيل حجز جديد لخدمة ' || NEW.service_requested || ' في ' || NEW.booking_date || ' الساعة ' || NEW.booking_time,
            (SELECT user_id FROM salon_configs WHERE id = NEW.salon_config_id),
            jsonb_build_object('booking_id', NEW.id, 'salon_id', NEW.salon_config_id)
        );
        
        INSERT INTO notification_logs (booking_id, session_id, status)
        VALUES (NEW.id, NEW.session_id, 'created');
    END IF;

    -- Handle STATUS CHANGE (UPDATE)
    IF (TG_OP = 'UPDATE') AND (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO platform_notifications (type, title, message, user_id, metadata)
        VALUES (
            'booking_update',
            'تحديث حجز: ' || NEW.customer_name,
            'تم تغيير حالة الحجز إلى ' || NEW.status,
            (SELECT user_id FROM salon_configs WHERE id = NEW.salon_config_id),
            jsonb_build_object('booking_id', NEW.id, 'status', NEW.status)
        );

        INSERT INTO notification_logs (booking_id, session_id, status)
        VALUES (NEW.id, NEW.session_id, NEW.status);
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create the trigger for both INSERT and UPDATE
DROP TRIGGER IF EXISTS tr_booking_notification ON bookings;
CREATE TRIGGER tr_booking_notification
AFTER INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION notify_on_booking_event();

-- 4. Scalable tool management
ALTER TABLE agents ADD COLUMN IF NOT EXISTS tool_permissions JSONB DEFAULT '[]';
