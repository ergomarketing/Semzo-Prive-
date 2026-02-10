# FASE 2: ANÁLISIS PRE-EJECUCIÓN

## Estado del Sistema

### 1. RPC Atómico (`create_atomic_reservation_rpc_v2.sql`)

**Qué hace:**
- Lock pesimista de bolso (`FOR UPDATE`)
- Lock pesimista de pase si aplica (`FOR UPDATE`)
- Verificación de idempotencia (5 minutos)
- Creación de reserva con `status='confirmed'`
- Marca bolso como `rented`
- Marca pase como `used` + link a reserva
- Retorna JSONB con success/error

**NO hace:**
- ❌ NO valida membresía del usuario
- ❌ NO valida tier del bolso vs membresía
- ❌ NO valida vigencia de Petite (30 días)
- ❌ NO verifica límite de 4 pases Petite
- ❌ NO maneja rollbacks en caso de error parcial

---

### 2. Endpoint Actual (`/app/api/user/reservations/route.ts`)

**POST Lógica (líneas 175-653):**

#### A. Validaciones de Membresía (líneas 202-253)
```typescript
// 1. Check membership_intents (source of truth)
// 2. Check user_memberships (secondary)
// 3. Determina canRent y effectivePlan
// 4. Rechaza si no hay membresía activa
```

#### B. Validación de Bolso (líneas 255-273)
```typescript
// 1. Fetch bag data
// 2. Verifica status = available/disponible
```

#### C. **VALIDACIÓN PETITE COMPLEJA** (líneas 275-400)
```typescript
if (userMembershipPlan === "petite") {
  // 1. Verifica vigencia (30 días desde activated_at/created_at)
  // 2. Cuenta pases usados en período de vigencia
  // 3. Valida límite de 4 pases
  // 4. Busca pase disponible del tier correcto
  // 5. Selecciona primer pase válido
}
```

#### D. Validación Tier para Essentiel/Signature/Privé (líneas 404-430)
```typescript
// Verifica que userTierLevel >= bagTierLevel
```

#### E. Idempotencia Manual (líneas 446-462)
```typescript
// Busca reserva duplicada en últimos 5 minutos
```

#### F. **LOCK OPTIMISTA MANUAL** (líneas 464-514)
```typescript
// 1. Lock de pase con UPDATE WHERE status='available'
// 2. Lock de bolso con UPDATE WHERE status='available'
// 3. Rollback manual si bolso falla
```

#### G. Creación de Reserva (líneas 517-549)
```typescript
// INSERT INTO reservations
// Rollback de bolso + pase si falla
```

#### H. Post-creación (líneas 554-565)
```typescript
// 1. Link pase a reserva
// 2. Actualiza contador de pases en profiles
```

#### I. Notificación Admin (líneas 567-622)
```typescript
// Email a admin con detalles
```

---

## DEPENDENCIAS OCULTAS DETECTADAS

### 🔴 CRÍTICA 1: Validación de Petite (30 días)
**Ubicación:** Líneas 284-310  
**Problema:** El RPC NO valida esto. Si migramos sin replicar esta lógica, usuarios con Petite expirado podrán reservar.

**Solución:**
- Opción A: Agregar validación al RPC
- Opción B: Mantener validación en endpoint antes de llamar RPC
- **Recomendación:** Opción B (mantener validación business logic fuera del RPC)

### 🔴 CRÍTICA 2: Límite de 4 pases Petite
**Ubicación:** Líneas 313-337  
**Problema:** El RPC NO valida esto. Petite podría usar más de 4 pases.

**Solución:** Mantener en endpoint (business rule compleja)

### 🔴 CRÍTICA 3: Selección de Pase por Tier
**Ubicación:** Líneas 340-392  
**Problema:** El RPC recibe `p_pass_id`, pero NO valida tier. El endpoint hace matching inteligente.

**Solución:** El endpoint debe seguir seleccionando el pase correcto antes de llamar al RPC

### 🟡 MEDIA 1: Validación Tier Essentiel/Signature/Privé
**Ubicación:** Líneas 404-430  
**Problema:** El RPC NO valida que el user tier cubra el bag tier.

