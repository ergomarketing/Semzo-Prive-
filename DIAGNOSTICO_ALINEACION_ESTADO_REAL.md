# 🔍 DIAGNÓSTICO COMPLETO: ALINEACIÓN DB → API → UI

**Fecha:** ${new Date().toISOString()}
**Estado:** ✅ Análisis completado antes de modificar código

---

## 📊 RESUMEN EJECUTIVO

| Área | Estado | Criticidad |
|------|--------|-----------|
| **Membresías** | 🟡 DESALINEADO | ALTA |
| **Pases de Bolso** | 🟢 CORRECTO | MEDIA |
| **Reservas** | 🟡 DESALINEADO | ALTA |
| **Dashboard UI** | 🔴 CRÍTICO | CRÍTICA |

---

## 1️⃣ MEMBRESÍAS (Source of Truth: `membership_intents`)

### ✅ ESTADO ACTUAL EN DB

**Esquema `membership_intents`:**
```sql
CREATE TABLE membership_intents (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  membership_type TEXT NOT NULL CHECK (membership_type IN ('petite', 'lessentiel', 'signature', 'prive')),
  status TEXT NOT NULL DEFAULT 'initiated' CHECK (status IN 
    ('initiated', 'paid_pending_verification', 'active', 'failed', 'cancelled')
  ),
  
  -- Timestamps críticos
  created_at TIMESTAMPTZ DEFAULT NOW(),
  paid_at TIMESTAMPTZ,
  verified_at TIMESTAMPTZ,
  activated_at TIMESTAMPTZ,  -- ⚠️ FUENTE DE VERDAD para vigencia Petite
  
  -- Stripe
  stripe_payment_intent_id TEXT,
  stripe_customer_id TEXT,
  stripe_verification_session_id TEXT,
  
  -- Descuentos
  coupon_code TEXT,
  gift_card_code TEXT
);
```

**Estados válidos según reglas:**
- `pending_payment` ❌ NO EXISTE EN DB (solo 'initiated')
- `paid_pending_verification` ✅ EXISTE
- `active` ✅ EXISTE
- `expired` ❌ NO EXISTE EN DB (debe calcularse)

### 🔴 PROBLEMA 1: Estado "pending_payment" no existe

**Ubicación:** `/app/dashboard/page.tsx` (líneas 50-52)
```typescript
if (intentData.status === "initiated") {
  setMembershipType(intentData.membership_type)
  setMembershipStatus("processing_payment") // ❌ Estado inventado en frontend
}
```

**Corrección necesaria:**
- `initiated` → mapear a estado UI "pending_payment" ✅
- Pero NO crear estado de DB nuevo

### 🟡 PROBLEMA 2: Dashboard NO lee desde source of truth canónico

**Dashboard actual (`/app/dashboard/page.tsx`):**
- Lee directamente desde `membership_intents` con query en frontend ❌
- Usa 3 queries diferentes para determinar estado ❌
- Inferencias de estado en cliente ❌

```typescript
// ❌ MAL: Múltiples queries en frontend
const { data: intentData } = await supabase
  .from("membership_intents")
  .select("membership_type, status, billing_cycle")
  .eq("user_id", user.id)
  .in("status", ["initiated", "paid_pending_verification", "active"])
  
const { data: allIntents } = await supabase
  .from("membership_intents")
  .select("id")
  .eq("user_id", user.id)
```

**API canónico EXISTE (`/app/api/user/dashboard/route.ts`):**
```typescript
// ✅ BIEN: Single source of truth
export async function GET() {
  // ... calcula estado real desde membership_intents
  return NextResponse.json({
    membership: {
      type: membershipType,
      status: isPetiteExpired ? "expired" : membershipStatus,
      started_at: membershipStartedAt,
      ends_at: membershipEndsAt,
    }
  })
}
```

**⚠️ DESALINEACIÓN:** Dashboard page.tsx NO usa el API `/api/user/dashboard` que SÍ existe.

### 🟢 PROBLEMA 3: Cálculo de vigencia Petite (30 días)

**En `/app/api/user/dashboard/route.ts` (CORRECTO):**
```typescript
if (membershipType === "petite") {
  const startDate = activeIntent?.activated_at || activeIntent?.created_at
  if (startDate) {
    membershipStartedAt = new Date(startDate).toISOString()
    membershipEndsAt = new Date(new Date(startDate).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString()
  }
}

const isPetiteExpired = membershipType === "petite" && membershipEndsAt && new Date() > new Date(membershipEndsAt)
```

