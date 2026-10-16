import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"
import { createServerSupabaseClient } from "@/lib/supabase-server"

export const dynamic = "force-dynamic"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
})

/**
 * Suma de las facturas pagadas de la suscripcion actual que corresponden a
 * cuotas de alquiler, es decir, pagadas fuera de cualquier periodo en el que
 * la socia tuviera un registro Colecciona (esas ya se acumularon por webhook).
 */
async function getRentalFeesPaid(userId: string): Promise<number> {
  const { data: membership } = await supabaseAdmin
    .from("user_memberships")
    .select("stripe_subscription_id")
    .eq("user_id", userId)
    .maybeSingle()

  const subscriptionId = membership?.stripe_subscription_id
  if (!subscriptionId) return 0

  const { data: collectRecords } = await supabaseAdmin
    .from("ownership_progress")
    .select("status, started_at, completed_at, updated_at")
    .eq("user_id", userId)
    .eq("mode", "collect")

  const collectPeriods = (collectRecords ?? []).map((record) => {
    const start = new Date(record.started_at).getTime()
    const end =
      record.status === "active"
        ? Date.now()
        : new Date(record.completed_at ?? record.updated_at).getTime()
    return { start, end }
  })

  let totalCents = 0
  for await (const invoice of stripe.invoices.list({
    subscription: subscriptionId,
    status: "paid",
    limit: 100,
  })) {
    const paidAt = invoice.created * 1000
    const insideCollectPeriod = collectPeriods.some(
      (period) => paidAt >= period.start && paidAt <= period.end,
    )
    if (!insideCollectPeriod) totalCents += invoice.amount_paid ?? 0
  }

  return totalCents / 100
}

/**
 * POST /api/user/ownership/convert-to-collect
 *
 * Convertir el bolso actual de Modo Descubre (alquiler) a Modo Colecciona.
 * Las cuotas de alquiler ya pagadas de la suscripcion actual cuentan como
 * credito inicial; a partir de ahi cada cuota nueva se suma por webhook.
 * Requiere que el bolso tenga purchase_price configurado.
 */
export async function POST(req: NextRequest) {
  try {
    const supabaseUser = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabaseUser.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const body = await req.json().catch(() => ({}))
    const bagId = body.bag_id as string | undefined
    if (!bagId) {
      return NextResponse.json({ error: "bag_id requerido" }, { status: 400 })
    }

    // Verificar que el bolso tiene precio
    const { data: bag } = await supabaseAdmin
      .from("bags")
      .select("id, purchase_price")
      .eq("id", bagId)
      .maybeSingle()

    if (!bag || bag.purchase_price == null) {
      return NextResponse.json(
        { error: "Este bolso no está disponible en Modo Colecciona" },
        { status: 400 },
      )
    }

    const now = new Date().toISOString()
    const target = Number(bag.purchase_price)

    // Credito inicial: cuotas de alquiler ya pagadas de la suscripcion actual
    // (se excluyen las pagadas mientras existia un registro Colecciona).
    let initialCredit = 0
    try {
      initialCredit = await getRentalFeesPaid(user.id)
    } catch (err) {
      console.error("[v0] convert-to-collect no se pudieron leer las cuotas pagadas:", err)
      return NextResponse.json(
        { error: "No se pudieron calcular tus cuotas pagadas. Inténtalo de nuevo." },
        { status: 502 },
      )
    }
    const isCompleted = initialCredit >= target

    // Cerrar discover activo
    await supabaseAdmin
      .from("ownership_progress")
      .update({ status: "cancelled", updated_at: now })
      .eq("user_id", user.id)
      .eq("bag_id", bagId)
      .eq("status", "active")

    // Crear nuevo registro collect con las cuotas de alquiler ya pagadas
    const { data: created, error: insertErr } = await supabaseAdmin
      .from("ownership_progress")
      .insert({
        user_id: user.id,
        bag_id: bagId,
        mode: "collect",
        purchase_price: bag.purchase_price,
        accumulated: isCompleted ? target : initialCredit,
        status: isCompleted ? "completed" : "active",
        completed_at: isCompleted ? now : null,
      })
      .select("id")
      .single()

    if (insertErr) {
      console.error("[v0] convert-to-collect insert error:", insertErr)
      return NextResponse.json({ error: "No se pudo crear el progreso" }, { status: 500 })
    }

    return NextResponse.json({ success: true, ownership_progress_id: created.id })
  } catch (err) {
    console.error("[v0] ownership/convert-to-collect error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    )
  }
}
