-- =====================================================================
-- CHECKLIST DE PRUEBAS - SEMZO PRIVE
-- =====================================================================
-- USO:
-- 1. Reemplaza con Ctrl+H:
--      EMAIL_DE_PRUEBA   -> tu email real
--      CODIGO_GIFT_CARD  -> codigo gift card que usaras
-- 2. Selecciona TODO el archivo y pulsa Run despues de cada accion en la web.
--    Cada query devuelve una columna "paso" para que sepas a que se refiere.
-- 3. Si una query devuelve 0 filas o NULL en algo critico, ahi esta el bug.
-- =====================================================================

-- PASO 0: estado inicial
SELECT
  '0_INICIAL' AS paso,
  u.id AS user_id,
  u.email,
  u.created_at AS usuario_creado,
  (SELECT count(*) FROM public.user_memberships WHERE user_id = u.id) AS num_memberships,
  (SELECT count(*) FROM public.membership_intents WHERE user_id = u.id) AS num_intents,
  (SELECT count(*) FROM public.identity_verifications WHERE user_id = u.id) AS num_identity
FROM auth.users u
WHERE u.email = 'EMAIL_DE_PRUEBA';

-- PASO 1: alta usuario + profile
SELECT
  '1_ALTA' AS paso,
  u.id AS user_id,
  u.email,
  u.phone,
  (u.email_confirmed_at IS NOT NULL) AS email_confirmado,
  (u.phone_confirmed_at IS NOT NULL) AS phone_confirmado,
  p.first_name,
  p.last_name,
  p.created_at AS profile_creado
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = 'EMAIL_DE_PRUEBA';

-- PASO 2: gift card disponible
SELECT
  '2_GIFTCARD' AS paso,
  gc.code,
  gc.balance,
  gc.status,
  gc.expires_at
FROM public.gift_cards gc
WHERE gc.code = 'CODIGO_GIFT_CARD';

-- PASO 3a: intent creado al pulsar Pagar
SELECT
  '3a_INTENT' AS paso,
  mi.id,
  mi.status,
  mi.amount_cents,
  mi.gift_card_applied_cents,
  mi.gift_card_code,
  mi.stripe_checkout_session_id,
  mi.created_at,
  CASE
    WHEN mi.amount_cents = 0 THEN 'BUG: amount_cents=0'
    WHEN mi.gift_card_code IS NOT NULL AND mi.gift_card_applied_cents = 0 THEN 'BUG: gift card no aplicada'
    ELSE 'OK'
  END AS diagnostico
FROM public.membership_intents mi
JOIN auth.users u ON u.id = mi.user_id
WHERE u.email = 'EMAIL_DE_PRUEBA'
ORDER BY mi.created_at DESC
LIMIT 1;

-- PASO 3b: membresia creada por webhook tras pago Stripe
SELECT
  '3b_MEMBERSHIP' AS paso,
  um.id,
  um.status,
  um.membership_type,
  um.billing_cycle,
  um.stripe_subscription_id,
  um.stripe_customer_id,
  um.created_at,
  CASE
    WHEN um.status = 'active' THEN 'BUG CRITICO: active sin SEPA - regla de oro violada'
    WHEN um.status = 'paid_pending_verification' THEN 'OK: esperando Identity'
    WHEN um.status = 'pending_sepa' THEN 'OK: Identity OK, esperando SEPA'
    ELSE 'REVISAR: status=' || um.status
  END AS diagnostico
FROM public.user_memberships um
JOIN auth.users u ON u.id = um.user_id
WHERE u.email = 'EMAIL_DE_PRUEBA'
ORDER BY um.created_at DESC
LIMIT 1;

-- PASO 3c: gift card debitada
SELECT
  '3c_GIFTCARD_DEBITADA' AS paso,
  gc.code,
  gc.balance AS balance_actual,
  gct.amount AS monto_debitado,
  gct.transaction_type,
  gct.reference_type,
  gct.created_at,
  CASE
    WHEN gct.id IS NULL THEN 'BUG: gift card NO debitada'
    ELSE 'OK: debitada ' || gct.amount || ' EUR'
  END AS diagnostico
FROM public.gift_cards gc
LEFT JOIN public.gift_card_transactions gct
  ON gct.gift_card_id = gc.id
  AND gct.transaction_type = 'debit'
  AND gct.reference_type = 'membership'
WHERE gc.code = 'CODIGO_GIFT_CARD'
ORDER BY gct.created_at DESC NULLS LAST
LIMIT 1;