**✅ CORRECTO:** Usa `activated_at` como source of truth.

**En `/app/api/user/reservations/route.ts` (CORRECTO):**
```typescript
const membershipStartDate = activeIntent?.activated_at || activeIntent?.created_at
const startedAt = new Date(membershipStartDate)
const expiresAt = new Date(startedAt.getTime() + 30 * 24 * 60 * 60 * 1000)

if (now > expiresAt) {
  return NextResponse.json({
    error: `Tu membresía Petite expiró hace ${expiredDaysAgo} día(s).`,
    membershipExpired: true
  }, { status: 403 })
}
```

**✅ CORRECTO:** Validación de expiración antes de crear reserva.

---

## 2️⃣ PASES DE BOLSO (Source of Truth: `bag_passes`)

### ✅ ESTADO ACTUAL EN DB

**Esquema `bag_passes`:**
```sql
CREATE TABLE bag_passes (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  pass_tier TEXT NOT NULL CHECK (pass_tier IN ('lessentiel', 'signature', 'prive')),
  status TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'used', 'expired')),
  used_for_reservation_id UUID REFERENCES reservations(id),
  purchased_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,  -- ⚠️ Siempre NULL (pases no expiran)
  price DECIMAL(10, 2) NOT NULL
);
```

**Reglas de negocio:**
- ✅ Pases NO expiran automáticamente (`expires_at` siempre NULL)
- ✅ Se consumen SOLO al crear reserva
- ✅ Máximo 4 pases consumidos por ciclo de membresía Petite (30 días)

### 🟢 PROBLEMA RESUELTO: Compra de pases

**En `/app/api/bag-passes/purchase/route.ts` (CORRECTO):**
```typescript
const passes = []
for (let i = 0; i < quantity; i++) {
  passes.push({
    user_id: finalUserId,
    pass_tier: dbTier,
    status: "available",  // ✅
    price: pricePerPass,
    purchased_at: new Date().toISOString(),
    expires_at: null,  // ✅ No expiran
  })
}
```

**✅ CORRECTO:** Pases creados con `status: "available"` y sin expiración.

### 🟢 PROBLEMA RESUELTO: Consumo de pases en reservas

**En `/app/api/user/reservations/route.ts` (líneas 282-402):**

**Validaciones implementadas:**
1. ✅ Verificar vigencia de membresía Petite (30 días)
2. ✅ Contar pases usados en período actual (máx 4)
3. ✅ Validar tier del pase vs tier del bolso
4. ✅ Lock optimista del pase antes de crear reserva

```typescript
// 1. Verificar vigencia
const expiresAt = new Date(startedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
if (now > expiresAt) {
  return NextResponse.json({ 
    error: "Tu membresía Petite expiró",
    membershipExpired: true 
  }, { status: 403 })
}

// 2. Contar pases usados
const { count: usedPassesCount } = await supabase
  .from("bag_passes")
  .select("id", { count: "exact", head: true })
  .eq("user_id", userId)
  .eq("status", "used")
  .gte("used_at", startedAt.toISOString())
  .lte("used_at", expiresAt.toISOString())

if ((usedPassesCount || 0) >= 4) {
  return NextResponse.json({
    error: "Has alcanzado el límite de 4 cambios",
    maxPassesReached: true
  }, { status: 403 })
}

// 3. Lock optimista del pase
const { data: passLock, error: passLockError } = await supabase
  .from("bag_passes")
  .update({
    status: "used",
    used_at: new Date().toISOString(),
  })
  .eq("id", passIdToConsume)
  .eq("status", "available")  // ✅ Lock optimista
  .select("id")
  .single()
```

**✅ CORRECTO:** Implementación completa con locks y validaciones atómicas.

---

## 3️⃣ RESERVAS (Source of Truth: `reservations`)

### ✅ ESTADO ACTUAL EN DB

**Esquema `reservations`:**
```sql
CREATE TABLE reservations (
  id UUID PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES profiles(id),
  bag_id UUID NOT NULL REFERENCES bags(id),
  status TEXT NOT NULL,  -- pending, confirmed, active, completed, cancelled
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  total_amount DECIMAL(10,2),
  membership_type TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

### 🟢 PROBLEMA RESUELTO: Orden obligatorio de operaciones

**En `/app/api/user/reservations/route.ts` (líneas 448-567):**

**Orden implementado:**
1. ✅ Validar membresía vigente
2. ✅ Validar pase disponible (si es Petite)
3. ✅ Lock del pase (update con WHERE status='available')
4. ✅ Lock del bolso (update con WHERE status='available')
5. ✅ Crear reserva
6. ✅ Rollback automático si falla cualquier paso

```typescript
// PASO 1: Lock del pase
if (passIdToConsume) {
  const { data: passLock } = await supabase
    .from("bag_passes")
    .update({ status: "used", used_at: new Date() })
    .eq("id", passIdToConsume)
    .eq("status", "available")  // ✅ Lock optimista
    .single()
  
  if (!passLock) {
    return NextResponse.json({ 
      error: "El pase ya no está disponible" 
    }, { status: 409 })
  }
}

