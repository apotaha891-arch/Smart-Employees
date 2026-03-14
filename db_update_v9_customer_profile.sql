-- Add mission/profile fields to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS email TEXT,
ADD COLUMN IF NOT EXISTS position TEXT;

-- Update RLS policies to ensure these fields are accessible
-- Usually, users should only see their own profile, which is likely already set up.
-- If you face permission errors, run the following:
-- CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
