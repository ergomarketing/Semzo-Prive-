import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VALID_MEMBERSHIP_TYPES = ["petite", "essentiel", "signature", "prive"] as const

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, giftCardId, amountCents, membershipType, billingCycle } = body

    // 1. Validacion completa del body — todo debe existir
    if (!userId || !giftCardId || !amountCents || !membershipType || !billingCycle) {
      return NextResponse.json({ error: "Faltan campos requeridos: userId, giftCardId, amountCents, membershipType, billingCycle" }, { status: 400 })
    }

    // 2. Validar que membershipType sea un valor aceptado por la DB
    if (!VALID_MEMBERSHIP_TYPES.includes(membershipType)) {
      return NextResponse.json({ error: `Tipo de membresía inválido: ${membershipType}` }, { status: 400 })
    }

    // 3. Obtener gift card — verificar que existe y esta activa
    const { data: giftCard, error: gcError } = await supabase
      .from("gift_cards")
      .select("id, amount, status")
      .eq("id", giftCardId)
      .single()

    if (gcError || !giftCard) {
      return NextResponse.json({ error: "Gift card no encontrada" }, { status: 400 })
    }

    if (giftCard.status !== "active") {
      return NextResponse.json({ error: "Gift card inválida o ya utilizada" }, { status: 400 })
    }

    // 4. Verificar saldo — amount en DB esta en EUROS, amountCents viene en centimos
    const amountEuros = amountCents / 100

    if (giftCard.amount < amountEuros) {
      return NextResponse.json({ error: `Saldo insuficiente. Disponible: ${giftCard.amount}€, requerido: ${amountEuros}€` }, { status: 400 })
    }

    // 5. Consumir gift card via RPC atomico — p_amount en EUROS
    const { data: rpcResult, error: rpcError } = await supabase.rpc("consume_gift_card_atomic", {
      p_gift_card_id: giftCardId,
      p_amount: amountEuros,
    })

    if (rpcError) {
      return NextResponse.json({ error: "Error procesando gift card: " + rpcError.message }, { status: 400 })
    }

    if (rpcResult === false) {
      return NextResponse.json({ error: "Gift card no pudo ser procesada (saldo insuficiente o inválida)" }, { status: 400 })
    }

    // 6. Activar membresia en user_memberships
    const now = new Date().toISOString()
    const endDate = new Date()
    endDate.setMonth(endDate.getMonth() + 1)

    const { error: upsertError } = await supabase
      .from("user_memberships")
      .upsert(
        {
          user_id: userId,
          membership_type: membershipType,
          status: "active",
          start_date: now,
          end_date: endDate.toISOString(),
        },
        { onConflict: "user_id" }
      )

    if (upsertError) {
      return NextResponse.json({ error: "Gift card consumida pero error activando membresía: " + upsertError.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: "Membresía activada con gift card" })
  } catch (error: any) {
    console.error("[v0] purchase-with-gift-card error:", error)
    return NextResponse.json({ error: "Error inesperado: " + error.message }, { status: 500 })
  }
}
