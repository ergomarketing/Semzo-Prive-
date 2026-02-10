-- RPC V3 CORRECTED - Lock con SELECT primero, luego UPDATE
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
BEGIN
  -- 1. LOCK DEL BOLSO (SELECT FOR UPDATE primero)
  SELECT status INTO v_bag_status
  FROM bags
  WHERE id = p_bag_id
  FOR UPDATE NOWAIT;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BAG_NOT_AVAILABLE: Bag % does not exist', p_bag_id;
  END IF;
  
  IF v_bag_status NOT IN ('available', 'Available', 'disponible', 'Disponible') THEN
    RAISE EXCEPTION 'BAG_NOT_AVAILABLE: Bag % is not available (status: %)', p_bag_id, v_bag_status;
  END IF;
  
  -- Ahora actualizar el bolso (ya está lockeado)
  UPDATE bags
  SET status = 'rented', updated_at = NOW()
  WHERE id = p_bag_id;

  -- 2. LOCK DEL PASE si se proporciona
  IF p_pass_id IS NOT NULL THEN
    SELECT status INTO v_pass_status
    FROM bag_passes
    WHERE id = p_pass_id
    FOR UPDATE NOWAIT;
    
    IF NOT FOUND THEN
      RAISE EXCEPTION 'PASS_NOT_AVAILABLE: Pass % does not exist', p_pass_id;
    END IF;
    
    IF v_pass_status != 'available' THEN
      RAISE EXCEPTION 'PASS_NOT_AVAILABLE: Pass % is not available (status: %)', p_pass_id, v_pass_status;
    END IF;
    
    -- Ahora actualizar el pase (ya está lockeado)
    UPDATE bag_passes
    SET status = 'used', used_at = NOW()
    WHERE id = p_pass_id;
  END IF;

  -- 3. CREAR RESERVA
  INSERT INTO reservations (
    user_id, bag_id, start_date, end_date,
    status, created_at, updated_at
  )
  VALUES (
    p_user_id, p_bag_id, p_start_date, p_end_date,
    'confirmed', NOW(), NOW()
  )
  RETURNING id INTO v_reservation_id;

  IF v_reservation_id IS NULL THEN
    RAISE EXCEPTION 'RESERVATION_INSERT_FAILED: Could not create reservation';
  END IF;

  -- 4. ASOCIAR PASE A RESERVA si existe
  IF p_pass_id IS NOT NULL THEN
    UPDATE bag_passes
    SET used_for_reservation_id = v_reservation_id
    WHERE id = p_pass_id;
  END IF;

  RETURN v_reservation_id;
END;
$$;
