# Comparación: RPC V2 (Actual) vs V3 (Propuesto)

## Resumen Ejecutivo

El RPC V2 actual **viola el principio de separación de responsabilidades** al contener lógica de negocio que corresponde al endpoint. La V3 propuesta es un **RPC minimalista técnico** que solo maneja locks transaccionales.

---

## Diferencias Principales

| Aspecto | V2 (Actual) ❌ | V3 (Propuesto) ✅ |
|---------|----------------|-------------------|
| **Idempotencia** | Dentro del RPC (líneas 29-39) | En el endpoint |
| **Mensajes funcionales** | "Reserva ya existente", etc. | Solo exceptions técnicas |
| **Return type** | JSONB con metadata | Solo UUID (reservation_id) |
| **Parámetro membership_type** | Incluido pero no usado | Eliminado |
| **Manejo de errores** | EXCEPTION WHEN OTHERS + JSONB | RAISE EXCEPTION específicas |
| **Lock strategy** | FOR UPDATE (blocking) | FOR UPDATE NOWAIT (fail-fast) |
| **Protección UPDATE bags** | Sin WHERE en status | Con WHERE status IN (...) |

---

## Análisis Detallado de Violaciones en V2

### 1. Idempotencia (Lógica de Negocio)

**V2 - INCORRECTO:**
```sql
-- Líneas 29-39
SELECT id INTO v_existing_reservation
FROM reservations
WHERE user_id = p_user_id
  AND bag_id = p_bag_id
  AND created_at > NOW() - INTERVAL '5 minutes';

IF v_existing_reservation IS NOT NULL THEN
  RETURN jsonb_build_object(
    'success', true, 
    'reservation_id', v_existing_reservation,
    'message', 'Reserva ya existente'
  );
END IF;
```

**Problemas:**
- La ventana de 5 minutos es una **regla de negocio**
- El RPC decide si es "duplicado" sin validar otras condiciones
- Mezcla detección de duplicados con locks transaccionales

**V3 - CORRECTO:**
```sql
-- Idempotencia ELIMINADA del RPC
-- El endpoint valida ANTES de llamar al RPC:
const { data: existingReservation } = await supabase
  .from("reservations")
  .select("id, created_at")
  .eq("user_id", userId)
  .eq("bag_id", bag_id)
  .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
  .maybeSingle()

if (existingReservation) {
  return NextResponse.json({ reservation: existingWithBag })
}
```

---

### 2. Mensajes Funcionales (Responsabilidad de Presentación)

**V2 - INCORRECTO:**
```sql
RETURN jsonb_build_object('success', false, 'error', 'El bolso ya no está disponible');
RETURN jsonb_build_object('success', true, 'message', 'Reserva ya existente');
```

**Problemas:**
- Mensajes en español dentro de la DB (no i18n)
- El RPC decide cómo comunicar errores al usuario
- Dificulta testing y manejo de errores específicos

**V3 - CORRECTO:**
```sql
RAISE EXCEPTION 'BAG_NOT_AVAILABLE: El bolso % tiene estado % (esperado: available)', 
  p_bag_id, v_bag_current_status;
```

**Endpoint mapea a respuestas HTTP:**
```typescript
if (rpcError.message.includes('BAG_NOT_AVAILABLE')) {
  return NextResponse.json(
    { error: "El bolso ya no está disponible. Alguien más lo reservó." }, 
    { status: 409 }
  )
}
```

---

### 3. Parámetro Innecesario

**V2 - INCORRECTO:**
```sql
CREATE OR REPLACE FUNCTION create_reservation_atomic(
  ...
  p_membership_type TEXT  -- ❌ NO SE USA EN LOCKS
)
```

**Uso en V2:**
```sql
-- NO SE USA EN NINGÚN LOCK
-- NO SE ALMACENA EN RESERVATIONS (comentario: "sin membership_type si no existe la columna")
```

**V3 - CORRECTO:**
```sql
CREATE OR REPLACE FUNCTION create_reservation_atomic_v3(
  p_user_id UUID,
  p_bag_id UUID,
  p_pass_id UUID,
  p_start_date TIMESTAMP WITH TIME ZONE,
  p_end_date TIMESTAMP WITH TIME ZONE
)
-- ✅ Solo parámetros necesarios para locks
```

---

### 4. Manejo de Errores No Específico

**V2 - INCORRECTO:**
```sql
EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', SQLERRM
  );
```

**Problemas:**
- Captura TODOS los errores genéricamente
- No diferencia entre conflictos de lock, violaciones de constraint, etc.
- Dificulta debugging y logging
- Retorna JSONB en lugar de propagar exception

