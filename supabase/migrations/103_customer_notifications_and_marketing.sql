-- ============================================================
-- 103_customer_notifications_and_marketing.sql
-- Enables customer notifications and marketing broadcasts
-- ============================================================

BEGIN;

-- 1. Standardize customers table (Rename salon_config_id to entity_id)
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'customers' AND COLUMN_NAME = 'salon_config_id') THEN
        ALTER TABLE customers RENAME COLUMN salon_config_id TO entity_id;
    END IF;
END $$;

-- 2. Create customer_broadcasts table
CREATE TABLE IF NOT EXISTS customer_broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Business Owner
    entity_id UUID REFERENCES entities(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_audiences JSONB DEFAULT '["all"]'::jsonb, -- e.g. ["all"], ["telegram"], ["beauty"]
    status TEXT DEFAULT 'pending', -- pending, sent, failed
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 3. Create customer_notifications table (To track history of messages sent to individuals)
CREATE TABLE IF NOT EXISTS customer_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    customer_id UUID REFERENCES customers(id) ON DELETE CASCADE,
    entity_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    broadcast_id UUID REFERENCES customer_broadcasts(id) ON DELETE CASCADE, -- Optional
    type TEXT NOT NULL, -- 'booking_update', 'marketing', 'chat_reply'
    platform TEXT NOT NULL, -- 'telegram', 'instagram'
    message TEXT NOT NULL,
    status TEXT DEFAULT 'sent',
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Automation: Notify Customer on Booking Confirmed
CREATE OR REPLACE FUNCTION notify_customer_on_booking_status()
RETURNS TRIGGER AS $$
DECLARE
    v_customer_id UUID;
    v_telegram_id TEXT;
    v_message TEXT;
BEGIN
    -- Only trigger if status changes 
    IF (TG_OP = 'UPDATE') AND (OLD.status IS DISTINCT FROM NEW.status) THEN
        
        -- Find customer record by matching phone/name (or link if possible)
        SELECT id, telegram_id INTO v_customer_id, v_telegram_id 
        FROM customers 
        WHERE (customer_phone = NEW.customer_phone OR customer_name = NEW.customer_name)
          AND entity_id = NEW.entity_id
        LIMIT 1;

        IF v_telegram_id IS NOT NULL THEN
            v_message := '🔔 تحديث لحجزك: ' || NEW.customer_name || '. حالة الحجز الآن هي: ' || NEW.status;
            
            -- Insert into notification tracking table
            -- This will be picked up by a cron or edge function if needed, 
            -- or we can trigger the edge function via HTTP if configured.
            -- For now, we log it.
            INSERT INTO customer_notifications (customer_id, entity_id, type, platform, message)
            VALUES (v_customer_id, NEW.entity_id, 'booking_update', 'telegram', v_message);
        END IF;

    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DROP TRIGGER IF EXISTS tr_customer_booking_notification ON bookings;
CREATE TRIGGER tr_customer_booking_notification
AFTER UPDATE ON bookings
FOR EACH ROW
EXECUTE FUNCTION notify_customer_on_booking_status();

-- 5. RLS Policies
ALTER TABLE customer_broadcasts ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own broadcasts" ON customer_broadcasts
FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view their customers notifications" ON customer_notifications
FOR SELECT USING (
    entity_id IN (SELECT id FROM entities WHERE user_id = auth.uid())
);

COMMIT;
