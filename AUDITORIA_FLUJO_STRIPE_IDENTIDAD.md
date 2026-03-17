# Auditoría técnica: flujo Stripe (pago + verificación de identidad)

Fecha: 2026-03-17

## 1) PaymentIntent

### ¿Se valida el estado (`succeeded`, `requires_action`, `processing`)?

- **Creación de PaymentIntent**: existe en `/api/payments/create-intent` y devuelve `clientSecret` + `paymentIntentId`. Se crea con `automatic_payment_methods.enabled = true`, pero **no hay persistencia del `paymentIntent.id` en `membership_intents` en este endpoint** (solo se devuelve al cliente).【F:app/api/payments/create-intent/route.ts†L222-L265】
- **Reconciliación**: solo acepta `paymentIntent.status === "succeeded"`; cualquier otro estado (`requires_action`, `processing`, etc.) se considera no exitoso y no activa membresía.【F:app/api/membership/reconcile/route.ts†L89-L111】
- **Webhook principal de membresías** (`/api/webhooks/stripe`) **no procesa eventos `payment_intent.*`**; trabaja sobre `checkout.session.completed` e `invoice.payment_succeeded` con `session.payment_status === "paid"`.【F:app/api/webhooks/stripe/route.ts†L72-L107】【F:app/api/webhooks/stripe/route.ts†L277-L285】

**Conclusión**: validación parcial. Se contempla el caso exitoso (`succeeded`/`paid`), pero no hay manejo explícito de estados intermedios de PaymentIntent en el webhook principal.

### ¿Se capturó el pago o solo se autorizó?

- No aparece `capture_method: "manual"` ni uso de `paymentIntents.capture(...)` en los endpoints Stripe revisados.
- El flujo principal usa Checkout + `session.payment_status === "paid"`, lo que indica pago efectivamente cobrado para continuar lógica de negocio.【F:app/api/webhooks/stripe/route.ts†L76-L107】

**Conclusión**: en código no se observa flujo de “solo autorización manual”; el sistema depende de estados de pago cobrado (`paid` / `succeeded`).

---

## 2) Stripe Identity

### `verification_session.status`

- Se crea sesión de Identity con metadatos (`user_id`, `intent_id`, `membership_type`) y se guarda en `identity_verifications` con estado inicial (`pending`).【F:app/api/identity/create-session/route.ts†L101-L127】
- Existe endpoint de consulta que reevalúa estado contra Stripe (`verified`, `requires_input`, `canceled`, `processing`) y sincroniza DB en consecuencia.【F:app/api/identity/check-status/route.ts†L95-L139】

**Conclusión**: sí, el estado de `verification_session.status` se consume y sincroniza.

### ¿Existe webhook `identity.verification_session.verified`?

- Sí. Hay webhook dedicado en `/api/webhooks/stripe-identity` que procesa `identity.verification_session.verified` y actualiza:
  - `membership_intents` (`stripe_verification_session_id`, `verified_at`),
  - `profiles.identity_verified = true`,
  - `identity_verifications.status = verified`.
  【F:app/api/webhooks/stripe-identity/route.ts†L57-L131】
- El webhook principal `/api/webhooks/stripe` delega explícitamente los eventos de identity al webhook dedicado.【F:app/api/webhooks/stripe/route.ts†L432-L439】

**Conclusión**: sí existe y está implementado en ruta separada.

---

## 3) Usuario en DB

### `membership_status`

- Se actualiza en `profiles` desde el webhook de Stripe al completar checkout, en renovaciones y en updates/deletes de suscripción.【F:app/api/webhooks/stripe/route.ts†L164-L170】【F:app/api/webhooks/stripe/route.ts†L348-L354】【F:app/api/webhooks/stripe/route.ts†L420-L426】

### `payment_status`

- **No se observa actualización persistente** de un campo `payment_status` en tablas de usuario/perfil.
- Solo aparece:
  - como condición de Stripe Checkout (`session.payment_status === "paid"`),
  - como valor de respuesta en reconciliación (`payment_status: paymentIntent.status`).
  【F:app/api/webhooks/stripe/route.ts†L76-L107】【F:app/api/membership/reconcile/route.ts†L105-L110】

