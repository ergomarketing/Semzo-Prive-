# IMPLEMENTACIÓN URGENTE - Flujo de Membresías Netflix-Style

## PROBLEMA IDENTIFICADO

El sistema actual tiene 3 desconexiones críticas:
1. ❌ No se crea `membership_intent` antes del checkout
2. ❌ No se reciben notificaciones de registro en mailbox@semzoprive.com
3. ❌ Dashboard muestra "Free" porque no hay membresía creada

## SOLUCIÓN IMPLEMENTADA

### 1. Tabla `membership_intents` (EJECUTAR SQL MANUAL)

**Acción requerida:** Ejecuta este SQL en Supabase SQL Editor:

```sql
-- Ver archivo: scripts/create-membership-intents-MANUAL.sql
```

### 2. Notificaciones de Admin (✅ COMPLETADO)

- `app/api/auth/callback/route.ts` → Ahora envía email a mailbox@semzoprive.com
- Se notifica en cada registro exitoso (email + SMS)

### 3. Flujo Completo de Checkout (⚠️ REQUIERE INTEGRACIÓN)

**PRÓXIMOS PASOS CRÍTICOS:**

#### A. Modificar CartClient para crear intent ANTES de Stripe

En `app/cart/CartClient.tsx`, en la función `handleCheckout`, agregar:

```typescript
// ANTES de crear el setup intent de Stripe:
const intentResponse = await fetch('/api/checkout/create-intent', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    membershipType,
    billingCycle,
    amountCents: Math.round(finalAmount * 100),
    originalAmountCents: Math.round(total * 100),
    couponCode: appliedCoupon?.code,
    couponDiscountCents: appliedCoupon ? Math.round((total - finalAmount) * 100) : 0,
    giftCardCode: appliedGiftCard?.code,
    giftCardAppliedCents: appliedGiftCard ? Math.round(appliedGiftCard.value * 100) : 0,
  })
})

const { intentId, customerId } = await intentResponse.json()

// LUEGO crear el setup intent con el intentId en metadata
```

#### B. Webhook ya actualizado (✅ PARCIAL)

El webhook de Stripe ya busca `intent_id` en metadata y actualiza el estado a `paid_pending_verification`.

#### C. Dashboard debe leer desde `membership_intents`

Modificar `app/dashboard/page.tsx` para consultar:

```typescript
const { data: activeIntent } = await supabase
  .from('membership_intents')
  .select('*')
  .eq('user_id', user.id)
  .in('status', ['paid_pending_verification', 'active'])
  .order('created_at', { ascending: false })
  .limit(1)
  .single()
```

## RESULTADO ESPERADO

```
Usuario selecciona plan
    ↓
POST /api/checkout/create-intent
    ↓ Crea registro en membership_intents (initiated)
    ↓ Envía email a mailbox@semzoprive.com
    ↓
Stripe Checkout con intent_id en metadata
    ↓
Webhook: payment_intent.succeeded
    ↓ Actualiza intent a "paid_pending_verification"
    ↓
Usuario completa Stripe Identity
    ↓
Webhook: identity.verification_session.verified
    ↓ Actualiza intent a "active"
    ↓ Crea subscription en user_memberships
    ↓
Dashboard lee desde membership_intents
    ↓ Muestra estado correcto
```

## CHECKLIST DE DESPLIEGUE

- [x] SQL ejecutado manualmente en Supabase
- [x] Notificaciones de admin implementadas
- [x] Endpoint `/api/checkout/create-intent` creado
- [ ] CartClient modificado para llamar create-intent
- [ ] Dashboard modificado para leer desde membership_intents
- [ ] Prueba completa end-to-end
