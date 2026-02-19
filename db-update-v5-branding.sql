-- db-update-v5-branding.sql
-- Run this in your Supabase SQL Editor to fix the "Row-level security policy" and schema errors

-- 1. Unify credit column names
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='credits_total') THEN
        ALTER TABLE profiles RENAME COLUMN credits_total TO total_credits;
    END IF;
END $$;

-- 2. Ensure all columns exist
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS business_name TEXT,
ADD COLUMN IF NOT EXISTS business_type TEXT,
ADD COLUMN IF NOT EXISTS working_hours TEXT,
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS services TEXT,
ADD COLUMN IF NOT EXISTS knowledge_base TEXT,
ADD COLUMN IF NOT EXISTS branding_tone TEXT DEFAULT 'professional',
ADD COLUMN IF NOT EXISTS subscription_tier TEXT DEFAULT 'trial',
ADD COLUMN IF NOT EXISTS total_credits INTEGER DEFAULT 50,
ADD COLUMN IF NOT EXISTS credits_used INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. RESET RLS Policies for Profiles
-- This ensures that upsert operations (insert + update) work correctly
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Allow users to manage their own profile" ON profiles;

-- Create a consolidated policy for all operations
CREATE POLICY "Allow users to manage their own profile" ON profiles
FOR ALL USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- 4. Set permissions for authenticated users
GRANT ALL ON profiles TO authenticated;

-- Comment: The "ALL" policy with BOTH "USING" and "WITH CHECK" is crucial for 
-- Supabase upsert operations to work without RLS violations.
