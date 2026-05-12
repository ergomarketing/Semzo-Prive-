import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@/lib/supabase"
import { trackReferralSignup } from "@/lib/referrals"

/**
 * POST /api/referrals/track
 *
 * Registra que el usuario actualmente logueado se ha registrado usando
 * el codigo de referido `referralCode`. Crea una fila en la tabla
 * `referrals` con status='pending'.
 *
 * Diseno deliberado:
 *   - Se invoca SOLO desde el cliente DESPUES de un signup exitoso.
 *   - NO modifica el flujo de pagos ni el endpoint /api/auth/register.
 *   - Es idempotente: si el usuario ya fue referido, devuelve already_referred.
 *
 * Body:
 *   { "referralCode": "MARIA2024" }
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

    const result = await trackReferralSignup({
      referralCode,
      referredUserId: user.id,
    })

    if (!result.ok) {
      const httpStatus = result.reason === "invalid_code" ? 400 : 409
      return NextResponse.json({ ok: false, reason: result.reason }, { status: httpStatus })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    console.error("[v0] /api/referrals/track error:", err)
    return NextResponse.json({ ok: false, reason: "internal_error" }, { status: 500 })
  }
}
