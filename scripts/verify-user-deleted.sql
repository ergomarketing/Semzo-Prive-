-- Script para verificar si un usuario fue completamente eliminado
-- Ejecuta este script después de hacer limpieza para confirmar que no quedan registros

-- CONFIGURACIÓN: Cambia estos valores para el usuario que quieres verificar
DO $$
DECLARE
  v_email TEXT := 'ergomara2@gmail.com';
  v_phone TEXT := '+34624239394';
BEGIN
  RAISE NOTICE '=== VERIFICANDO USUARIO ===';
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE 'Phone: %', v_phone;
  RAISE NOTICE '';
END $$;

-- Verificar en profiles
SELECT 'profiles' as tabla, COUNT(*) as registros
FROM public.profiles
WHERE email ILIKE '%ergomara2%'
   OR phone = '+34624239394'
   OR phone = '34624239394'
   OR email = '34624239394@phone.semzoprive.com';

-- Verificar en auth.users  
SELECT 'auth.users' as tabla, COUNT(*) as registros
FROM auth.users
WHERE email ILIKE '%ergomara2%'
   OR phone = '+34624239394'
   OR phone = '34624239394';

-- Verificar en reservations
SELECT 'reservations' as tabla, COUNT(*) as registros
FROM public.reservations
WHERE user_id IN (
  SELECT id FROM public.profiles 
  WHERE email ILIKE '%ergomara2%' 
    OR phone = '+34624239394'
    OR phone = '34624239394'
    OR email = '34624239394@phone.semzoprive.com'
);

-- Verificar en membership_intents
SELECT 'membership_intents' as tabla, COUNT(*) as registros
FROM public.membership_intents
WHERE user_id IN (
  SELECT id FROM public.profiles 
  WHERE email ILIKE '%ergomara2%' 
    OR phone = '+34624239394'
    OR phone = '34624239394'
    OR email = '34624239394@phone.semzoprive.com'
);

-- Verificar en user_memberships
SELECT 'user_memberships' as tabla, COUNT(*) as registros
FROM public.user_memberships
WHERE user_id IN (
  SELECT id FROM public.profiles 
  WHERE email ILIKE '%ergomara2%' 
    OR phone = '+34624239394'
    OR phone = '34624239394'
    OR email = '34624239394@phone.semzoprive.com'
);

-- Verificar en audit_log
SELECT 'audit_log' as tabla, COUNT(*) as registros
FROM public.audit_log
WHERE user_id IN (
  SELECT id FROM public.profiles 
  WHERE email ILIKE '%ergomara2%' 
    OR phone = '+34624239394'
    OR phone = '34624239394'
    OR email = '34624239394@phone.semzoprive.com'
);

-- Si todos los resultados son 0, el usuario fue completamente eliminado
