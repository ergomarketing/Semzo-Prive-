import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

/**
 * PATCH /api/admin/referrals/[id]
 *
 * Acciones manuales del admin sobre un referral. NO toca pagos Stripe,
 * NO emite cupones - solo manipula la tabla referrals y profiles.referral_balance.
 *
 * Acciones soportadas:
 *   - force_qualify: marca status='qualified' + qualified_at=now()
 *                    (NO aplica credito, eso lo hace el cron luego)
 *   - force_reject:  marca status='rejected'
 *   - manual_reward: ejecuta la funcion atomica process_referral_reward(id, 50)
 *                    para aplicar credito YA sin esperar al cron diario
 *
 * Body: { action: "force_qualify" | "force_reject" | "manual_reward" }
 */
export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: "missing_id" }, { status: 400 })
    }

    const body = await request.json().catch(() => ({}))
    const action = body?.action as string | undefined
    if (!action) {
      return NextResponse.json({ error: "missing_action" }, { status: 400 })
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Verificar que el referral existe.
    const { data: existing, error: fetchErr } = await supabase
      .from("referrals")
      .select("id, status, reward_applied_at")
      .eq("id", id)
      .maybeSingle()

    if (fetchErr || !existing) {
      return NextResponse.json({ error: "referral_not_found" }, { status: 404 })
    }

    if (action === "force_qualify") {
      // Solo permitido si no esta ya rewarded.
      if (existing.status === "rewarded") {
        return NextResponse.json({ error: "already_rewarded" }, { status: 409 })
      }
      const { error } = await supabase
        .from("referrals")
        .update({
          status: "qualified",
          qualified_at: new Date().toISOString(),
        })
        .eq("id", id)
      if (error) {
        console.error("[v0] force_qualify error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ ok: true, action: "force_qualify" })
    }

    if (action === "force_reject") {
      const { error } = await supabase
        .from("referrals")
        .update({ status: "rejected" })
        .eq("id", id)
      if (error) {
        console.error("[v0] force_reject error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }
      return NextResponse.json({ ok: true, action: "force_reject" })
    }

    if (action === "manual_reward") {
      // Solo si esta qualified y sin aplicar.
      if (existing.status !== "qualified") {
        return NextResponse.json({ error: "not_qualified" }, { status: 409 })
      }
      if (existing.reward_applied_at) {
        return NextResponse.json({ error: "already_rewarded" }, { status: 409 })
      }

      // Llama a la funcion atomica que ya existe (creada en BLOQUE 4).
      const { data, error } = await supabase.rpc("process_referral_reward", {
        p_referral_id: id,
        p_amount: 50,
      })

      if (error) {
        console.error("[v0] manual_reward rpc error:", error)
        return NextResponse.json({ error: error.message }, { status: 500 })
      }

      return NextResponse.json({ ok: true, action: "manual_reward", result: data })
    }

    return NextResponse.json({ error: "invalid_action" }, { status: 400 })
  } catch (err) {
    console.error("[v0] admin referrals PATCH exception:", err)
    return NextResponse.json({ error: "Internal error" }, { status: 500 })
  }
}
