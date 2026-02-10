import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
    }

    // Step 1: Get intent with original_amount_cents
    const { data: intent } = await supabase
      .from("membership_intents")
      .select("id, status, gift_card_id, gift_card_consumed_at, original_amount_cents, membership_type, billing_cycle")
      .eq("user_id", userId)
      .in("status", ["initiated", "paid_pending_verification"])
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    // Idempotency: already processed
    if (intent?.gift_card_consumed_at) {
      return NextResponse.json({
        success: true,
        next_step: "identity_verification",
        message: "Membresía ya procesada.",
        intent_id: intent.id,
        already_processed: true,
      })
    }

    if (!intent?.gift_card_id) {
      return NextResponse.json({ error: "Gift card no asociada al pedido." }, { status: 400 })
    }

    // Step 2: Call RPC once with original_amount_cents from intent
    const { data: rpcResult, error: rpcError } = await supabase.rpc("consume_gift_card_atomic", {
      p_gift_card_id: intent.gift_card_id,
      p_membership_intent_id: intent.id,
      p_amount: intent.original_amount_cents,
    })

    if (rpcError) {
      return NextResponse.json({ error: "Error procesando gift card: " + rpcError.message }, { status: 500 })
    }

    // Step 3: Check result
    if (!rpcResult?.success) {
      return NextResponse.json({ error: "Saldo insuficiente en gift card." }, { status: 400 })
    }

    // Step 4: Update membership_intent to paid_pending_verification
    const { error: updateError } = await supabase
      .from("membership_intents")
      .update({
        status: "paid_pending_verification",
        paid_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", intent.id)
      .eq("user_id", userId)

    if (updateError) {
      console.error("[v0] Error updating membership_intent:", updateError)
      return NextResponse.json({ error: "Error actualizando intent: " + updateError.message }, { status: 500 })
    }

    console.log("[v0] Membership intent updated to paid_pending_verification via gift card")

    return NextResponse.json({
      success: true,
      next_step: "identity_verification",
      message: "Membresía confirmada. Completa la verificación de identidad.",
      intent_id: intent.id,
    })
  } catch (error: any) {
    return NextResponse.json({ error: "Error interno: " + (error.message || "desconocido") }, { status: 500 })
  }
}
