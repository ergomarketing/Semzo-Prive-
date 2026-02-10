-- SCRIPT DE LIMPIEZA COMPLETA POR EMAIL
-- Elimina TODOS los registros relacionados con un email en TODO el sistema
-- Incluye auth.users, profiles, y TODAS las tablas relacionadas

-- ⚠️ CONFIGURACIÓN: Cambia este email por el que necesites limpiar
DO $$
DECLARE
  v_target_email TEXT := 'ergomara2@gmail.com'; -- ⚠️ CAMBIAR AQUÍ
  v_user_ids UUID[];
  v_count INTEGER;
BEGIN
  RAISE NOTICE '==========================================';
  RAISE NOTICE 'INICIANDO LIMPIEZA COMPLETA PARA EMAIL: %', v_target_email;
  RAISE NOTICE '==========================================';
  
  -- Obtener todos los user_ids relacionados con este email (de profiles Y auth.users)
  SELECT ARRAY_AGG(DISTINCT user_id) INTO v_user_ids FROM (
    SELECT id as user_id FROM public.profiles WHERE LOWER(email) = LOWER(v_target_email)
    UNION
    SELECT id as user_id FROM auth.users WHERE LOWER(email) = LOWER(v_target_email)
  ) combined_users;
  
  RAISE NOTICE 'User IDs encontrados: %', v_user_ids;
  
  IF v_user_ids IS NULL OR array_length(v_user_ids, 1) = 0 THEN
    RAISE NOTICE '✓ No se encontraron usuarios con ese email';
    RETURN;
  END IF;
  
  -- 1. Eliminar bag_passes que referencian reservations del usuario
  DELETE FROM public.bag_passes
  WHERE used_for_reservation_id IN (
    SELECT id FROM public.reservations WHERE user_id = ANY(v_user_ids)
  );
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '1. Bag passes eliminados: %', v_count;
  
  -- 2. Eliminar reservations
  DELETE FROM public.reservations WHERE user_id = ANY(v_user_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '2. Reservations eliminadas: %', v_count;
  
  -- 3. Eliminar membership_intents
  DELETE FROM public.membership_intents WHERE user_id = ANY(v_user_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '3. Membership intents eliminados: %', v_count;
  
  -- 4. Eliminar user_memberships
  DELETE FROM public.user_memberships WHERE user_id = ANY(v_user_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '4. User memberships eliminadas: %', v_count;
  
  -- 5. Eliminar gift_card_transactions
  DELETE FROM public.gift_card_transactions WHERE user_id = ANY(v_user_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '5. Gift card transactions eliminadas: %', v_count;
  
  -- 6. Eliminar identity_verifications
  DELETE FROM public.identity_verifications WHERE user_id = ANY(v_user_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '6. Identity verifications eliminadas: %', v_count;
  
  -- 7. Eliminar audit_log
  DELETE FROM public.audit_log WHERE user_id = ANY(v_user_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '7. Audit log entries eliminados: %', v_count;
  
  -- 8. Eliminar profiles
  DELETE FROM public.profiles WHERE id = ANY(v_user_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '8. Profiles eliminados: %', v_count;
  
  -- 9. Eliminar auth.users
  DELETE FROM auth.users WHERE id = ANY(v_user_ids);
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '9. Auth users eliminados: %', v_count;
  
  RAISE NOTICE '==========================================';
  RAISE NOTICE '✓ LIMPIEZA COMPLETADA PARA: %', v_target_email;
  RAISE NOTICE '==========================================';
  
END $$;

-- Verificación final
SELECT 
  'profiles' as tabla,
  COUNT(*) as registros_restantes
FROM public.profiles 
WHERE LOWER(email) = LOWER('ergomara2@gmail.com') -- ⚠️ CAMBIAR AQUÍ TAMBIÉN

UNION ALL

SELECT 
  'auth.users' as tabla,
  COUNT(*) as registros_restantes
FROM auth.users 
WHERE LOWER(email) = LOWER('ergomara2@gmail.com'); -- ⚠️ CAMBIAR AQUÍ TAMBIÉN
