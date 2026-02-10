-- Script para reparar usuarios huérfanos (confirmados pero sin perfil)

-- Mostrar usuarios huérfanos antes de la reparación
SELECT 
  'ANTES DE REPARAR' as estado,
  COUNT(*) as total_huerfanos
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email_confirmed_at IS NOT NULL 
  AND pu.id IS NULL;

-- Insertar perfiles para usuarios huérfanos confirmados
INSERT INTO public.users (
  id, 
  email, 
  first_name, 
  last_name, 
  phone,
  membership_status,
  email_confirmed,
  created_at,
  updated_at
)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'first_name', '') as first_name,
  COALESCE(au.raw_user_meta_data->>'last_name', '') as last_name,
  COALESCE(au.raw_user_meta_data->>'phone', NULL) as phone,
  'free' as membership_status,
  true as email_confirmed,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email_confirmed_at IS NOT NULL 
  AND pu.id IS NULL;

-- Mostrar usuarios reparados
SELECT 
  'DESPUÉS DE REPARAR' as estado,
  COUNT(*) as total_huerfanos
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email_confirmed_at IS NOT NULL 
  AND pu.id IS NULL;

-- Mostrar todos los usuarios y su estado final
SELECT 
  au.id,
  au.email,
  au.email_confirmed_at,
  CASE 
    WHEN pu.id IS NULL THEN '❌ SIN PERFIL' 
    ELSE '✅ CON PERFIL' 
  END as estado_perfil,
  pu.first_name,
  pu.last_name,
  pu.membership_status
FROM auth.users au
LEFT JOIN public.users pu ON au.id = pu.id
WHERE au.email_confirmed_at IS NOT NULL
ORDER BY au.created_at DESC;
