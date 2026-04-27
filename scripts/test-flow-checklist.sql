-- =====================================================================
-- CHECKLIST DE PRUEBAS - FLUJO COMPLETO SEMZO PRIVE
-- =====================================================================
-- COMO USAR:
-- 1. Pega este archivo entero en Supabase SQL Editor (NO ejecutes todavia).
-- 2. Pulsa Cmd+F (Mac) o Ctrl+H (Windows) y reemplaza:
--      EMAIL_DE_PRUEBA   ->  tu email real (ej: ergomara@hotmail.com)
--      CODIGO_GIFT_CARD  ->  el codigo de la gift card que vas a usar
-- 3. Ejecuta UN BLOQUE A LA VEZ, despues de hacer la accion en la web.
--    Para ejecutar solo un bloque: selecciona con el cursor y pulsa Run.
--
-- Si un bloque devuelve algo distinto a lo esperado, el flujo se rompio
-- en ESE paso. No avances al siguiente hasta que el actual este OK.
-- =====================================================================


-- =====================================================================
-- PASO 0 - ESTADO INICIAL (antes de empezar la prueba)
-- =====================================================================
-- Esperado: usuario NO existe, o existe pero SIN membership/intent/identity.
-- Si hay datos previos, ejecuta antes cleanup-test-user-keep-account.sql
SELECT
  '0. ESTADO INICIAL' AS paso,
  u.id AS user_id,
  u.email,
  u.created_at AS usuario_creado,
  (SELECT count(*) FROM public.user_memberships WHERE user_id = u.id) AS num_memberships,
  (SELECT count(*) FROM public.membership_intents WHERE user_id = u.id) AS num_intents,
  (SELECT count(*) FROM public.identity_verifications WHERE user_id = u.id) AS num_identity
FROM auth.users u
WHERE u.email = 'EMAIL_DE_PRUEBA';


-- =====================================================================
-- PASO 1 - ALTA POR SMS / EMAIL  (ejecutar despues de registrarte)
-- =====================================================================
-- Esperado tras crear cuenta y verificar OTP:
--   - auth.users   -> 1 fila con tu email
--   - profiles     -> 1 fila vinculada
-- Si profile_creado es NULL hay un bug en el trigger handle_new_user.
SELECT
  '1. ALTA' AS paso,
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


-- =====================================================================
-- PASO 2 - APLICAR GIFT CARD EN EL CARRITO  (ejecutar tras "Aplicar codigo")
-- =====================================================================
-- Esperado: la gift card existe, status='active', balance > 0.
SELECT
  '2. GIFT CARD' AS paso,
  gc.code,
  gc.status,
  gc.balance,
  gc.original_amount,
  gc.created_at,
  gc.expires_at
FROM public.gift_cards gc
WHERE gc.code = 'CODIGO_GIFT_CARD';


-- =====================================================================
-- PASO 3a - INTENT CREADO  (ejecutar al pulsar "Pagar", antes de Stripe)
-- =====================================================================
-- Esperado: 1 intent con gift_card_applied_cents > 0 y stripe_checkout_session_id.
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
WHERE u.email = 'EMAIL_DE_PRUEBA'
ORDER BY mi.created_at DESC
LIMIT 1;


-- =====================================================================
-- PASO 3b - MEMBRESIA TRAS PAGO  (ejecutar al volver de Stripe Checkout)
-- =====================================================================
-- REGLA DE ORO: Identity -> SEPA -> Active.
-- Esperado: status = 'paid_pending_verification' (NUNCA 'active' aqui).
-- Si aparece 'active' = BUG critico (se salto Identity y SEPA).
SELECT
  '3b. MEMBRESIA TRAS PAGO' AS paso,
  um.id,
  um.status AS status_actual,
  CASE
    WHEN um.status = 'paid_pending_verification' THEN 'OK - esperando Identity'
    WHEN um.status = 'active'                    THEN 'BUG - se salto Identity/SEPA'
    ELSE 'REVISAR - status inesperado'
  END AS diagnostico,
  um.membership_type,
  um.stripe_subscription_id,
  um.created_at
FROM public.user_memberships um
JOIN auth.users u ON u.id = um.user_id
WHERE u.email = 'EMAIL_DE_PRUEBA'
ORDER BY um.created_at DESC
LIMIT 1;


