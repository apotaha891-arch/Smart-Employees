-- ============================================================
-- Google Sheets Sync Trigger
-- Automatically pushes new bookings to the sheets-sync function
-- ============================================================

-- 1. Create the trigger function
CREATE OR REPLACE FUNCTION on_booking_created_sync_sheets()
RETURNS TRIGGER AS $$
DECLARE
    v_function_url TEXT := 'https://dydflepcfdrlslpxapqo.supabase.co/functions/v1/sheets-sync'; -- YOUR PROJECT REF
    v_service_role_key TEXT := '-'; -- Note: Supabase Webhooks handles keys securely if set via Dashboard
BEGIN
    -- We use the native Supabase http_request if available, 
    -- but for standard migrations, we just define the intent.
    -- In a real Supabase environment, this is best done via the Dashboard 'Database Webhooks'
    -- However, we can use a generic HTTP POST if pg_net is enabled.

    PERFORM
      net.http_post(
        url := v_function_url,
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || (SELECT value FROM platform_settings WHERE key = 'service_role_key') -- Dynamic lookup if stored
        ),
        body := jsonb_build_object(
          'type', 'INSERT',
          'record', row_to_json(NEW)
        )::jsonb
      );

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Attach trigger to bookings table
DROP TRIGGER IF EXISTS tr_sync_to_sheets ON bookings;
CREATE TRIGGER tr_sync_to_sheets
AFTER INSERT ON bookings
FOR EACH ROW
EXECUTE FUNCTION on_booking_created_sync_sheets();
