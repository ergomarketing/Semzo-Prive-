import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"
import Stripe from "stripe"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import {
  insertLedgerEntries,
  previewRentalConversion,
  type LedgerRow,
} from "@/lib/ownership-credit-ledger"
import { notifyReadyToFinalize } from "@/lib/ownership-ready-email"

export const dynamic = "force-dynamic"

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion,
})

/**
 * POST /api/user/ownership/convert-to-collect
 *
 * Convertir el bolso actual de Modo Descubre (alquiler) a Modo Colecciona.
 * Las facturas pagadas de la suscripcion actual que aun NO estan en el libro
 * (ownership_credit_entries, de ningun progreso) cuentan como credito inicial y
 * se registran con source='rental_conversion'. Una factura solo da credito una vez.
 * Nunca marca 'completed': si el credito cubre el precio queda 'active' y la socia
 * finaliza la compra en /ownership/complete.
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

    let preview
    try {
      preview = await previewRentalConversion(supabaseAdmin, stripe, user.id)
    } catch (err) {
      console.error("[v0] convert-to-collect no se pudieron leer las facturas pagadas:", err)
      return NextResponse.json(
        { error: "No se pudieron calcular tus cuotas pagadas. Inténtalo de nuevo." },
        { status: 502 },
      )
    }
    if (!preview.ledger_available) {
      return NextResponse.json(
        { error: "El libro de crédito no está disponible todavía. Inténtalo más tarde." },
        { status: 503 },
      )
    }

    // Cerrar discover activo
    await supabaseAdmin
      .from("ownership_progress")
      .update({ status: "cancelled", updated_at: now })
      .eq("user_id", user.id)
      .eq("bag_id", bagId)
      .eq("status", "active")

    // Nuevo registro collect (siempre 'active'); el credito se aplica tras registrar el libro
    const { data: created, error: insertErr } = await supabaseAdmin
      .from("ownership_progress")
      .insert({
        user_id: user.id,
        bag_id: bagId,
        mode: "collect",
        purchase_price: bag.purchase_price,
        accumulated: 0,
        status: "active",
        completed_at: null,
      })
      .select("id")
      .single()

    if (insertErr || !created) {
      console.error("[v0] convert-to-collect insert error:", insertErr)
      return NextResponse.json({ error: "No se pudo crear el progreso" }, { status: 500 })
    }

    let initialCredit = 0
    try {
      const rows: LedgerRow[] = preview.eligible.map((invoice) => ({
        ownership_progress_id: created.id,
        user_id: user.id,
        stripe_invoice_id: invoice.id,
        amount_cents: invoice.amount_cents,
        source: "rental_conversion",
      }))
      // Solo cuentan las filas realmente insertadas (si otra peticion se adelanto, no se duplica)
      const inserted = await insertLedgerEntries(supabaseAdmin, rows)
      const creditCents = inserted.reduce((total, row) => total + row.amount_cents, 0)
      initialCredit = Math.round(Math.min(creditCents / 100, target) * 100) / 100

      if (initialCredit > 0) {
        const { error: updateErr } = await supabaseAdmin
          .from("ownership_progress")
          .update({ accumulated: initialCredit, updated_at: new Date().toISOString() })
          .eq("id", created.id)
        if (updateErr) throw updateErr
      }
    } catch (err) {
      console.error("[v0] convert-to-collect error aplicando el credito:", err)
      await supabaseAdmin.from("ownership_credit_entries").delete().eq("ownership_progress_id", created.id)
      await supabaseAdmin.from("ownership_progress").delete().eq("id", created.id)
      return NextResponse.json({ error: "No se pudo aplicar el crédito. Inténtalo de nuevo." }, { status: 500 })
    }

    const readyToFinalize = initialCredit >= target
    if (readyToFinalize) {
      await notifyReadyToFinalize(supabaseAdmin, user.id, bagId)
    }

    return NextResponse.json({
      success: true,
      ownership_progress_id: created.id,
      initial_credit: initialCredit,
      ready_to_finalize: readyToFinalize,
    })
  } catch (err) {
    console.error("[v0] ownership/convert-to-collect error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    )
  }
}
