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

    if (!code) {
      return NextResponse.json({ error: "Código de gift card requerido" }, { status: 400 })
    }

    // Validar gift card
    const { data: giftCard, error: fetchError } = await supabase
      .from("gift_cards")
      .select("*")
      .eq("code", code.toUpperCase().trim())
      .eq("status", "active")
      .single()

    if (fetchError || !giftCard) {
      return NextResponse.json({ error: "Gift card no válida o inactiva" }, { status: 400 })
    }

    const currentBalance = giftCard.amount
    const amountInCents = amountToUse || currentBalance // If no amount specified, use full balance

    // Verificar que hay saldo suficiente
    if (currentBalance < amountInCents) {
      return NextResponse.json(
        {
          error: `Saldo insuficiente. Disponible: ${(currentBalance / 100).toFixed(2)}€`,
        },
        { status: 400 },
      )
    }

    // Calcular nuevo saldo
    const newAmount = currentBalance - amountInCents
    const newStatus = newAmount <= 0 ? "used" : "active"

    // Actualizar gift card
    const { error: updateError } = await supabase
      .from("gift_cards")
      .update({
        amount: Math.max(0, newAmount),
        status: newStatus,
        used_by: user.id,
        used_at: newStatus === "used" ? new Date().toISOString() : giftCard.used_at,
      })
      .eq("id", giftCard.id)

    if (updateError) {
      console.error("Error updating gift card:", updateError)
      return NextResponse.json({ error: "Error al usar gift card" }, { status: 500 })
    }

    // Registrar transacción
    await supabase.from("gift_card_transactions").insert({
      gift_card_id: giftCard.id,
      user_id: user.id,
      amount_used: amountInCents,
      order_reference: orderReference || `manual_${Date.now()}`,
    })

    console.log(`[v0] Gift card ${code} redeemed: ${amountInCents / 100}€ used, ${newAmount / 100}€ remaining`)

    return NextResponse.json({
      success: true,
      amountUsed: amountInCents,
      remainingBalance: Math.max(0, newAmount),
      giftCardStatus: newStatus,
    })
  } catch (error) {
    console.error("Error redeeming gift card:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
