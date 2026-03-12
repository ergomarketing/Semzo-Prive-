import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export const dynamic = "force-dynamic"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { membershipType, billingCycle, amount, coupon, giftCard } = body

    const validMembershipTypes = ["petite", "essentiel", "signature", "prive"]
    const validBillingCycles = ["weekly", "monthly", "quarterly"]

    if (!validMembershipTypes.includes(membershipType)) {
      return NextResponse.json({ error: `Invalid membershipType: ${membershipType}` }, { status: 400 })
    }

    if (!validBillingCycles.includes(billingCycle)) {
      return NextResponse.json({ error: `Invalid billingCycle: ${billingCycle}` }, { status: 400 })
    }

    // Autenticar desde cookies SSR — nunca confiar en userId del body
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const userId = user.id

    // Eliminar intents "initiated" previos del mismo usuario para evitar duplicados
    await supabase
      .from("membership_intents")
      .delete()
      .eq("user_id", userId)
      .eq("status", "initiated")

    const originalAmountCents = Math.round((amount || 0) * 100)
    let finalAmountCents = originalAmountCents
    let couponDiscountCents = 0
    let giftCardAppliedCents = 0
    let resolvedGiftCardId: string | null = null

    if (coupon) {
      couponDiscountCents = coupon.type === "percent"
        ? Math.round((originalAmountCents * coupon.discount) / 100)
        : coupon.discount * 100
      finalAmountCents -= couponDiscountCents
    }

    if (giftCard?.code) {
      const { data: card } = await supabase
        .from("gift_cards")
        .select("id, code, amount")
        .ilike("code", giftCard.code.trim())
        .gt("amount", 0)
        .limit(1)
        .single()

      if (card) {
        resolvedGiftCardId = card.id
        giftCardAppliedCents = Math.min(card.amount, finalAmountCents)
        finalAmountCents -= giftCardAppliedCents
      }
    }

    finalAmountCents = Math.max(0, finalAmountCents)

    const now = new Date().toISOString()

    const { data: intent, error } = await supabase
      .from("membership_intents")
      .insert({
        user_id: userId,
        membership_type: membershipType,
        billing_cycle: billingCycle,
        amount_cents: finalAmountCents,
        original_amount_cents: originalAmountCents,
        coupon_code: coupon?.code || null,
        coupon_discount_cents: couponDiscountCents,
        gift_card_code: giftCard?.code || null,
        gift_card_applied_cents: giftCardAppliedCents,
        status: "initiated",
        initiated_at: now,
        created_at: now,
        updated_at: now,
      })
      .select("id")
      .single()

    if (error) {
      console.error("[create-intent] DB insert error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      intentId: intent.id,
      giftCardId: resolvedGiftCardId,
      amount_cents: finalAmountCents,
      original_amount_cents: originalAmountCents,
      membership: { type: membershipType, cycle: billingCycle },
    })
  } catch (error: any) {
    console.error("[create-intent] Unexpected error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
