import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/lib/supabase-server"

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
 * Finaliza la compra rent-to-own del bolso reservado en modo Colecciona.
 * - Si accumulated >= purchase_price: cobra 1€ simbólico.
 * - Si accumulated  < purchase_price: cobra la diferencia.
 * Marca el registro como completed y libera el depósito (si existiera).
 */
export async function POST(_req: NextRequest) {
  try {
    const supabaseUser = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabaseUser.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
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
    const diff = Math.max(0, target - accumulated)

    // 2. Determinar importe a cobrar (en céntimos)
    const amountCents = diff > 0 ? Math.round(diff * 100) : 100 // 1€ simbólico

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
        description: `Compra rent-to-own bolso ${progress.bag_id}`,
        metadata: {
          user_id: user.id,
          bag_id: progress.bag_id,
          ownership_progress_id: progress.id,
          type: "rent_to_own_completion",
        },
      })
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
