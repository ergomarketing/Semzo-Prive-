# FASE 1 - ALINEACIÓN DASHBOARD Y SOURCE OF TRUTH

## ✅ CAMBIOS COMPLETADOS

### 1. Sistema de Mapeo Centralizado
**Archivo:** `/lib/membership-state-mapper.ts` (NUEVO)

**Funcionalidad:**
- Mapeo explícito de estados DB → UI
- `mapDBStatusToUI()`: Convierte estados de `membership_intents` a estados UI
- `getStatusLabel()`: Labels amigables en español
- `getStatusDescription()`: Descripciones contextuales por tipo de membresía

**Mapeos implementados:**
```typescript
DB (membership_intents)  →  UI (mostrar al usuario)
─────────────────────────────────────────────────────
initiated                →  pending_payment
paid_pending_verification →  pending_verification  
active                   →  active
expired                  →  expired
cancelled                →  cancelled
null/undefined           →  inactive
```

---

### 2. Dashboard Principal Refactorizado
**Archivo:** `/app/dashboard/page.tsx`

**Cambios realizados:**

#### ❌ ELIMINADO (queries directas):
```typescript
// ❌ Ya no se hace esto:
const { data, error } = await supabase.from("profiles").select("*")
const { data: intentData } = await supabase.from("membership_intents").select(...)
const { count: waitlistCount } = await supabase.from("waitlist").select(...)
```

#### ✅ IMPLEMENTADO (API canónico):
```typescript
// ✅ Ahora se hace esto:
const { data, error, isLoading } = useSWR(
  user?.id ? DASHBOARD_KEY : null, 
  fetcher
)
// data contiene: profile, membership, gift_cards, reservations
```

**Beneficios:**
- Single source of truth: `/api/user/dashboard`
- Caché automático con SWR
- Revalidación automática
- Mismo estado que página de membresía

**UI actualizada:**
- Usa `mapDBStatusToUI()` para convertir estados
- Usa `getStatusLabel()` y `getStatusDescription()` para textos
- Contador de reservas desde `data.reservations.active`
- Contador de wishlist desde `data.reservations.wishlist`
- Contador de waitlist desde `data.reservations.waitlist`
- Balance gift cards desde `data.gift_cards.total_balance`

---

### 3. Eliminación de Fallbacks a `profiles.membership_status`

#### 3.1 Endpoint de Reservas
**Archivo:** `/app/api/user/reservations/route.ts`

**Antes:**
```typescript
const { data: userProfile } = await supabase
  .from("profiles")
  .select("full_name, email, membership_type, membership_status")  // ❌
  .eq("id", userId)
  .single()

const canRent =
  activeIntent?.status === "active" ||
  userMembershipRecord?.status === "active" ||
  userProfile.membership_status === "active"  // ❌ FALLBACK ELIMINADO
```

**Después:**
```typescript
const { data: userProfile } = await supabase
  .from("profiles")
  .select("full_name, email")  // ✅ Solo datos básicos
  .eq("id", userId)
  .single()

const canRent =
  activeIntent?.status === "active" ||
  userMembershipRecord?.status === "active"  // ✅ Solo fuentes confiables
```

#### 3.2 Endpoint de Compra de Pases
**Archivo:** `/app/api/bag-passes/purchase/route.ts`

**Antes:**
```typescript
const { data: profile } = await supabase
  .from("profiles")
  .select("membership_type, membership_status, email, full_name")  // ❌
  .eq("id", finalUserId)
  .single()

const hasActiveMembership =
  activeIntent?.status === "active" ||
  activeIntent?.status === "paid_pending_verification" ||
  profile?.membership_status === "active" ||  // ❌ FALLBACK ELIMINADO
  userMembership?.status === "active"
```

**Después:**
```typescript
const { data: profile } = await supabase
  .from("profiles")
  .select("email, full_name")  // ✅ Solo datos básicos
  .eq("id", finalUserId)
  .single()

const hasActiveMembership =
  activeIntent?.status === "active" ||
  activeIntent?.status === "paid_pending_verification" ||
  userMembership?.status === "active"  // ✅ Solo fuentes confiables
```

---

## 🎯 VALIDACIÓN

