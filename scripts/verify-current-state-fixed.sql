-- Verificar usuarios en auth.users
SELECT id, email, created_at, email_confirmed_at, last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Verificar estructura actual de profiles
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'profiles' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Verificar perfiles en public.profiles (usando updated_at en lugar de created_at)
SELECT id, email, full_name, updated_at
FROM public.profiles 
ORDER BY updated_at DESC 
LIMIT 5;

-- Verificar si hay discrepancias entre auth.users y profiles
SELECT 
  'En profiles pero NO en auth' as status,
  p.email 
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id
WHERE u.id IS NULL

UNION ALL

SELECT 
  'En auth pero NO en profiles' as status,
  u.email
FROM auth.users u  
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL;
