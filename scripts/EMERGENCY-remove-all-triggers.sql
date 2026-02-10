-- EMERGENCIA: Eliminar TODOS los triggers de auth.users
-- Ejecuta esto en Supabase SQL Editor AHORA

-- 1. Eliminar todos los triggers
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_email_confirmed ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_confirmed ON auth.users;
DROP TRIGGER IF EXISTS handle_new_user_trigger ON auth.users;
DROP TRIGGER IF EXISTS create_profile_trigger ON auth.users;

-- 2. Eliminar todas las funciones relacionadas
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_user_email_confirmed() CASCADE;
DROP FUNCTION IF EXISTS public.create_profile_for_user() CASCADE;

-- 3. Verificar que no quedan triggers
SELECT 
  tgname as trigger_name,
  tgrelid::regclass as table_name
FROM pg_trigger 
WHERE tgrelid = 'auth.users'::regclass;

-- DESPUES de ejecutar esto, el registro deberia funcionar
-- porque el endpoint /api/auth/register ya hace upsert a profiles manualmente
