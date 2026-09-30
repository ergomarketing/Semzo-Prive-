import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@/app/lib/supabase/server"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

/**
 * ============================================================================
 * COMPRA DIRECTA — Bolso en modo Colecciona (pago único, catálogo)
 * ============================================================================
 * - Solo bolsos con purchase_price definido y status != "colecciona" (aún no vendido).
 * - mode: payment (pago único), no acumula crédito ni pasa por ownership_progress.
 * - Al completarse (webhook), el bolso pasa a status "colecciona" y sale del
 *   inventario de alquiler. Ver app/api/webhooks/stripe/route.tsx (type: "bag_direct_purchase").
 * ============================================================================
 */
export async function POST(req: NextRequest) {
  try {
    const { bagId } = await req.json()

    if (!bagId) {
      return NextResponse.json({ error: "Falta bagId" }, { status: 400 })
    }

    const supabase = await createClient()
    const {
      data: { session },
      error: authError,
    } = await supabase.auth.getSession()

    if (authError || !session) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    const userId = session.user.id

    // El bolso debe estar activo en modo Colecciona (precio de venta definido y aún no vendido)
    const { data: bag, error: bagError } = await supabase
      .from("bags")
      .select("id, name, brand, purchase_price, status, images, image_url")
      .eq("id", bagId)
      .maybeSingle()

    if (bagError || !bag) {
      return NextResponse.json({ error: "Bolso no encontrado" }, { status: 404 })
    }

    if (!bag.purchase_price || Number(bag.purchase_price) <= 0) {
      return NextResponse.json({ error: "Este bolso no tiene precio de venta definido" }, { status: 400 })
    }

    if (bag.status === "colecciona") {
      return NextResponse.json({ error: "Este bolso ya ha sido vendido" }, { status: 409 })
    }

    // La socia debe tener una membresía activa para comprar directamente
    const { data: membership } = await supabase
      .from("user_memberships")
      .select("status")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const eligibleStatuses = ["active", "cancelled_active"]
    if (!membership || !eligibleStatuses.includes(membership.status)) {
      return NextResponse.json(
        { error: "Necesitas una membresía activa para comprar este bolso", code: "MEMBERSHIP_NOT_ELIGIBLE" },
        { status: 403 },
      )
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

    const vercelEnv = process.env.VERCEL_ENV
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (vercelEnv === "production"
        ? "https://semzoprive.com"
        : vercelEnv === "preview" && process.env.VERCEL_URL
          ? `https://${process.env.VERCEL_URL}`
          : "http://localhost:3000")

    const amountCents = Math.round(Number(bag.purchase_price) * 100)
    const productName = `${bag.brand} ${bag.name}`.trim()
    const productImage = bag.images?.[0] || bag.image_url

    const checkoutSession = await stripe.checkout.sessions.create({
      mode: "payment",
      customer: stripeCustomerId,
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "eur",
            product_data: {
              name: productName,
              description: "Compra directa — Colecciona Semzo Privé",
              ...(productImage ? { images: [productImage] } : {}),
            },
            unit_amount: amountCents,
          },
          quantity: 1,
        },
      ],
      metadata: {
        user_id: userId,
        bag_id: bag.id,
        type: "bag_direct_purchase",
      },
      payment_intent_data: {
        metadata: {
          user_id: userId,
          bag_id: bag.id,
          type: "bag_direct_purchase",
        },
      },
      success_url: `${baseUrl}/post-checkout/bag-purchase?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/catalog?canceled=true`,
      billing_address_collection: "auto",
      customer_update: { address: "auto", name: "auto" },
    })

    return NextResponse.json({ sessionId: checkoutSession.id, url: checkoutSession.url })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error creando sesión de pago: " + (error?.message || "Unknown error") },
      { status: 500 },
    )
  }
}
