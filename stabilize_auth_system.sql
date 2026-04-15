-- ============================================
-- 🔐 AUTHENTICATION STABILIZATION SCRIPT
-- ============================================
-- Targets: Signup 500 errors and Login 400 errors
-- ============================================

BEGIN;

-- 1. STABILIZE PROFILES TABLE STRUCTURE
-- Adding missing columns that RPCs/Triggers depend on
DO $$ 
BEGIN
    -- Ensure created_at exists (referenced in many RPCs)
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'created_at') THEN
        ALTER TABLE public.profiles ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Ensure email exists (referenced in many RPCs)
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'email') THEN
        ALTER TABLE public.profiles ADD COLUMN email TEXT;
    END IF;

    -- Ensure updated_at exists
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'updated_at') THEN
        ALTER TABLE public.profiles ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;

    -- Ensure is_agency exists
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'is_agency') THEN
        ALTER TABLE public.profiles ADD COLUMN is_agency BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. SYNC EMAIL DATA
-- Ensures all profiles have the email from auth.users (critical for login logic)
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND (p.email IS NULL OR p.email = '');

-- 3. RE-IMPLEMENT USER CREATION TRIGGER (RELIABLE VERSION)
-- This is the core fix for "Database error saving new user"
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email,
    full_name, 
    role, 
    subscription_tier, 
    is_agency,
    created_at,
    updated_at
  )
  VALUES (
    new.id,
    new.email, -- Crucial: Capture email from auth.users
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    'customer',
    'basic',
    COALESCE((new.raw_user_meta_data->>'is_agency')::boolean, false),
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    email = EXCLUDED.email,
    full_name = EXCLUDED.full_name,
    updated_at = NOW(),
    is_agency = CASE 
                  WHEN profiles.is_agency = true THEN true 
                  ELSE EXCLUDED.is_agency
                END;
  
  -- 4. ENSURE WALLET EXISTS
  -- Pre-emptively create a wallet for the new user to avoid later deduction failures
  INSERT INTO public.wallet_credits (user_id, balance)
  VALUES (new.id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-attach trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. FINAL CLEANUP
-- Ensure all existing users have a wallet
INSERT INTO public.wallet_credits (user_id, balance)
SELECT id, 0 FROM auth.users
ON CONFLICT (user_id) DO NOTHING;

COMMIT;

-- 6. DIAGNOSTIC CHECK
SELECT count(*) as total_profiles, 
       (SELECT count(*) FROM profiles WHERE email IS NULL) as profiles_missing_email
FROM profiles;
