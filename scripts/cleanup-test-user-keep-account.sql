-- ============================================================================
-- CLEANUP TEST USER (KEEP ACCOUNT)
-- ============================================================================
-- Limpia rastro de pago / membresia / Identity / SEPA pero MANTIENE el usuario
-- en auth.users y profiles. Asi puedes reprobar el flujo SIN volver a registrarte.
--
-- USO:
--   1) Supabase Dashboard → SQL Editor → New query
--   2) Cambia el v_email en la primera linea del DECLARE
--   3) Run (Cmd/Ctrl + Enter)
--   4) Lee la salida en la pestaña "Results" → "Messages"
--
-- DIFERENCIA con cleanup-test-user.sql:
--   - cleanup-test-user.sql        → BORRA usuario completo (registro nuevo)
--   - cleanup-test-user-keep-account.sql → MANTIENE login, solo limpia pago
-- ============================================================================

DO $$
DECLARE
  v_email     text := 'CAMBIAR_AQUI@ejemplo.com';   -- <<< CAMBIA ESTO
  v_user_id   uuid;
  v_count     int;
  v_giftcards int;
  v_refunded  numeric;
BEGIN
  -- 1. Resolver user_id
  SELECT id INTO v_user_id FROM auth.users WHERE email = v_email LIMIT 1;

  IF v_user_id IS NULL THEN
    RAISE NOTICE '❌ Usuario no encontrado: %', v_email;
    RETURN;
  END IF;

  RAISE NOTICE '✓ Usuario: % (id=%)', v_email, v_user_id;
  RAISE NOTICE '------------------------------------------------------------';

  -- 2. Restaurar saldo de gift cards consumidas por el usuario
  v_giftcards := 0;
  v_refunded  := 0;

  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gift_card_transactions') THEN
    WITH refunds AS (
      SELECT gift_card_id, SUM(amount) AS total_refund
      FROM public.gift_card_transactions
      WHERE user_id = v_user_id AND amount > 0
      GROUP BY gift_card_id
    )
    UPDATE public.gift_cards gc
    SET balance    = gc.balance + r.total_refund,
        status     = 'active',
        used_at    = NULL,
        updated_at = NOW()
    FROM refunds r
    WHERE gc.id = r.gift_card_id;
    GET DIAGNOSTICS v_giftcards = ROW_COUNT;

    SELECT COALESCE(SUM(amount),0) INTO v_refunded
    FROM public.gift_card_transactions
    WHERE user_id = v_user_id AND amount > 0;

    RAISE NOTICE '↩  Gift cards restauradas: % (€ % devueltos)', v_giftcards, v_refunded;
  END IF;

  -- 3. Borrar transacciones de gift cards
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'gift_card_transactions') THEN
    DELETE FROM public.gift_card_transactions WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '   gift_card_transactions  borradas: %', v_count;
  END IF;

  -- 4. Borrar SEPA mandates
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'sepa_mandates') THEN
    DELETE FROM public.sepa_mandates WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '   sepa_mandates           borrados: %', v_count;
  END IF;

  -- 5. Borrar identity_verifications
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'identity_verifications') THEN
    DELETE FROM public.identity_verifications WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '   identity_verifications  borradas: %', v_count;
  END IF;

  -- 6. Borrar membership_intents
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'membership_intents') THEN
    DELETE FROM public.membership_intents WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '   membership_intents      borrados: %', v_count;
  END IF;

  -- 7. Borrar pending_memberships
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'pending_memberships') THEN
    DELETE FROM public.pending_memberships WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '   pending_memberships     borrados: %', v_count;
  END IF;

  -- 8. Borrar bag_passes (compras one-shot)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'bag_passes') THEN
    DELETE FROM public.bag_passes WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '   bag_passes              borrados: %', v_count;
  END IF;

  -- 9. Borrar payment_history
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_history') THEN
    DELETE FROM public.payment_history WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '   payment_history         borrados: %', v_count;
  END IF;

  -- 10. Borrar membership_history
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'membership_history') THEN
    DELETE FROM public.membership_history WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '   membership_history      borrados: %', v_count;
  END IF;

  -- 11. Borrar reservations del usuario (primero bag_passes que las referencian)
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'reservations') THEN
    DELETE FROM public.reservations WHERE user_id = v_user_id;
    GET DIAGNOSTICS v_count = ROW_COUNT;
    RAISE NOTICE '   reservations            borradas: %', v_count;
  END IF;

  -- 12. Borrar user_memberships (tabla principal)
  DELETE FROM public.user_memberships WHERE user_id = v_user_id;
  GET DIAGNOSTICS v_count = ROW_COUNT;
  RAISE NOTICE '   user_memberships        borrados: %', v_count;

  -- 13. Limpiar stripe_customer_id en profile (NO borrar el profile)
  UPDATE public.profiles
  SET stripe_customer_id = NULL,
      updated_at = NOW()
  WHERE id = v_user_id;

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE '✅ CLEANUP COMPLETO. auth.users y profile INTACTOS.';
  RAISE NOTICE '   Email % puede loguear y reprobar el flujo desde cero.', v_email;
END $$;