**Solución:** Mantener validación en endpoint

### 🟡 MEDIA 2: Contador de Pases en Profiles
**Ubicación:** Líneas 560-565  
**Problema:** El RPC NO actualiza `profiles.available_passes_count`.

**Solución:**
- Opción A: Agregar al RPC
- Opción B: Llamar después del RPC
- **Recomendación:** Opción B (separar actualización de contador)

### 🟢 BAJA 1: Notificación Admin
**Ubicación:** Líneas 567-622  
**Solución:** Mantener en endpoint después del RPC

### 🟢 BAJA 2: Audit Log
**Ubicación:** Líneas 567-587  
**Solución:** Mantener en endpoint después del RPC

---

## WEBHOOK DE IDENTIDAD - ESTADO ACTUAL

**Archivo:** `/app/api/webhooks/stripe-identity/route.ts`

### ✅ Lo que hace bien:
```typescript
case "identity.verification_session.verified": {
  await supabase
    .from("membership_intents")
    .update({
      status: "active",
      stripe_verification_session_id: session.id,
      verified_at: new Date().toISOString(),
      activated_at: new Date().toISOString(), // ✅ SÍ SE SETEA
      updated_at: new Date().toISOString(),
    })
    .eq("id", intent.id)
}
```

**Verificación:** Líneas 113-121 ya setean `activated_at` correctamente.

### 🎯 No hay problema aquí
El webhook YA hace lo correcto. No requiere cambios.

---

## PROPUESTA DE MIGRACIÓN

### Estrategia: **Híbrido Seguro**

El RPC maneja:
- ✅ Lock atómico de bolso
- ✅ Lock atómico de pase
- ✅ Idempotencia
- ✅ Creación de reserva
- ✅ Rollback automático (PostgreSQL)

El endpoint mantiene:
- ✅ Validación de membresía (active)
- ✅ Validación de vigencia Petite (30 días)
- ✅ Validación límite de 4 pases Petite
- ✅ Selección inteligente de pase por tier
- ✅ Validación tier user vs bag tier
- ✅ Contador de pases en profiles
- ✅ Notificación admin
- ✅ Audit log

---

## CÓDIGO ELIMINAR DEL ENDPOINT

### Bloque 1: Lock optimista manual (líneas 464-514)
```typescript
// ELIMINAR: Lock de pase manual
const { data: passLock, error: passLockError } = await supabase
  .from("bag_passes")
  .update({ status: "used", used_at: new Date().toISOString() })
  .eq("id", passIdToConsume)
  .eq("status", "available")
  ...

// ELIMINAR: Lock de bolso manual
const { data: bagLock, error: bagLockError } = await supabase
  .from("bags")
  .update({ status: "rented", updated_at: new Date().toISOString() })
  .eq("id", bag_id)
  ...

// ELIMINAR: Rollback manual
if (passIdToConsume) {
  await supabase.from("bag_passes").update({ status: "available" })...
}
```

### Bloque 2: Creación de reserva manual (líneas 517-549)
```typescript
// ELIMINAR: INSERT manual
const { data: reservation, error: createError } = await supabase
  .from("reservations")
  .insert({ ... })
  
// ELIMINAR: Rollback manual de reserva
await supabase.from("bags").update({ status: "available" })...
```

### Bloque 3: Update del pase con reservation_id (líneas 554-559)
```typescript
// ELIMINAR: El RPC ya hace esto
await supabase
  .from("bag_passes")
  .update({ used_for_reservation_id: reservation.id })
  .eq("id", passIdToConsume)
```

### Bloque 4: Idempotencia manual (líneas 446-462)
```typescript
// ELIMINAR: El RPC ya verifica duplicados
const { data: existingReservation } = await supabase
  .from("reservations")
  .select("id, created_at")
  .eq("user_id", userId)
  .eq("bag_id", bag_id)
  ...
```

**Total eliminado: ~150 líneas de lógica de lock/transacción**

---

## CÓDIGO NUEVO DEL ENDPOINT