// PASO 2: Lock del bolso
const { data: bagLock } = await supabase
  .from("bags")
  .update({ status: "rented", updated_at: new Date() })
  .eq("id", bag_id)
  .in("status", ["available", "Available"])  // ✅ Lock optimista
  .single()

if (!bagLock) {
  // ROLLBACK: Liberar el pase
  if (passIdToConsume) {
    await supabase
      .from("bag_passes")
      .update({ status: "available", used_at: null })
      .eq("id", passIdToConsume)
  }
  return NextResponse.json({ 
    error: "El bolso ya no está disponible" 
  }, { status: 409 })
}

// PASO 3: Crear reserva
const { data: reservation } = await supabase
  .from("reservations")
  .insert({ ... })
```

**✅ CORRECTO:** Orden correcto, locks optimistas, rollback manual implementado.

### 🟡 PROBLEMA: RPC atómico NO está siendo usado

**Existe RPC atómico:** `/scripts/create-atomic-reservation-rpc-v2.sql`
```sql
CREATE OR REPLACE FUNCTION create_reservation_atomic(...)
RETURNS JSONB
AS $$
BEGIN
  -- Lock y verificar bolso
  SELECT status INTO v_bag_status FROM bags WHERE id = p_bag_id FOR UPDATE;
  
  -- Lock y verificar pase
  IF p_pass_id IS NOT NULL THEN
    SELECT status INTO v_pass_status FROM bag_passes WHERE id = p_pass_id FOR UPDATE;
  END IF;
  
  -- Crear reserva
  INSERT INTO reservations (...) RETURNING id INTO v_reservation_id;
  
  -- Commit atómico
