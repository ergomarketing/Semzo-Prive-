# Actualización del Endpoint para RPC V3

## Cambios necesarios después de ejecutar el RPC V3

### Antes (RPC V2 - retorna JSONB):
```typescript
const { data: rpcResult, error: rpcError } = await supabase.rpc("create_reservation_atomic", {
  p_user_id: userId,
  p_bag_id: bag_id,
  p_pass_id: passIdToConsume || null,
  p_start_date: startDate.toISOString(),
  p_end_date: endDate.toISOString(),
  p_membership_type: userMembershipPlan, // ❌ Ya no existe
})

if (rpcError) { /* ... */ }

if (!rpcResult?.success) { /* ... */ } // ❌ Ya no retorna JSONB

const reservationId = rpcResult.reservation_id // ❌ Ya no es objeto
const isExisting = rpcResult.message === "Reserva ya existente" // ❌ Sin idempotencia
```

### Después (RPC V3 - retorna UUID):
```typescript
const { data: reservationId, error: rpcError } = await supabase.rpc("create_reservation_atomic", {
  p_user_id: userId,
  p_bag_id: bag_id,
  p_pass_id: passIdToConsume || null,
  p_start_date: startDate.toISOString(),
  p_end_date: endDate.toISOString(),
  // ✅ p_membership_type eliminado
})

if (rpcError) {
  console.error("[v0] RPC error:", rpcError)
  
  // Mapear excepciones del RPC a códigos HTTP
  if (rpcError.message.includes("BAG_NOT_AVAILABLE")) {
    return NextResponse.json(
      { error: "El bolso ya no está disponible" },
      { status: 409 }
    )
  }
  
  if (rpcError.message.includes("PASS_NOT_AVAILABLE")) {
    return NextResponse.json(
      { error: "El pase ya no está disponible" },
      { status: 409 }
    )
  }
  
  if (rpcError.message.includes("lock_not_available")) {
    return NextResponse.json(
      { error: "Recurso bloqueado, intenta de nuevo" },
      { status: 409 }
    )
  }
  
  // Error genérico
  return NextResponse.json(
    { error: "Error al crear la reserva", details: rpcError.message },
    { status: 500 }
  )
}

if (!reservationId) {
  return NextResponse.json(
    { error: "No se pudo crear la reserva" },
    { status: 500 }
  )
}

console.log("[v0] Reservation created via RPC:", reservationId)
```

## Líneas exactas a cambiar

**Archivo:** `/app/api/user/reservations/route.ts`

**Líneas 445-526:** Reemplazar toda la sección de llamada al RPC

### Resumen de cambios:
1. ✅ Eliminar parámetro `p_membership_type`
2. ✅ Cambiar `data: rpcResult` → `data: reservationId`
3. ✅ Mapear errores desde excepciones (no desde result.success)
4. ✅ Eliminar lógica de idempotencia (ya está antes del RPC)
5. ✅ Usar directamente `reservationId` (es UUID, no objeto)

## Listo para aplicar cuando confirmes que ejecutaste el RPC