**V3 - CORRECTO:**
```sql
-- Excepciones específicas que el endpoint captura:
RAISE EXCEPTION 'PASS_NOT_FOUND: El pase % no existe', p_pass_id;
RAISE EXCEPTION 'PASS_NOT_AVAILABLE: El pase % tiene estado %', p_pass_id, v_pass_current_status;
RAISE EXCEPTION 'BAG_NOT_FOUND: El bolso % no existe', p_bag_id;
RAISE EXCEPTION 'BAG_NOT_AVAILABLE: El bolso % tiene estado %', p_bag_id, v_bag_current_status;
RAISE EXCEPTION 'BAG_UPDATE_FAILED: Race condition detectada', p_bag_id;

-- No hay EXCEPTION WHEN OTHERS
-- Las excepciones se propagan al endpoint para manejo específico
```

---

### 5. Lock Strategy No Óptima

**V2 - INCORRECTO:**
```sql
SELECT status INTO v_bag_status
FROM bags
WHERE id = p_bag_id
FOR UPDATE;  -- ❌ BLOCKING: espera indefinidamente si hay lock
```

**Problemas:**
- Si otro usuario tiene lock, este RPC ESPERA (blocking)
- Puede causar timeouts en el endpoint
- No detecta conflictos inmediatamente

**V3 - CORRECTO:**
```sql
SELECT status INTO v_bag_current_status
FROM bags
WHERE id = p_bag_id
FOR UPDATE NOWAIT;  -- ✅ FAIL-FAST: falla inmediatamente si hay lock
```

**Beneficios:**
- Detecta conflictos en milisegundos
- El endpoint puede responder 409 Conflict inmediatamente
- Mejor UX (no esperas largas)

---

### 6. UPDATE Sin Protección de Estado

**V2 - INCORRECTO:**
```sql
UPDATE bags
SET status = 'rented',
    updated_at = NOW()
WHERE id = p_bag_id;  -- ❌ Sin verificar estado actual
```

**Problema:**
- Si entre el SELECT y el UPDATE el estado cambió (race condition), el UPDATE sigue ejecutándose
- Puede marcar como rented un bolso que ya está rented

**V3 - CORRECTO:**
```sql
UPDATE bags
SET 
  status = 'rented',
  updated_at = NOW()
WHERE id = p_bag_id
  AND status IN ('available', 'Available', 'disponible', 'Disponible');  -- ✅ Protección adicional

IF NOT FOUND THEN
  RAISE EXCEPTION 'BAG_UPDATE_FAILED: Race condition detectada';
END IF;
```

---

## Cambios en el Endpoint

### Antes (con V2):
```typescript
const { data: rpcResult, error: rpcError } = await supabase.rpc("create_reservation_atomic", {
  p_user_id: userId,
  p_bag_id: bag_id,
  p_pass_id: passIdToConsume || null,
  p_start_date: startDate.toISOString(),
  p_end_date: endDate.toISOString(),
  p_membership_type: userMembershipPlan,  // ❌ No usado
})

if (!rpcResult?.success) {
  const errorMessage = rpcResult?.error || "Error desconocido"
  // Manejo genérico basado en strings
  if (errorMessage.includes("no está disponible")) {
    return NextResponse.json({ error: errorMessage }, { status: 409 })
  }
  return NextResponse.json({ error: errorMessage }, { status: 500 })
}

const reservationId = rpcResult.reservation_id
```

### Después (con V3):
```typescript
// 1. IDEMPOTENCIA (antes de llamar al RPC)
const { data: existingReservation } = await supabase
  .from("reservations")
  .select("id, created_at")
  .eq("user_id", userId)
  .eq("bag_id", bag_id)
  .gte("created_at", new Date(Date.now() - 5 * 60 * 1000).toISOString())
  .maybeSingle()

if (existingReservation) {
  console.log("[v0] Duplicate reservation detected:", existingReservation.id)
  return NextResponse.json({ reservation: existingReservationData, message: "Reserva ya existente" })
}

// 2. LLAMADA AL RPC (solo locks + insert)
const { data: reservationId, error: rpcError } = await supabase.rpc("create_reservation_atomic_v3", {
  p_user_id: userId,
  p_bag_id: bag_id,
  p_pass_id: passIdToConsume || null,
  p_start_date: startDate.toISOString(),
  p_end_date: endDate.toISOString(),
  // ✅ Sin p_membership_type
})

if (rpcError) {
  console.error("[v0] RPC error:", rpcError)
  
  // Mapeo específico de excepciones técnicas a respuestas HTTP
  if (rpcError.message.includes('PASS_NOT_AVAILABLE')) {
    return NextResponse.json(
      { error: "El pase ya no está disponible. Por favor, intenta con otro pase." },
      { status: 409 }
    )
  }
  
  if (rpcError.message.includes('BAG_NOT_AVAILABLE') || rpcError.message.includes('BAG_UPDATE_FAILED')) {
    return NextResponse.json(
      { error: "El bolso ya no está disponible. Alguien más lo reservó." },
      { status: 409 }
    )
  }
  
  if (rpcError.message.includes('NOWAIT')) {
    return NextResponse.json(
      { error: "Conflicto de reserva detectado. Por favor, intenta nuevamente." },
      { status: 409 }
    )
  }
  
  // Otros errores técnicos
  return NextResponse.json(
    { error: "Error al crear la reserva", details: rpcError.message },
    { status: 500 }
  )
}

// 3. POST-PROCESAMIENTO
const { data: reservation } = await supabase
  .from("reservations")
  .select("*, bags(...)")
  .eq("id", reservationId)
  .single()
```

