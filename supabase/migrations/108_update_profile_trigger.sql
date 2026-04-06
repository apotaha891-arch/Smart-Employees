-- Redeclare the profile sync trigger to capture is_agency from raw_user_meta_data
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    full_name, 
    role, 
    subscription_tier, 
    is_agency
  )
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    'customer',
    'basic',
    COALESCE((new.raw_user_meta_data->>'is_agency')::boolean, false)
  )
  ON CONFLICT (id) DO UPDATE 
  SET 
    full_name = EXCLUDED.full_name,
    is_agency = CASE 
                  WHEN profiles.is_agency = true THEN true 
                  ELSE COALESCE((new.raw_user_meta_data->>'is_agency')::boolean, EXCLUDED.is_agency)
                END;
  
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
