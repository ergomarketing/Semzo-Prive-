import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { getMembershipPrice, validateMembershipType } from "@/lib/plan-config"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

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

    if (!validateMembershipType(membershipType)) {
      return NextResponse.json({ error: `Tipo de membresía inválido: ${membershipType}` }, { status: 400 })
    }

    const amountEuros = getMembershipPrice(membershipType, billingCycle)
    if (!amountEuros) {
      return NextResponse.json({ error: `Precio no encontrado para membresía: ${membershipType} / ${billingCycle}` }, { status: 400 })
    }

    // 1. Verificar gift card
    const { data: gc, error: gcErr } = await supabase
      .from("gift_cards")
      .select("id, amount, status")
      .eq("id", giftCardId)
      .single()

    if (gcErr || !gc) return NextResponse.json({ error: "Gift card no encontrada" }, { status: 400 })
    if (!["active", "partial"].includes(gc.status)) return NextResponse.json({ error: "Gift card no está activa" }, { status: 400 })
    if (gc.amount < amountEuros) return NextResponse.json({ error: "Saldo insuficiente en la gift card" }, { status: 400 })

    // 2. Descontar saldo
    const newAmount = gc.amount - amountEuros
    const { error: gcUpdateErr } = await supabase
      .from("gift_cards")
      .update({ amount: newAmount, status: newAmount <= 0 ? "used" : "active", updated_at: new Date().toISOString() })
      .eq("id", giftCardId)

    if (gcUpdateErr) return NextResponse.json({ error: "Error actualizando gift card" }, { status: 500 })

    // 3. Calcular fecha de fin
    const endDate = new Date()
    if (billingCycle === "quarterly") endDate.setMonth(endDate.getMonth() + 3)
    else if (billingCycle === "weekly") endDate.setDate(endDate.getDate() + 7)
    else endDate.setMonth(endDate.getMonth() + 1)

    // 4. Upsert membresía (funciona tanto para nuevos como para reactivaciones)
    const { error: membershipErr } = await supabase
      .from("user_memberships")
      .upsert({
        user_id: userId,
        membership_type: membershipType,
        status: "active",
        start_date: new Date().toISOString(),
        end_date: endDate.toISOString(),
        stripe_subscription_id: null,
        stripe_customer_id: null,
        failed_payment_count: 0,
        dunning_status: null,
        updated_at: new Date().toISOString(),
      }, { onConflict: "user_id" })

    if (membershipErr) return NextResponse.json({ error: "Error activando membresía: " + membershipErr.message }, { status: 500 })

    return NextResponse.json({ success: true, message: "Membresía activada con gift card" })
  } catch (error: any) {
    return NextResponse.json({ error: "Error inesperado: " + error.message }, { status: 500 })
  }
}
