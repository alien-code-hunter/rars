-- Grant SYSTEM_ADMIN role to admin@mail.com
DO $$
DECLARE
  target_user_id UUID;
BEGIN
  SELECT id INTO target_user_id FROM auth.users WHERE email = 'admin@mail.com' LIMIT 1;

  IF target_user_id IS NULL THEN
    RAISE NOTICE 'No user found with email admin@mail.com';
    RETURN;
  END IF;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (target_user_id, 'SYSTEM_ADMIN')
  ON CONFLICT (user_id, role) DO NOTHING;
END $$;
