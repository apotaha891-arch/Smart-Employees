-- ============================================================
-- 121_admin_profile_access.sql
-- Enables Admins to view all profiles for support purposes.
-- ============================================================

-- Drop existing restricted policy if it exists (usually it's the default one)
-- CREATE POLICY "Users can only see their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);

DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles"
ON public.profiles FOR SELECT
USING (
    auth.uid() = id 
    OR (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin'
    OR (auth.jwt() ->> 'email') IN ('apotaha891@gmail.com', 'sabah@gajha.com')
);

-- Ensure user identity is reconciled for the specific clinic
UPDATE public.profiles 
SET business_name = 'عيادة د. امتنان لطب الأسنان',
    full_name = 'عيادة د. امتنان لطب الأسنان'
WHERE id = 'beae4cd3-563a-47f7-a0d8-7b7b7255e58e';

-- Also ensure the entity exists with the same name
INSERT INTO public.entities (user_id, business_name, business_type)
SELECT 'beae4cd3-563a-47f7-a0d8-7b7b7255e58e', 'عيادة د. امتنان لطب الأسنان', 'medical'
WHERE NOT EXISTS (SELECT 1 FROM public.entities WHERE user_id = 'beae4cd3-563a-47f7-a0d8-7b7b7255e58e');
