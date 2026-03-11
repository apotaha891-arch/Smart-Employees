-- ============================================================
-- 10_add_widget_config_to_salon_configs.sql
-- Adds missing columns for integration and widget configuration
-- ============================================================

DO $$ 
BEGIN
    -- Business Profile Columns
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'salon_configs' AND COLUMN_NAME = 'description') THEN
        ALTER TABLE salon_configs ADD COLUMN description TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'salon_configs' AND COLUMN_NAME = 'phone') THEN
        ALTER TABLE salon_configs ADD COLUMN phone TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'salon_configs' AND COLUMN_NAME = 'address') THEN
        ALTER TABLE salon_configs ADD COLUMN address TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'salon_configs' AND COLUMN_NAME = 'website') THEN
        ALTER TABLE salon_configs ADD COLUMN website TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'salon_configs' AND COLUMN_NAME = 'whatsapp_number') THEN
        ALTER TABLE salon_configs ADD COLUMN whatsapp_number TEXT;
    END IF;

    -- Integration Columns
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'salon_configs' AND COLUMN_NAME = 'telegram_token') THEN
        ALTER TABLE salon_configs ADD COLUMN telegram_token TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'salon_configs' AND COLUMN_NAME = 'whatsapp_api_key') THEN
        ALTER TABLE salon_configs ADD COLUMN whatsapp_api_key TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'salon_configs' AND COLUMN_NAME = 'google_sheets_id') THEN
        ALTER TABLE salon_configs ADD COLUMN google_sheets_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'salon_configs' AND COLUMN_NAME = 'google_calendar_id') THEN
        ALTER TABLE salon_configs ADD COLUMN google_calendar_id TEXT;
    END IF;

    -- Widget & Website Integration Columns
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'salon_configs' AND COLUMN_NAME = 'app_base_url') THEN
        ALTER TABLE salon_configs ADD COLUMN app_base_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'salon_configs' AND COLUMN_NAME = 'welcome_message') THEN
        ALTER TABLE salon_configs ADD COLUMN welcome_message TEXT;
    END IF;

END $$;
