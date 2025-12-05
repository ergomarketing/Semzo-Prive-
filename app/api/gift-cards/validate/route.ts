import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const { code } = await request.json()

    if (!code) {
      return NextResponse.json({ valid: false, error: "Código requerido" }, { status: 400 })
    }

    const { data: giftCard, error } = await supabase
      .from("gift_cards")
      .select("*")
      .eq("code", code.toUpperCase().trim())
      .single()

    if (error || !giftCard) {
      return NextResponse.json({
        valid: false,
        error: "Código de gift card no válido",
      })
    }

    const currentBalance = giftCard.amount ?? giftCard.balance ?? 0
    if (currentBalance <= 0) {
      return NextResponse.json({
        valid: false,
        error: "Esta gift card ya ha sido utilizada y no tiene saldo disponible",
      })
    }

    // Verificar estado
    if (giftCard.status === "used") {
      return NextResponse.json({
        valid: false,
        error: "Esta gift card ya ha sido utilizada completamente",
      })
    }

    if (giftCard.status === "expired" || (giftCard.expires_at && new Date(giftCard.expires_at) < new Date())) {
      return NextResponse.json({
        valid: false,
        error: "Esta gift card ha expirado",
      })
    }

    if (giftCard.status === "disabled") {
      return NextResponse.json({
        valid: false,
        error: "Esta gift card ha sido desactivada",
      })
    }

    if (giftCard.status === "pending") {
      return NextResponse.json({
        valid: false,
        error: "Esta gift card aún no ha sido activada",
      })
    }

    return NextResponse.json({
      valid: true,
      balance: currentBalance,
      giftCard: {
        id: giftCard.id,
        code: giftCard.code,
        amount: currentBalance,
        originalAmount: giftCard.original_amount,
        currency: giftCard.currency,
        expiresAt: giftCard.expires_at,
      },
    })
  } catch (error) {
    console.error("Error validating gift card:", error)
    return NextResponse.json({ valid: false, error: "Error del servidor" }, { status: 500 })
  }
}
