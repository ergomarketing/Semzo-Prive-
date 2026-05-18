-- ============================================================
-- Reserva manual Anly - bolso Reverie de Louis Vuitton
-- pase_id: c3d05ebb-336f-40c5-9f5e-8b9b78fa4562 (signature, available)
-- ============================================================

-- PASO 1: Confirmar bag_id del bolso Reverie de LV
SELECT id, brand, name, tier, status
FROM bags
WHERE brand ILIKE '%louis%vuitton%'
  AND name ILIKE '%reverie%';

-- PASO 2 (ejecutar despues de confirmar el bag_id arriba):
-- Reemplaza <BAG_ID_AQUI> por el UUID que devuelve el SELECT anterior
-- y descomenta el bloque DO siguiente.

/*
DO $$
DECLARE
  v_user_id    uuid := (SELECT id FROM auth.users WHERE email = 'anlymaribel@gmail.com');
  v_bag_id     uuid := '<BAG_ID_AQUI>'::uuid;
  v_pass_id    uuid := 'c3d05ebb-336f-40c5-9f5e-8b9b78fa4562'::uuid;
  v_start      timestamptz := NOW();
  v_end        timestamptz := NOW() + INTERVAL '7 days';
  v_reservation_id uuid;
BEGIN
  -- Verificaciones previas
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario anlymaribel@gmail.com no encontrado';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM bag_passes WHERE id = v_pass_id AND user_id = v_user_id AND status = 'available') THEN
    RAISE EXCEPTION 'Pase % no esta available para este usuario', v_pass_id;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM bags WHERE id = v_bag_id AND status = 'available') THEN
    RAISE EXCEPTION 'Bolso % no esta available', v_bag_id;
  END IF;

  -- Llamada al RPC atomico (mismo que usa el flujo nuevo)
  SELECT create_reservation_atomic(
    v_user_id,
    v_bag_id,
    v_pass_id,
    v_start,
    v_end
  ) INTO v_reservation_id;

  RAISE NOTICE 'Reserva creada OK: %', v_reservation_id;
END $$;
*/

-- PASO 3 (verificar tras ejecutar el bloque DO):
SELECT
  r.id   AS reservation_id,
  r.status AS reservation_status,
  r.start_date,
  r.end_date,
  b.brand, b.name AS bag_name, b.status AS bag_status,
  bp.id AS pass_id, bp.status AS pass_status, bp.used_for_reservation_id
FROM reservations r
JOIN bags b ON b.id = r.bag_id
LEFT JOIN bag_passes bp ON bp.used_for_reservation_id = r.id
WHERE r.user_id = (SELECT id FROM auth.users WHERE email = 'anlymaribel@gmail.com')
ORDER BY r.created_at DESC
LIMIT 5;
