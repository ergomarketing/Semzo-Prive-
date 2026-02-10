import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import { adminNotifications } from "@/lib/admin-notifications"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, membershipType, billingCycle, amount, coupon, giftCard } = body

    console.log("[v0] create-intent:", { userId, membershipType, billingCycle, amount, giftCard: giftCard?.code })

    if (!userId || userId.startsWith("guest_")) {
      return NextResponse.json({ error: "User must be authenticated" }, { status: 401 })
    }

    const { data: userProfile } = await supabase.from("profiles").select("full_name, email").eq("id", userId).single()

    // Always delete old "initiated" intents
    await supabase.from("membership_intents").delete().eq("user_id", userId).eq("status", "initiated")

    const originalAmountCents = Math.round(amount * 100)
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

    // Resolve gift card
    if (giftCard?.code) {
      const code = giftCard.code.trim()
      console.log("[v0] Searching gift card:", code)
      
      const { data: card } = await supabase
        .from("gift_cards")
        .select("id, code, amount")
        .ilike("code", code)
        .gt("amount", 0)
        .limit(1)
        .single()

      console.log("[v0] Gift card found:", card)

      if (card) {
        resolvedGiftCardId = card.id
        giftCardAppliedCents = Math.min(card.amount, finalAmountCents)
        finalAmountCents -= giftCardAppliedCents
        console.log("[v0] Gift card resolved:", { id: card.id, applied: giftCardAppliedCents })
      }
    }

    finalAmountCents = Math.max(0, finalAmountCents)

    // Create new intent
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
        gift_card_id: resolvedGiftCardId,
        gift_card_code: giftCard?.code || null,
        gift_card_applied_cents: giftCardAppliedCents,
        status: "initiated",
        initiated_at: new Date().toISOString(),
      })
      .select("id")
      .single()

    if (error) {
      console.error("[v0] Error creating intent:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    console.log("[v0] Created intent:", intent.id, "gift_card_id:", resolvedGiftCardId)

    if (userProfile) {
      adminNotifications.notifyNewUserRegistration({
        userName: userProfile.full_name || "Nuevo Usuario",
        userEmail: userProfile.email || "email@desconocido.com",
        membershipPlan: membershipType,
      }).catch(() => {})
    }

    return NextResponse.json({
      intentId: intent.id,
      giftCardId: resolvedGiftCardId,
      amount: finalAmountCents,
      membership: { type: membershipType, cycle: billingCycle },
    })
  } catch (error: any) {
    console.error("[v0] create-intent error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
