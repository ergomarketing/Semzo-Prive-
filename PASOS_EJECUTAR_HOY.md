# PASOS PARA RESOLVER HOY - Flujo de Membresías

## PROBLEMA ACTUAL

Usuario completa verificación de identidad en Stripe → Dashboard muestra "Free" → No llega email a mailbox@semzoprive.com

## SOLUCIÓN EN 3 PASOS

### PASO 1: Ejecutar SQL en Supabase (5 minutos)

1. Ve a Supabase → SQL Editor
2. Copia y pega el contenido de `scripts/create-membership-intents-MANUAL.sql`
3. Click en **RUN**
4. Verifica que la tabla se creó: `SELECT * FROM membership_intents LIMIT 1;`

### PASO 2: Hacer Deploy (Ya implementado, solo desplegar)

Los siguientes archivos YA están listos:
- ✅ `app/api/auth/callback/route.ts` - Envía email a mailbox@semzoprive.com
- ✅ `app/api/checkout/create-intent/route.ts` - Crea membership_intent
- ✅ `app/api/webhooks/stripe/route.ts` - Ya busca intent_id y actualiza estado

**Acción:** Haz deploy con `git push` o desde Vercel

### PASO 3: Probar el Flujo Completo (10 minutos)

1. Registro nuevo usuario
   - ✅ Debe llegar email a mailbox@semzoprive.com
   
2. Seleccionar membresía → Checkout
   - ⚠️ Aún falta integrar create-intent en CartClient
   
3. Completar pago
   - ⚠️ Webhook debe actualizar intent a "paid_pending_verification"
   
4. Completar Stripe Identity
   - ⚠️ Webhook debe activar membresía

## LO QUE FALTA (SIGUIENTE ITERACIÓN)

### A. Integrar create-intent en CartClient

Archivo: `app/cart/CartClient.tsx`

Buscar la función donde se crea el setup intent de Stripe y ANTES agregar:

\`\`\`typescript
// Crear membership intent PRIMERO
const intentRes = await fetch('/api/checkout/create-intent', {
  method: 'POST',
  body: JSON.stringify({
    userId: user.id,
    membershipType,
    billingCycle,
    amount: finalAmount,
    coupon: appliedCoupon,
    giftCard: appliedGiftCard,
  })
})

const { intentId } = await intentRes.json()

// Luego pasar intentId en metadata del setup intent
\`\`\`

### B. Dashboard leer desde membership_intents

Archivo: `app/dashboard/page.tsx`

Cambiar la consulta de membresía por:

\`\`\`typescript
const { data: activeIntent } = await supabase
  .from('membership_intents')
  .select('*')
  .eq('user_id', user.id)
  .in('status', ['paid_pending_verification', 'active'])
  .order('created_at', { ascending: false })
  .limit(1)
  .single()

// Mostrar estado basado en activeIntent.status
\`\`\`

## PRUEBA INMEDIATA

**Después del PASO 2 (deploy), prueba solo el registro:**

1. Regístrate con nuevo email
2. Confirma email
3. ✅ Debes recibir notificación en mailbox@semzoprive.com

Esto ya funciona. El resto (checkout → pago → identity) lo completamos después de hacer la integración del PASO 3.

## CONTACTO DE EMERGENCIA

Si algo falla:
- Revisa logs en Vercel: `vercel logs`
- Revisa Supabase SQL logs
- Verifica EMAIL_API_KEY configurada
