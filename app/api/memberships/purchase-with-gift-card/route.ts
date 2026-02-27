import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-06-20" })

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, giftCardId, amountCents, membershipType, billingCycle, stripeCustomerId, stripePriceId } = body

    if (!userId) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    if (!giftCardId || !amountCents) {
      return NextResponse.json({ error: "Gift card y monto requeridos" }, { status: 400 })
    }

    // Idempotency: verificar si ya fue consumida
    const { data: giftCard } = await supabase
      .from("gift_cards")
      .select("id, amount, status, code")
      .eq("id", giftCardId)
      .single()

    if (!giftCard || giftCard.status !== "active") {
      return NextResponse.json({ error: "Gift card no válida o ya usada" }, { status: 400 })
    }

    if (giftCard.amount < amountCents) {
      return NextResponse.json({ error: "Saldo insuficiente en gift card" }, { status: 400 })
    }

    // Consumir gift card via RPC atomico
    const { data: rpcResult, error: rpcError } = await supabase.rpc("consume_gift_card_atomic", {
      p_gift_card_id: giftCardId,
      p_membership_intent_id: null,
      p_amount: amountCents,
    })

    if (rpcError || !rpcResult?.success) {
      return NextResponse.json({ error: "Error procesando gift card: " + rpcError?.message }, { status: 500 })
    }

    // Crear suscripcion en Stripe — el webhook se encargara de activar user_memberships
    if (stripePriceId && stripeCustomerId) {
      await stripe.subscriptions.create({
        customer: stripeCustomerId,
        items: [{ price: stripePriceId }],
        metadata: {
          user_id: userId,
          membership_type: membershipType,
          billing_cycle: billingCycle || "monthly",
          gift_card_id: giftCardId,
          service: "luxury_rental",
        },
      })
    }

    return NextResponse.json({
      success: true,
      message: "Gift card consumida. Suscripcion creada en Stripe.",
    })
  } catch (error: any) {
    return NextResponse.json({ error: "Error interno: " + (error.message || "desconocido") }, { status: 500 })
  }
}
