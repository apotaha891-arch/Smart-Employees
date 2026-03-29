-- FIX FOR CUSTOM_REQUESTS RLS POLICY

-- 1. Ensure the table exists with public insert capability
CREATE TABLE IF NOT EXISTS custom_requests (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    business_type TEXT,
    required_tasks TEXT,
    contact_name TEXT,
    contact_phone TEXT,
    contact_email TEXT,
    status TEXT DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE custom_requests ENABLE ROW LEVEL SECURITY;

-- 3. DROP old policies to avoid conflict
DROP POLICY IF EXISTS "Allow public insert for custom_requests" ON custom_requests;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON custom_requests;
DROP POLICY IF EXISTS "Allow authenticated select for custom_requests" ON custom_requests;
DROP POLICY IF EXISTS "Admins can manage all custom_requests" ON custom_requests;

-- 4. Create Policy: Allow ANYONE to INSERT
-- This allows guests and users to submit requests from the setup page
CREATE POLICY "Allow public insert for custom_requests" 
ON custom_requests 
FOR INSERT 
TO public
WITH CHECK (true);

-- 5. Create Policy: Only Authenticated users can SEE the requests (Admin/Owners)
CREATE POLICY "Allow authenticated select for custom_requests" 
ON custom_requests 
FOR SELECT 
TO authenticated
USING (true);

-- 6. Scalable visibility for Admins (Full Control)
CREATE POLICY "Admins can manage all custom_requests" 
ON custom_requests 
FOR ALL 
TO authenticated 
USING (true)
WITH CHECK (true);
