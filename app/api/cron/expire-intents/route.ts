import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

/**
 * Fallback Vercel Cron para tarea 3 (limpieza de membership_intents huerfanos).
 *
 * Solo necesario si pg_cron NO esta disponible en Supabase.
 * Si pg_cron esta activo, este endpoint queda como redundancia inocua
 * (la funcion SQL es idempotente).
 *
 * Reglas:
 *   - initiated > 24h sin pago             -> expired
 *   - paid_pending_verification > 7 dias   -> expired
 *   - intents con stripe_subscription_id    -> nunca se tocan
 */
export async function GET(request: Request) {
  try {
    const authHeader = request.headers.get("authorization")
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = await createClient()

    const { data, error } = await supabase.rpc("expire_stale_membership_intents")

    if (error) {
      console.error("[cron/expire-intents] RPC error:", error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    const result = Array.isArray(data) ? data[0] : data

    return NextResponse.json({
      success: true,
      expired_initiated: result?.expired_initiated ?? 0,
      expired_pending_verification: result?.expired_pending_verification ?? 0,
      timestamp: new Date().toISOString(),
    })
  } catch (err: any) {
    console.error("[cron/expire-intents] error:", err)
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 })
  }
}
