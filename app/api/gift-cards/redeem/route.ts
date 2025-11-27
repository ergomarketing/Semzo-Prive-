import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { code, amountToUse, orderReference } = await request.json()

    // Validar gift card
    const { data: giftCard, error: fetchError } = await supabase
      .from("gift_cards")
      .select("*")
      .eq("code", code.toUpperCase().trim())
      .eq("status", "active")
      .single()

    if (fetchError || !giftCard) {
      return NextResponse.json({ error: "Gift card no válida" }, { status: 400 })
    }

    // Verificar que hay saldo suficiente
    if (giftCard.amount < amountToUse) {
      return NextResponse.json(
        {
          error: `Saldo insuficiente. Disponible: ${(giftCard.amount / 100).toFixed(2)}€`,
        },
        { status: 400 },
      )
    }

    // Calcular nuevo saldo
    const newAmount = giftCard.amount - amountToUse
    const newStatus = newAmount === 0 ? "used" : "active"

    // Actualizar gift card
    const { error: updateError } = await supabase
      .from("gift_cards")
      .update({
        amount: newAmount,
        status: newStatus,
        used_by: user.id,
        used_at: newStatus === "used" ? new Date().toISOString() : giftCard.used_at,
      })
      .eq("id", giftCard.id)

    if (updateError) {
      return NextResponse.json({ error: "Error al usar gift card" }, { status: 500 })
    }

    // Registrar transacción
    await supabase.from("gift_card_transactions").insert({
      gift_card_id: giftCard.id,
      user_id: user.id,
      amount_used: amountToUse,
      order_reference: orderReference,
    })

    return NextResponse.json({
      success: true,
      amountUsed: amountToUse,
      remainingBalance: newAmount,
      giftCardStatus: newStatus,
    })
  } catch (error) {
    console.error("Error redeeming gift card:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
