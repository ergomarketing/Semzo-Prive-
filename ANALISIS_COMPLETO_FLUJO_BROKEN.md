# ANÁLISIS COMPLETO DEL FLUJO ROTO

## ESTADO ACTUAL (15 Enero 2026)

### Base de Datos
\`\`\`sql
-- TABLA MEMBERSHIP_INTENTS: ❌ NO EXISTE
-- Script creado pero NUNCA ejecutado
\`\`\`

### Flujo de Pago Actual (ROTO)
\`\`\`
1. Usuario agrega Petite al carrito (€19.99)
2. Aplica gift card 100€
3. PaymentFormContent llama DIRECTAMENTE a /api/payments/create-intent
   ❌ NO llama a /api/checkout/create-intent
   ❌ NO crea membership_intent en DB
   ❌ NO pasa intentId a Stripe metadata
4. Webhook payment_intent.succeeded
   ❌ NO tiene intentId en metadata
   ❌ NO puede actualizar membership_intent (no existe)
   ❌ Lógica vieja intenta crear directamente en user_memberships
5. Dashboard lee desde:
   ❌ profiles.membership_type (viejo)
   ❌ user_memberships (viejo)
   ❌ NO lee desde membership_intents (no existe)
\`\`\`

### Flujo de Notificaciones (PARCIALMENTE ROTO)
\`\`\`
REGISTRO EMAIL:
- auth/callback llama adminNotifications.notifyNewUserRegistration()
- PERO redirect sucede ANTES de await
- Email NO se envía

REGISTRO SMS:
- Lógica diferente, email SÍ se envía
- Inconsistencia en flujos
\`\`\`

### Flujo de Verification Identity (ROTO)
\`\`\`
1. Stripe Identity completa verificación
2. return_url = /verification-complete?userId=XXX
3. Página hace polling a /api/user/check-verification-status
4. PROBLEMA: userId probablemente NULL o incorrecto
5. Usuario es redirigido a home en lugar de dashboard
\`\`\`

### Flujo de Gift Cards (COMPLETAMENTE ROTO)
\`\`\`
1. Usuario aplica gift card 100€
2. Checkout crea payment intent con metadata:
   {
     user_id,
     plan_id,
     giftCardUsed: JSON.stringify({id, code, amount})
   }
3. Webhook payment_intent.succeeded:
   ❌ NO lee giftCardUsed de metadata
   ❌ NO deduce saldo de gift_cards table
   ❌ NO crea transaction en gift_card_transactions
4. Resultado: Gift card NO se descuenta
\`\`\`

## PROBLEMAS CRÍTICOS

### 1. Tabla membership_intents NO EXISTE
- Script SQL existe pero no se ejecutó
- TODO el flujo nuevo depende de esta tabla
- SIN ESTA TABLA, NADA FUNCIONA

### 2. PaymentFormContent NO integrado
- Sigue usando flujo viejo
- NO llama a /api/checkout/create-intent
- NO crea membership_intent
- NO pasa intentId a Stripe

### 3. Webhook NO actualiza membership_intents
- case "payment_intent.succeeded" NO toca membership_intents
- case "identity.verification_session.verified" NO toca membership_intents
- Lógica vieja intenta crear directamente membresías

### 4. Dashboard lee datos viejos
- Lee desde profiles.membership_type
- Lee desde user_memberships
- NO lee desde membership_intents
- Muestra estados incorrectos

### 5. Gift Cards completamente olvidadas
- Webhook NO deduce saldo
- NO crea transactions
- Metadata contiene datos pero se ignoran

### 6. Redirecciones incorrectas
- auth/callback redirige ANTES de enviar email
- verification-complete recibe userId incorrecto
- Botón "Activar Membresía" va a upgrade page

## SOLUCIÓN REQUERIDA

### FASE 1: Preparación Base de Datos
\`\`\`sql
-- 1. Ejecutar script MANUALMENTE en Supabase
CREATE TABLE membership_intents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  membership_type TEXT NOT NULL,
  billing_cycle TEXT NOT NULL,
  status TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  ...
);

-- 2. Verificar tabla existe
SELECT * FROM membership_intents LIMIT 1;
\`\`\`

### FASE 2: Integrar PaymentFormContent
\`\`\`typescript
// ANTES de llamar a /api/payments/create-intent:
const intentResponse = await fetch("/api/checkout/create-intent", {
  method: "POST",
  body: JSON.stringify({
    userId,
    membershipType,
    billingCycle,
    amount,
    coupon,
    giftCard
  })
});
const { intentId } = await intentResponse.json();

// LUEGO pasar intentId a Stripe
\`\`\`

### FASE 3: Actualizar Webhooks
\`\`\`typescript
// payment_intent.succeeded
const intentId = paymentIntent.metadata.intent_id;
if (intentId) {
  await supabase
    .from("membership_intents")
    .update({ 
      status: "paid_pending_verification",
      stripe_payment_intent_id: paymentIntent.id 
    })
    .eq("id", intentId);
    
  // Deducir gift card si existe
  if (giftCardData) {
    await supabase.from("gift_cards")
      .update({ balance: balance - amount })
      .eq("id", giftCardId);
      
    await supabase.from("gift_card_transactions").insert({...});
  }
}

// identity.verification_session.verified
const userId = session.metadata.user_id;
const intent = await supabase
  .from("membership_intents")
  .select("*")
  .eq("user_id", userId)
  .eq("status", "paid_pending_verification")
  .single();

await supabase
  .from("membership_intents")
  .update({ status: "active" })
  .eq("id", intent.id);

await supabase
  .from("user_memberships")
  .upsert({...});
\`\`\`

### FASE 4: Actualizar Dashboard
\`\`\`typescript
// Leer SOLO desde membership_intents
const { data } = await supabase
  .from("membership_intents")
  .select("*")
  .eq("user_id", userId)
  .in("status", ["initiated", "paid_pending_verification", "active"])
  .order("created_at", { ascending: false })
  .single();

if (data.status === "paid_pending_verification") {
  return "Pago confirmado - Pendiente verificación";
}
\`\`\`

### FASE 5: Fix Notificaciones
\`\`\`typescript
// auth/callback - AWAIT antes de redirect
await adminNotifications.notifyNewUserRegistration({...});
// LUEGO redirect
return NextResponse.redirect(successUrl);
\`\`\`

### FASE 6: Fix Redirecciones
\`\`\`typescript
// Stripe Identity return_url debe incluir userId correcto
return_url: `${origin}/verification-complete?userId=${userId}`

// verification-complete debe leer userId y hacer polling correcto
const userId = searchParams.get("userId");

// Botón "Activar Membresía" debe ir a verification flow
onClick={() => router.push("/dashboard/membresia/verify")}
\`\`\`

## ORDEN DE IMPLEMENTACIÓN

1. ✅ EJECUTAR SQL MANUALMENTE (crear tabla)
2. ✅ Actualizar auth/callback (await antes de redirect)
3. ✅ Actualizar PaymentFormContent (llamar create-intent)
4. ✅ Actualizar webhook payment_intent.succeeded (actualizar intent + gift card)
5. ✅ Actualizar webhook identity verified (actualizar intent)
6. ✅ Actualizar dashboard (leer desde membership_intents)
7. ✅ Actualizar verification-complete (userId correcto)
8. ✅ Fix botón "Activar Membresía" (redirigir correctamente)

## REGLAS ESTRICTAS

- NO improvisar
- NO asumir
- NO simplificar
- NO cambiar arquitectura
- SEGUIR especificación EXACTAMENTE
- membership_intents es ÚNICO source of truth
- TODOS los flujos deben usar membership_intents
- NINGÚN estado fantasma
- Sistema DETERMINISTA