### `identity_verified`

- Se actualiza en webhook de identity (`profiles.identity_verified = true`).【F:app/api/webhooks/stripe-identity/route.ts†L114-L121】
- También se actualiza vía endpoint de polling (`/api/identity/check-status`) cuando Stripe devuelve `verified` (redundancia útil como fallback).【F:app/api/identity/check-status/route.ts†L95-L104】

---

## 4) Tarea 2 — Revisión CRÍTICA de webhooks solicitados

### Evento `payment_intent.succeeded`

**Estado real:** ❌ **No manejado** en los webhooks activos de membresía.

- En `/api/webhooks/stripe` no hay `case "payment_intent.succeeded"`.
- En `/api/stripe-webhook` tampoco hay `case "payment_intent.succeeded"`.
- Ambos dependen de `checkout.session.completed` e `invoice.payment_succeeded` para avanzar estado de usuario.

**Impacto:** si parte del flujo espera que `payment_intent.succeeded` actualice `membership_intents/profiles`, ese update nunca ocurrirá por webhook.

### Evento `payment_intent.processing`

**Estado real:** ❌ **No manejado**.

- No hay `case "payment_intent.processing"`.
- Tampoco existe persistencia explícita de un `payment_status` de usuario para reflejar “processing”.

**Impacto:** el sistema no tiene visibilidad de estado intermedio en DB de usuario; solo “paid” vía Checkout o “succeeded” en reconciliación.

### Evento `identity.verification_session.verified`

**Estado real:** ✅ **Manejado** en `/api/webhooks/stripe-identity`.

- Construye/verifica firma (`stripe.webhooks.constructEvent`).
- Busca intent por `intent_id` o fallback por `user_id`.
- Actualiza `membership_intents`, `profiles.identity_verified`, `identity_verifications.status`.

**Riesgo de fallo silencioso detectado:**
- `POST` responde 200 inmediatamente y procesa async (`processWebhookAsync(...).catch(() => {})`), por lo que errores pueden no reflejarse en respuesta HTTP a Stripe.
- Si no hay `intent_id` y tampoco `user_id` en metadata: hace `break` sin error explícito.

### Evento `identity.verification_session.requires_input`

**Estado real:** ✅ **Manejado** en `/api/webhooks/stripe-identity`.

- Marca `identity_verifications.status = rejected` y guarda `last_error`.
- Crea `admin_notifications` cuando hay `session.metadata.user_id`.

**Riesgo de fallo silencioso detectado:**
- Si falta `session.metadata.user_id`, no crea notificación de admin.
- Si no existe fila en `identity_verifications` para ese `stripe_verification_id`, el `update` puede afectar 0 filas sin alertar.

---

## 5) Tarea 3 — Detección del fallo exacto

### ❓ ¿Se creó el usuario antes del pago?

**Sí, en el flujo principal debería existir usuario autenticado antes de crear checkout**:
- `/api/stripe/create-subscription-checkout` exige `supabase.auth.getUser()`; si no hay usuario retorna 401.
- `/api/stripe/create-payment-checkout` exige sesión (`getSession`) y si no, retorna 401.

**Fallo probable no es “usuario inexistente”, sino “mapeo posterior del evento”.**

### ❓ ¿Se pierde el `user_id` entre pasos?

**Sí, puede perderse en escenarios concretos**:
- Varios puntos dependen de `metadata.user_id` (subscription/session/identity).
- `syncMembershipFromStripe` falla directamente si `subscription.metadata.user_id` no está.
- En webhook identity, si faltan `intent_id` y `user_id`, el evento se ignora (`break`).

**Este es un fallo raíz probable.**

### ❓ ¿Stripe redirect rompe la sesión?

**Sí, es plausible y hay síntomas de fallback ya implementado**:
- `post-checkout` redirige cliente y reintenta hasta 10 veces contra `/api/stripe/verify-session`.
- si no converge, envía a `/dashboard/membresia/status`.
- `verify-session` no usa sesión auth del usuario; depende de metadata Stripe + DB. Si metadata está incompleta, retorna `incomplete`.

**Conclusión:** el redirect no necesariamente “rompe” la membresía, pero sí puede romper continuidad UX/autenticación y dejar el usuario en estado “pendiente” hasta reconciliar manualmente.

