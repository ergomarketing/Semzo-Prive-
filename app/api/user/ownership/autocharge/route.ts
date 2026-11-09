import { NextResponse } from "next/server"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"
import { recordLegalAcceptance } from "@/lib/legal-acceptance"
import {
  AUTOCHARGE_CONTEXT,
  AUTOCHARGE_DOCUMENT,
  AUTOCHARGE_REVOKED_CONTEXT,
  AUTOCHARGE_VERSION,
  MAX_AUTO_RENEWALS,
  PASS_PRICE_CENTS,
  autochargeConsentText,
  getConsentedProgressIds,
  normalizePassTier,
} from "@/lib/colecciona-autocharge"

export const dynamic = "force-dynamic"

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
  auth: { autoRefreshToken: false, persistSession: false },
})

/**
 * Contexto de la socia: solo aplica a una Petite con un pase en curso y Colecciona activo sobre ESE bolso.
 * Devuelve null si no aplica (la tarjeta del panel no muestra nada).
 */
async function loadContext(userId: string) {
  const { data: reservation } = await admin
    .from("reservations")
    .select("id, bag_id, bag_pass_id, membership_type, pass_expires_at, status")
    .eq("user_id", userId)
    .in("status", ["active", "confirmed", "overdue"])
    .not("bag_pass_id", "is", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (!reservation || String(reservation.membership_type || "").toLowerCase() !== "petite") return null

  const { data: progress } = await admin
    .from("ownership_progress")
    .select("id, bag_id")
    .eq("user_id", userId)
    .eq("bag_id", reservation.bag_id)
    .eq("mode", "collect")
    .eq("status", "active")
    .maybeSingle()
  if (!progress) return null

  const { data: pass } = await admin.from("bag_passes").select("pass_tier").eq("id", reservation.bag_pass_id).maybeSingle()
  const tier = normalizePassTier(pass?.pass_tier)
  return { reservation, progress, tier }
}

/** GET: estado de la renovacion automatica para la tarjeta del panel. */
export async function GET() {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const ctx = await loadContext(user.id)
  if (!ctx) return NextResponse.json({ eligible: false })

  const consented = (await getConsentedProgressIds(admin, [ctx.progress.id])).has(ctx.progress.id)
  const { count: renewalsDone } = await admin
    .from("colecciona_pass_renewals")
    .select("id", { count: "exact", head: true })
    .eq("ownership_progress_id", ctx.progress.id)
    .eq("status", "succeeded")

  return NextResponse.json({
    eligible: true,
    consented,
    text: autochargeConsentText(),
    amountCents: ctx.tier ? PASS_PRICE_CENTS[ctx.tier] : null,
    passExpiresAt: ctx.reservation.pass_expires_at,
    renewalsDone: renewalsDone ?? 0,
    maxRenewals: MAX_AUTO_RENEWALS,
  })
}

/** POST: la socia autoriza la renovacion automatica (queda guardado el texto exacto, la fecha, la hora y la IP). */
export async function POST(request: Request) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const body = await request.json().catch(() => ({}))
  if (body?.accepted !== true) {
    return NextResponse.json({ error: "Tienes que aceptar la autorización para activarla." }, { status: 400 })
  }

  const ctx = await loadContext(user.id)
  if (!ctx || !ctx.tier) {
    return NextResponse.json({ error: "La renovación automática solo está disponible con un pase Petite en Modo Colecciona." }, { status: 409 })
  }
  if ((await getConsentedProgressIds(admin, [ctx.progress.id])).has(ctx.progress.id)) {
    return NextResponse.json({ success: true, alreadyActive: true })
  }

  const id = await recordLegalAcceptance(admin, {
    userId: user.id,
    context: AUTOCHARGE_CONTEXT,
    document: AUTOCHARGE_DOCUMENT,
    documentVersion: AUTOCHARGE_VERSION,
    referenceId: ctx.progress.id,
    textSnapshot: autochargeConsentText(),
    request,
    metadata: { bag_id: ctx.progress.bag_id, pass_tier: ctx.tier, amount_cents: PASS_PRICE_CENTS[ctx.tier] },
  })
  if (!id) return NextResponse.json({ error: "No se pudo guardar tu autorización. No se ha activado nada." }, { status: 500 })
  return NextResponse.json({ success: true })
}

/** DELETE: la socia revoca la autorizacion; no se cobra nada mas. */
export async function DELETE(request: Request) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const ctx = await loadContext(user.id)
  if (!ctx) return NextResponse.json({ error: "No hay una renovación automática activa." }, { status: 409 })

  const id = await recordLegalAcceptance(admin, {
    userId: user.id,
    context: AUTOCHARGE_REVOKED_CONTEXT,
    document: AUTOCHARGE_DOCUMENT,
    documentVersion: AUTOCHARGE_VERSION,
    referenceId: ctx.progress.id,
    textSnapshot: "La socia revoca la autorización de renovación automática del pase semanal.",
    request,
    metadata: { bag_id: ctx.progress.bag_id },
  })
  if (!id) return NextResponse.json({ error: "No se pudo desactivar. Inténtalo de nuevo." }, { status: 500 })
  return NextResponse.json({ success: true })
}
