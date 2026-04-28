-- =====================================================================
-- CHECKLIST DE PRUEBAS - SEMZO PRIVE
-- =====================================================================
-- USO:
--   1) Ctrl+H y reemplaza:
--        EMAIL_DE_PRUEBA   ->  tu email real
--        CODIGO_GIFT_CARD  ->  el codigo de tu gift card
--   2) Selecciona TODO el archivo y pulsa Run.
--   3) Cada query devuelve una fila etiquetada (paso).
--      Lee la columna "diagnostico" - dice en espanol si esta OK o si hay bug.
--   4) Re-ejecuta tras cada accion en la web (registro, gift card, pago,
--      Identity, SEPA) para ver como avanza el flujo.
-- =====================================================================


-- ---------------------------------------------------------------------
-- PASO 0  - Usuario en auth.users
-- ---------------------------------------------------------------------
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


-- ---------------------------------------------------------------------
-- PASO 1  - Profile creado
-- ---------------------------------------------------------------------
SELECT
  '1_PROFILE' AS paso,
  id, email, full_name, phone, stripe_customer_id,
  sepa_payment_method_id, sepa_mandate_accepted_at, created_at
FROM public.profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'EMAIL_DE_PRUEBA');


-- ---------------------------------------------------------------------
-- PASO 2  - Gift card disponible (amount en centimos)
-- ---------------------------------------------------------------------
SELECT
  '2_GIFTCARD' AS paso,
  code,
  ROUND(amount::numeric / 100, 2)          AS amount_actual_eur,
  ROUND(original_amount::numeric / 100, 2) AS original_eur,
  status,
  expires_at
FROM public.gift_cards
WHERE code = 'CODIGO_GIFT_CARD';


-- ---------------------------------------------------------------------
-- PASO 3a  - Intent creado al pulsar Pagar
-- ---------------------------------------------------------------------
SELECT
  '3a_INTENT' AS paso,
  id, status, amount_cents, gift_card_applied_cents, gift_card_code,
  stripe_checkout_session_id, created_at
FROM public.membership_intents
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'EMAIL_DE_PRUEBA')
ORDER BY created_at DESC
LIMIT 1;


-- ---------------------------------------------------------------------
-- PASO 3b  - Membresia tras pago
-- Esperado: status = 'paid_pending_verification' (NO 'active')
-- ---------------------------------------------------------------------
SELECT
  '3b_MEMBERSHIP' AS paso,
  status, membership_type, billing_cycle,
  stripe_subscription_id, stripe_customer_id, created_at,
  CASE
    WHEN status = 'active' THEN 'BUG CRITICO: active sin SEPA - regla de oro violada'
    WHEN status IN ('paid_pending_verification','pending_verification') THEN 'OK: esperando Identity'
    WHEN status = 'pending_sepa' THEN 'OK: esperando SEPA'
    ELSE 'REVISAR status: ' || status
  END AS diagnostico
FROM public.user_memberships
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'EMAIL_DE_PRUEBA')
ORDER BY created_at DESC
LIMIT 1;


-- ---------------------------------------------------------------------
-- PASO 3c  - Gift card debitada
-- Esperado: amount < original_amount (gift card consumida)
-- ---------------------------------------------------------------------
SELECT
  '3c_GIFTCARD_DEBIT' AS paso,
  code,
  ROUND(amount::numeric / 100, 2)                       AS amount_actual_eur,
  ROUND(original_amount::numeric / 100, 2)              AS original_eur,
  ROUND((original_amount - amount)::numeric / 100, 2)   AS consumido_eur,
  status,
  CASE
    WHEN amount = original_amount THEN 'BUG: gift card NO debitada tras pago'
    WHEN amount < original_amount THEN 'OK: gift card debitada'
    ELSE 'REVISAR'
  END AS diagnostico
FROM public.gift_cards
WHERE code = 'CODIGO_GIFT_CARD';


-- ---------------------------------------------------------------------
-- PASO 4a  - Identity verificada
-- Esperado: status = 'verified' tras completar Stripe Identity
-- ---------------------------------------------------------------------
SELECT
  '4a_IDENTITY' AS paso,
  stripe_verification_id, status, verified_at, created_at,
  CASE
    WHEN status = 'verified'       THEN 'OK: Identity completada'
    WHEN status = 'requires_input' THEN 'PENDIENTE: usuario debe completar'
    WHEN status = 'pending'        THEN 'EN PROCESO'
    ELSE 'REVISAR status: ' || status
  END AS diagnostico