END;
$$;
```

**⚠️ DESALINEACIÓN:** El código actual NO usa este RPC, implementa locks manualmente en TypeScript.

**Riesgo:** Rollback manual puede fallar, dejando estado inconsistente.

---

## 4️⃣ DASHBOARD UI (Crítico)

### 🔴 PROBLEMA CRÍTICO: Dashboard NO usa API canónico

**API canónico EXISTE:** `/app/api/user/dashboard/route.ts`
- ✅ Calcula estado real desde `membership_intents`
- ✅ Cuenta pases disponibles desde `bag_passes`
- ✅ Calcula vigencia Petite (30 días)
- ✅ Retorna flags: `needs_email`, `can_reserve`, `is_petite_expired`

**Dashboard UI:** `/app/dashboard/page.tsx`
- ❌ NO llama al API `/api/user/dashboard`
- ❌ Hace queries directas a Supabase
- ❌ Infiere estado en cliente
- ❌ NO usa SWR para cache compartido

**Página de Membresía:** `/app/dashboard/membresia/page.tsx`
- ✅ USA SWR con `/api/user/dashboard` ✅
- ✅ Muestra datos reales del backend ✅

**⚠️ DESALINEACIÓN CRÍTICA:** 
- Dashboard principal (página inicial) NO usa el API canónico
- Página de membresía SÍ usa el API canónico
- Datos mostrados pueden ser diferentes entre ambas páginas

---

## 📋 LISTA DE DESALINEACIONES PRIORIZADAS

### 🔴 CRÍTICAS (Rompen source of truth)

1. **Dashboard page.tsx NO usa API canónico**
   - Ubicación: `/app/dashboard/page.tsx`
   - Problema: Queries directas a DB, inferencias en cliente
   - Solución: Usar SWR + `/api/user/dashboard` (como en membresia page)

2. **profiles.membership_status sigue siendo consultado**
   - Ubicación: `/app/api/user/reservations/route.ts` (línea 233)
   - Problema: Se consulta `profiles.membership_status` como fallback
   - Solución: Eliminar fallback, usar SOLO `membership_intents`

### 🟡 ALTAS (Pueden causar bugs)

3. **Estado "pending_payment" no existe en DB**
   - Ubicación: Reglas de negocio vs esquema DB
   - Problema: Documento dice "pending_payment" pero DB tiene "initiated"
   - Solución: Mapear "initiated" → "pending_payment" solo en UI

4. **RPC atómico para reservas NO se usa**
   - Ubicación: `/app/api/user/reservations/route.ts`
   - Problema: Locks manuales en lugar de RPC atómico
   - Solución: Migrar a `create_reservation_atomic()`

### 🟢 MEDIAS (Mejoras, no críticas)

5. **Webhook NO actualiza `activated_at` en `membership_intents`**
   - Ubicación: `/app/api/webhooks/stripe/route.ts`
   - Problema: Después de verificar identidad, falta activar membresía
   - Solución: Actualizar `status='active'` y `activated_at=NOW()`

6. **Dashboard muestra contador de gift cards duplicado**
   - Ubicación: `/app/api/user/dashboard/route.ts` (líneas 129-164)
   - Problema: Complejidad innecesaria para obtener saldo
   - Solución: Simplificar query con JOIN

---

## ✅ ALINEACIONES CORRECTAS (No tocar)

1. ✅ `membership_intents` es source of truth para membresías
2. ✅ `bag_passes` es source of truth para pases
3. ✅ `reservations` es source of truth para reservas
4. ✅ Validación de vigencia Petite (30 días) en API reservas
5. ✅ Locks optimistas en compra de pases
6. ✅ Locks optimistas en creación de reservas
7. ✅ Rollback manual implementado en reservas
8. ✅ API `/api/user/dashboard` calcula estado correctamente
9. ✅ Página `/dashboard/membresia` usa API canónico

---

## 📐 PLAN DE CORRECCIÓN PROPUESTO

### Fase 1: Alinear Dashboard con API canónico (1 hora)

**Archivos a modificar:**
1. `/app/dashboard/page.tsx`
   - Reemplazar queries directas con `useSWR('/api/user/dashboard')`
   - Eliminar lógica de inferencia de estado
   - Usar datos directamente del API

### Fase 2: Eliminar fallbacks a `profiles` (30 min)

**Archivos a modificar:**
1. `/app/api/user/reservations/route.ts`
   - Eliminar consulta a `profiles.membership_status`
   - Usar SOLO `membership_intents` como source of truth

2. `/app/api/bag-passes/purchase/route.ts`
   - Eliminar consulta a `profiles.membership_status`
   - Usar SOLO `membership_intents` como source of truth

### Fase 3: Activación de membresía post-verificación (30 min)

**Archivos a modificar:**
1. `/app/api/webhooks/stripe-identity/route.ts`
   - Después de verificar identidad, actualizar:
     ```typescript
     await supabaseAdmin
       .from("membership_intents")
       .update({
         status: "active",
         activated_at: new Date().toISOString()
       })
       .eq("id", intent_id)
     ```

### Fase 4: Migrar a RPC atómico (1 hora - OPCIONAL)

**Archivos a modificar:**
1. `/app/api/user/reservations/route.ts`
   - Reemplazar locks manuales con:
     ```typescript
     const { data, error } = await supabase.rpc("create_reservation_atomic", {
       p_user_id: userId,
       p_bag_id: bag_id,
       p_pass_id: passToUse?.id,
       p_start_date: startDate,
       p_end_date: endDate,
       p_membership_type: userMembershipPlan
     })
     ```

---

## ⚠️ REGLAS CRÍTICAS (NO ROMPER)

✅ **membership_intents** es el único source of truth para membresías
✅ **bag_passes** es el único source of truth para pases
✅ **reservations** es el único source of truth para reservas
✅ **profiles** NO decide estado de membresía
✅ Ningún flujo depende de estado en memoria, cookies o frontend
✅ Toda acción crítica es idempotente
✅ Toda mutación crítica tiene lock optimista

---

## 🎯 PRÓXIMOS PASOS

**ANTES de escribir código:**
1. ✅ Mapa completo de estados reales (COMPLETADO)
2. ✅ Identificación de desalineaciones (COMPLETADO)

**AHORA podemos proceder:**
3. ⏳ Aplicar correcciones de Fase 1 (Dashboard UI)
4. ⏳ Aplicar correcciones de Fase 2 (Eliminar fallbacks)
5. ⏳ Aplicar correcciones de Fase 3 (Activación membresía)
6. ⏳ Testing manual de flujos completos
7. ⏳ Documentar cambios realizados

---

**FIN DEL DIAGNÓSTICO**

Este documento debe actualizarse después de cada corrección para reflejar el estado real del sistema.