### ❓ ¿Falta metadata en Stripe para mapear usuario?

**Sí, es el riesgo más crítico identificado.**

- Todo el pipeline usa metadata (`user_id`, `intent_id`, `membership_type`) para correlación.
- Si metadata no viaja en un objeto/evento concreto, los webhooks no tienen una ruta robusta alternativa en todos los casos.
- Aunque hay fallback a `customer.metadata.supabase_user_id` en un punto del webhook de checkout, no existe fallback equivalente en todos los eventos (especialmente payment_intent.* que ni se manejan).

---

## Hallazgos clave (riesgo)

1. **Ruta legacy duplicada**: coexisten dos webhooks de Stripe (`/api/webhooks/stripe` y `/api/stripe-webhook`) con lógica superpuesta para `checkout.session.completed`/`invoice.payment_succeeded`, lo que aumenta riesgo de divergencia operacional si se configura endpoint equivocado en Stripe.【F:app/api/webhooks/stripe/route.ts†L72-L107】【F:app/api/stripe-webhook/route.ts†L46-L76】
2. **`payment_status` de usuario no persistido**: no hay rastro de persistencia de un campo homogéneo `payment_status` para perfil/usuario; la fuente actual es evento Stripe + `payment_history` para histórico.
3. **Estado intermedio de PaymentIntent**: flujo de activación no usa eventos `payment_intent.*`; depende de Checkout `paid` y reconciliación con `succeeded`.
4. **Posible fallo silencioso en identity webhook**: procesamiento async con `catch` vacío en capa superior, y `break` cuando metadata no alcanza para correlacionar.

## Veredicto resumido contra checklist solicitado

- PaymentIntent estado (`succeeded`, `requires_action`, `processing`): **Parcial** (fuerte para `succeeded`; no orquestación explícita para `requires_action/processing` en webhook principal).
- ¿Capturado o autorizado?: **Capturado/cobrado** en flujo operativo observado (`paid` / `succeeded`), sin captura manual explícita.
- Stripe Identity `verification_session.status`: **Sí**.
- Webhook `identity.verification_session.verified`: **Sí**.
- Webhook `identity.verification_session.requires_input`: **Sí**.
- Webhook `payment_intent.succeeded`: **No manejado**.
- Webhook `payment_intent.processing`: **No manejado**.
- DB `membership_status`: **Sí** (actualizado).
- DB `payment_status`: **No evidenciado como campo persistente de usuario**.
- DB `identity_verified`: **Sí** (actualizado).

---

## 6) Tarea 5 — ¿Necesitas implementar `POST /resume-onboarding`?

**Respuesta corta: Sí, recomendable (alta prioridad UX/operación).**

### Por qué sí

Actualmente la lógica está fragmentada entre varios pasos/endpoint:
- `post-checkout` hace polling de `/api/stripe/verify-session` y decide redirección/lanzar identity en cliente.
- `/api/identity/create-session` relanza la verificación.
- `/api/membership/reconcile` intenta convergencia final.

Esta fragmentación hace más probable quedar en estados grises cuando falla metadata, hay latencia de webhook o el usuario pierde sesión al volver del redirect.

### Qué debe resolver `POST /resume-onboarding`

1. **Consultar estado real en Stripe** (fuente de verdad):
   - PaymentIntent / Checkout Session / Subscription según `intent_id`/`session_id` disponibles.
2. **Si pago OK + identity pendiente** → devolver acción `launch_identity` con URL de nueva/reutilizada `verification_session`.
3. **Si todo OK** → ejecutar activación idempotente (reconciliar + activar membresía) y devolver `active`.
4. **Si pago incompleto** → devolver acción `resume_checkout` con URL de checkout.

### Beneficio principal

Tener un único endpoint transaccional de “reanudar onboarding” reduce:
- dependencia de timing de webhooks,
- ambigüedad del estado en frontend,
- fallos silenciosos por pérdida de contexto entre redirecciones.

### Veredicto operativo

**Sí, deberías implementarlo.** No porque hoy no exista ninguna pieza (sí existen), sino porque hoy están dispersas y no garantizan una reanudación robusta en un solo punto.
