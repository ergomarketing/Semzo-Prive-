-- ============================================================================
-- FIX MANUAL: crear reserva para Anly Goncalves vinculada a su pase signature
-- ============================================================================
-- Pase: SIGNATURE €99 available, comprado 18/5/2026 15:54:57
-- Email: anlymaribel@gmail.com
--
-- USO:
-- 1) Listar bolsos signature disponibles → identificar bag_id deseado
-- 2) Reemplazar el UUID en el bloque de la reserva
-- 3) Ejecutar el bloque de reserva
-- ============================================================================

-- PASO 1: Listar bolsos signature disponibles
SELECT id, brand, name, status, membership_type
FROM bags
WHERE membership_type IN ('signature', 'Signature')
  AND status IN ('available', 'Available', 'disponible', 'Disponible')
ORDER BY brand, name;

-- PASO 2: Obtener el pase available de Anly
SELECT bp.id AS pass_id, bp.pass_tier, bp.status, bp.purchased_at, p.email
FROM bag_passes bp
JOIN profiles p ON p.id = bp.user_id
WHERE p.email = 'anlymaribel@gmail.com'
  AND bp.status = 'available'
ORDER BY bp.purchased_at DESC
LIMIT 1;

-- PASO 3: Crear reserva atomica (REEMPLAZAR <BAG_ID> con uno del paso 1)
-- DESCOMENTAR Y EJECUTAR cuando tengas el bag_id:
--
-- DO $$
-- DECLARE
--   v_user_id UUID;
--   v_pass_id UUID;
--   v_bag_id  UUID := '<BAG_ID>'::UUID;  -- <-- pegar aqui
--   v_reservation_id UUID;
-- BEGIN
--   SELECT id INTO v_user_id FROM profiles WHERE email = 'anlymaribel@gmail.com';
--   SELECT id INTO v_pass_id FROM bag_passes
--     WHERE user_id = v_user_id AND status = 'available'
--     ORDER BY purchased_at DESC LIMIT 1;
--
--   v_reservation_id := create_reservation_atomic(
--     v_user_id,
--     v_bag_id,
--     v_pass_id,
--     NOW(),
--     NOW() + INTERVAL '7 days'
--   );
--
--   RAISE NOTICE 'Reserva creada: %', v_reservation_id;
-- END $$;
