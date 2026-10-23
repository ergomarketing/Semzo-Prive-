# Plan: Klarna en el pago final de Colecciona (solo plan, sin código)

Estado: borrador para revisión. No se implementa nada hasta que (1) se confirme en Stripe que Klarna
está disponible y con qué límites y comisión, y (2) se apruebe este plan.

## 1. Alcance

- Klarna SOLO para pagar el importe final de la compra del bolso en Colecciona
  (`precio - crédito acumulado`). No para membresías ni cuotas mensuales.
- Las suscripciones no cambian.
- El pago con tarjeta guardada actual (`/api/user/ownership/complete`, off-session) se mantiene.
  La socia elige método al finalizar: tarjeta guardada o Klarna.

## 2. Puerta previa: comprobación en Stripe (la haces tú)

Si no se cumple, no se construye nada.

| Qué comprobar | Dónde | Criterio para seguir |
|---|---|---|
| Klarna activo en la cuenta | Ajustes > Métodos de pago | Activo en modo test y live |
| Límites en EUR para ES | Misma pantalla / docs de Stripe | Anotar mínimo y máximo de cada opción |
| Comisión | Precios de Stripe para Klarna | Anotar % + fijo; decidir si se asume o se repercute |
| Qué ofrece Klarna con 1.500 € o más | Prueba en modo test con importes de ejemplo | Ver si hay financiación real o solo "pagar ahora" |

Dato de partida, a confirmar (documentación de Stripe, EUR): Pay in full 0-10.000 €, Pay later 0-500 €,
Pay in 3 1-1.500 €. Con un bolso de 4.500 € la financiación en 3 plazos solo aparecería si, tras el crédito,
quedan 1.500 € o menos por pagar. Si para los importes habituales Klarna solo ofrece "pagar ahora", la
funcionalidad no cumple su objetivo (que Klarna financie) y no merece la pena. En ese caso se replantea
la alternativa.

## 3. Flujo propuesto

1. La socia pulsa "Finalizar compra" y elige Klarna. Acepta las condiciones (checkbox actual).
2. `POST /api/user/ownership/complete/klarna` (ruta nueva), en este orden:
   1. Valida sesión, `accepted_terms === true` y progreso `collect` `active` (como hoy).
   2. Recalcula el importe en servidor (`getAmountDue`) y exige que coincida con `expected_amount` (como hoy).
   3. Guarda la aceptación en `legal_acceptances` con `recordLegalAcceptance` (mismo texto y versión
      `COLECCIONA_PURCHASE_*`). Si falla, se aborta antes de tocar Stripe.
   4. Solo entonces crea la Checkout Session (`mode: "payment"`, `currency: "eur"`,
      `payment_method_types: ["klarna"]`, `customer` de la socia, `expires_at` corto de 30 min) con:
      `line_items` por el importe calculado en servidor (nunca el que manda el cliente) y
      `metadata` y `payment_intent_data.metadata`:
      `type: "colecciona_completion"`, `user_id`, `ownership_progress_id`, `bag_id`,
      `legal_acceptance_id`, `amount_cents`.
   5. Guarda en el progreso el `checkout_session_id` pendiente y devuelve la URL de Stripe.
3. La socia paga en Klarna y vuelve a `/ownership/complete?session_id=...`.
   Esa página NO cierra nada: muestra "pago en proceso" y consulta el estado con SWR hasta que el
   progreso pase a `completed` (el webhook puede llegar después de la redirección, o no llegar a
   verse si la socia cierra el navegador).
4. El webhook cierra la compra (sección 4).

Una sola sesión pendiente por progreso: si ya existe una abierta y vigente, se devuelve su URL en lugar
de crear otra. Esto sustituye al antiguo freno de 30 s contra doble clic en este camino.

## 3.1 Evitar el doble pago

- Al pagar con tarjeta por `/complete` se expira la sesión Klarna abierta
  (`stripe.checkout.sessions.expire`) antes de cobrar.
- Al crear la sesión Klarna se rechaza si hay un cobro con tarjeta en curso.
- Si aun así llegan dos pagos para el mismo progreso, el segundo NO cierra nada, se registra y se avisa
  al admin para reembolsar (sección 4, paso 7).

## 4. Cierre desde el webhook (condiciones aprobadas)

Archivo: `app/api/webhooks/stripe/route.tsx`. Se añade una rama nueva a `checkout.session.completed`
para `metadata.type === "colecciona_completion"`, y la misma lógica a
`checkout.session.async_payment_succeeded` por si Klarna confirma de forma asíncrona (a comprobar en
Stripe). `async_payment_failed` deja el progreso `active` y avisa a la socia.

Toda la lógica va en una función única `closeCollectPurchase(...)` en `lib/`, para que sea testeable.
Pasos, en este orden, y si cualquiera falla NO se cierra:

1. `payment_status === "paid"`, `mode === "payment"`, `currency === "eur"`.
2. Metadatos completos (`user_id`, `ownership_progress_id`, `legal_acceptance_id`).
3. Aceptación: existe la fila en `legal_acceptances` con ese id, mismo `user_id`,
   `context = "colecciona_purchase"` y `reference_id = ownership_progress_id`.
4. Progreso: existe, es del mismo `user_id`, `mode = "collect"` y `status = "active"`.
5. Importe, vuelto a calcular al cerrar: `getAmountDue(accumulated, purchase_price)` del progreso ACTUAL
   debe coincidir con `session.amount_total` (tolerancia 1 céntimo). Además `amount_total` debe coincidir
   con `metadata.amount_cents`.
