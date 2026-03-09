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

    // 1. Validar campos requeridos
    if (!userId || !giftCardId || !membershipType || !billingCycle) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: userId, giftCardId, membershipType, billingCycle" },
        { status: 400 }
      )
    }

    // 2. Validar membershipType
    if (!VALID_MEMBERSHIP_TYPES.includes(membershipType as any)) {
      return NextResponse.json({ error: `Tipo de membresía inválido: ${membershipType}` }, { status: 400 })
    }

    // 3. Consumo atómico via RPC
    // La RPC ejecuta en Postgres: UPDATE WHERE status='active' AND amount >= p_amount
    // Si ninguna fila se actualiza → devuelve false (saldo insuficiente o inválida)
    // No hay race condition posible — Postgres lock de fila garantiza atomicidad
    const amountEuros = amountCents ? amountCents / 100 : 0

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
