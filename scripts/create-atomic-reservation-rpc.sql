-- RPC ATÓMICO PARA CREAR RESERVAS CON LOCK DE PASE Y BOLSO
-- Previene race conditions y garantiza consistencia

DROP FUNCTION IF EXISTS create_reservation_atomic(uuid, uuid, uuid, timestamptz, timestamptz, text);

CREATE OR REPLACE FUNCTION create_reservation_atomic(
  p_user_id UUID,
  p_bag_id UUID,
  p_pass_id UUID,  -- NULL si no requiere pase (membresías superiores)
  p_start_date TIMESTAMPTZ,
  p_end_date TIMESTAMPTZ,
  p_membership_type TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_bag_status TEXT;
  v_pass_status TEXT;
  v_reservation_id UUID;
  v_existing_reservation UUID;
BEGIN
  -- 1. LOCK Y VERIFICAR BOLSO (FOR UPDATE previene race conditions)
  SELECT status INTO v_bag_status
  FROM bags
  WHERE id = p_bag_id
  FOR UPDATE;
  
  IF v_bag_status IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'Bolso no encontrado');
  END IF;
  
  IF LOWER(v_bag_status) NOT IN ('available', 'disponible') THEN
    RETURN jsonb_build_object('success', false, 'error', 'El bolso ya no está disponible');
  END IF;
  
  -- 2. VERIFICAR IDEMPOTENCIA (no crear duplicados en últimos 5 minutos)
  SELECT id INTO v_existing_reservation
  FROM reservations
  WHERE user_id = p_user_id
    AND bag_id = p_bag_id
    AND start_date = p_start_date
    AND end_date = p_end_date
    AND created_at > NOW() - INTERVAL '5 minutes';
  
  IF v_existing_reservation IS NOT NULL THEN
    RETURN jsonb_build_object(
      'success', true, 
      'reservation_id', v_existing_reservation,
      'message', 'Reserva ya existente'
    );
  END IF;
  
  -- 3. SI REQUIERE PASE, LOCK Y CONSUMIR ATÓMICAMENTE
  IF p_pass_id IS NOT NULL THEN
    SELECT status INTO v_pass_status
    FROM bag_passes
    WHERE id = p_pass_id
      AND user_id = p_user_id
    FOR UPDATE;
    
    IF v_pass_status IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'Pase no encontrado');
    END IF;
    
    IF v_pass_status != 'available' THEN
      RETURN jsonb_build_object('success', false, 'error', 'El pase ya fue utilizado');
    END IF;
  END IF;
  
  -- 4. CREAR RESERVA
  INSERT INTO reservations (
    user_id,
    bag_id,
    start_date,
    end_date,
    status,
    total_amount,
    membership_type,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_bag_id,
    p_start_date,
    p_end_date,
    'confirmed',
    0,
    p_membership_type,
    NOW(),
    NOW()
  )
  RETURNING id INTO v_reservation_id;
  
  -- 5. MARCAR BOLSO COMO ALQUILADO
  UPDATE bags
  SET status = 'rented',
      updated_at = NOW()
  WHERE id = p_bag_id;
  
  -- 6. SI USAMOS PASE, MARCARLO COMO USADO
  IF p_pass_id IS NOT NULL THEN
    UPDATE bag_passes
    SET status = 'used',
        used_for_reservation_id = v_reservation_id,
        used_at = NOW()
    WHERE id = p_pass_id;
  END IF;
  
  -- 7. RETORNAR ÉXITO CON ID DE RESERVA
  RETURN jsonb_build_object(
    'success', true,
    'reservation_id', v_reservation_id,
    'bag_locked', true,
    'pass_consumed', p_pass_id IS NOT NULL
  );
  
EXCEPTION WHEN OTHERS THEN
  -- Rollback automático por ser función
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
END;
$$;

-- Índice para mejorar la verificación de idempotencia
CREATE INDEX IF NOT EXISTS idx_reservations_idempotency 
ON reservations (user_id, bag_id, start_date, end_date, created_at);

-- Índice para locks eficientes de pases
CREATE INDEX IF NOT EXISTS idx_bag_passes_user_status 
ON bag_passes (user_id, status) WHERE status = 'available';
