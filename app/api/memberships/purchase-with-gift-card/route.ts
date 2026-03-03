import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      giftCardId,
      amountCents,
      membershipType,
      billingCycle,
    } = body

    if (!userId)
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })

    if (!giftCardId || !amountCents)
      return NextResponse.json({ error: "Gift card y monto requeridos" }, { status: 400 })

    // Verificar perfil
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("id", userId)
      .single()

    if (!profile)
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 400 })

    // Obtener gift card
    const { data: giftCard } = await supabase
      .from("gift_cards")
      .select("id, amount, status")
      .eq("id", giftCardId)
      .single()

    if (!giftCard || giftCard.status !== "active")
      return NextResponse.json({ error: "Gift card inválida o usada" }, { status: 400 })

    // amount en DB está en EUROS
    if (Math.round(giftCard.amount * 100) < amountCents)
      return NextResponse.json({ error: "Saldo insuficiente" }, { status: 400 })

    // Consumir gift card (firma correcta SIN membership_intent)
    const { data: rpcResult, error: rpcError } = await supabase.rpc(
      "consume_gift_card_atomic",
      {
        p_gift_card_id: giftCardId,
        p_amount: amountCents,
      }
    )

    if (rpcError || !rpcResult?.success)
      return NextResponse.json(
        { error: "Error consumiendo gift card: " + rpcError?.message },
        { status: 500 }
      )

    // Activar membresía directamente
    const { error: upsertError } = await supabase
      .from("user_memberships")
      .upsert(
        {
          user_id: userId,
          membership_type: membershipType,
          billing_cycle: billingCycle || "monthly",
          status: "active",
          source: "gift_card",
          start_date: new Date().toISOString(),
        },
        { onConflict: "user_id" }
      )

    if (upsertError)
      return NextResponse.json(
        { error: "Error activando membresía: " + upsertError.message },
        { status: 500 }
      )

    return NextResponse.json({
      success: true,
      message: "Membresía activada con gift card",
    })
  } catch (error: any) {
    return NextResponse.json(
      { error: "Error interno: " + error.message },
      { status: 500 }
    )
  }
}
