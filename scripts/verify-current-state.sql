-- Verificar usuarios en auth.users
SELECT id, email, created_at, email_confirmed_at, last_sign_in_at
FROM auth.users 
ORDER BY created_at DESC 
LIMIT 5;

-- Verificar perfiles en public.profiles  
SELECT id, email, full_name, email_confirmed, created_at
FROM public.profiles 
ORDER BY created_at DESC 
LIMIT 5;

-- Verificar si hay discrepancias
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
