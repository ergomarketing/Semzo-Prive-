-- ============================================================================
-- create-atomic-reservation-rpc-v3-trigger-safe.sql
-- Fix BAG_UPDATE_FAILED causado por colision con trigger
-- trigger_update_bag_on_reservation (create-automatic-inventory-system-v1.sql)
-- ============================================================================
--
-- PROBLEMA:
-- El trigger AFTER INSERT ON reservations actualiza bags.status = 'rented'.
-- El RPC v3-minimal hacia despues UPDATE bags WHERE status IN ('available',...)
-- y fallaba porque el trigger YA habia cambiado el status, devolviendo NOT FOUND.
--
-- FIX:
-- El UPDATE de PASO 4 ya no filtra por status. Solo asegura que el bag exista
-- y normaliza el status a 'rented' (idempotente). Si el trigger ya lo hizo,
-- el UPDATE sigue siendo correcto (re-escribe el mismo valor + updated_at).
--
-- ============================================================================

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
  -- =========================================================================
  -- PASO 1: LOCK DEL BAG CON VALIDACION DE ESTADO
  -- =========================================================================
  SELECT id, status INTO v_locked_bag_id, v_bag_status
  FROM bags
  WHERE id = p_bag_id
    AND status IN ('available', 'Available', 'disponible', 'Disponible')
  FOR UPDATE NOWAIT;

  IF v_locked_bag_id IS NULL THEN
    RAISE EXCEPTION 'BAG_NOT_AVAILABLE: Bag % not available or locked', p_bag_id;
  END IF;

  -- =========================================================================
  -- PASO 2: LOCK DEL PASS (si se proporciona)
  -- =========================================================================
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

  -- =========================================================================
  -- PASO 3: CREAR RESERVA
  -- NOTA: el trigger trigger_update_bag_on_reservation se dispara AFTER INSERT
  -- y actualiza bags.status = 'rented'. Por eso PASO 4 ya no filtra por status.
  -- =========================================================================
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
    RAISE EXCEPTION 'RESERVATION_INSERT_FAILED: Could not create reservation';
  END IF;

  -- =========================================================================
  -- PASO 4: ASEGURAR bag.status = 'rented' (IDEMPOTENTE, sin filtro de status)
  -- El trigger probablemente ya lo hizo. Este UPDATE garantiza el resultado
  -- aunque el trigger se desactive en el futuro.
  -- =========================================================================
  UPDATE bags
  SET status     = 'rented',
      updated_at = NOW()
  WHERE id = p_bag_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BAG_UPDATE_FAILED: Bag % not found', p_bag_id;
  END IF;

  -- =========================================================================
  -- PASO 5: ACTUALIZAR PASS -> used (si existe)
  -- =========================================================================
  IF p_pass_id IS NOT NULL THEN
    UPDATE bag_passes
    SET status                  = 'used',
        used_at                 = NOW(),
        used_for_reservation_id = v_reservation_id
    WHERE id = p_pass_id
      AND status = 'available';

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PASS_UPDATE_FAILED: Could not update pass % to used', p_pass_id;
    END IF;
  END IF;

  RETURN v_reservation_id;
END;
$$;

COMMENT ON FUNCTION create_reservation_atomic IS
'RPC atomico v3 trigger-safe. PASO 4 idempotente para coexistir con
trigger_update_bag_on_reservation que tambien marca bags.status = rented.';

GRANT EXECUTE ON FUNCTION create_reservation_atomic TO authenticated;
GRANT EXECUTE ON FUNCTION create_reservation_atomic TO service_role;