-- PASO 4a: identity verificada
SELECT
  '4a_IDENTITY' AS paso,
  iv.stripe_verification_id,
  iv.status,
  iv.verified_at,
  CASE
    WHEN iv.status = 'verified' THEN 'OK: Identity completada'
    WHEN iv.status = 'requires_input' THEN 'PENDIENTE: usuario debe completar verificacion'
    ELSE 'REVISAR: status=' || COALESCE(iv.status, 'NULL')
  END AS diagnostico
FROM public.identity_verifications iv
JOIN auth.users u ON u.id = iv.user_id
WHERE u.email = 'EMAIL_DE_PRUEBA'
ORDER BY iv.created_at DESC
LIMIT 1;

-- PASO 4b: membresia DEBE seguir paid_pending_verification tras Identity
SELECT
  '4b_MEMBERSHIP_TRAS_IDENTITY' AS paso,
  um.status,
  um.sepa_payment_method_id,
  CASE
    WHEN um.status = 'active' AND um.sepa_payment_method_id IS NULL
      THEN 'BUG CRITICO: active sin SEPA - check-status o webhook violo regla de oro'
    WHEN um.status = 'paid_pending_verification'
      THEN 'OK: esperando que el usuario firme SEPA'
    WHEN um.status = 'pending_sepa'
      THEN 'OK: redirigido a SEPA'
    ELSE 'REVISAR: status=' || um.status
  END AS diagnostico
FROM public.user_memberships um
JOIN auth.users u ON u.id = um.user_id
WHERE u.email = 'EMAIL_DE_PRUEBA'
ORDER BY um.created_at DESC
LIMIT 1;

-- PASO 5a: SEPA firmado
SELECT
  '5a_SEPA' AS paso,
  um.sepa_payment_method_id,
  um.sepa_signed_at,
  CASE
    WHEN um.sepa_payment_method_id IS NULL THEN 'PENDIENTE: usuario no ha firmado SEPA'
    ELSE 'OK: SEPA firmado'
  END AS diagnostico
FROM public.user_memberships um
JOIN auth.users u ON u.id = um.user_id
WHERE u.email = 'EMAIL_DE_PRUEBA'
ORDER BY um.created_at DESC
LIMIT 1;

-- PASO 5b: membresia activa tras SEPA - regla de oro completa
SELECT
  '5b_MEMBERSHIP_ACTIVA' AS paso,
  um.status,
  um.membership_type,
  um.start_date,
  um.end_date,
  iv.status AS identity_status,
  um.sepa_payment_method_id IS NOT NULL AS sepa_firmado,
  CASE
    WHEN um.status = 'active' AND iv.status = 'verified' AND um.sepa_payment_method_id IS NOT NULL
      THEN 'OK: regla de oro cumplida - Identity + SEPA + Active'
    WHEN um.status = 'active' AND um.sepa_payment_method_id IS NULL
      THEN 'BUG: active sin SEPA'
    WHEN um.status = 'active' AND iv.status != 'verified'
      THEN 'BUG: active sin Identity'
    ELSE 'PENDIENTE: status=' || um.status
  END AS diagnostico
FROM public.user_memberships um
JOIN auth.users u ON u.id = um.user_id
LEFT JOIN public.identity_verifications iv ON iv.user_id = um.user_id
WHERE u.email = 'EMAIL_DE_PRUEBA'
ORDER BY um.created_at DESC, iv.created_at DESC
LIMIT 1;

-- PASO 6: resumen completo del estado del usuario (ejecutar al final)
SELECT
  '6_RESUMEN' AS paso,
  u.email,
  u.phone,
  um.status AS membership_status,
  um.membership_type,
  um.stripe_subscription_id IS NOT NULL AS tiene_subscripcion,
  iv.status AS identity_status,
  um.sepa_payment_method_id IS NOT NULL AS sepa_firmado,
  (SELECT count(*) FROM public.gift_card_transactions gct
   JOIN public.gift_cards gc2 ON gc2.id = gct.gift_card_id
   WHERE gc2.code = 'CODIGO_GIFT_CARD' AND gct.transaction_type = 'debit') AS gift_card_debits,
  um.created_at AS membership_creado,
  iv.verified_at AS identity_verificado,
  um.sepa_signed_at AS sepa_firmado_at
FROM auth.users u
LEFT JOIN public.user_memberships um ON um.user_id = u.id
LEFT JOIN public.identity_verifications iv ON iv.user_id = u.id
WHERE u.email = 'EMAIL_DE_PRUEBA'
ORDER BY um.created_at DESC NULLS LAST, iv.created_at DESC NULLS LAST
LIMIT 1;
