-- =====================================================================
-- CHECKLIST DE PRUEBAS — FLUJO COMPLETO SEMZO PRIVÉ
-- =====================================================================
-- Uso: copia este archivo en Supabase SQL Editor y ejecuta cada bloque
-- DESPUES de completar el paso correspondiente en la web.
--
-- Si un bloque devuelve algo distinto a lo esperado, el flujo se rompió
-- en ESE paso. No avances al siguiente hasta que el actual esté OK.
--
-- ANTES DE EMPEZAR: cambia el email en la linea de abajo
-- =====================================================================

-- CAMBIAR ESTE EMAIL POR EL DE LA PRUEBA
-- (mantener las comillas simples)
\set test_email 'CAMBIAR_AQUI@ejemplo.com'


-- =====================================================================
-- PASO 0 — ESTADO INICIAL (antes de empezar la prueba)
-- =====================================================================
-- Esperado: usuario NO existe, o existe pero SIN membership/intent/identity
-- Si hay datos, ejecuta primero cleanup-test-user-keep-account.sql

SELECT
  '0. ESTADO INICIAL' AS paso,
  u.id AS user_id,
  u.email,
  u.created_at AS usuario_creado,
  (SELECT count(*) FROM public.user_memberships WHERE user_id = u.id) AS num_memberships,
  (SELECT count(*) FROM public.membership_intents WHERE user_id = u.id) AS num_intents,
  (SELECT count(*) FROM public.identity_verifications WHERE user_id = u.id) AS num_identity
FROM auth.users u
WHERE u.email = :'test_email';


-- =====================================================================
-- PASO 1 — ALTA POR SMS / EMAIL
-- =====================================================================
-- Esperado tras crear cuenta y verificar OTP:
--   - auth.users  → 1 fila con tu email
--   - profiles    → 1 fila vinculada
-- Si no hay profile, hay un bug en el trigger handle_new_user

SELECT
  '1. ALTA' AS paso,
  u.id AS user_id,
  u.email,
  u.phone,
  u.email_confirmed_at IS NOT NULL AS email_confirmado,
  u.phone_confirmed_at IS NOT NULL AS phone_confirmado,
  p.first_name,
  p.last_name,
  p.created_at AS profile_creado
FROM auth.users u
LEFT JOIN public.profiles p ON p.id = u.id
WHERE u.email = :'test_email';


-- =====================================================================
-- PASO 2 — APLICAR GIFT CARD EN EL CARRITO
-- =====================================================================
-- Esperado: la gift card que aplicaste tiene balance > 0 y status='active'
-- (esto se verifica antes del pago, para confirmar que la GC es valida)
-- CAMBIA EL CODIGO de la gift card abajo

SELECT
  '2. GIFT CARD' AS paso,
  gc.code,
  gc.status,
  gc.balance,
  gc.original_amount,
  gc.created_at,
  gc.expires_at
FROM public.gift_cards gc
WHERE gc.code = 'CAMBIAR_CODIGO_GIFT_CARD';


-- =====================================================================
-- PASO 3 — PAGO STRIPE COMPLETADO
-- =====================================================================
-- Esperado tras pagar en Stripe Checkout:
--   - membership_intents → 1 fila con gift_card_applied_cents > 0
--   - user_memberships   → 1 fila con status = 'paid_pending_verification'
--                          (NUNCA 'active' aqui — regla de oro)
--   - gift_cards         → balance reducido por el monto consumido
--
-- Si user_memberships.status = 'active' AQUI = bug critico (se salto Identity+SEPA)
-- Si gift_cards.balance no se redujo = bug en webhook gift card debit

SELECT
  '3a. INTENT' AS paso,
  mi.id,
  mi.status,
  mi.amount_cents,
  mi.gift_card_applied_cents,
  mi.gift_card_code,
  mi.stripe_checkout_session_id,
  mi.created_at
FROM public.membership_intents mi
JOIN auth.users u ON u.id = mi.user_id
WHERE u.email = :'test_email'
ORDER BY mi.created_at DESC
LIMIT 1;

SELECT
  '3b. MEMBRESIA TRAS PAGO' AS paso,
  um.id,
  um.status AS status_actual,
  CASE
    WHEN um.status = 'paid_pending_verification' THEN 'OK — esperando Identity'
    WHEN um.status = 'active'                    THEN 'BUG — se salto Identity/SEPA'
    ELSE 'REVISAR — status inesperado'
  END AS diagnostico,
  um.membership_type,
  um.stripe_subscription_id,
  um.created_at
FROM public.user_memberships um
JOIN auth.users u ON u.id = um.user_id
WHERE u.email = :'test_email'
ORDER BY um.created_at DESC
LIMIT 1;

