/**
 * Crea/asegura el descuento de bienvenida PRIVE50:
 *  - Coupon: 50% off, duration "once" (solo primera factura).
 *  - Promotion Code "PRIVE50" con restrictions.first_time_transaction = true
 *    => Stripe SOLO lo acepta para clientas sin ningun pago previo.
 *       Esto impone de forma nativa "una sola vez, solo primera suscripcion".
 *
 * Idempotente: si ya existen, los reutiliza (no duplica).
 *
 * Uso:
 *   node --env-file-if-exists=/vercel/share/.env.project scripts/setup-prive50-promo.mjs
 */
import Stripe from "stripe"

const key = process.env.STRIPE_SECRET_KEY
if (!key) {
  console.error("[setup] Falta STRIPE_SECRET_KEY")
  process.exit(1)
}

const stripe = new Stripe(key, { apiVersion: "2024-12-18.acacia" })

const PROMO_CODE = "PRIVE50"
const COUPON_NAME = "Bienvenida 50% primera mensualidad"

async function main() {
  // 1. Buscar promotion code existente (activo o no)
  const existingPromos = await stripe.promotionCodes.list({ code: PROMO_CODE, limit: 1 })
  if (existingPromos.data.length > 0) {
    const p = existingPromos.data[0]
    console.log("[setup] Promotion Code ya existe:", {
      id: p.id,
      code: p.code,
      coupon: p.coupon.id,
      first_time_transaction: p.restrictions?.first_time_transaction,
      active: p.active,
    })
    return
  }

  // 2. Reutilizar coupon 50% once si existe, si no crearlo
  const coupons = await stripe.coupons.list({ limit: 100 })
  let coupon = coupons.data.find(
    (c) => c.percent_off === 50 && c.duration === "once" && c.valid,
  )

  if (!coupon) {
    coupon = await stripe.coupons.create({
      percent_off: 50,
      duration: "once",
      name: COUPON_NAME,
      metadata: { purpose: "welcome_first_subscription" },
    })
    console.log("[setup] Coupon creado:", coupon.id)
  } else {
    console.log("[setup] Coupon reutilizado:", coupon.id)
  }

  // 3. Crear promotion code con restriccion nativa
  const promo = await stripe.promotionCodes.create({
    coupon: coupon.id,
    code: PROMO_CODE,
    restrictions: { first_time_transaction: true },
    metadata: { purpose: "welcome_first_subscription" },
  })

  console.log("[setup] Promotion Code creado:", {
    id: promo.id,
    code: promo.code,
    coupon: coupon.id,
    first_time_transaction: promo.restrictions.first_time_transaction,
  })
}

main().catch((e) => {
  console.error("[setup] Error:", e?.message || e)
  process.exit(1)
})
