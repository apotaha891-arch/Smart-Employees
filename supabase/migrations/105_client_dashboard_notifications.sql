-- ============================================================
-- 105. Client Dashboard Notifications (Owner Alerts)
-- ============================================================

-- 1. Create client_notifications table
CREATE TABLE IF NOT EXISTS client_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    type TEXT DEFAULT 'system', -- booking, inquiry, system, wallet
    title_ar TEXT,
    title_en TEXT,
    message_ar TEXT,
    message_en TEXT,
    is_read BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- Enable RLS
ALTER TABLE client_notifications ENABLE ROW LEVEL SECURITY;

-- 2. Policies
DROP POLICY IF EXISTS "Users can view their own notifications" ON client_notifications;
CREATE POLICY "Users can view their own notifications" ON client_notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON client_notifications;
CREATE POLICY "Users can update their own notifications" ON client_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- 3. Trigger for New Bookings
CREATE OR REPLACE FUNCTION tr_notify_owner_on_booking()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_biz_name TEXT;
BEGIN
    -- Get the owner (user_id) linked to this entity
    SELECT user_id, agent_name INTO v_user_id, v_biz_name FROM entities WHERE id = NEW.entity_id;
    
    IF v_user_id IS NOT NULL THEN
        INSERT INTO client_notifications (user_id, entity_id, type, title_ar, title_en, message_ar, message_en, metadata)
        VALUES (
            v_user_id, 
            NEW.entity_id, 
            'booking',
            'حجز جديد - ' || COALESCE(NEW.customer_name, 'عميل'),
            'New Booking - ' || COALESCE(NEW.customer_name, 'Guest'),
            'لديك حجز جديد بتاريخ ' || NEW.booking_date || ' الساعة ' || NEW.booking_time,
            'You have a new booking on ' || NEW.booking_date || ' at ' || NEW.booking_time,
            jsonb_build_object('booking_id', NEW.id)
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_on_booking_notify ON bookings;
CREATE TRIGGER tr_on_booking_notify
    AFTER INSERT ON bookings
    FOR EACH ROW EXECUTE FUNCTION tr_notify_owner_on_booking();

-- 4. Trigger for New Inquiries (Concierge Chat)
CREATE OR REPLACE FUNCTION tr_notify_owner_on_inquiry()
RETURNS TRIGGER AS $$
DECLARE
    v_user_id UUID;
    v_last_role TEXT;
    v_last_msg TEXT;
BEGIN
    -- Only trigger if it's a guest conversation linked to an ENTITY (or if we can find the owner)
    -- This assumes concierge_conversations has an entity_id or we can derive it
    
    -- Check the last message role
    SELECT (m->>'role')::TEXT, (m->>'content')::TEXT
    INTO v_last_role, v_last_msg
    FROM jsonb_array_elements(NEW.messages) m
    ORDER BY (m->>'timestamp')::TIMESTAMPTZ DESC
    LIMIT 1;

    -- If the role is 'user', it's a customer asking something
    IF v_last_role = 'user' THEN
        -- Find the owner of the entity associated with this conversation
        -- (Ideally cc table has entity_id, if not, we might need a lookup)
        -- For now, let's look for any entity that could be the target (simplified)
        SELECT user_id INTO v_user_id FROM entities 
        WHERE id = (NEW.metadata->>'entity_id')::UUID 
        OR user_id = NEW.user_id -- backup
        LIMIT 1;

        IF v_user_id IS NOT NULL THEN
            INSERT INTO client_notifications (user_id, entity_id, type, title_ar, title_en, message_ar, message_en, metadata)
            VALUES (
                v_user_id,
                (NEW.metadata->>'entity_id')::UUID,
                'inquiry',
                'رسالة جديدة من عميل',
                'New Customer Inquiry',
                'وصلتك رسالة جديدة: ' || LEFT(v_last_msg, 50) || '...',
                'New message received: ' || LEFT(v_last_msg, 50) || '...',
                jsonb_build_object('conversation_id', NEW.id)
            );
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_on_inquiry_notify ON concierge_conversations;
CREATE TRIGGER tr_on_inquiry_notify
    AFTER UPDATE ON concierge_conversations
    FOR EACH ROW WHEN (OLD.messages != NEW.messages)
    EXECUTE FUNCTION tr_notify_owner_on_inquiry();