```typescript
// DESPUÉS de todas las validaciones de negocio...

console.log("[v0] Calling atomic RPC with:", {
  userId,
  bag_id,
  pass_id: passIdToConsume || null,
  start_date: startDate.toISOString(),
  end_date: endDate.toISOString(),
  membership_type: userMembershipPlan,
})

// LLAMAR AL RPC
const { data: rpcResult, error: rpcError } = await supabase.rpc(
  "create_reservation_atomic",
  {
    p_user_id: userId,
    p_bag_id: bag_id,
    p_pass_id: passIdToConsume || null,
    p_start_date: startDate.toISOString(),
    p_end_date: endDate.toISOString(),
    p_membership_type: userMembershipPlan,
  }
)

if (rpcError) {
  console.error("[v0] RPC error:", rpcError)
  return NextResponse.json(
    { error: "Error técnico al crear reserva. Intenta nuevamente." },
    { status: 500 }
  )
}

// Parsear resultado
const result = typeof rpcResult === 'string' ? JSON.parse(rpcResult) : rpcResult

if (!result.success) {
  console.error("[v0] RPC returned failure:", result.error)
  return NextResponse.json({ error: result.error }, { status: 400 })
}

const reservationId = result.reservation_id

// Fetch reserva completa con join
const { data: reservation, error: fetchError } = await supabase
  .from("reservations")
  .select("*, bags(id, name, brand, image_url)")
  .eq("id", reservationId)
  .single()

if (fetchError || !reservation) {
  console.error("[v0] Error fetching created reservation:", fetchError)
  return NextResponse.json(
    { error: "Reserva creada pero error al obtener detalles" },
    { status: 500 }
  )
}

// Actualizar contador de pases (si se usó pase)
if (passIdToConsume) {
  const { data: passCount } = await supabase.rpc("count_available_passes", {
    p_user_id: userId,
  })
  if (passCount !== null) {
    await supabase.from("profiles").update({ available_passes_count: passCount }).eq("id", userId)
  }
}

// Audit log
await supabase.from("audit_log").insert({ ... })

// Notificar admin
await notifyAdmin(...)

return NextResponse.json({ reservation })
```

---

## RIESGOS Y MITIGACIONES

### ⚠️ Riesgo 1: RPC no lanza excepciones detectables
**Mitigación:** El RPC retorna `{success: false, error: "..."}` en lugar de lanzar excepciones.  
**Validación:** Verificar `result.success` siempre.

### ⚠️ Riesgo 2: Parámetros del RPC inconsistentes con endpoint
**Mitigación:** El RPC espera `p_pass_id UUID` pero puede ser NULL. Pasar `null` si no hay pase.  
**Validación:** Probar con y sin pase.

### ⚠️ Riesgo 3: Tipo de retorno JSONB
**Mitigación:** Parsear si es string, usar directo si es objeto.  
**Validación:** `typeof rpcResult === 'string' ? JSON.parse(rpcResult) : rpcResult`

---

## PLAN DE EJECUCIÓN

### Paso 1: Refactor del endpoint POST
1. Mantener validaciones de negocio (líneas 202-430)
2. Eliminar locks manuales (líneas 446-514)
3. Llamar al RPC (código nuevo)
4. Mantener post-procesamiento (contador, audit, notificación)

### Paso 2: Verificar webhook identidad
- ✅ Ya correcto, no requiere cambios

### Paso 3: Testing
- Crear reserva con Petite + pase
- Crear reserva con Essentiel (sin pase)
- Crear reserva con Petite expirado (debe fallar)
- Crear reserva con bolso ya rentado (debe fallar)
- Crear reserva duplicada (idempotencia)

---

## CONFIRMACIÓN REQUERIDA

**¿Procedo con la migración usando esta estrategia híbrida?**

Ventajas:
- ✅ Mantiene validaciones de negocio complejas en TypeScript
- ✅ Usa RPC solo para locks/transacciones
- ✅ Elimina ~150 líneas de código duplicado
- ✅ Mantiene rollback automático de PostgreSQL
- ✅ No cambia esquema DB
- ✅ No introduce nuevos estados

**BLOQUEO:** Esperando tu confirmación antes de ejecutar cambios.
