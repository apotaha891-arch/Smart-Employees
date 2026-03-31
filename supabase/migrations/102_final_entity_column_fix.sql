BEGIN;

-- 1. Update entity_services columns
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'entity_services' AND COLUMN_NAME = 'salon_config_id') THEN
        ALTER TABLE entity_services RENAME COLUMN salon_config_id TO entity_id;
    END IF;
END $$;

-- 2. Update integrations columns
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'integrations' AND COLUMN_NAME = 'salon_config_id') THEN
        ALTER TABLE integrations RENAME COLUMN salon_config_id TO entity_id;
    END IF;
END $$;

-- 3. Update notification_logs columns - for safety
DO $$ BEGIN
    IF EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'notification_logs' AND COLUMN_NAME = 'salon_config_id') THEN
        ALTER TABLE notification_logs RENAME COLUMN salon_config_id TO entity_id;
    END IF;
END $$;

COMMIT;