---

## Tabla de Responsabilidades

| Responsabilidad | V2 (Actual) | V3 (Propuesto) |
|-----------------|-------------|----------------|
| Validar membresía activa | Endpoint | Endpoint ✅ |
| Validar vigencia Petite | Endpoint | Endpoint ✅ |
| Validar límite 4 pases | Endpoint | Endpoint ✅ |
| Verificar idempotencia | **RPC ❌** | **Endpoint ✅** |
| Seleccionar pase correcto | Endpoint | Endpoint ✅ |
| Lock pase (FOR UPDATE) | RPC | RPC ✅ |
| Lock bolso (FOR UPDATE) | RPC | RPC ✅ |
| INSERT reservation | RPC | RPC ✅ |
| UPDATE bags status | RPC | RPC ✅ |
| UPDATE bag_passes status | RPC | RPC ✅ |
| Mensajes de error en español | **RPC ❌** | **Endpoint ✅** |
| Decidir status HTTP | **RPC ❌** | **Endpoint ✅** |
| Calcular total_amount | Endpoint | Endpoint ✅ |
| Audit log | Endpoint | Endpoint ✅ |
| Notificaciones | Endpoint | Endpoint ✅ |
| Actualizar contador pases | Endpoint | Endpoint ✅ |

---

## Ventajas de V3

### 1. Separación de Responsabilidades Limpia
- **RPC**: Solo locks transaccionales (infraestructura)
- **Endpoint**: Toda la lógica de negocio (aplicación)

### 2. Testing Más Fácil
- Endpoint puede ser testeado sin ejecutar el RPC real
- RPC puede ser testeado aisladamente con casos técnicos

### 3. Manejo de Errores Específico
- Excepciones técnicas con códigos claros
- Endpoint mapea a respuestas HTTP semánticas (409, 500)

### 4. Performance Mejorada
- NOWAIT detecta conflictos en milisegundos
- No hay esperas blocking en locks

### 5. Mantenibilidad
- Cambios en lógica de negocio NO requieren migrations
- Cambios en mensajes NO requieren actualizar RPC

### 6. Atomicidad Garantizada
- Cualquier RAISE EXCEPTION hace ROLLBACK completo
- No hay estado inconsistente posible

---

## Migración Propuesta

### Paso 1: Ejecutar V3
```sql
\i scripts/PROPUESTA-create-atomic-reservation-rpc-v3-minimal.sql
```

### Paso 2: Actualizar Endpoint
- Agregar idempotencia ANTES de llamar al RPC
- Cambiar nombre de función: `create_reservation_atomic` → `create_reservation_atomic_v3`
- Eliminar parámetro `p_membership_type`
- Cambiar manejo de retorno: `rpcResult.reservation_id` → `reservationId` directamente
- Agregar mapeo específico de excepciones a status HTTP

### Paso 3: Testing
1. Reserva normal (con y sin pase)
2. Idempotencia (misma reserva en < 5 minutos)
3. Conflicto de bolso (2 usuarios simultáneos)
4. Conflicto de pase (2 usuarios simultáneos)
5. Pase inexistente / ya usado
6. Bolso inexistente / ya rented

### Paso 4: Deprecar V2
- Mantener V2 por 1 sprint para rollback
- Eliminar después de confirmar estabilidad

---

## Conclusión

El RPC V2 **viola principios de arquitectura limpia** al contener:
- Lógica de negocio (idempotencia)
- Responsabilidades de presentación (mensajes)
- Parámetros innecesarios
- Manejo de errores genérico

El RPC V3 es un **componente técnico puro** que:
- Solo maneja locks y transacciones
- Lanza excepciones específicas
- Permite al endpoint controlar la lógica de negocio
- Facilita testing, mantenimiento y debugging

**Recomendación: Aprobar y ejecutar V3**