6. Cierre idempotente a nivel de datos: `UPDATE ownership_progress SET status='completed',
   accumulated=purchase_price, completed_at=now(), completed_payment_intent_id=... WHERE id=... AND
   status='active' RETURNING id`. Solo si devuelve fila se envían emails y se hacen efectos secundarios.
   Un evento repetido o un reintento no cierra dos veces.
7. Si falla el paso 4 o el 5 con el pago ya cobrado (por ejemplo entró una cuota mensual mientras la
   socia pagaba y el importe adeudado bajó): no se cierra, se registra el motivo y se avisa al admin
   para decidir reembolso total o parcial. No se reembolsa de forma automática.

Idempotencia, en capas:
- Nivel evento: ya existe `stripe_processed_events` (se inserta el id antes de procesar).
- Nivel dato: el `UPDATE ... WHERE status='active'` del paso 6, más un índice único parcial sobre
  `completed_payment_intent_id` para que un mismo pago no cierre dos progresos.
- Riesgo a revisar al implementar: el webhook inserta el evento ANTES de procesarlo. Si el cierre lanza
  una excepción después, Stripe reintenta pero el evento ya consta como procesado y se descarta. Para esta
  rama hay que decidir si se borra el registro del evento al fallar, o se confía en una conciliación
  (ver sección 6).

Regla de negocio: se respeta "solo se pasa a `completed` con aceptación y pago real". Ya no es solo
`/ownership/complete`: también lo hace el webhook, pero únicamente si pasan los pasos 1 a 5.

## 5. Cambios previstos (para el PR de implementación)

- SQL (`/scripts`, dry-run, RLS activado): columnas en `ownership_progress`:
  `checkout_session_id`, `completed_payment_intent_id`, `completed_via` (`card` | `klarna`);
  índice único parcial sobre `completed_payment_intent_id`. Confirmar nombres con el esquema real antes.
- `lib/ownership-collect-close.ts`: `closeCollectPurchase` (sección 4).
- `app/api/user/ownership/complete/klarna/route.ts`: crea la Checkout Session (sección 3).
- `app/api/user/ownership/complete/route.ts`: reutiliza `closeCollectPurchase` para el cierre por
  tarjeta y expira la sesión Klarna pendiente.
- `app/api/webhooks/stripe/route.tsx`: rama nueva de la sección 4.
- UI: selector de método de pago en el diálogo de finalizar compra, y estado "pago en proceso" en
  `/ownership/complete`.
- Email de compra completada: se envía desde `closeCollectPurchase`, no desde la ruta.

## 6. Pruebas antes de fusionar (modo test de Stripe)

1. Pago Klarna correcto: el progreso pasa a `completed`, llega un solo email y queda `legal_acceptance_id`
   en los metadatos.
2. Reenviar el mismo evento (`stripe events resend`): sin segundo cierre ni segundo email.
3. Cerrar el navegador tras pagar: el webhook cierra igualmente.
4. Sesión caducada o pago rechazado: el progreso sigue `active`.
5. Sin fila en `legal_acceptances`, con `user_id` distinto o con `amount_total` manipulado: no cierra.
6. Importe cambiado entre crear la sesión y el pago (entra una cuota): no cierra y avisa al admin.
7. Pago por tarjeta y Klarna a la vez: solo uno cierra; el otro queda para reembolso.
8. Importes límite según lo medido en la sección 2 (por debajo y por encima del máximo de Klarna).
9. Conciliación: consulta que lista progresos `active` con sesión Klarna pagada, para detectar eventos
   perdidos.

## 7. Pregunta: ¿`startCollectProgress` debe exigir membresía activa?

Recomendación: sí. Va en un PR pequeño propio, antes del de Klarna, y dentro de `startCollectProgress`
(no en las rutas), porque es la función única para empezar Colecciona.

Motivos:
- El crédito de Colecciona sale de las facturas pagadas de la suscripción. Sin suscripción,
  `previewRentalConversion` no devuelve nada y la socia entra con 0 € de crédito.
- `/ownership/complete` solo cobra si hay una membresía en `active`, `cancelled_active` o `past_due`
  (`user_memberships.stripe_customer_id`). Hoy una socia sin membresía puede empezar Colecciona y quedar
  bloqueada al pagar con "Sin método de pago".
- `/api/user/ownership-progress` (POST `mode='collect'`) no comprueba membresía hoy.
- Es coherente con el modelo: Colecciona significa seguir con la membresía mientras se compra el bolso.

Regla propuesta, si estás de acuerdo:
- Permitir `active` y `cancelled_active` (todavía dentro del periodo pagado).
- Rechazar `past_due`, `paused`, `limited_access` y `no_membership` con 403 y `code: "membership_required"`.
- No restringir por tipo de membresía (Petite, L'Essentiel, Signature, Privé), salvo que el negocio lo pida.
- Las socias con un progreso Colecciona ya activo (como María Alba) no se ven afectadas: el chequeo solo
  actúa al crear.

Decisiones tuyas pendientes:
1. ¿`cancelled_active` puede empezar Colecciona? Lo he dejado permitido; tendría solo el periodo restante.
2. Qué pasa con un Colecciona `active` cuando la membresía se cancela o expira: seguir `active` sin
   acumular más (propuesta) o cancelarlo. No lo toco en este plan.
3. ¿Se restringe por tipo de membresía? Propuesta: no.
