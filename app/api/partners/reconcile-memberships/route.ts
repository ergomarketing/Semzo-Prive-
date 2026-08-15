import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServiceRole } from "@/lib/supabase-server"
import { getMembershipPrice } from "@/lib/plan-config"
import { reconcileMembershipCommission } from "@/lib/partners"

/**
 * POST /api/partners/reconcile-memberships
 *
 * Reconciliacion de comisiones de MEMBRESIA (primer mes, una sola vez) sin
 * tocar el webhook de Stripe. Recorre las reclamaciones de partner activas y,
 * si el usuario tiene una membresia activa, crea la comision del partner.
 *
 * Protegido por CRON_SECRET (cabecera Authorization: Bearer <CRON_SECRET>).
 * Pensado para ejecutarse periodicamente (cron) o manualmente desde el admin.
 */
export async function POST(request: NextRequest) {
  const auth = request.headers.get("authorization")
  const expected = `Bearer ${process.env.CRON_SECRET}`
  if (!process.env.CRON_SECRET || auth !== expected) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  }

  const supabase = getSupabaseServiceRole()
  if (!supabase) {
    return NextResponse.json({ error: "Servicio no disponible" }, { status: 503 })
  }

  try {
    // Reclamaciones activas (candidatas a conversion de membresia).
    const { data: claims, error: claimsError } = await supabase
      .from("partner_code_claims")
      .select("user_id")
      .eq("status", "active")

    if (claimsError) {
      return NextResponse.json({ error: claimsError.message }, { status: 500 })
    }

    let created = 0
    let skipped = 0

    for (const claim of claims || []) {
      const userId = claim.user_id as string

      // Membresia activa del usuario (fuente de verdad: user_memberships).
      const { data: membership } = await supabase
        .from("user_memberships")
        .select("id, membership_type, billing_cycle, status")
        .eq("user_id", userId)
        .in("status", ["active", "cancelled_active"])
        .maybeSingle()

      if (!membership) {
        skipped++
        continue
      }

      const base =
        getMembershipPrice(membership.membership_type, membership.billing_cycle || "monthly") || 0

      const result = await reconcileMembershipCommission({
        userId,
        membershipId: membership.id,
        baseAmount: base,
      })

      if (result.created) created++
      else skipped++
    }

    return NextResponse.json({ success: true, created, skipped, scanned: claims?.length || 0 })
  } catch (error) {
    console.error("[v0] reconcile-memberships error:", error)
    return NextResponse.json({ error: "Error en la reconciliación" }, { status: 500 })
  }
}
