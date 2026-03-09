import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

const VALID_MEMBERSHIP_TYPES = ["petite", "essentiel", "signature", "prive"] as const

function calcEndDate(billingCycle: string): string {
  const end = new Date()
  if (billingCycle === "weekly") {
    end.setDate(end.getDate() + 7)
  } else {
    end.setMonth(end.getMonth() + 1)
  }
  return end.toISOString()
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, giftCardId, amountCents, billingCycle } = body
    const membershipType = (body.membershipType || "essentiel").toLowerCase()

    // 1. Validar campos requeridos — membershipType ya tiene default
    if (!userId || !giftCardId || !billingCycle) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: userId, giftCardId, billingCycle" },
        { status: 400 }
      )
    }

    // 2. Validar membershipType
    if (!VALID_MEMBERSHIP_TYPES.includes(membershipType as any)) {
      return NextResponse.json({ error: `Tipo de membresía inválido: ${membershipType}` }, { status: 400 })
    }

    // 3. Obtener saldo real de la gift card — columna "amount" en céntimos
    const { data: card, error: cardError } = await supabase
      .from("gift_cards")
      .select("amount, status")
      .eq("id", giftCardId)
      .single()

    if (cardError || !card) {
      return NextResponse.json({ error: "Gift card no encontrada" }, { status: 400 })
    }

    if (card.status !== "active") {
      return NextResponse.json({ error: "Gift card inválida o ya utilizada" }, { status: 400 })
    }

    // 4. Calcular importe a consumir — amount en DB está en céntimos
    const membershipPricesCents: Record<string, number> = {
      petite: 1999,
      essentiel: 3999,
      signature: 7999,
      prive: 14999,
    }
    const membershipPriceCents = membershipPricesCents[membershipType] || 0
    // consumir el mínimo entre saldo disponible y precio de la membresía
    const amountToCConsumeCents = Math.min(card.amount, membershipPriceCents)

    if (amountToCConsumeCents <= 0) {
      return NextResponse.json({ error: "Saldo insuficiente en la gift card" }, { status: 400 })
    }

    // 5. Consumo atómico via RPC — p_amount en céntimos, Postgres garantiza atomicidad
    const { data: consumed, error: rpcError } = await supabase.rpc("atomic_gift_card_consume", {
      p_gift_card_id: giftCardId,
      p_amount: amountToCConsumeCents,
    })

    if (rpcError) {
      return NextResponse.json(
        { error: "Error procesando gift card: " + rpcError.message },
        { status: 400 }
      )
    }

    if (consumed === false) {
      return NextResponse.json(
        { error: "Gift card no válida, ya utilizada o saldo insuficiente" },
        { status: 400 }
      )
    }

    // 4. Activar membresía
    const now = new Date().toISOString()
    const endDate = calcEndDate(billingCycle)

    const { error: upsertError } = await supabase
      .from("user_memberships")
      .upsert(
        {
          user_id: userId,
          membership_type: membershipType,
          billing_cycle: billingCycle,
          status: "active",
          start_date: now,
          end_date: endDate,
        },
        { onConflict: "user_id" }
      )

    if (upsertError) {
      return NextResponse.json(
        { error: "Gift card consumida pero error activando membresía: " + upsertError.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true, message: "Membresía activada con gift card" })
  } catch (error: any) {
    return NextResponse.json({ error: "Error inesperado: " + error.message }, { status: 500 })
  }
}