-- =====================================================================
-- PASO 3c - GIFT CARD DEBITADA  (ejecutar tras webhook checkout.session.completed)
-- =====================================================================
-- Esperado: balance reducido. Si balance = original_amount, el webhook no debito.
SELECT
  '3c. GIFT CARD DEBITADA' AS paso,
  gc.code,
  gc.balance AS balance_actual,
  gc.original_amount,
  (gc.original_amount - gc.balance) AS consumido,
  CASE
    WHEN gc.balance < gc.original_amount THEN 'OK - debito aplicado'
    ELSE 'BUG - webhook no debito la gift card'
  END AS diagnostico
FROM public.gift_cards gc
WHERE gc.code = 'CODIGO_GIFT_CARD';


-- =====================================================================
-- PASO 4a - IDENTITY VERIFICADA  (ejecutar tras completar Stripe Identity)
-- =====================================================================
-- Esperado: status = 'verified'.
SELECT
  '4a. IDENTITY' AS paso,
  iv.stripe_verification_id,
  iv.status,
  iv.verified_at,
  iv.created_at,
  CASE
    WHEN iv.status = 'verified' THEN 'OK - Identity verificada'
    WHEN iv.status IN ('pending','processing') THEN 'En curso - espera redirect'
    ELSE 'BUG - status: ' || iv.status
  END AS diagnostico
FROM public.identity_verifications iv
JOIN auth.users u ON u.id = iv.user_id
WHERE u.email = 'EMAIL_DE_PRUEBA'
ORDER BY iv.created_at DESC
LIMIT 1;


-- =====================================================================
-- PASO 4b - MEMBRESIA TRAS IDENTITY  (ejecutar despues de PASO 4a)
-- =====================================================================
-- Esperado: status sigue en 'paid_pending_verification' o pasa a 'pending_sepa'.
-- Si aparece 'active' aqui = BUG (se salto SEPA).
SELECT
  '4b. MEMBRESIA TRAS IDENTITY' AS paso,
  um.status,
  CASE
    WHEN um.status = 'paid_pending_verification' THEN 'OK - esperando SEPA'
    WHEN um.status = 'pending_sepa'              THEN 'OK - listo para firmar SEPA'
    WHEN um.status = 'active'                    THEN 'BUG - se salto SEPA'
    ELSE 'REVISAR - status: ' || um.status
  END AS diagnostico
FROM public.user_memberships um
JOIN auth.users u ON u.id = um.user_id
WHERE u.email = 'EMAIL_DE_PRUEBA'
ORDER BY um.created_at DESC
LIMIT 1;


-- =====================================================================
-- PASO 5a - MANDATO SEPA  (ejecutar tras firmar el mandato)
-- =====================================================================
-- Esperado: 1 fila con stripe_payment_method_id y status='active'.
SELECT
  '5a. SEPA MANDATE' AS paso,
  sm.stripe_payment_method_id,
  sm.status,
  sm.bank_name,
  sm.last4,
  sm.created_at
FROM public.sepa_mandates sm
JOIN auth.users u ON u.id = sm.user_id
WHERE u.email = 'EMAIL_DE_PRUEBA'
ORDER BY sm.created_at DESC
LIMIT 1;


-- =====================================================================
-- PASO 5b - MEMBRESIA FINAL  (ejecutar despues de PASO 5a)
-- =====================================================================
-- Esperado: status='active' Y sepa_payment_method_id NO nulo.
-- Esta es la UNICA transicion legitima a 'active' en todo el flujo.
SELECT
  '5b. MEMBRESIA FINAL' AS paso,
  um.status,
  um.membership_type,
  um.sepa_payment_method_id,
  um.start_date,
  um.end_date,
  CASE
    WHEN um.status = 'active' AND um.sepa_payment_method_id IS NOT NULL
      THEN 'OK - flujo completo'
    WHEN um.status = 'active' AND um.sepa_payment_method_id IS NULL
      THEN 'BUG - active sin SEPA payment method'
    ELSE 'INCOMPLETO - status: ' || um.status
  END AS diagnostico
FROM public.user_memberships um
JOIN auth.users u ON u.id = um.user_id
WHERE u.email = 'EMAIL_DE_PRUEBA'
ORDER BY um.created_at DESC
LIMIT 1;


-- =====================================================================
-- PASO 6 - RESUMEN COMPLETO  (1 sola fila con todo el estado)
-- =====================================================================
-- Util para mandar copy/paste si algo fallo en cualquier paso.
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
WHERE u.email = 'EMAIL_DE_PRUEBA';
