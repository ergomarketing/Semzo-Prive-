-- =====================================================================
-- CHECKLIST DE PRUEBAS - SEMZO PRIVE
-- =====================================================================
-- USO:
--   1) Ctrl+H y reemplaza:
--        EMAIL_DE_PRUEBA   -> tu email real (ej: ergomara@hotmail.com)
--        CODIGO_GIFT_CARD  -> el codigo de tu gift card
--   2) Selecciona TODO el archivo y pulsa Run.
--   3) Cada query devuelve una fila etiquetada (paso). Lee la columna
--      "diagnostico" - te dice en espanol si esta OK o si hay bug.
-- =====================================================================

-- PASO 0: usuario existe en auth.users
SELECT
  '0_USUARIO' AS paso,
  id AS user_id,
  email,
  phone,
  created_at,
  email_confirmed_at IS NOT NULL AS email_ok,
  phone_confirmed_at IS NOT NULL AS phone_ok
FROM auth.users
WHERE email = 'EMAIL_DE_PRUEBA';

-- PASO 1: profile creado
SELECT
  '1_PROFILE' AS paso,
  *
FROM public.profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'EMAIL_DE_PRUEBA');

-- PASO 2: gift card disponible
SELECT
  '2_GIFTCARD' AS paso,
  code,
  balance,
  status,
  expires_at
FROM public.gift_cards
WHERE code = 'CODIGO_GIFT_CARD';

-- PASO 3a: intent creado al pulsar Pagar
SELECT
  '3a_INTENT' AS paso,
  id,
  status,
  amount_cents,
  gift_card_applied_cents,
  gift_card_code,
  stripe_checkout_session_id,
  created_at
FROM public.membership_intents
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'EMAIL_DE_PRUEBA')
ORDER BY created_at DESC
LIMIT 1;

-- PASO 3b: membresia creada por webhook tras pago Stripe
SELECT
  '3b_MEMBERSHIP' AS paso,
  id,
  status,
  membership_type,
  billing_cycle,
  stripe_subscription_id,
  stripe_customer_id,
  created_at,
  CASE
    WHEN status = 'active' THEN 'BUG CRITICO: active sin SEPA - regla de oro violada'
    WHEN status = 'paid_pending_verification' THEN 'OK: esperando Identity'
    WHEN status = 'pending_sepa' THEN 'OK: esperando SEPA'
    ELSE 'REVISAR status'
  END AS diagnostico
FROM public.user_memberships
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'EMAIL_DE_PRUEBA')
ORDER BY created_at DESC
LIMIT 1;

-- PASO 3c: gift card debitada
SELECT
  '3c_GIFTCARD_BALANCE' AS paso,
  code,
  balance AS balance_actual,
  status
FROM public.gift_cards
WHERE code = 'CODIGO_GIFT_CARD';

-- PASO 3d: transaccion de debito de gift card
SELECT
  '3d_GIFTCARD_DEBIT' AS paso,
  amount,
  transaction_type,
  reference_type,
  reference_id,
  created_at
FROM public.gift_card_transactions
WHERE gift_card_id = (SELECT id FROM public.gift_cards WHERE code = 'CODIGO_GIFT_CARD')
  AND transaction_type = 'debit'
ORDER BY created_at DESC
LIMIT 1;

-- PASO 4a: identity verificada
SELECT
  '4a_IDENTITY' AS paso,
  stripe_verification_id,
  status,
  verified_at,
  CASE
    WHEN status = 'verified' THEN 'OK: Identity completada'
    WHEN status = 'requires_input' THEN 'PENDIENTE: usuario debe completar'
    ELSE 'REVISAR status'
  END AS diagnostico
FROM public.identity_verifications
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'EMAIL_DE_PRUEBA')
ORDER BY created_at DESC
LIMIT 1;

-- PASO 4b: membresia DEBE seguir paid_pending_verification tras Identity
SELECT
  '4b_MEMBERSHIP_TRAS_IDENTITY' AS paso,
  status,
  sepa_payment_method_id,
  CASE
    WHEN status = 'active' AND sepa_payment_method_id IS NULL
      THEN 'BUG CRITICO: active sin SEPA tras Identity'
    WHEN status = 'paid_pending_verification' THEN 'OK'
    WHEN status = 'pending_sepa' THEN 'OK: redirigido a SEPA'
    ELSE 'REVISAR status'
  END AS diagnostico
FROM public.user_memberships
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'EMAIL_DE_PRUEBA')
ORDER BY created_at DESC
LIMIT 1;

-- PASO 5a: SEPA firmado
SELECT
  '5a_SEPA' AS paso,
  sepa_payment_method_id,
  sepa_signed_at,
  status,
  CASE
    WHEN sepa_payment_method_id IS NULL THEN 'PENDIENTE: usuario no firmo SEPA'
    ELSE 'OK: SEPA firmado'
  END AS diagnostico
FROM public.user_memberships
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'EMAIL_DE_PRUEBA')
ORDER BY created_at DESC
LIMIT 1;

-- PASO 5b: membresia activa - regla de oro completa
SELECT
  '5b_FINAL' AS paso,
  status,
  membership_type,
  billing_cycle,
  start_date,
  end_date,
  sepa_payment_method_id IS NOT NULL AS sepa_ok,
  CASE
    WHEN status = 'active' AND sepa_payment_method_id IS NOT NULL
      THEN 'OK: regla de oro cumplida - Active con SEPA'
    WHEN status = 'active' AND sepa_payment_method_id IS NULL
      THEN 'BUG: active sin SEPA'
    ELSE 'PENDIENTE: status=' || status
  END AS diagnostico
FROM public.user_memberships
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'EMAIL_DE_PRUEBA')
ORDER BY created_at DESC
LIMIT 1;

-- PASO 6: total transacciones gift card (deberia ser 1 debito tras flujo OK)
SELECT
  '6_TOTAL_DEBITS' AS paso,
  count(*) FILTER (WHERE transaction_type = 'debit') AS debits,
  count(*) FILTER (WHERE transaction_type = 'credit') AS credits,
  coalesce(sum(amount) FILTER (WHERE transaction_type = 'debit'), 0) AS total_debitado
FROM public.gift_card_transactions
WHERE gift_card_id = (SELECT id FROM public.gift_cards WHERE code = 'CODIGO_GIFT_CARD');
