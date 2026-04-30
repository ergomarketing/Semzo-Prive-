-- ============================================
-- SCRIPT DE LIMPIEZA PARA USUARIOS DE PRUEBA
-- ============================================
-- Usa este script para eliminar usuarios de prueba por email o teléfono
-- IMPORTANTE: Modifica las variables al inicio antes de ejecutar

-- ============================================
-- CONFIGURACIÓN: Modifica estos valores
-- ============================================

-- Opción 1: Eliminar por EMAIL
-- Descomenta y modifica el email a eliminar:
-- DO $$
-- DECLARE
--   v_email TEXT := 'ergomara2@gmail.com';  -- CAMBIA ESTE EMAIL
-- 

-- Opción 2: Eliminar por TELÉFONO
-- Descomenta y modifica el teléfono a eliminar:
-- DO $$
-- DECLARE
--   v_phone TEXT := '+34624239394';  -- CAMBIA ESTE TELÉFONO
-- 

-- Opción 3: Eliminar por EMAIL O TELÉFONO (ambos)
DO $$
DECLARE
  v_email TEXT := 'ergomara2@gmail.com';     -- CAMBIA ESTE EMAIL
  v_phone TEXT := '+34624239394';             -- CAMBIA ESTE TELÉFONO
BEGIN

  RAISE NOTICE '================================================';
  RAISE NOTICE 'Iniciando limpieza de usuario de prueba';
  RAISE NOTICE 'Email: %', v_email;
  RAISE NOTICE 'Teléfono: %', v_phone;
  RAISE NOTICE '================================================';

  -- 1. Eliminar bag_passes que referencian reservations del usuario
  RAISE NOTICE 'Paso 1/9: Eliminando bag_passes...';
  DELETE FROM public.bag_passes
  WHERE used_for_reservation_id IN (
    SELECT r.id FROM public.reservations r
    INNER JOIN public.profiles p ON r.user_id = p.id
    WHERE p.email ILIKE '%' || v_email || '%' 
      OR p.phone = v_phone
      OR p.email = v_phone || '@phone.semzoprive.com'
  );

  -- 2. Eliminar reservations
  RAISE NOTICE 'Paso 2/9: Eliminando reservations...';
  DELETE FROM public.reservations
  WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE email ILIKE '%' || v_email || '%' 
      OR phone = v_phone
      OR email = v_phone || '@phone.semzoprive.com'
  );

  -- 3. Eliminar membership_intents
  RAISE NOTICE 'Paso 3/9: Eliminando membership_intents...';
  DELETE FROM public.membership_intents
  WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE email ILIKE '%' || v_email || '%' 
      OR phone = v_phone
      OR email = v_phone || '@phone.semzoprive.com'
  );

  -- 4. Eliminar user_memberships
  RAISE NOTICE 'Paso 4/9: Eliminando user_memberships...';
  DELETE FROM public.user_memberships
  WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE email ILIKE '%' || v_email || '%' 
      OR phone = v_phone
      OR email = v_phone || '@phone.semzoprive.com'
  );

  -- 5. Eliminar gift_card_transactions
  RAISE NOTICE 'Paso 5/9: Eliminando gift_card_transactions...';
  DELETE FROM public.gift_card_transactions
  WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE email ILIKE '%' || v_email || '%' 
      OR phone = v_phone
      OR email = v_phone || '@phone.semzoprive.com'
  );

  -- 6. Eliminar identity_verifications
  RAISE NOTICE 'Paso 6/9: Eliminando identity_verifications...';
  DELETE FROM public.identity_verifications
  WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE email ILIKE '%' || v_email || '%' 
      OR phone = v_phone
      OR email = v_phone || '@phone.semzoprive.com'
  );

  -- 7. Eliminar audit_log
  RAISE NOTICE 'Paso 7/9: Eliminando audit_log...';
  DELETE FROM public.audit_log
  WHERE user_id IN (
    SELECT id FROM public.profiles 
    WHERE email ILIKE '%' || v_email || '%' 
      OR phone = v_phone
      OR email = v_phone || '@phone.semzoprive.com'
  );

  -- 8. Eliminar de profiles
  RAISE NOTICE 'Paso 8/9: Eliminando profiles...';
  DELETE FROM public.profiles
  WHERE 
    email ILIKE '%' || v_email || '%'
    OR phone = v_phone
    OR email = v_phone || '@phone.semzoprive.com';

  -- 9. Eliminar de auth.users
  RAISE NOTICE 'Paso 9/9: Eliminando auth.users...';
  DELETE FROM auth.users
  WHERE 
    email ILIKE '%' || v_email || '%'
    OR phone = v_phone;

  RAISE NOTICE '================================================';
  RAISE NOTICE 'Limpieza completada exitosamente';
  RAISE NOTICE '================================================';

END $$;

-- Verificación final
SELECT 
  'Verificando eliminación...' as status,
  COUNT(*) as usuarios_restantes
FROM public.profiles 
WHERE 
  email ILIKE '%ergomara2%'  -- Cambia esto si usaste otro email
  OR phone = '+34624239394';  -- Cambia esto si usaste otro teléfono
