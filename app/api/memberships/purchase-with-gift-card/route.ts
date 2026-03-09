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

    // 3. Obtener balance real de la gift card desde el backend — nunca confiar en el frontend
    const { data: card, error: cardError } = await supabase
      .from("gift_cards")
      .select("balance")
      .eq("id", giftCardId)
      .single()

    if (cardError || !card) {
      return NextResponse.json({ error: "Gift card no encontrada" }, { status: 400 })
    }

    // 4. Calcular importe real a consumir — el backend es la fuente de verdad
    const membershipPrices: Record<string, number> = {
      petite: 19.99,
      essentiel: 39.99,
      signature: 79.99,
      prive: 149.99,
    }
    const membershipPrice = membershipPrices[membershipType] || 0
    const amountEuros = Math.min(card.balance, membershipPrice)

    if (amountEuros <= 0) {
      return NextResponse.json({ error: "Saldo insuficiente en la gift card" }, { status: 400 })
    }

    // 5. Consumo atómico via RPC — Postgres garantiza atomicidad, sin race condition
    const { data: consumed, error: rpcError } = await supabase.rpc("atomic_gift_card_consume", {
      p_gift_card_id: giftCardId,
      p_amount: amountEuros,
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
