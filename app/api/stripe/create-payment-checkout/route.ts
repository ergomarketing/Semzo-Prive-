import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/app/lib/supabase/server"
import { canCreateReservations } from "@/lib/membership-state-mapper"
import { getNextBagState, nextBagBlockMessage } from "@/lib/next-bag-queue"
import { getServiceClient } from "@/lib/supabase-service"

export const dynamic = "force-dynamic"

// Precios oficiales de los pases en Stripe (fuente de verdad). El importe NO lo decide el navegador.
const PASS_PRICE_IDS: Record<string, string> = {
  essentiel: "price_1SxPZoKBSKEgBoTngB9BgrSI", // 52 EUR
  signature: "price_1SxPbgKBSKEgBoTn0FSyrfah", // 99 EUR
  prive: "price_1SxPcqKBSKEgBoTngpQRUR8B", // 137 EUR
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

/**
 * ============================================================================
 * FLUJO VALIDADO — NO MODIFICAR SIN CONSULTAR
 * ============================================================================
 * PASO 6 (variante): CHECKOUT DE PAGO UNICO (bag-pass / pagos no recurrentes)
 *
 * - mode: payment (no subscription)
 * - payment_method_types: ["card"] (sepa_debit solo es valido en subscription)
 * - success_url = {baseUrl}/post-checkout?session_id={CHECKOUT_SESSION_ID}
 *
 * baseUrl: usar dominio de produccion, nunca VERCEL_URL (pide login de Vercel).
 * ============================================================================
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amountCents, productName, intentId, bagId } = body
    // Modo elegido en el catalogo para este bolso. Solo 'collect' se transporta: el webhook
    // registra el Colecciona cuando crea la reserva del pase (Descubre es el modo por defecto).
    const ownershipMode: "collect" | undefined = body.ownershipMode === "collect" ? "collect" : undefined
    // Acepta gift_card_id (snake_case desde CartClient) o giftCardId (legacy camelCase)
    const giftCardId: string | undefined = body.gift_card_id || body.giftCardId
    // giftCardAmountEuros: cuánto cubre la gift card (en euros, del CartClient)
    const giftCardAmountEuros: number | undefined = body.giftCardAmountEuros

    if (!amountCents || !productName || !intentId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: amountCents, productName, intentId" },
        { status: 400 }
      )
    }

    if (amountCents < 50) {
      return NextResponse.json({ error: "El importe mínimo es 0.50€" }, { status: 400 })
    }

    // Autenticacion: mismo patron que create-subscription-checkout
    const supabase = await createClient()
    const db = getServiceClient()
    const { data: { session }, error: authError } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    const userId = session.user.id

    // ========================================================================
    // VALIDACION: 1 bolso a la vez para socias Petite
    // Bloquea la compra de un nuevo Pase Bolso Prive si la socia ya tiene:
    //  - Una reserva en curso (bolso en posesion / pendiente de devolucion), o
    //  - Un pase comprado pendiente de uso (status = available)
    // Solo aplica cuando el checkout es de tipo bag_pass (presencia de bagId).
    // ========================================================================
    if (bagId) {
      // 0) GATE DE ELIGIBILIDAD: morosa (past_due/unpaid), expirada, pausada.
      const { data: membershipGate } = await supabase
        .from("user_memberships")
        .select("status, end_date, can_make_reservations")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle()

      const eligibility = canCreateReservations({
        status: membershipGate?.status,
        can_make_reservations: (membershipGate as any)?.can_make_reservations,
        end_date: membershipGate?.end_date,
      })

      if (!eligibility.allowed) {
        const reasonMessages: Record<string, string> = {
          status_past_due: "Tienes un pago pendiente. Regulariza tu membresía para poder reservar.",
          status_unpaid: "Tienes un pago pendiente. Regulariza tu membresía para poder reservar.",
          status_paused: "Tu membresía está pausada. Reactivala para reservar.",
          status_expired: "Tu membresía expiró. Renueva para seguir reservando.",
          end_date_passed: "Tu membresía expiró. Renueva para seguir reservando.",
          can_make_reservations_false: "Tu membresía no permite reservar en este momento.",
          no_membership: "Necesitas una membresía activa para reservar.",
        }
        return NextResponse.json(
          {
            error: reasonMessages[eligibility.reason || ""] || "Tu membresía no permite reservar.",
            code: "MEMBERSHIP_NOT_ELIGIBLE",
            reason: eligibility.reason,
          },
          { status: 403 }
        )
      }

      // 1) Con un bolso en curso solo se puede comprar el pase de su "proximo bolso" (ultimos 7 dias del ciclo).
      const nextBag = await getNextBagState(supabase, userId)
      if ((nextBag.hasBagInHand && !nextBag.canQueue) || nextBag.queued) {
        return NextResponse.json(
          {
            error: nextBag.hasBagInHand
              ? nextBagBlockMessage(nextBag)
              : `Ya tienes tu próximo bolso reservado (${nextBag.queued?.bagLabel}).`,
            code: "ACTIVE_RESERVATION",
            reason: nextBag.reason,
            nextBagWindowOpensAt: nextBag.windowOpensAt,
          },
          { status: 409 }
        )
      }

      // 2) Pases comprados sin usar
      const { data: pendingPasses, error: passError } = await supabase
        .from("bag_passes")
        .select("id, status")
        .eq("user_id", userId)
        .eq("status", "available")

      if (passError) {
        console.error("[v0][create-payment-checkout] error bag_passes:", passError)
      }

      if (pendingPasses && pendingPasses.length > 0) {
        return NextResponse.json(
          {
            error:
              "Ya tienes un Pase Bolso Prive disponible. Reservalo con un bolso antes de comprar otro pase.",
            code: "AVAILABLE_PASS",
          },
          { status: 409 }
        )
      }
    }

    // Obtener o crear customer de Stripe
    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_customer_id, full_name, email")
      .eq("id", userId)
      .single()

    let stripeCustomerId = profile?.stripe_customer_id

    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: profile?.email || undefined,
        name: profile?.full_name || undefined,
        metadata: { supabase_user_id: userId },
      })
      stripeCustomerId = customer.id
      await supabase.from("profiles").update({ stripe_customer_id: stripeCustomerId }).eq("id", userId)
    }

    // IMPORTANTE: evitar VERCEL_URL en produccion (URL *.vercel.app pide login de Vercel).
    const vercelEnv = process.env.VERCEL_ENV
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (vercelEnv === "production"
        ? "https://semzoprive.com"
        : vercelEnv === "preview" && process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000")

    // PRECIO EN SERVIDOR: el pase vale lo que dice Stripe para su categoria (la del bolso). Con gift card parcial el importe
    // puede bajar, pero solo por el saldo REAL de la gift card en BD; nunca por debajo.
    let passTier: string | null = null
    if (bagId) {
      const { data: bagRow } = await db.from("bags").select("membership_type").eq("id", bagId).maybeSingle()
      const t = String(bagRow?.membership_type || "").toLowerCase().replace(/^l'/, "")
      passTier = PASS_PRICE_IDS[t] ? t : null
    }
    const priceIds = passTier ? [PASS_PRICE_IDS[passTier]] : Object.values(PASS_PRICE_IDS)
    const prices = await Promise.all(priceIds.map((id) => stripe.prices.retrieve(id)))
    const passPriceCents = Math.min(...prices.map((pr) => pr.unit_amount || 0))
    // Cupon: se vuelve a leer en Stripe (el navegador solo manda su id); solo cuenta si sigue siendo valido.
    let couponOffCents = 0
    const couponId: string | undefined = body.coupon?.code
    if (couponId && typeof couponId === "string") {
      try {
        const cp = await stripe.coupons.retrieve(couponId)
        if (cp.valid) {
          couponOffCents = cp.percent_off
            ? Math.round((passPriceCents * cp.percent_off) / 100)
            : cp.currency === "eur"
              ? cp.amount_off || 0
              : 0
        }
      } catch {
        couponOffCents = 0
      }
    }
    const afterCouponCents = Math.max(0, passPriceCents - couponOffCents)
    let validatedGiftCents = 0
    if (giftCardId && giftCardAmountEuros) {
      const { data: gcCheck } = await db.from("gift_cards").select("amount, status").eq("id", giftCardId).maybeSingle()
      if (gcCheck && gcCheck.status === "active") {
        validatedGiftCents = Math.min(Math.round(giftCardAmountEuros * 100), gcCheck.amount || 0, afterCouponCents)
      }
    }
    const minAllowedCents = Math.max(50, afterCouponCents - validatedGiftCents - 1) // -1: redondeo de centimos
    if (!passPriceCents || amountCents < minAllowedCents || amountCents > Math.max(...prices.map((pr) => pr.unit_amount || 0))) {
      console.error("[create-payment-checkout] importe no valido", { amountCents, minAllowedCents, passTier, userId })
      return NextResponse.json({ error: "Importe no válido para este pase" }, { status: 400 })
    }

    // Persistir cuánto cubre la gift card en membership_intents ANTES de Stripe.
    // El webhook lo leerá de aquí como fuente de verdad para consumirla.
    // PROTECCIÓN: verificar el saldo real de la GC en BD y usar Math.min para
    // garantizar que nunca se descuenta más del precio del artículo NI más del
    // saldo disponible de la GC. Esto evita descuentos incorrectos aunque el
    // frontend envíe un valor erróneo.
    if (giftCardId && giftCardAmountEuros && intentId) {
      // Saldo real de la GC directamente desde BD (fuente de verdad)
      const { data: gcRow } = await db
        .from("gift_cards")
        .select("amount")
        .eq("id", giftCardId)
        .maybeSingle()

      const gcBalanceCents = gcRow?.amount ?? 0
      const requestedCents = Math.round(giftCardAmountEuros * 100)
      // Nunca descontar más que: el saldo real de la GC Y el precio del artículo
      const giftCardAppliedCents = Math.min(requestedCents, gcBalanceCents, amountCents)

      if (giftCardAppliedCents > 0) {
        await supabase
          .from("membership_intents")
          .update({ gift_card_applied_cents: giftCardAppliedCents })
          .eq("id", intentId)
      }
    }

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: stripeCustomerId,
      payment_method_types: ["card"],  // sepa_debit solo es válido en mode: subscription
      line_items:
        passTier && amountCents === passPriceCents
          ? [{ price: PASS_PRICE_IDS[passTier], quantity: 1 }] // pase completo: queda enlazado al producto de Stripe
          : [
              {
                price_data: {
                  currency: "eur",
                  product_data: {
                    name: productName,
                    description: "Acceso semanal a un bolso de lujo",
                  },
                  unit_amount: amountCents,
                },
                quantity: 1,
              },
            ],
      metadata: {
        intent_id: intentId,
        user_id: userId,
        ...(giftCardId ? { gift_card_id: giftCardId } : {}),
        ...(bagId ? { bag_id: bagId, type: "bag_pass" } : {}),
        ...(bagId && ownershipMode ? { ownership_mode: ownershipMode } : {}),
      },
      payment_intent_data: {
        metadata: {
          intent_id: intentId,
          user_id: userId,
          ...(giftCardId ? { gift_card_id: giftCardId } : {}),
          ...(bagId ? { bag_id: bagId, type: "bag_pass" } : {}),
          ...(bagId && ownershipMode ? { ownership_mode: ownershipMode } : {}),
        },
      },
      success_url: `${baseUrl}/post-checkout?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/cart?canceled=true`,
      billing_address_collection: "auto",
      customer_update: { address: "auto", name: "auto" },
    })

    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error creando sesión de pago: " + (error?.message || "Unknown error") },
      { status: 500 }
    )
  }
}
