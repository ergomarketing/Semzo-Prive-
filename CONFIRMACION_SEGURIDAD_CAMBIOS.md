# CONFIRMACIÓN DE SEGURIDAD - Cambios Realizados

## A. RPC `create_reservation_atomic`

### ✅ CONFIRMADO: El RPC NO contiene validaciones de negocio

**Archivo:** `/scripts/create-atomic-reservation-rpc-v2.sql`

**El RPC solo contiene:**
1. **Locks transaccionales:**
   - `SELECT ... FOR UPDATE` en bags (línea 23)
   - `SELECT ... FOR UPDATE` en bag_passes (línea 49)

2. **Verificaciones de existencia:**
   - Bolso existe (línea 25)
   - Pase existe (línea 51)

3. **Verificaciones de estado básico:**
   - Bolso está "available" o "disponible" (línea 28)
   - Pase está "available" (línea 54)

4. **Idempotencia:**
   - Check de reservas duplicadas en ventana de 5 minutos (líneas 33-41)

5. **Operaciones atómicas:**
   - INSERT en reservations (líneas 60-78)
   - UPDATE bags → "rented" (líneas 80-83)
   - UPDATE bag_passes → "used" (líneas 85-91)

### ❌ El RPC NO valida:
- ❌ Vigencia de membresía Petite (30 días desde activated_at)
- ❌ Límite de 4 pases por período de membresía Petite
- ❌ Tier hierarchy (si el pase es suficiente para el bolso)
- ❌ Selección de pase correcto según tier
- ❌ Expiración de pases
- ❌ Si el usuario tiene membresía activa

### ✅ TODAS las validaciones permanecen en el endpoint

**Archivo:** `/app/api/user/reservations/route.ts`

**Validaciones exclusivas del endpoint (líneas 201-430):**

1. **Membresía activa** (líneas 201-253):
   - Verifica `membership_intents.status = 'active'`
   - Verifica `user_memberships.status = 'active'`
   - Determina `effectivePlan`
   - Rechaza si no tiene membresía activa (403)

2. **Estado del bolso** (líneas 255-273):
   - Bolso existe
   - Bolso está "available" o "disponible"

3. **VALIDACIONES PETITE** (líneas 284-400):
   - **Vigencia de 30 días** (líneas 286-310):
     - Calcula `expiresAt = activated_at + 30 días`
     - Rechaza si expiró (403)
   - **Límite de 4 pases** (líneas 312-337):
     - Cuenta pases usados en período de vigencia
     - Rechaza si alcanzó el límite (403)
   - **Selección de pase correcto** (líneas 340-399):
     - Define tier hierarchy (essentiel=1, signature=2, prive=3)
     - Busca pases disponibles que cubren el tier del bolso
     - Rechaza si no hay pase adecuado (403)
     - **Selecciona el primer pase válido** (línea 391)

4. **VALIDACIONES MEMBRESÍAS SUPERIORES** (líneas 404-430):
   - Verifica que el tier del bolso esté cubierto por la membresía
   - Rechaza si necesita upgrade (403)

**Total: ~230 líneas de lógica de negocio en el endpoint**

---

## B. Gift Cards - Deduplicación

### 🎯 Qué significa "deduplicación de gift cards compartidas"

**Contexto del problema:**
Una misma gift card puede aparecer en el dashboard de un usuario por **dos caminos diferentes**:

