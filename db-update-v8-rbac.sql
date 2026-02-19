-- Add role field to profiles table to enable proper RBAC
-- Run this migration to add role-based access control support

-- Add role column to profiles table
ALTER TABLE profiles ADD COLUMN role VARCHAR(50) DEFAULT 'customer';

-- Add comment explaining the role values
COMMENT ON COLUMN profiles.role IS 'User role: admin or customer';

-- Create admin role assignments (Optional - only set this for admin users)
UPDATE profiles 
SET role = 'admin' 
WHERE email IN ('admin@example.com', 'admin@agentic.com');

-- Ensure all other users default to customer
UPDATE profiles 
SET role = 'customer' 
WHERE role IS NULL;

-- Add constraint to ensure only valid roles
ALTER TABLE profiles 
ADD CONSTRAINT valid_role CHECK (role IN ('admin', 'customer'));