SELECT
  '3c. GIFT CARD DEBITADA' AS paso,
  gc.code,
  gc.balance AS balance_actual,
  gc.original_amount,
  (gc.original_amount - gc.balance) AS consumido,
  CASE
    WHEN gc.balance < gc.original_amount THEN 'OK — debito aplicado'
    ELSE 'BUG — webhook no debito la gift card'
  END AS diagnostico
FROM public.gift_cards gc
WHERE gc.code = 'CAMBIAR_CODIGO_GIFT_CARD';


-- =====================================================================
-- PASO 4 — IDENTITY VERIFICADA (Stripe Identity completado)
-- =====================================================================
-- Esperado tras completar la verificacion de identidad en Stripe:
--   - identity_verifications.status = 'verified'
--   - user_memberships.status      = 'paid_pending_verification' (SIGUE igual)
--
-- Si user_memberships.status pasa a 'active' AQUI = bug (se salto SEPA)

SELECT
  '4a. IDENTITY' AS paso,
  iv.stripe_verification_id,
  iv.status,
  iv.verified_at,
  iv.created_at,
  CASE
    WHEN iv.status = 'verified' THEN 'OK — Identity verificada'
    WHEN iv.status IN ('pending','processing') THEN 'En curso — espera redirect'
    ELSE 'BUG — status: ' || iv.status
  END AS diagnostico
FROM public.identity_verifications iv
JOIN auth.users u ON u.id = iv.user_id
WHERE u.email = :'test_email'
ORDER BY iv.created_at DESC
LIMIT 1;

SELECT
  '4b. MEMBRESIA TRAS IDENTITY' AS paso,
  um.status,
  CASE
    WHEN um.status = 'paid_pending_verification' THEN 'OK — esperando SEPA'
    WHEN um.status = 'active'                    THEN 'BUG — se salto SEPA'
    WHEN um.status = 'pending_sepa'              THEN 'OK — listo para firmar SEPA'
    ELSE 'REVISAR — status: ' || um.status
  END AS diagnostico
FROM public.user_memberships um
JOIN auth.users u ON u.id = um.user_id
WHERE u.email = :'test_email'
ORDER BY um.created_at DESC
LIMIT 1;


-- =====================================================================
-- PASO 5 — MANDATO SEPA FIRMADO
-- =====================================================================
-- Esperado tras firmar el mandato SEPA:
--   - sepa_mandates.status        = 'active' (o equivalente)
--   - user_memberships.status     = 'active'  ← AHORA SI
--   - user_memberships.sepa_payment_method_id  no nulo
--
-- Esta es la unica transicion legitima a 'active' en todo el flujo.

SELECT
  '5a. SEPA MANDATE' AS paso,
  sm.stripe_payment_method_id,
  sm.status,
  sm.bank_name,
  sm.last4,
  sm.created_at
FROM public.sepa_mandates sm
JOIN auth.users u ON u.id = sm.user_id
WHERE u.email = :'test_email'
ORDER BY sm.created_at DESC
LIMIT 1;

SELECT
  '5b. MEMBRESIA FINAL' AS paso,
  um.status,
  um.membership_type,
  um.sepa_payment_method_id,
  um.start_date,
  um.end_date,
  CASE
    WHEN um.status = 'active' AND um.sepa_payment_method_id IS NOT NULL
      THEN 'OK — flujo completo'
    WHEN um.status = 'active' AND um.sepa_payment_method_id IS NULL
      THEN 'BUG — active sin SEPA payment method'
    ELSE 'INCOMPLETO — status: ' || um.status
  END AS diagnostico
FROM public.user_memberships um
JOIN auth.users u ON u.id = um.user_id
WHERE u.email = :'test_email'
ORDER BY um.created_at DESC
LIMIT 1;


-- =====================================================================
-- PASO 6 — RESUMEN COMPLETO (vista de 1 query)
-- =====================================================================
-- Esto te da en una sola fila el estado de todo el flujo.

SELECT
  u.email,
  (SELECT iv.status FROM public.identity_verifications iv
     WHERE iv.user_id = u.id ORDER BY iv.created_at DESC LIMIT 1) AS identity_status,
  (SELECT sm.status FROM public.sepa_mandates sm
     WHERE sm.user_id = u.id ORDER BY sm.created_at DESC LIMIT 1) AS sepa_status,
  (SELECT um.status FROM public.user_memberships um
     WHERE um.user_id = u.id ORDER BY um.created_at DESC LIMIT 1) AS membership_status,
  (SELECT um.sepa_payment_method_id FROM public.user_memberships um
     WHERE um.user_id = u.id ORDER BY um.created_at DESC LIMIT 1) IS NOT NULL AS tiene_sepa_pm,
  (SELECT mi.gift_card_applied_cents FROM public.membership_intents mi
     WHERE mi.user_id = u.id ORDER BY mi.created_at DESC LIMIT 1) AS gift_card_aplicado_cents
FROM auth.users u
WHERE u.email = :'test_email';
