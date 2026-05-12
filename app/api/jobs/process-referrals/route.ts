/**
 * Cron job: aplica creditos a referidos cualificados.
 *
 * Ruta:        POST/GET /api/jobs/process-referrals
 * Proteccion:  Authorization: Bearer ${CRON_SECRET}
 *              (Vercel Cron envia este header automaticamente)
 * Frecuencia:  diaria, programada en vercel.json
 *
 * Logica:
 *   1) Busca referrals con status='qualified' AND reward_applied_at IS NULL
 *   2) Por cada uno, invoca el RPC `process_referral_reward(id, 50)` que
 *      realiza la mutacion de forma ATOMICA en transaccion DB:
 *        - +50 EUR al referrer
 *        - +50 EUR al referido
 *        - status = 'rewarded', reward_applied_at = NOW()
 *   3) Devuelve resumen { processed, rewarded, skipped, errors }
 *
 * REGLA DE ORO RESPETADA:
 *   - Aislado en /api/jobs/ (separado de /api/cron/* existentes)
 *   - NO toca Stripe, NO toca subscriptions, NO toca pagos
 *   - Solo lee/escribe en tablas `referrals` y `profiles.referral_balance`
 *   - Idempotente: ejecutar 2 veces no duplica creditos (lock + status check)
 */
import { NextResponse } from "next/server"
import { getSupabaseServiceRole } from "@/lib/supabase"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

// Importe de la recompensa por referido cualificado (en EUR enteros).
// Si en el futuro cambia, modificar aqui o moverlo a env var.
const REWARD_AMOUNT_EUR = 50

// Limite de filas a procesar por ejecucion para evitar timeouts del cron.
// Vercel Cron tiene un timeout de 60s en Hobby / 300s en Pro.
const BATCH_LIMIT = 200

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) {
    console.error("[v0] process-referrals: CRON_SECRET no configurado")
    return false
  }
  const auth = req.headers.get("authorization") || ""
  return auth === `Bearer ${secret}`
}

async function handleRequest(req: Request) {
  // 1) Autorizacion estricta.
  if (!isAuthorized(req)) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 })
  }

  const admin = getSupabaseServiceRole()
  if (!admin) {
    return NextResponse.json({ error: "service_role_unavailable" }, { status: 500 })
  }

  const startedAt = new Date().toISOString()

  // 2) Buscar referidos cualificados sin recompensar.
  const { data: pending, error: queryError } = await admin
    .from("referrals")
    .select("id, referrer_user_id, referred_user_id")
    .eq("status", "qualified")
    .is("reward_applied_at", null)
    .order("qualified_at", { ascending: true })
    .limit(BATCH_LIMIT)

  if (queryError) {
    console.error("[v0] process-referrals query error:", queryError)
    return NextResponse.json(
      { error: "query_failed", detail: queryError.message },
      { status: 500 },
    )
  }

  const candidates = pending || []
  if (candidates.length === 0) {
    return NextResponse.json({
      ok: true,
      startedAt,
      processed: 0,
      rewarded: 0,
      skipped: 0,
      errors: 0,
      message: "No hay referidos cualificados pendientes",
    })
  }

  // 3) Procesar cada uno via RPC atomico.
  const results: Array<{
    referralId: string
    status: "rewarded" | "skipped" | "error"
    reason?: string
  }> = []

  let rewarded = 0
  let skipped = 0
  let errors = 0

  for (const row of candidates) {
    try {
      const { data, error } = await admin.rpc("process_referral_reward", {
        p_referral_id: row.id,
        p_amount: REWARD_AMOUNT_EUR,
      })

      if (error) {
        console.error("[v0] RPC error for referral", row.id, error)
        results.push({ referralId: row.id, status: "error", reason: error.message })
        errors += 1
        continue
      }

      const payload = (data ?? {}) as { ok?: boolean; reason?: string }
      if (payload.ok) {
        results.push({ referralId: row.id, status: "rewarded" })
        rewarded += 1
      } else {
        // already_applied, not_qualified, not_found -> son skips no fatales.
        results.push({
          referralId: row.id,
          status: "skipped",
          reason: payload.reason ?? "unknown",
        })
        skipped += 1
      }
    } catch (e) {
      console.error("[v0] unexpected error for referral", row.id, e)
      results.push({
        referralId: row.id,
        status: "error",
        reason: e instanceof Error ? e.message : String(e),
      })
      errors += 1
    }
  }

  const finishedAt = new Date().toISOString()

  return NextResponse.json({
    ok: true,
    startedAt,
    finishedAt,
    rewardAmountEur: REWARD_AMOUNT_EUR,
    processed: candidates.length,
    rewarded,
    skipped,
    errors,
    results,
  })
}

// Vercel Cron envia GET; soportamos ambos por seguridad.
export async function GET(req: Request) {
  return handleRequest(req)
}

export async function POST(req: Request) {
  return handleRequest(req)
}
