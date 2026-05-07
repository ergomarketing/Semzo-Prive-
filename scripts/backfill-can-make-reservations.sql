-- =============================================================================
-- BACKFILL: can_make_reservations = true para membresias ya activas.
--
-- CONTEXTO:
--   La columna user_memberships.can_make_reservations se creo con
--   DEFAULT false. Los endpoints de activacion (orchestrator, gift card,
--   memberships/activate, resume-onboarding) NO seteaban explicitamente
--   este campo a true al activar. Resultado: usuarias con membresia
--   activa pero bloqueadas en /api/user/reservations (403 Forbidden).
--
--   Tras el fix de codigo, las nuevas activaciones ya marcan true.
--   Este script repara las activaciones HISTORICAS.
--
-- IDEMPOTENTE: solo afecta filas donde el flag esta mal seteado.
-- =============================================================================

-- 1) PREVIEW: ver a quien va a afectar antes de ejecutar el UPDATE.
SELECT
  um.user_id,
  p.email,
  p.full_name,
  um.membership_type,
  um.status,
  um.can_make_reservations,
  um.start_date,
  um.end_date,
  um.created_at
FROM user_memberships um
LEFT JOIN profiles p ON p.id = um.user_id
WHERE um.status = 'active'
  AND um.can_make_reservations IS DISTINCT FROM true
  AND (um.end_date IS NULL OR um.end_date > NOW())
ORDER BY um.created_at DESC;

-- 2) UPDATE: habilitar reservas para membresias activas y vigentes.
UPDATE user_memberships
SET
  can_make_reservations = true,
  updated_at = NOW()
WHERE status = 'active'
  AND can_make_reservations IS DISTINCT FROM true
  AND (end_date IS NULL OR end_date > NOW());

-- 3) VERIFICACION: confirmar que no queda ninguna fila active con flag false.
SELECT COUNT(*) AS active_pero_bloqueadas
FROM user_memberships
WHERE status = 'active'
  AND can_make_reservations IS DISTINCT FROM true
  AND (end_date IS NULL OR end_date > NOW());
