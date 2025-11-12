-- Verificar si la sincronización funcionó
SELECT 
  'VERIFICACIÓN DE SINCRONIZACIÓN' as seccion,
  au.email,
  au.email_confirmed_at,
  CASE WHEN pu.id IS NOT NULL THEN '✓ users' ELSE '✗ users' END as en_users,
  CASE WHEN pp.id IS NOT NULL THEN '✓ profiles' ELSE '✗ profiles' END as en_profiles,
  CASE 
    WHEN pu.id IS NOT NULL AND pp.id IS NOT NULL THEN '✅ AMBAS TABLAS'
    WHEN pu.id IS NOT NULL THEN '📋 SOLO users'
    WHEN pp.id IS NOT NULL THEN '👤 SOLO profiles'
    ELSE '❌ NINGUNA TABLA'
  END as estado_final
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
LEFT JOIN public.profiles pp ON au.id = pp.id
WHERE au.email_confirmed_at IS NOT NULL
ORDER BY au.created_at DESC;

-- Contar registros en cada tabla
SELECT 
  'CONTEO DE REGISTROS' as info,
  (SELECT COUNT(*) FROM auth.users WHERE email_confirmed_at IS NOT NULL) as usuarios_confirmados,
  (SELECT COUNT(*) FROM public.users) as registros_en_users,
  (SELECT COUNT(*) FROM public.profiles) as registros_en_profiles;

-- Si no hay registros en profiles, intentar sincronización manual
INSERT INTO public.profiles (
  id,
  first_name,
  last_name,
  email,
  phone,
  membership_status,
  email_confirmed
)
SELECT 
  u.id,
  u.first_name,
  u.last_name,
  u.email,
  u.phone,
  COALESCE(u.membership_status, 'free'),
  COALESCE(u.email_confirmed, true)
FROM public.users u
LEFT JOIN public.profiles p ON u.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO UPDATE SET
  first_name = EXCLUDED.first_name,
  last_name = EXCLUDED.last_name,
  email = EXCLUDED.email,
  phone = EXCLUDED.phone,
  membership_status = EXCLUDED.membership_status,
  email_confirmed = EXCLUDED.email_confirmed;

-- Mostrar resultado final después de la sincronización
SELECT 
  'RESULTADO DESPUÉS DE SINCRONIZACIÓN' as seccion,
  au.email,
  CASE WHEN pu.id IS NOT NULL THEN '✓' ELSE '✗' END as en_users,
  CASE WHEN pp.id IS NOT NULL THEN '✓' ELSE '✗' END as en_profiles,
  CASE 
    WHEN pu.id IS NOT NULL AND pp.id IS NOT NULL THEN '✅ LISTO PARA LOGIN'
    ELSE '❌ PROBLEMA'
  END as estado
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
LEFT JOIN public.profiles pp ON au.id = pp.id
WHERE au.email_confirmed_at IS NOT NULL
ORDER BY au.created_at DESC;
