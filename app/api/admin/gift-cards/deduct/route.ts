import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: Request) {
  try {
    const { code, amount, intentId } = await request.json()

    console.log("[v0] Deducting gift card:", { code, amount, intentId })

    const { data: giftCard, error: fetchError } = await supabaseAdmin
      .from("gift_cards")
      .select("*")
      .eq("code", code)
      .eq("status", "active")
      .single()

    if (fetchError || !giftCard) {
      return NextResponse.json({ error: "Gift card no encontrada o inválida" }, { status: 404 })
    }

    if (giftCard.amount < amount) {
      return NextResponse.json({ error: "Saldo insuficiente en gift card" }, { status: 400 })
    }

    const newBalance = giftCard.amount - amount

    const { error: updateError } = await supabaseAdmin
      .from("gift_cards")
      .update({
        amount: newBalance,
        status: newBalance <= 0 ? "used" : "active",
        updated_at: new Date().toISOString(),
      })
      .eq("code", code)

    if (updateError) {
      console.error("[v0] Error updating gift card:", updateError)
      return NextResponse.json({ error: "Error actualizando gift card" }, { status: 500 })
    }

    await supabaseAdmin.from("gift_card_transactions").insert({
      gift_card_id: giftCard.id,
      amount: -amount,
      description: intentId ? `Membresía (Intent: ${intentId})` : "Membresía",
      created_at: new Date().toISOString(),
    })

    console.log("[v0] ✅ Gift card deducted:", { code, amount, newBalance })

    return NextResponse.json({ success: true, newBalance })
  } catch (error: any) {
    console.error("[v0] Error in gift card deduct:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
