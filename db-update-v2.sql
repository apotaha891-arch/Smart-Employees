-- Add to database-setup.sql

-- 1. Profiles table to track credits and subscriptions
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  subscription_tier TEXT DEFAULT 'trial', -- trial, starter, pro, enterprise
  credits_total INTEGER DEFAULT 50, -- Starting trial credits
  credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Custom Agent Requests table
CREATE TABLE IF NOT EXISTS custom_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  business_type TEXT NOT NULL,
  required_tasks TEXT NOT NULL,
  preferred_language TEXT,
  integrations TEXT,
  status TEXT DEFAULT 'pending', -- pending, analyzing, implemented
  ai_analysis JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE custom_requests ENABLE ROW LEVEL SECURITY;

-- 4. Policies
CREATE POLICY "Users can view their own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own custom requests" ON custom_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view their own custom requests" ON custom_requests FOR SELECT USING (auth.uid() = user_id);
