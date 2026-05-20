import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/app/lib/supabase/server"

export const dynamic = "force-dynamic"

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
    // Acepta gift_card_id (snake_case desde CartClient) o giftCardId (legacy camelCase)
    const giftCardId: string | undefined = body.gift_card_id || body.giftCardId

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
      // 1) Reservas activas del usuario
      const { data: activeReservations, error: resError } = await supabase
        .from("reservations")
        .select("id, status")
        .eq("user_id", userId)
        .in("status", ["active", "in_progress", "pending", "shipped", "delivered"])

      if (resError) {
        console.error("[v0][create-payment-checkout] error reservations:", resError)
      }

      if (activeReservations && activeReservations.length > 0) {
        return NextResponse.json(
          {
            error:
              "Ya tienes un bolso en curso. Devuelvelo antes de reservar otro pase.",
            code: "ACTIVE_RESERVATION",
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
              "Ya tienes un pase comprado sin usar. Usalo antes de comprar otro.",
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

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: stripeCustomerId,
      payment_method_types: ["card"],  // sepa_debit solo es válido en mode: subscription
      line_items: [
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
      },
      payment_intent_data: {
        metadata: {
          intent_id: intentId,
          user_id: userId,
          ...(giftCardId ? { gift_card_id: giftCardId } : {}),
          ...(bagId ? { bag_id: bagId, type: "bag_pass" } : {}),
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
