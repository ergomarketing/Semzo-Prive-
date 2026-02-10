-- ============================================================================
-- RPC: create_reservation_atomic_v3 - VERSIÓN MINIMALISTA
-- ============================================================================
-- PROPÓSITO: Operaciones atómicas transaccionales ÚNICAMENTE
-- NO contiene: validaciones de negocio, idempotencia, mensajes funcionales
-- SÍ contiene: locks FOR UPDATE, protección de concurrencia, rollback automático
--
-- CONTRATO:
-- - Endpoint valida TODA la lógica de negocio ANTES de llamar al RPC
-- - Endpoint valida idempotencia ANTES de llamar al RPC
-- - RPC solo garantiza atomicidad de: lock pase + lock bolso + insert reserva
-- - RPC lanza EXCEPCIONES técnicas que el endpoint debe capturar y mapear
-- ============================================================================

DROP FUNCTION IF EXISTS create_reservation_atomic_v3(UUID, UUID, UUID, TIMESTAMP WITH TIME ZONE, TIMESTAMP WITH TIME ZONE);

CREATE OR REPLACE FUNCTION create_reservation_atomic_v3(
  p_user_id UUID,
  p_bag_id UUID,
  p_pass_id UUID,           -- puede ser NULL si no usa pase
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
RETURNS UUID  -- Devuelve solo el reservation_id, sin metadata funcional
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_reservation_id UUID;
  v_bag_current_status TEXT;
  v_pass_current_status TEXT;
BEGIN
  -- ============================================================================
  -- PASO 1: LOCK DEL PASE (si aplica)
  -- ============================================================================
  IF p_pass_id IS NOT NULL THEN
    -- Lock exclusivo del pase
    SELECT status INTO v_pass_current_status
    FROM bag_passes
    WHERE id = p_pass_id
    FOR UPDATE NOWAIT;  -- Falla inmediatamente si ya está locked

    -- Validación técnica: el pase debe existir
    IF NOT FOUND THEN
      RAISE EXCEPTION 'PASS_NOT_FOUND: El pase % no existe', p_pass_id;
    END IF;

    -- Validación técnica: el pase debe estar disponible
    IF v_pass_current_status != 'available' THEN
      RAISE EXCEPTION 'PASS_NOT_AVAILABLE: El pase % tiene estado % (esperado: available)', 
        p_pass_id, v_pass_current_status;
    END IF;

    -- Marcar pase como usado
    UPDATE bag_passes
    SET 
      status = 'used',
      used_at = NOW()
    WHERE id = p_pass_id;

  END IF;

  -- ============================================================================
  -- PASO 2: LOCK DEL BOLSO
  -- ============================================================================
  -- Lock exclusivo del bolso
  SELECT status INTO v_bag_current_status
  FROM bags
  WHERE id = p_bag_id
  FOR UPDATE NOWAIT;  -- Falla inmediatamente si ya está locked

  -- Validación técnica: el bolso debe existir
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BAG_NOT_FOUND: El bolso % no existe', p_bag_id;
  END IF;

  -- Validación técnica: el bolso debe estar disponible
  -- Soporta variantes: available, Available, disponible, Disponible
  IF v_bag_current_status NOT IN ('available', 'Available', 'disponible', 'Disponible') THEN
    RAISE EXCEPTION 'BAG_NOT_AVAILABLE: El bolso % tiene estado % (esperado: available)', 
      p_bag_id, v_bag_current_status;
  END IF;

  -- Marcar bolso como rented
  UPDATE bags
  SET 
    status = 'rented',
    updated_at = NOW()
  WHERE id = p_bag_id
    AND status IN ('available', 'Available', 'disponible', 'Disponible');  -- Protección adicional

  -- Verificar que el UPDATE afectó exactamente 1 fila
  IF NOT FOUND THEN
    RAISE EXCEPTION 'BAG_UPDATE_FAILED: El bolso % no pudo actualizarse (race condition detectada)', p_bag_id;
  END IF;

  -- ============================================================================
  -- PASO 3: CREAR RESERVA
  -- ============================================================================
  INSERT INTO reservations (
    user_id,
    bag_id,
    start_date,
    end_date,
    status,
    created_at,
    updated_at
  ) VALUES (
    p_user_id,
    p_bag_id,
    p_start_date,
    p_end_date,
    'confirmed',  -- Estado fijo, sin lógica de negocio
    NOW(),
    NOW()
  )
  RETURNING id INTO v_reservation_id;

  -- Verificar que el INSERT fue exitoso
  IF v_reservation_id IS NULL THEN
    RAISE EXCEPTION 'RESERVATION_INSERT_FAILED: No se pudo crear la reserva';
  END IF;

  -- Devolver solo el ID, sin metadata funcional
  RETURN v_reservation_id;

  -- Cualquier EXCEPTION hace ROLLBACK automático de TODA la transacción
  -- (pase, bolso y reserva vuelven al estado anterior)
END;
$$;

-- ============================================================================
-- PERMISOS
-- ============================================================================
GRANT EXECUTE ON FUNCTION create_reservation_atomic_v3 TO authenticated;
GRANT EXECUTE ON FUNCTION create_reservation_atomic_v3 TO service_role;

-- ============================================================================
-- NOTAS DE IMPLEMENTACIÓN
-- ============================================================================
-- 
-- 1. ERRORES QUE LANZA (todos son RAISE EXCEPTION):
--    - PASS_NOT_FOUND
--    - PASS_NOT_AVAILABLE
--    - BAG_NOT_FOUND
--    - BAG_NOT_AVAILABLE
--    - BAG_UPDATE_FAILED (race condition)
--    - RESERVATION_INSERT_FAILED
--    - NOWAIT timeout (lock conflict)
--
-- 2. RESPONSABILIDADES DEL ENDPOINT:
--    - Validar membresía activa
--    - Validar vigencia Petite (30 días)
--    - Validar límite 4 pases
--    - Validar tier hierarchy
--    - Verificar idempotencia (últimos 5 minutos)
--    - Calcular total_amount
--    - Seleccionar pase correcto
--    - Capturar excepciones del RPC y mapear a respuestas HTTP
--    - Post-procesamiento: audit, notificaciones, contador
--
-- 3. ROLLBACK AUTOMÁTICO:
--    Cualquier RAISE EXCEPTION revierte TODA la transacción.
--    No se necesita rollback manual.
--
-- 4. CONCURRENCIA:
--    - FOR UPDATE NOWAIT = falla inmediatamente si hay lock conflict
--    - El endpoint debe capturar el error y reintentar O responder 409
--
-- 5. CAMBIOS vs V2:
--    ❌ Eliminada idempotencia (ahora en endpoint)
--    ❌ Eliminado p_membership_type (no se usa en locks)
--    ❌ Eliminados mensajes funcionales (success, error, bag_locked, etc)
--    ❌ Eliminado JSON return con metadata
--    ✅ Solo retorna UUID (reservation_id)
--    ✅ Solo lanza RAISE EXCEPTION para errores técnicos
--    ✅ Protege UPDATE bags con WHERE status IN (...)
--    ✅ Usa NOWAIT para detectar conflictos inmediatamente
--
-- ============================================================================
