-- FINAL FIX FOR CUSTOM_REQUESTS RLS POLICY & SCHEMA

-- 1. Ensure the table exists with ALL required columns
CREATE TABLE IF NOT EXISTS custom_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id), -- Optional: Track who made the request
    business_type TEXT,
    required_tasks TEXT,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    status TEXT DEFAULT 'pending',
    -- Additional fields from CustomRequest.jsx
    preferred_language TEXT,
    integrations TEXT,
    -- Additional fields from DeployAgent.jsx
    request_type TEXT,
    description TEXT,
    contact_preference TEXT,
    agent_id UUID,
    agent_name TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add columns if table already existed (Safety check for existing projects)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'custom_requests' AND COLUMN_NAME = 'preferred_language') THEN
        ALTER TABLE custom_requests ADD COLUMN preferred_language TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'custom_requests' AND COLUMN_NAME = 'integrations') THEN
        ALTER TABLE custom_requests ADD COLUMN integrations TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'custom_requests' AND COLUMN_NAME = 'request_type') THEN
        ALTER TABLE custom_requests ADD COLUMN request_type TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'custom_requests' AND COLUMN_NAME = 'description') THEN
        ALTER TABLE custom_requests ADD COLUMN description TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'custom_requests' AND COLUMN_NAME = 'contact_preference') THEN
        ALTER TABLE custom_requests ADD COLUMN contact_preference TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'custom_requests' AND COLUMN_NAME = 'agent_id') THEN
        ALTER TABLE custom_requests ADD COLUMN agent_id UUID;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'custom_requests' AND COLUMN_NAME = 'agent_name') THEN
        ALTER TABLE custom_requests ADD COLUMN agent_name TEXT;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'custom_requests' AND COLUMN_NAME = 'user_id') THEN
        ALTER TABLE custom_requests ADD COLUMN user_id UUID REFERENCES auth.users(id);
    END IF;
END $$;

-- 3. Enable RLS
ALTER TABLE custom_requests ENABLE ROW LEVEL SECURITY;

-- 4. DROP all existing policies to avoid "already exists" errors
DROP POLICY IF EXISTS "Allow public insert for custom_requests" ON custom_requests;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON custom_requests;
DROP POLICY IF EXISTS "Allow authenticated select for custom_requests" ON custom_requests;
DROP POLICY IF EXISTS "Admins can manage all custom_requests" ON custom_requests;
DROP POLICY IF EXISTS "Allow public insert" ON custom_requests;
DROP POLICY IF EXISTS "Admins manage all" ON custom_requests;

-- 5. Create INSERT Policy: Allow anyone (anon + auth) to insert
CREATE POLICY "Allow public insert" 
ON custom_requests 
FOR INSERT 
TO public
WITH CHECK (true);

-- 6. Create SELECT/UPDATE Policy: Admins can see/manage everything
CREATE POLICY "Admins manage all" 
ON custom_requests 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);
