import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/app/lib/supabase/server"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { amountCents, productName, intentId } = body
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
      metadata: { intent_id: intentId, user_id: userId, ...(giftCardId ? { gift_card_id: giftCardId } : {}) },
      payment_intent_data: { metadata: { intent_id: intentId, user_id: userId, ...(giftCardId ? { gift_card_id: giftCardId } : {}) } },
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
