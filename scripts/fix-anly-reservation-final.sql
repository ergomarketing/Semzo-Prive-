-- Anly: crear reserva manual con pase signature ya pagado
-- Bolso: Louis Vuitton Reverie (e5a5c457-6678-4713-9ded-ff964054c597)
-- Pase: c3d05ebb-336f-40c5-9f5e-8b9b78fa4562

DO $$
DECLARE
  v_user_id uuid;
  v_reservation_id uuid;
BEGIN
  SELECT id INTO v_user_id FROM profiles WHERE email = 'anlymaribel@gmail.com';

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Usuario anlymaribel@gmail.com no encontrado';
  END IF;

  SELECT create_reservation_atomic(
    v_user_id,
    'e5a5c457-6678-4713-9ded-ff964054c597'::uuid,
    'c3d05ebb-336f-40c5-9f5e-8b9b78fa4562'::uuid,
    NOW(),
    NOW() + INTERVAL '7 days'
  ) INTO v_reservation_id;

  RAISE NOTICE 'Reserva creada: %', v_reservation_id;
END $$;

-- Verificacion
SELECT
  r.id AS reservation_id,
  r.status AS reservation_status,
  r.start_date,
  r.end_date,
  b.brand || ' ' || b.name AS bolso,
  bp.id AS pass_id,
  bp.status AS pass_status,
  bp.used_for_reservation_id,
  p.email
FROM reservations r
JOIN bags b ON b.id = r.bag_id
LEFT JOIN bag_passes bp ON bp.used_for_reservation_id = r.id
JOIN profiles p ON p.id = r.user_id
WHERE p.email = 'anlymaribel@gmail.com'
ORDER BY r.created_at DESC
LIMIT 1;
