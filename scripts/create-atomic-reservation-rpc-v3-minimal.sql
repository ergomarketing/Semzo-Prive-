-- ============================================================================
-- create-atomic-reservation-rpc-v3-minimal.sql
-- RPC minimalista que SOLO garantiza atomicidad de locks transaccionales
-- ============================================================================
--
-- RESPONSABILIDADES (solo técnicas):
-- ✅ Lock atómico de bag + pass (FOR UPDATE NOWAIT)
-- ✅ Inserción transaccional de reserva
-- ✅ Actualización de estados (bag → rented, pass → used)
-- ✅ Excepciones técnicas específicas
--
-- NO RESPONSABILIDADES (quedan en endpoint):
-- ❌ Validación de vigencia Petite
-- ❌ Límite de 4 pases
-- ❌ Tier hierarchy
-- ❌ Idempotencia
-- ❌ Mensajes funcionales
--
-- CONTRATO:
-- - Input: user_id, bag_id, pass_id?, start_date, end_date
-- - Output: UUID (reservation_id)
-- - Excepciones: RAISE EXCEPTION con códigos técnicos
--
-- ============================================================================

-- Eliminar versiones anteriores si existen
DROP FUNCTION IF EXISTS create_reservation_atomic(uuid, uuid, uuid, timestamptz, timestamptz, text);
DROP FUNCTION IF EXISTS create_reservation_atomic(uuid, uuid, uuid, timestamptz, timestamptz);

-- Crear función minimalista
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
  -- PASO 1: LOCK DEL BAG CON VALIDACIÓN DE ESTADO
  -- =========================================================================
  
  SELECT id, status INTO v_locked_bag_id, v_bag_status
  FROM bags
  WHERE id = p_bag_id
    AND status IN ('available', 'Available', 'disponible', 'Disponible')
  FOR UPDATE NOWAIT;  -- Fail-fast, no esperar

  -- Si no se obtuvo lock o el bag no existe/no está disponible
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
      AND user_id = p_user_id  -- Verificar propiedad
    FOR UPDATE NOWAIT;  -- Fail-fast

    -- Si no se obtuvo lock o el pass no existe/no está disponible
    IF v_locked_pass_id IS NULL THEN
      RAISE EXCEPTION 'PASS_NOT_AVAILABLE: Pass % not available or locked', p_pass_id;
    END IF;
  END IF;

  -- =========================================================================
  -- PASO 3: CREAR RESERVA (con locks asegurados)
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
    0,  -- El endpoint calcula el monto
    NOW(),
    NOW()
  )
  RETURNING id INTO v_reservation_id;

  -- Verificar inserción
  IF v_reservation_id IS NULL THEN
    RAISE EXCEPTION 'RESERVATION_INSERT_FAILED: Could not create reservation';
  END IF;

  -- =========================================================================
  -- PASO 4: ACTUALIZAR BAG → rented (con protección de estado)
  -- =========================================================================
  
  UPDATE bags
  SET 
    status = 'rented',
    updated_at = NOW()
  WHERE id = p_bag_id
    AND status IN ('available', 'Available', 'disponible', 'Disponible');

  IF NOT FOUND THEN
    RAISE EXCEPTION 'BAG_UPDATE_FAILED: Could not update bag % to rented', p_bag_id;
  END IF;

  -- =========================================================================
  -- PASO 5: ACTUALIZAR PASS → used (si existe)
  -- =========================================================================
  
  IF p_pass_id IS NOT NULL THEN
    UPDATE bag_passes
    SET 
      status = 'used',
      used_at = NOW(),
      used_for_reservation_id = v_reservation_id
    WHERE id = p_pass_id
      AND status = 'available';

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PASS_UPDATE_FAILED: Could not update pass % to used', p_pass_id;
    END IF;
  END IF;

  -- =========================================================================
  -- RETORNO: Solo el UUID de la reserva creada
  -- =========================================================================
  
  RETURN v_reservation_id;

END;
$$;

-- ============================================================================
-- COMENTARIOS Y PERMISOS
-- ============================================================================

COMMENT ON FUNCTION create_reservation_atomic IS 
'RPC minimalista v3 - Solo locks atómicos y operaciones transaccionales.
NO contiene lógica de negocio (vigencia, límites, tier).
Retorna UUID de reserva creada o lanza EXCEPTION técnica.';

-- Permitir ejecución a usuarios autenticados
GRANT EXECUTE ON FUNCTION create_reservation_atomic TO authenticated;

-- ============================================================================
-- NOTAS DE MIGRACIÓN
-- ============================================================================
--
-- Este RPC reemplaza create_reservation_atomic V2 que violaba el principio
-- de separación de responsabilidades al incluir idempotencia y mensajes
-- funcionales.
--
-- El endpoint /app/api/user/reservations/route.ts debe:
-- 1. Implementar idempotencia ANTES de llamar al RPC
-- 2. Validar todas las reglas de negocio
-- 3. Manejar excepciones del RPC y traducirlas a respuestas HTTP
-- 4. Realizar post-procesamiento (audit, notificaciones, contadores)
--
-- ============================================================================
