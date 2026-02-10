# Auditoría Completa del Sistema de Membresías

## ESTADO ACTUAL - PROBLEMAS IDENTIFICADOS

### 1. INCONSISTENCIAS EN BASE DE DATOS

#### Tablas con nombres inconsistentes:
- ❌ `audit_logs` (plural) en algunos scripts vs `audit_log` (singular) en otros
- ✅ `user_memberships` (consistente)
- ✅ `profiles` (consistente)
- ✅ `bag_passes` (nuevo, a crear)

#### Columnas faltantes o incorrectas:
- ❌ `profiles.can_make_reservations` NO EXISTE (está en `user_memberships`)
- ✅ `profiles.membership_type` EXISTS
- ✅ `profiles.membership_status` EXISTS
- ❌ `bag_passes` tabla NO EXISTE en producción

### 2. REGLAS DE NEGOCIO NO IMPLEMENTADAS CORRECTAMENTE

#### Membresías Mensuales (CORRECTO):
\`\`\`
- Privé → Acceso TOTAL (prive, signature, lessentiel)
- Signature → Acceso a signature + lessentiel (NO prive)
- L'Essentiel → Acceso SOLO a lessentiel
\`\`\`

#### Petite + Pases (NO IMPLEMENTADO):
\`\`\`
- Petite semanal → Con PASES puede acceder a cualquier tier
- Pases por tier: lessentiel (€52/semana), signature (€99/semana), prive (€137/semana)
- Sistema de compra, validación y consumo de pases FALTA
\`\`\`

### 3. VALIDACIONES ACTUALES CON ERRORES

**Archivo:** `app/api/user/reservations/route.ts`

**Problemas encontrados:**
1. Lee `can_make_reservations` de `profiles` (NO EXISTE)
2. NO valida sistema de pases
3. NO permite a Petite reservar con pases
4. Validación de tier incompleta

### 4. APIs FALTANTES

- ❌ `/api/bag-passes/purchase` - Existe pero sin integrar con Stripe
- ❌ `/api/bag-passes/available` - Existe pero no se usa en UI
- ❌ `/api/bag-passes/use` - NO EXISTE (necesario)
- ❌ UI de compra de pases - NO EXISTE

### 5. REFERENCIAS INCORRECTAS

**audit_logs vs audit_log:**
- `app/api/admin/audit-logs/route.ts` → Lee de `audit_log` ✅
- `app/api/user/reservations/[id]/route.ts` → Escribe en `audit_log` ✅ (corregido)
- `app/api/cron/auto-update-reservation-status/route.ts` → Escribe en `audit_log` ✅ (corregido)
- `app/api/user/update-membership/route.ts` → Escribe en `audit_log` ✅ (corregido)

---

## SOLUCIÓN INTEGRAL PROPUESTA

### FASE 1: BASE DE DATOS (Scripts SQL)

1. **Crear tabla `bag_passes`**
   - Columnas: id, user_id, pass_tier, status, price, expires_at, used_for_reservation_id
   - Índices: user_id, status, user_id+status
   - RLS policies

2. **Verificar/Crear tabla `user_memberships`**
   - Asegurar que existe y tiene `can_make_reservations`
   
3. **Función auxiliar: `count_available_passes(user_id)`**
   - Retorna cantidad de pases disponibles por tier

### FASE 2: API ENDPOINTS

1. **`/api/bag-passes/purchase`** (YA EXISTE - MEJORAR)
   - Integrar con Stripe
   - Crear pases en BD
   - Enviar email confirmación

2. **`/api/bag-passes/available`** (YA EXISTE - OK)
   - Retorna pases disponibles del usuario

3. **`/api/user/reservations` (POST)** (CORREGIR)
   - Validar tier según membresía
   - SI es Petite: verificar pase disponible del tier correcto
   - Consumir pase automáticamente al confirmar
   - Marcar pase como `used`

### FASE 3: LÓGICA DE VALIDACIÓN

\`\`\`typescript
// Validación completa de permisos
function canReserve(user, bag):
  if bag.membership_type == 'petite':
    return true  // Petite puede reservar sus bolsos
  
  if user.membership_type == 'prive':
    return true  // Privé accede a todo
  
  if user.membership_type == 'signature':
    return bag.membership_type in ['signature', 'lessentiel']
  
  if user.membership_type == 'lessentiel':
    return bag.membership_type == 'lessentiel'
  
  if user.membership_type == 'petite':
    // Verificar si tiene pase disponible del tier correcto
    return hasAvailablePass(user.id, bag.membership_type)
  
  return false
\`\`\`

### FASE 4: UI COMPONENTES

1. **Componente de Selección de Pases**
   - Mostrar pases disponibles
   - Permitir seleccionar pase al reservar
   - Mostrar precio y expiración

2. **Página de Compra de Pases**
   - Catálogo de pases por tier
   - Checkout con Stripe
   - Confirmación y recibo

3. **Dashboard de Membresía**
   - Mostrar pases disponibles
   - Historial de pases usados
   - Botón "Comprar más pases"

### FASE 5: SEGURIDAD

1. **Validación en servidor SIEMPRE**
   - NO confiar en cliente
   - Verificar permisos en cada request

2. **Transacciones atómicas**
   - Crear reserva + consumir pase en transacción
   - Rollback si falla

3. **Rate limiting**
   - Prevenir abuso de compra de pases

---

## PLAN DE IMPLEMENTACIÓN

### PASO 1: Base de Datos (5min)
- Ejecutar script de creación de `bag_passes`
- Ejecutar script de creación de `user_memberships` si falta
- Verificar funciones auxiliares

### PASO 2: Corregir APIs Existentes (10min)
- Corregir `/api/user/reservations` POST
- Corregir validaciones de tier
- Integrar sistema de pases

### PASO 3: Completar APIs de Pases (10min)
- Mejorar `/api/bag-passes/purchase`
- Integrar Stripe
- Crear emails

### PASO 4: UI Componentes (15min)
- Componente selector de pases
- Página compra de pases
- Dashboard mejorado

### PASO 5: Testing Completo (10min)
- Test: Privé reserva todo
- Test: Signature reserva signature+lessentiel, rechaza prive
- Test: Petite sin pases rechazada
- Test: Petite con pase correcto acepta
- Test: Petite con pase incorrecto rechaza

---

## ARCHIVO DE IMPLEMENTACIÓN

### Scripts SQL:
1. `scripts/create-bag-passes-system.sql` ✅ (YA CREADO)
2. `scripts/create-user-memberships-table.sql` ✅ (YA CREADO)
3. `scripts/fix-user-membership-simple.sql` ✅ (YA CREADO - para usuario actual)

### APIs a corregir:
1. `app/api/user/reservations/route.ts` - CRÍTICO
2. `app/api/bag-passes/purchase/route.ts` - MEJORAR
3. `app/api/bag-passes/available/route.ts` - OK

### Componentes a crear:
1. `app/components/bag-pass-selector.tsx` - NUEVO
2. `app/dashboard/membresia/page.tsx` - MEJORAR (mostrar pases)
3. `app/catalog/page.tsx` - INTEGRAR selector pases

---

## PRIORIDAD DE CORRECCIÓN

### 🔴 CRÍTICO (Ahora mismo):
1. Corregir validación de reservas (permitir Petite con pases)
2. Implementar consumo de pases al reservar
3. Testing de validaciones

### 🟡 IMPORTANTE (Siguiente):
1. UI de compra de pases
2. Integración Stripe para pases
3. Emails de confirmación

### 🟢 OPCIONAL (Futuro):
1. Dashboard de analytics de pases
2. Sistema de notificaciones de expiración
3. Descuentos por volumen de pases
