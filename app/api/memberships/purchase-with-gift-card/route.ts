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
    const { userId, giftCardId, billingCycle, membershipType: rawMembershipType } = body
    const membershipType = rawMembershipType?.toLowerCase()

    if (!userId || !giftCardId || !billingCycle || !membershipType) {
      return NextResponse.json(
        { error: "Faltan campos requeridos: userId, giftCardId, billingCycle, membershipType" },
        { status: 400 }
      )
    }

    if (!VALID_MEMBERSHIP_TYPES.includes(membershipType as any)) {
      return NextResponse.json({ error: `Tipo de membresía inválido: ${membershipType}` }, { status: 400 })
    }

    // Una sola RPC transaccional — gift card y membresía en la misma transacción Postgres
    // Si la membresía falla, el saldo NO se descuenta
    const membershipPrices: Record<string, number> = {
      petite: 39,
      essentiel: 59,
      signature: 89,
      prive: 149,
    }
    const amountEuros = membershipPrices[membershipType]
    if (!amountEuros) {
      return NextResponse.json({ error: `Precio no encontrado para membresía: ${membershipType}` }, { status: 400 })
    }

    const { error } = await supabase.rpc("purchase_membership_with_gift_card", {
      p_user_id: userId,
      p_gift_card_id: giftCardId,
      p_membership_type: membershipType,
      p_billing_cycle: billingCycle,
      p_amount: amountEuros,
    })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json({ success: true, message: "Membresía activada con gift card" })
  } catch (error: any) {
    return NextResponse.json({ error: "Error inesperado: " + error.message }, { status: 500 })
  }
}
