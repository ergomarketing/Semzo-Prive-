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

    // gift_cards.amount esta en EUROS — convertir amountCents a euros
    const amountEuros = amountCents / 100

    // Verificar gift card
    const { data: giftCard } = await supabase
      .from("gift_cards")
      .select("id, amount, status, code")
      .eq("id", giftCardId)
      .single()

    if (!giftCard || giftCard.status !== "active") {
      return NextResponse.json({ error: "Gift card no válida o ya usada" }, { status: 400 })
    }

    if (giftCard.amount < amountEuros) {
      return NextResponse.json({ error: "Saldo insuficiente en gift card" }, { status: 400 })
    }

    // Consumir gift card via RPC atomico (firma: p_gift_card_id, p_amount en EUROS)
    const { data: rpcResult, error: rpcError } = await supabase.rpc("consume_gift_card_atomic", {
      p_gift_card_id: giftCardId,
      p_amount: amountEuros,
    })

    if (rpcError || !rpcResult?.success) {
      return NextResponse.json({ error: "Error procesando gift card: " + rpcError?.message }, { status: 500 })
    }

    // Gift card cubre el 100% — activar user_memberships directamente (no pasa por Stripe)
    const now = new Date().toISOString()
    const periodEnd = new Date()
    periodEnd.setMonth(periodEnd.getMonth() + 1)

    const { error: membershipError } = await supabase
      .from("user_memberships")
      .upsert(
        {
          user_id: userId,
          membership_type: membershipType || "essentiel",
          status: "active",
          start_date: now,
          end_date: periodEnd.toISOString(),
          updated_at: now,
        },
        { onConflict: "user_id" }
      )

    if (membershipError) {
      return NextResponse.json({ error: "Gift card consumida pero error al activar membresía: " + membershipError.message }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: "Gift card consumida y membresía activada correctamente.",
    })
  } catch (error: any) {
    return NextResponse.json({ error: "Error interno: " + (error.message || "desconocido") }, { status: 500 })
  }
}
