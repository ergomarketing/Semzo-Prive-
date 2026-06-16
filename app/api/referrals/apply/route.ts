import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@/lib/supabase"
import { applyReferral } from "@/lib/referrals"

/**
 * POST /api/referrals/apply
 *
 * Endpoint oficial del programa de referidos (Fase 1).
 * Registra que el usuario logueado se ha registrado usando el
 * `referralCode` indicado, creando una fila en `referrals` con
 * status='pending' tras pasar los chequeos antifraude.
 *
 * Diseno:
 *   - Se invoca SOLO desde el cliente DESPUES de un signup exitoso.
 *   - NO modifica el flujo de pagos ni `/api/auth/register`.
 *   - Idempotente: si el usuario ya fue referido, devuelve already_referred.
 *
 * Body:
 *   { "referralCode": "MARIA8472" }
 *
 * Respuestas:
 *   200 { ok: true }
 *   400 { ok: false, reason: "missing_code" | "invalid_code" }
 *   401 { ok: false, reason: "unauthorized" }
 *   409 { ok: false, reason: "self_referral" | "already_referred" |
 *                            "same_email" | "same_stripe_customer" }
 *   500 { ok: false, reason: "db_error" | "internal_error" }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const referralCode: string = (body?.referralCode || "").toString().trim()

    if (!referralCode) {
      return NextResponse.json({ ok: false, reason: "missing_code" }, { status: 400 })
    }

    const supabase = await createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      // 401 silencioso: si el usuario aun no esta autenticado (porque
      // requiere confirmacion de email) el cliente reintentara despues.
      return NextResponse.json({ ok: false, reason: "unauthorized" }, { status: 401 })
    }

    const result = await applyReferral({
      referralCode,
      referredUserId: user.id,
    })

    if (!result.ok) {
      const httpStatus = result.reason === "invalid_code" ? 400 : result.reason === "db_error" ? 500 : 409
      return NextResponse.json({ ok: false, reason: result.reason }, { status: httpStatus })
    }

    // Meter al referido en el embudo de leads
    try {
      const { enrollLead } = await import("@/lib/leads/enroll")
      await enrollLead({
        email: user.email!,
        name: user.user_metadata?.full_name || user.user_metadata?.name || "",
        source: "referral",
        referral_code: referralCode,
      })
    } catch (e) {
      console.error("[v0] enrollLead error (referral):", e)
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("[v0] /api/referrals/apply error:", err)
    return NextResponse.json({ ok: false, reason: "internal_error" }, { status: 500 })
  }
}
