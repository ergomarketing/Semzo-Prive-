import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@/lib/supabase"
import { getReferralStats } from "@/lib/referrals"

/**
 * GET /api/referrals/me
 *
 * Devuelve el codigo de referido del usuario autenticado, su link de
 * invitacion y las estadisticas (total, pendientes, cualificados,
 * recompensados, saldo en euros).
 *
 * Si el usuario no tiene codigo aun, se le asigna uno automaticamente
 * (caso de cuentas creadas antes del backfill).
 */
export async function GET() {
  try {
    const supabase = await createRouteHandlerClient({ cookies })
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 })
    }

    const stats = await getReferralStats(user.id)
    if (!stats) {
      return NextResponse.json({ error: "internal_error" }, { status: 500 })
    }

    return NextResponse.json(stats)
  } catch (err: any) {
    console.error("[v0] /api/referrals/me error:", err)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
