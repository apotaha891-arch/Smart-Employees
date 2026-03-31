-- ============================================================
-- 24Shift ARCHITECTURAL REFACTOR (Part 2): Logic & RPCs
-- ============================================================

BEGIN;

-- 1. UPDATE FUNCTIONS & RPCs (Re-creating with new names)
-- These ensure the Dashboard can read from 'entities' instead of 'salon_configs'

-- Drop old functions if they still exist under old logic
DROP FUNCTION IF EXISTS get_admin_agents();
DROP FUNCTION IF EXISTS get_admin_bookings();
DROP FUNCTION IF EXISTS get_admin_salon_configs();

-- 1.1 Update get_admin_agents
CREATE OR REPLACE FUNCTION get_admin_agents()
RETURNS TABLE (
    id UUID,
    name TEXT,
    specialty TEXT,
    status TEXT,
    business_type TEXT,
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF (auth.jwt() -> 'app_metadata' ->> 'role') != 'admin' THEN RAISE EXCEPTION 'Access denied'; END IF;
    RETURN QUERY SELECT a.id, a.name, a.specialty, a.status, a.business_type, a.entity_id, a.metadata, a.created_at FROM agents a ORDER BY a.created_at DESC;
END; $$;

-- 1.2 Update get_admin_bookings
CREATE OR REPLACE FUNCTION get_admin_bookings()
RETURNS TABLE (
    id UUID,
    customer_name TEXT,
    customer_phone TEXT,
    service_requested TEXT,
    booking_date TEXT,
    booking_time TEXT,
    status TEXT,
    entity_id UUID,
    agent_id UUID,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF (auth.jwt() -> 'app_metadata' ->> 'role') != 'admin' THEN RAISE EXCEPTION 'Access denied'; END IF;
    RETURN QUERY SELECT b.id, b.customer_name, b.customer_phone, b.service_requested, b.booking_date::text, b.booking_time::text, b.status, b.entity_id, b.agent_id, b.created_at FROM bookings b ORDER BY b.created_at DESC LIMIT 500;
END; $$;

-- 1.3 Create get_admin_entities (New replacement for get_admin_salon_configs)
CREATE OR REPLACE FUNCTION get_admin_entities()
RETURNS TABLE (
    id UUID,
    user_id UUID,
    business_type TEXT,
    agent_name TEXT,
    telegram_token TEXT,
    whatsapp_number TEXT,
    whatsapp_api_key TEXT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    IF (auth.jwt() -> 'app_metadata' ->> 'role') != 'admin' THEN RAISE EXCEPTION 'Access denied'; END IF;
    RETURN QUERY SELECT e.id, e.user_id, e.business_type, e.agent_name, e.telegram_token, e.whatsapp_number, e.whatsapp_api_key, e.created_at FROM entities e ORDER BY e.created_at DESC;
END; $$;

-- 2. UPDATE NOTIFICATION TRIGGER
-- This ensures notifications go to the right user when a booking happens

CREATE OR REPLACE FUNCTION notify_on_booking_event()
RETURNS TRIGGER AS $$
DECLARE
    v_entity_name TEXT;
    v_target_user_id UUID;
BEGIN
    -- Get User ID associated with this entity
    SELECT user_id, agent_name INTO v_target_user_id, v_entity_name FROM entities WHERE id = NEW.entity_id;

    -- Handle NEW BOOKING (INSERT)
    IF (TG_OP = 'INSERT') THEN
        INSERT INTO platform_notifications (type, title, message, user_id, metadata)
        VALUES (
            'new_booking',
            'حجز جديد: ' || NEW.customer_name,
            'تم تسجيل حجز جديد لخدمة ' || NEW.service_requested || ' في ' || NEW.booking_date || ' الساعة ' || NEW.booking_time,
            v_target_user_id,
            jsonb_build_object('booking_id', NEW.id, 'entity_id', NEW.entity_id)
        );
    END IF;

    -- Handle STATUS CHANGE (UPDATE)
    IF (TG_OP = 'UPDATE') AND (OLD.status IS DISTINCT FROM NEW.status) THEN
        INSERT INTO platform_notifications (type, title, message, user_id, metadata)
        VALUES (
            'booking_update',
            'تحديث حجز: ' || NEW.customer_name,
            'تم تغيير حالة الحجز إلى ' || NEW.status,
            v_target_user_id,
            jsonb_build_object('booking_id', NEW.id, 'status', NEW.status)
        );
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger
DROP TRIGGER IF EXISTS tr_booking_notification ON bookings;
CREATE TRIGGER tr_booking_notification
AFTER INSERT OR UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION notify_on_booking_event();

-- 3. PERMISSIONS
GRANT EXECUTE ON FUNCTION get_admin_entities() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_agents() TO authenticated;
GRANT EXECUTE ON FUNCTION get_admin_bookings() TO authenticated;

COMMIT;