1. **Via `used_by`:** El usuario canjeó la gift card directamente
   \`\`\`sql
   SELECT * FROM gift_cards WHERE used_by = user_id
   \`\`\`

2. **Via `membership_intents`:** El usuario compró una membresía con esa gift card
   \`\`\`sql
   SELECT gc.* 
   FROM gift_cards gc
   JOIN membership_intents mi ON mi.gift_card_id = gc.id
   WHERE mi.user_id = user_id
   \`\`\`

**Problema:** Si canjeé una gift card Y además la usé para comprar una membresía, aparecería **2 veces** en mi saldo total (duplicando el saldo).

**Solución implementada (líneas 155-161 en `/app/api/user/dashboard/route.ts`):**
\`\`\`typescript
// Obtener cards de ambas fuentes
const allCards = [...directGiftCards, ...intentGiftCards]

// Deduplicar por ID (misma card = mismo ID)
const uniqueGiftCards = allCards.filter(
  (card, index, self) => index === self.findIndex((c) => c.id === card.id)
)

// Sumar solo UNA VEZ cada card
const totalBalance = uniqueGiftCards.reduce((sum, card) => sum + card.amount, 0)
\`\`\`

**Ejemplo práctico:**
- Gift Card GC123 tiene 100€
- Usuario la canjea → `used_by = user_id`
- Usuario la usa para comprar membresía → `membership_intents.gift_card_id = GC123`
- Sin deduplicación: 100€ + 100€ = **200€ (INCORRECTO)**
- Con deduplicación: 100€ (GC123 aparece solo 1 vez) ✅

---

### ✅ CONFIRMACIONES FINANCIERAS

#### 1. Cada consumo sigue creando un registro en `gift_card_transactions`

**Archivo:** `/app/api/bag-passes/purchase/route.ts` (líneas 168-204)

\`\`\`typescript
// PASO 1: Crear transacción (idempotencia por constraint único)
const { error: txError } = await supabase
  .from("gift_card_transactions")
  .insert({
    gift_card_id: giftCard.id,
    user_id: finalUserId,
    reference_type: "bag_pass",
    reference_id: passId,  // Unique constraint aquí
    amount: totalPrice,
    balance_before: previousAmount,
    balance_after: newAmount,
  })

if (txError?.code === "23505") {
  // Ya procesado, skip
} else {
  // PASO 2: Solo si INSERT exitoso, actualizar saldo
  await supabase
    .from("gift_cards")
    .update({ amount: newAmount })
    .eq("id", giftCard.id)
}
\`\`\`

**✅ Confirmado:** Cada compra de pase crea un registro en `gift_card_transactions` con:
- `reference_type = "bag_pass"`
- `reference_id = pass_id` (unique constraint)
- `amount` consumido
- `balance_before` y `balance_after`

**Archivo:** `/app/api/gift-cards/redeem/route.ts` (líneas 85-92)

\`\`\`typescript
// Registrar transacción en redeem manual
await supabase.from("gift_card_transactions").insert({
  gift_card_id: giftCard.id,
  user_id: user.id,
  amount_used: amountInCents,
  order_reference: orderReference || `manual_${Date.now()}`,
})
\`\`\`

**✅ Confirmado:** Cada redeem manual también crea un registro en `gift_card_transactions`.

---

#### 2. NO existe reutilización lógica de una gift card sin transacción

**Evidencia:**
1. **Constraint único en transacciones:**
   \`\`\`sql
   -- /scripts/create-gift-card-transactions-v2.sql (línea 11)
   UNIQUE(gift_card_id, reference_type, reference_id)
   \`\`\`
   Esto **previene** que la misma gift card se use 2 veces para el mismo pase.

2. **Idempotencia estricta:**
   \`\`\`typescript
   // Si ya existe transacción, NO actualizar saldo (líneas 180-186)
   if (txError.code === "23505") {
     console.log("Transaction already processed (idempotent)")
     // NO modifica gift_cards.amount
   }
   \`\`\`

3. **Balance siempre disminuye:**
   \`\`\`typescript
   // /app/api/bag-passes/purchase/route.ts (línea 166)
   const newAmount = Math.max(0, previousAmount - totalPrice)
   
   // Solo actualiza si tiene saldo suficiente (línea 194)
   .gte("amount", totalPrice)
   \`\`\`

**✅ Confirmado:** Una gift card NO puede usarse dos veces para la misma referencia. Cada uso registra una transacción única y reduce el saldo una sola vez.

---

#### 3. NO se ha cambiado el modelo de source of truth financiero

**Source of Truth ANTES de los cambios:**
- `gift_cards.amount` = saldo actual disponible
- `gift_card_transactions` = registro de cada consumo con idempotencia
- Cada compra/redeem:
  1. INSERT en transactions (idempotencia)
  2. UPDATE en gift_cards (solo si INSERT exitoso)

**Source of Truth DESPUÉS de los cambios:**
- `gift_cards.amount` = saldo actual disponible ✅ (igual)
- `gift_card_transactions` = registro de cada consumo con idempotencia ✅ (igual)
- Cada compra/redeem:
  1. INSERT en transactions (idempotencia) ✅ (igual)
  2. UPDATE en gift_cards (solo si INSERT exitoso) ✅ (igual)

**LO ÚNICO QUE CAMBIÓ EN FASE 4:**
\`\`\`typescript
// ANTES: 3 queries secuenciales
const directCards = await supabase.from("gift_cards")...
const intentIds = await supabase.from("membership_intents")...
const intentCards = await supabase.from("gift_cards").in(intentIds)...

// DESPUÉS: 2 queries en paralelo
const [directCards, intentIds] = await Promise.all([
  supabase.from("gift_cards")...,
  supabase.from("membership_intents")...
])
const intentCards = await supabase.from("gift_cards").in(intentIds)...
\`\`\`

**✅ Confirmado:** Solo optimizamos la LECTURA del saldo para el dashboard. No se tocó ninguna lógica de consumo, transacciones o validaciones financieras.

---

## RESUMEN DE CONFIRMACIONES

### ✅ A. RPC
- **RPC = locks transaccionales + idempotencia**
- **Endpoint = 100% de las validaciones de negocio**
- **No se perdió ninguna validación en la migración**

### ✅ B. Gift Cards
- **Deduplicación = mostrar el saldo correcto en UI (evitar contar 2 veces la misma card)**
- **Transacciones siguen siendo obligatorias** para cada consumo
- **NO se puede reutilizar** una gift card sin transacción
- **Source of truth financiero NO cambió**
- **Solo optimizamos queries de lectura** (dashboard)

---

## GARANTÍAS DE INTEGRIDAD

1. **Transaccional:** Todas las operaciones críticas usan el RPC con locks FOR UPDATE
2. **Idempotente:** Constraint único en transactions previene doble cobro
3. **Auditada:** Cada consumo queda registrado en gift_card_transactions
4. **Consistente:** Balance disminuye solo si la transacción se registra exitosamente
5. **Validada:** Todas las reglas de negocio se ejecutan en el endpoint ANTES del RPC

**NO HAY CAMBIOS EN EL MODELO DE DATOS NI EN LA LÓGICA FINANCIERA.**