FROM public.identity_verifications
WHERE user_id = (SELECT id FROM auth.users WHERE email = 'EMAIL_DE_PRUEBA')
ORDER BY created_at DESC
LIMIT 1;


-- ---------------------------------------------------------------------
-- PASO 4b  - Membresia tras Identity
-- Esperado: status sigue en paid_pending_verification o pending_sepa.
-- NO debe ser 'active' hasta que SEPA se firme.
-- NOTA: sepa_payment_method_id esta en profiles, NO en user_memberships.
-- ---------------------------------------------------------------------
SELECT
  '4b_MEMBERSHIP_TRAS_IDENTITY' AS paso,
  m.status,
  m.stripe_subscription_id,
  p.sepa_payment_method_id,
  CASE
    WHEN m.status = 'active' AND p.sepa_payment_method_id IS NULL
      THEN 'BUG CRITICO: active sin SEPA - regla de oro violada'
    WHEN m.status IN ('paid_pending_verification','pending_verification')
      THEN 'OK: aun espera SEPA'
    WHEN m.status = 'pending_sepa'
      THEN 'OK: redirigido a SEPA'
    ELSE 'REVISAR status: ' || m.status
  END AS diagnostico
FROM public.user_memberships m
LEFT JOIN public.profiles p ON p.id = m.user_id
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'EMAIL_DE_PRUEBA')
ORDER BY m.created_at DESC
LIMIT 1;


-- ---------------------------------------------------------------------
-- PASO 5a  - SEPA firmado (datos en profiles)
-- Esperado: sepa_payment_method_id IS NOT NULL tras firmar mandato.
-- ---------------------------------------------------------------------
SELECT
  '5a_SEPA' AS paso,
  sepa_payment_method_id,
  sepa_mandate_accepted_at,
  CASE
    WHEN sepa_payment_method_id IS NULL THEN 'PENDIENTE: usuario no firmo SEPA'
    ELSE 'OK: SEPA firmado'
  END AS diagnostico
FROM public.profiles
WHERE id = (SELECT id FROM auth.users WHERE email = 'EMAIL_DE_PRUEBA');


-- ---------------------------------------------------------------------
-- PASO 5b  - Estado final - regla de oro completa
-- Esperado: status='active' Y sepa_payment_method_id IS NOT NULL
-- ---------------------------------------------------------------------
SELECT
  '5b_FINAL' AS paso,
  m.status,
  m.membership_type,
  m.billing_cycle,
  m.start_date,
  m.end_date,
  (p.sepa_payment_method_id IS NOT NULL) AS sepa_ok,
  CASE
    WHEN m.status = 'active' AND p.sepa_payment_method_id IS NOT NULL
      THEN 'OK: regla de oro cumplida - Active con SEPA'
    WHEN m.status = 'active' AND p.sepa_payment_method_id IS NULL
      THEN 'BUG: active sin SEPA'
    ELSE 'PENDIENTE: status = ' || m.status
  END AS diagnostico
FROM public.user_memberships m
LEFT JOIN public.profiles p ON p.id = m.user_id
WHERE m.user_id = (SELECT id FROM auth.users WHERE email = 'EMAIL_DE_PRUEBA')
ORDER BY m.created_at DESC
LIMIT 1;


-- ---------------------------------------------------------------------
-- PASO 6  - Resumen movimientos gift card
-- ---------------------------------------------------------------------
SELECT
  '6_GC_MOVIMIENTOS' AS paso,
  count(*) FILTER (WHERE transaction_type = 'debit')                     AS debits,
  count(*) FILTER (WHERE transaction_type = 'credit')                    AS credits,
  ROUND(coalesce(sum(amount) FILTER (WHERE transaction_type = 'debit'),0)::numeric / 100, 2) AS total_debitado_eur
FROM public.gift_card_transactions
WHERE gift_card_id = (SELECT id FROM public.gift_cards WHERE code = 'CODIGO_GIFT_CARD');
