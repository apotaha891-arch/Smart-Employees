-- ============================================================
-- Profile Sync Trigger
-- Ensure all auth.users have a corresponding entry in public.profiles
-- Supports Email and OAuth (Google) sign-ins
-- ============================================================

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, subscription_tier)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    'customer',
    'basic'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to run on auth.users insert
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Also ensure existing users from AUTH are in Profiles
INSERT INTO public.profiles (id, full_name, role, subscription_tier)
SELECT 
    id, 
    COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', ''),
    'customer',
    'basic'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
