import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import {
  COLECCIONA_PURCHASE_DOCUMENT,
  COLECCIONA_PURCHASE_VERSION,
  getAmountDue,
  getAppliedCredit,
} from "@/lib/ownership-credit"
import { recordLegalAcceptance } from "@/lib/legal-acceptance"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

/**
 * POST /api/user/ownership/complete
 *
 * Finaliza la compra del bolso reservado en modo Colecciona.
 * Body: { accepted_terms: true, expected_amount: number }
 * - Exige aceptación expresa de las condiciones de compra (se registra en legal_acceptances).
 * - Cobra precio - crédito aplicable (crédito acumulado con tope del 20% del precio).
 * - El importe esperado debe coincidir con el calculado en servidor; si no, no se cobra.
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
    if (body?.accepted_terms !== true) {
      return NextResponse.json(
        { error: "Debes aceptar las condiciones de compra antes de pagar", code: "terms_required" },
        { status: 400 },
      )
    }
    const expectedAmount = Number(body?.expected_amount)
    if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
      return NextResponse.json({ error: "Importe a confirmar no válido", code: "amount_required" }, { status: 400 })
    }

    // 1. Buscar ownership_progress activo modo collect
    const { data: progress, error: progressErr } = await supabaseAdmin
      .from("ownership_progress")
      .select("id, bag_id, mode, status, accumulated, purchase_price")
      .eq("user_id", user.id)
      .eq("mode", "collect")
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (progressErr || !progress) {
      return NextResponse.json({ error: "No hay compra en curso" }, { status: 404 })
    }
    if (progress.purchase_price == null) {
      return NextResponse.json({ error: "Precio no disponible" }, { status: 400 })
    }

    const accumulated = Number(progress.accumulated || 0)
    const target = Number(progress.purchase_price)
    const appliedCredit = getAppliedCredit(accumulated, target)
    const amountDue = getAmountDue(accumulated, target)

    // 2. Importe a cobrar (en céntimos). Debe coincidir con lo que la socia vio y confirmó.
    const amountCents = Math.round(amountDue * 100)
    if (amountCents <= 0) {
      return NextResponse.json({ error: "Importe a cobrar no válido" }, { status: 400 })
    }
    if (Math.abs(Math.round(expectedAmount * 100) - amountCents) > 1) {
      return NextResponse.json(
        {
          error: "El importe ha cambiado. Revisa el detalle y confirma de nuevo.",
          code: "amount_mismatch",
          amount_due: amountDue,
        },
        { status: 409 },
      )
    }

    // Protección contra doble clic: otra confirmación para este progreso en los últimos 30 s
    const { data: recent } = await supabaseAdmin
      .from("legal_acceptances")
      .select("id")
      .eq("user_id", user.id)
      .eq("context", "colecciona_purchase")
      .eq("reference_id", progress.id)
      .gte("accepted_at", new Date(Date.now() - 30_000).toISOString())
      .limit(1)
    if (recent && recent.length > 0) {
      return NextResponse.json({ error: "Ya hay un pago en curso. Espera unos segundos." }, { status: 429 })
    }

    // Registrar la aceptación ANTES de cobrar; si no se puede guardar, no se cobra
    const { data: bagInfo } = await supabaseAdmin
      .from("bags")
      .select("brand, name")
      .eq("id", progress.bag_id)
      .maybeSingle()
    const bagLabel = bagInfo ? `${bagInfo.brand} ${bagInfo.name}` : progress.bag_id
    const acceptanceId = await recordLegalAcceptance(supabaseAdmin, {
      userId: user.id,
      context: "colecciona_purchase",
      document: COLECCIONA_PURCHASE_DOCUMENT,
      documentVersion: COLECCIONA_PURCHASE_VERSION,
      referenceId: progress.id,
      textSnapshot:
        `Compra definitiva del bolso ${bagLabel}. Precio ${target.toFixed(2)} EUR; crédito aplicado ` +
        `${appliedCredit.toFixed(2)} EUR; importe a cobrar ${amountDue.toFixed(2)} EUR. La socia declara conocer y ` +
        `aceptar el estado del bolso tras su uso durante la membresía y que no se admiten devoluciones por cambio de opinión.`,
      request: req,
      metadata: { bag_id: progress.bag_id, price: target, credit: appliedCredit, amount_due: amountDue },
    })
    if (!acceptanceId) {
      return NextResponse.json({ error: "No se pudo registrar tu aceptación. No se ha cobrado nada." }, { status: 500 })
    }

    // 3. Recuperar customer + payment method default de la membresía activa
    const { data: mem } = await supabaseAdmin
      .from("user_memberships")
      .select("stripe_customer_id, stripe_subscription_id")
      .eq("user_id", user.id)
      .in("status", ["active", "cancelled_active", "past_due"])
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!mem?.stripe_customer_id) {
      return NextResponse.json({ error: "Sin método de pago registrado" }, { status: 400 })
    }

    // Obtener payment method default del customer
    const customer = (await stripe.customers.retrieve(mem.stripe_customer_id)) as Stripe.Customer
    const pmId =
      (customer.invoice_settings?.default_payment_method as string | null) ||
      (typeof customer.default_source === "string" ? customer.default_source : null)

    if (!pmId) {
      // Fallback: listar payment methods
      const pms = await stripe.paymentMethods.list({
        customer: mem.stripe_customer_id,
        type: "card",
        limit: 1,
      })
      if (!pms.data.length) {
        return NextResponse.json({ error: "Sin tarjeta válida" }, { status: 400 })
      }
    }

    // 4. Crear y confirmar PaymentIntent off_session
    let pi: Stripe.PaymentIntent
    try {
      pi = await stripe.paymentIntents.create({
        amount: amountCents,
        currency: "eur",
        customer: mem.stripe_customer_id,
        payment_method:
          pmId ||
          (
            await stripe.paymentMethods.list({
              customer: mem.stripe_customer_id,
              type: "card",
              limit: 1,
            })
          ).data[0].id,
        off_session: true,
        confirm: true,
        description: `Compra Colecciona bolso ${progress.bag_id}`,
        metadata: {
          user_id: user.id,
          bag_id: progress.bag_id,
          ownership_progress_id: progress.id,
          legal_acceptance_id: acceptanceId,
          type: "rent_to_own_completion",
        },
      }, { idempotencyKey: `colecciona-complete-${acceptanceId}` })
    } catch (err: any) {
      // Si requiere SCA, Stripe lanza err con payment_intent.client_secret
      const piErr = err?.payment_intent
      if (piErr?.client_secret) {
        return NextResponse.json(
          {
            requires_action: true,
            client_secret: piErr.client_secret,
            error: "Se necesita confirmación del banco",
          },
          { status: 402 },
        )
      }
      throw err
    }

    if (pi.status !== "succeeded") {
      return NextResponse.json(
        { error: `Pago no confirmado (${pi.status})`, payment_intent_id: pi.id },
        { status: 402 },
      )
    }

    // 5. Marcar progreso como completed
    const now = new Date().toISOString()
    await supabaseAdmin
      .from("ownership_progress")
      .update({
        accumulated: target,
        status: "completed",
        completed_at: now,
        updated_at: now,
      })
      .eq("id", progress.id)

    return NextResponse.json({
      success: true,
      paid_amount: amountCents / 100,
      payment_intent_id: pi.id,
    })
  } catch (err) {
    console.error("[v0] ownership/complete error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error desconocido" },
      { status: 500 },
    )
  }
}
