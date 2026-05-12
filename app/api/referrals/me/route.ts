import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient } from "@/lib/supabase"
import { getReferralList, getReferralStats } from "@/lib/referrals"

/**
 * GET /api/referrals/me
 *
 * Devuelve para el usuario autenticado:
 *   - Su codigo de referido (lo genera si no existe).
 *   - Su link de invitacion.
 *   - Contadores agregados por estado.
 *   - Saldo en euros (referral_balance).
 *   - Lista detallada de sus referidos (`referrals: ReferralRow[]`)
 *     ordenada por fecha descendente.
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

    // Cargamos stats y lista en paralelo: ambas llaman a Supabase pero
    // a tablas distintas, asi reducimos la latencia total del endpoint.
    const [stats, referrals] = await Promise.all([getReferralStats(user.id), getReferralList(user.id)])

    if (!stats) {
      return NextResponse.json({ error: "internal_error" }, { status: 500 })
    }

    return NextResponse.json({
      ...stats,
      referrals,
    })
  } catch (err: any) {
    console.error("[v0] /api/referrals/me error:", err)
    return NextResponse.json({ error: "internal_error" }, { status: 500 })
  }
}
