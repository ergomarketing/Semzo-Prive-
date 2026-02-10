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

    const { code, amountToUse, orderReference, membershipType } = await request.json()

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
    const amountInCents = amountToUse || currentBalance

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

    if (newAmount > 0) {
      // Obtener balance actual del usuario
      const { data: profile } = await supabase.from("profiles").select("gift_card_balance").eq("id", user.id).single()

      const currentUserBalance = profile?.gift_card_balance || 0
      const newUserBalance = currentUserBalance + newAmount

      // Actualizar balance del usuario
      await supabase.from("profiles").update({ gift_card_balance: newUserBalance }).eq("id", user.id)

      console.log(`[v0] User ${user.id} gift card balance updated: ${newUserBalance / 100}€`)
    }

    // Registrar transacción
    await supabase.from("gift_card_transactions").insert({
      gift_card_id: giftCard.id,
      user_id: user.id,
      amount_used: amountInCents,
      order_reference: orderReference || `manual_${Date.now()}`,
    })

    console.log(`[v0] Gift card ${code} redeemed: ${amountInCents / 100}€ used, ${newAmount / 100}€ remaining`)

    if (membershipType) {
      try {
        const activationResponse = await fetch(
          `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/user/update-membership`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              userId: user.id,
              membershipType,
              paymentId: `gift_${orderReference || Date.now()}`,
              giftCardCode: code,
            }),
          },
        )

        if (!activationResponse.ok) {
          const errorData = await activationResponse.json()
          console.error("[v0] Error activating membership:", errorData)
          // No fallar el redeem si la activación falla, solo logear
        } else {
          console.log(`[v0] Membership ${membershipType} activated for user ${user.id}`)
        }
      } catch (activationError) {
        console.error("[v0] Error calling membership activation:", activationError)
        // No fallar el redeem si la activación falla
      }
    }

    return NextResponse.json({
      success: true,
      amountUsed: amountInCents,
      remainingBalance: Math.max(0, newAmount),
      giftCardStatus: newStatus,
      membershipActivated: !!membershipType,
    })
  } catch (error) {
    console.error("Error redeeming gift card:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
