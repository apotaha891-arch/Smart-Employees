-- ============================================================
-- 24Shift Schema Fixes
-- ============================================================

-- 1. Add metadata column to agents table if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'agents' AND COLUMN_NAME = 'metadata') THEN
        ALTER TABLE agents ADD COLUMN metadata JSONB DEFAULT '{}'::jsonb;
    END IF;
END $$;

-- 2. Ensure agent_templates table is created (Backup in case 02 wasn't run)
CREATE TABLE IF NOT EXISTS agent_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT NOT NULL,
    description TEXT,
    specialty TEXT,
    business_type TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    is_active BOOLEAN DEFAULT true
);

-- Note: Ensure 01_core_infrastructure.sql was also run for platform_settings.
