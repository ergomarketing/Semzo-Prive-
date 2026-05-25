-- =====================================================
-- BACKFILL: vincular reservas Petite ya activas con su bag_pass
-- y poblar pass_expires_at / delivered_at desde datos existentes.
-- Idempotente: solo toca filas con campos NULL.
-- =====================================================

-- 1. Vincular bag_pass_id usando used_for_reservation_id (relacion ya existente en bag_passes)
UPDATE reservations r
SET bag_pass_id = bp.id
FROM bag_passes bp
WHERE bp.used_for_reservation_id = r.id
  AND r.bag_pass_id IS NULL;

-- 2. Para reservas con pase ya vinculado, poblar pass_expires_at desde end_date si esta vacio
UPDATE reservations
SET pass_expires_at = end_date
WHERE bag_pass_id IS NOT NULL
  AND pass_expires_at IS NULL
  AND end_date IS NOT NULL;

-- 3. Si la reserva tiene shipment delivered, poblar delivered_at y recalcular pass_expires_at correcto
UPDATE reservations r
SET 
  delivered_at = COALESCE(r.delivered_at, s.delivered_at, s.updated_at),
  pass_expires_at = COALESCE(s.delivered_at, s.updated_at) + INTERVAL '7 days'
FROM shipments s
WHERE s.reservation_id = r.id
  AND s.status = 'delivered'
  AND r.bag_pass_id IS NOT NULL
  AND r.delivered_at IS NULL;

-- 4. Verificar resultado
SELECT 
  r.id AS reservation_id,
  r.user_id,
  r.bag_pass_id,
  r.delivered_at,
  r.pass_expires_at,
  r.end_date,
  r.status
FROM reservations r
WHERE r.bag_pass_id IS NOT NULL
ORDER BY r.created_at DESC;
