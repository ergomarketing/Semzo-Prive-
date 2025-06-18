-- Sincronizar usuarios existentes de auth.users a la tabla users
INSERT INTO public.users (id, email, first_name, last_name, membership_status, created_at, updated_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'firstName', au.raw_user_meta_data->>'first_name', 'Usuario') as first_name,
  COALESCE(au.raw_user_meta_data->>'lastName', au.raw_user_meta_data->>'last_name', 'Nuevo') as last_name,
  'free' as membership_status,
  au.created_at,
  NOW() as updated_at
FROM auth.users au
WHERE au.id NOT IN (SELECT id FROM public.users)
AND au.email_confirmed_at IS NOT NULL;

-- Verificar que se insertaron los usuarios
SELECT 
  id, 
  email, 
  first_name, 
  last_name, 
  membership_status,
  created_at
FROM public.users;
