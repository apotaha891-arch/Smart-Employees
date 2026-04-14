-- ==========================================
-- Migration 103: Add RLS policies for entity_services
-- Fixes "403 Forbidden" error for service management
-- ==========================================

BEGIN;

-- 1. Ensure RLS is enabled
ALTER TABLE entity_services ENABLE ROW LEVEL SECURITY;

-- 2. DROP existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Users can view their own entity services" ON entity_services;
DROP POLICY IF EXISTS "Users can insert their own entity services" ON entity_services;
DROP POLICY IF EXISTS "Users can update their own entity services" ON entity_services;
DROP POLICY IF EXISTS "Users can delete their own entity services" ON entity_services;

-- 3. SELECT: Users can view services for entities they own
CREATE POLICY "Users can view their own entity services"
ON entity_services FOR SELECT
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM entities
        WHERE entities.id = entity_services.entity_id
        AND entities.user_id = auth.uid()
    )
);

-- 4. INSERT: Users can insert services for entities they own
CREATE POLICY "Users can insert their own entity services"
ON entity_services FOR INSERT
TO authenticated
WITH CHECK (
    EXISTS (
        SELECT 1 FROM entities
        WHERE entities.id = entity_services.entity_id
        AND entities.user_id = auth.uid()
    )
);

-- 5. UPDATE: Users can update services for entities they own
CREATE POLICY "Users can update their own entity services"
ON entity_services FOR UPDATE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM entities
        WHERE entities.id = entity_services.entity_id
        AND entities.user_id = auth.uid()
    )
);

-- 6. DELETE: Users can delete services for entities they own
CREATE POLICY "Users can delete their own entity services"
ON entity_services FOR DELETE
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM entities
        WHERE entities.id = entity_services.entity_id
        AND entities.user_id = auth.uid()
    )
);

-- 7. PUBLIC SELECT (For the AI Agent/Public Web Chat)
-- Allow anyone to read services if we want the public agent to work without user auth
-- (Optional: adjust if privacy is a concern, but usually services are public info)
CREATE POLICY "Allow public read-access to services"
ON entity_services FOR SELECT
TO anon, authenticated
USING (true);

COMMIT;