### ✅ Criterios cumplidos:

1. **Dashboard usa API canónico**
   - ✅ `/app/dashboard/page.tsx` usa SWR + `/api/user/dashboard`
   - ✅ No hace queries directas a Supabase
   - ✅ Mismo patrón que `/app/dashboard/membresia/page.tsx`

2. **Source of Truth respetado**
   - ✅ `membership_intents` es la única fuente de verdad
   - ✅ `user_memberships` como fuente secundaria válida
   - ✅ `profiles.membership_status` NO se consulta en frontend ni backend crítico

3. **Mapeo de estados centralizado**
   - ✅ `initiated` → `pending_payment` (solo UI)
   - ✅ Función única en `/lib/membership-state-mapper.ts`
   - ✅ No se crean estados nuevos en DB

4. **Alcance respetado**
   - ✅ No se tocó lógica de pagos
   - ✅ No se tocó lógica de webhooks
   - ✅ No se modificaron esquemas de DB
   - ✅ Solo se alineó dashboard y fuentes de verdad

---

## 🔍 VERIFICACIÓN MANUAL

Para confirmar que todo funciona correctamente:

### 1. Dashboard muestra mismo estado que Membresía
```bash
# Navega a /dashboard
# Navega a /dashboard/membresia
# Compara el estado mostrado → debe ser idéntico
```

### 2. No hay discrepancias entre vistas
```bash
# Usuario con membresía "initiated" debe ver:
# - Dashboard: "Procesando pago..."
# - Membresía: "Procesando pago..."
```

### 3. No hay referencias a profiles.membership_status en frontend
```bash
grep -r "profiles.membership_status" app/dashboard/
# Resultado esperado: solo en archivos .md de documentación
```

### 4. Backend crítico no usa profiles como fallback
```bash
grep -r "membership_status.*active" app/api/user/reservations/
grep -r "membership_status.*active" app/api/bag-passes/
# Resultado esperado: sin matches en validaciones de membresía
```

---

## 📊 IMPACTO

### Archivos modificados: 4
1. `/lib/membership-state-mapper.ts` - NUEVO
2. `/app/dashboard/page.tsx` - REFACTORIZADO
3. `/app/api/user/reservations/route.ts` - LIMPIADO
4. `/app/api/bag-passes/purchase/route.ts` - LIMPIADO

### Archivos NO tocados (fuera de scope):
- `/app/api/webhooks/stripe/route.ts`
- `/app/api/membership/*`
- `/scripts/*.sql`
- Cualquier lógica de activación de membresías

### Líneas de código:
- **Añadidas:** ~120 líneas (mapper + refactor)
- **Eliminadas:** ~180 líneas (queries directas + fallbacks)
- **Neto:** -60 líneas (código más limpio)

---

## 🚀 PRÓXIMOS PASOS

Esta fase sienta las bases para las siguientes fases del plan:

### Fase 2: Eliminar fallbacks restantes (30 min)
- Archivos pendientes:
  - `/app/api/identity/check-status/route.ts`
  - `/app/api/admin/alerts/route.ts`
  - `/app/api/admin/logistics/shipments/route.ts`
  - `/app/api/admin/members/route.ts`
  - Y otros archivos admin que aún consultan `profiles.membership_status`

### Fase 3: Activación post-verificación (30 min)
- Actualizar `activated_at` en webhook tras verificación de identidad
- Centralizar lógica de activación

### Fase 4: Migrar a RPC atómico (1 hora)
- Usar `/scripts/create-atomic-reservation-rpc-v2.sql` en producción
- Eliminar queries manuales en `/app/api/user/reservations/route.ts`

---

## ✅ CONCLUSIÓN

**Fase 1 completada exitosamente.**

El dashboard principal ahora:
- Consume el API canónico `/api/user/dashboard`
- Muestra el mismo estado que la página de membresía
- No hace inferencias por su cuenta
- Usa un sistema centralizado de mapeo de estados

Los endpoints críticos ahora:
- Solo consultan `membership_intents` y `user_memberships`
- No tienen fallbacks a `profiles.membership_status`
- Respetan el source of truth establecido

El sistema está listo para las siguientes fases de alineación.
