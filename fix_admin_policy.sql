-- SQL to fix Admin permissions for salon_configs

-- Ensure the existing policy allows Admins to UPDATE
-- This assumes admins have 'is_admin': true in their app_metadata 
-- or a similar check in the profiles table.

DO $$
BEGIN
    -- 1. Create a policy for Admins to UPDATE any salon_config
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'salon_configs' AND policyname = 'Admins can update all salon configs'
    ) THEN
        CREATE POLICY "Admins can update all salon configs" 
        ON salon_configs
        FOR UPDATE
        TO authenticated
        USING ( (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true )
        WITH CHECK ( (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true );
    END IF;

    -- 2. Create a policy for Admins to SELECT any salon_config
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'salon_configs' AND policyname = 'Admins can view all salon configs'
    ) THEN
        CREATE POLICY "Admins can view all salon configs" 
        ON salon_configs
        FOR SELECT
        TO authenticated
        USING ( (auth.jwt() -> 'app_metadata' ->> 'is_admin')::boolean = true );
    END IF;
END $$;

-- Also ensure the specific 'admin' role (if defined) has permissions
GRANT ALL ON TABLE salon_configs TO authenticated;
