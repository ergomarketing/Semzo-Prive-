-- RPC minimalista v3 - Solo locks atómicos, sin lógica de negocio
DROP FUNCTION IF EXISTS create_reservation_atomic(uuid, uuid, uuid, timestamptz, timestamptz, text);
DROP FUNCTION IF EXISTS create_reservation_atomic(uuid, uuid, uuid, timestamptz, timestamptz);

CREATE OR REPLACE FUNCTION create_reservation_atomic(
  p_user_id UUID,
  p_bag_id UUID,
  p_pass_id UUID,
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
  v_reservation_id UUID;
  v_bag_status TEXT;
  v_pass_status TEXT;
  v_locked_bag_id UUID;
  v_locked_pass_id UUID;
BEGIN
  -- LOCK DEL BAG
  SELECT id, status INTO v_locked_bag_id, v_bag_status
  FROM bags
  WHERE id = p_bag_id
    AND status IN ('available', 'Available', 'disponible', 'Disponible')
  FOR UPDATE NOWAIT;

  IF v_locked_bag_id IS NULL THEN
    RAISE EXCEPTION 'BAG_NOT_AVAILABLE: Bag % not available or locked', p_bag_id;
  END IF;

  -- LOCK DEL PASS (si existe)
  IF p_pass_id IS NOT NULL THEN
    SELECT id, status INTO v_locked_pass_id, v_pass_status
    FROM bag_passes
    WHERE id = p_pass_id
      AND status = 'available'
      AND user_id = p_user_id
    FOR UPDATE NOWAIT;

    IF v_locked_pass_id IS NULL THEN
      RAISE EXCEPTION 'PASS_NOT_AVAILABLE: Pass % not available or locked', p_pass_id;
    END IF;
  END IF;

  -- CREAR RESERVA
  INSERT INTO reservations (
    user_id,
    bag_id,
    start_date,
    end_date,
    status,
    total_amount,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_bag_id,
    p_start_date,
    p_end_date,
    'confirmed',
    0,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_reservation_id;

  IF v_reservation_id IS NULL THEN
    RAISE EXCEPTION 'RESERVATION_INSERT_FAILED';
  END IF;

  -- ACTUALIZAR BAG
  UPDATE bags
  SET status = 'rented', updated_at = NOW()
  WHERE id = p_bag_id
    AND status IN ('available', 'Available', 'disponible', 'Disponible');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BAG_UPDATE_FAILED';
  END IF;

  -- ACTUALIZAR PASS
  IF p_pass_id IS NOT NULL THEN
    UPDATE bag_passes
    SET status = 'used', used_at = NOW(), used_for_reservation_id = v_reservation_id
    WHERE id = p_pass_id
      AND status = 'available';

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PASS_UPDATE_FAILED';
    END IF;
  END IF;

  RETURN v_reservation_id;
END;
$$;

GRANT EXECUTE ON FUNCTION create_reservation_atomic TO authenticated;
