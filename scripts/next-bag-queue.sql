-- Proximo bolso en cola ("reserva anticipada"). Idempotente.
-- Una socia que ya tiene un bolso puede reservar UNO mas en los ultimos 7 dias de su ciclo: queda en estado
-- 'queued' (bolso retenido) y pasa a 'confirmed' cuando Logistica confirma la devolucion del bolso actual.

-- 1) Nuevo estado permitido.
ALTER TABLE public.reservations DROP CONSTRAINT IF EXISTS reservations_status_check;
ALTER TABLE public.reservations
  ADD CONSTRAINT reservations_status_check
  CHECK (((status)::text = ANY ((ARRAY['pending','confirmed','active','overdue','completed','cancelled','queued'])::text[])));

-- 2) Marca de origen: una reserva creada en cola cuenta para el ciclo SIGUIENTE (cupo mensual/trimestral).
ALTER TABLE public.reservations ADD COLUMN IF NOT EXISTS queued_from_prev_cycle boolean NOT NULL DEFAULT false;

-- 3) create_reservation_atomic con estado inicial opcional (p_status). Se sustituye la firma anterior para
--    no dejar dos funciones ambiguas para PostgREST.
DROP FUNCTION IF EXISTS public.create_reservation_atomic(uuid, uuid, uuid, timestamptz, timestamptz, text, integer);

CREATE OR REPLACE FUNCTION public.create_reservation_atomic(
  p_user_id uuid,
  p_bag_id uuid,
  p_pass_id uuid,
  p_start_date timestamptz,
  p_end_date timestamptz,
  p_membership_type text DEFAULT NULL,
  p_rental_days integer DEFAULT 7,
  p_status text DEFAULT 'confirmed'
) RETURNS uuid
LANGUAGE plpgsql
AS $function$
DECLARE
  v_reservation_id UUID;
  v_bag_status TEXT;
  v_pass_status TEXT;
  v_locked_bag_id UUID;
  v_locked_pass_id UUID;
  v_status TEXT := COALESCE(NULLIF(p_status, ''), 'confirmed');
BEGIN
  IF v_status NOT IN ('confirmed', 'queued') THEN
    RAISE EXCEPTION 'INVALID_STATUS: % no es un estado inicial valido', v_status;
  END IF;

  SELECT id, status INTO v_locked_bag_id, v_bag_status
  FROM bags
  WHERE id = p_bag_id
    AND status IN ('available', 'Available', 'disponible', 'Disponible')
  FOR UPDATE NOWAIT;

  IF v_locked_bag_id IS NULL THEN
    RAISE EXCEPTION 'BAG_NOT_AVAILABLE: Bag % not available or locked', p_bag_id;
  END IF;

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

  INSERT INTO reservations (
    user_id, bag_id, bag_pass_id, membership_type, rental_days,
    start_date, end_date, status, total_amount, queued_from_prev_cycle, created_at, updated_at
  ) VALUES (
    p_user_id, p_bag_id, p_pass_id, p_membership_type, p_rental_days,
    p_start_date, p_end_date, v_status, 0, (v_status = 'queued'), NOW(), NOW()
  )
  RETURNING id INTO v_reservation_id;

  IF v_reservation_id IS NULL THEN
    RAISE EXCEPTION 'RESERVATION_INSERT_FAILED: Could not create reservation';
  END IF;

  UPDATE bags SET status = 'rented', updated_at = NOW() WHERE id = p_bag_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BAG_UPDATE_FAILED: Bag % not found', p_bag_id;
  END IF;

  IF p_pass_id IS NOT NULL THEN
    UPDATE bag_passes
    SET status = 'used', used_at = NOW(), used_for_reservation_id = v_reservation_id
    WHERE id = p_pass_id AND status = 'available';
    IF NOT FOUND THEN
      RAISE EXCEPTION 'PASS_UPDATE_FAILED: Could not update pass % to used', p_pass_id;
    END IF;
  END IF;

  RETURN v_reservation_id;
END;
$function$;

GRANT EXECUTE ON FUNCTION public.create_reservation_atomic(uuid, uuid, uuid, timestamptz, timestamptz, text, integer, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.create_reservation_atomic(uuid, uuid, uuid, timestamptz, timestamptz, text, integer, text) TO service_role;
