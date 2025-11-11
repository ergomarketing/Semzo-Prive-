-- Script para verificar el estado de usuarios en ambas tablas

-- Mostrar información de las tablas
SELECT 
  'INFORMACIÓN DE TABLAS' as seccion,
  '' as email,
  '' as en_users,
  '' as en_profiles,
  '' as estado_final;

-- Verificar usuarios confirmados en auth.users y su presencia en ambas tablas
SELECT 
  au.email,
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

-- Mostrar conteos
SELECT 
  'RESUMEN' as seccion,
  '' as email,
  '' as en_users,
  '' as en_profiles,
  '' as estado_final
UNION ALL
SELECT 
  'Total en auth.users confirmados',
  COUNT(*)::text,
  '',
  '',
  ''
FROM auth.users 
WHERE email_confirmed_at IS NOT NULL
UNION ALL
SELECT 
  'Total en public.users',
  COUNT(*)::text,
  '',
  '',
  ''
FROM public.users
UNION ALL
SELECT 
  'Total en public.profiles',
  COALESCE(COUNT(*)::text, '0'),
  '',
  '',
  ''
FROM public.profiles;
