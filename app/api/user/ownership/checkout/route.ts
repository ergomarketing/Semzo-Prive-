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

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

/**
 * POST /api/user/ownership/checkout
 *
 * Inicia el pago de la compra del bolso en Modo Colecciona con Stripe Checkout
 * (la socia esta presente): puede pagar con tarjeta o con los metodos que tengas
 * activados en Stripe (Klarna, Scalapay, seQura...), segun importe y pais. No se fijan
 * payment_method_types a proposito: Checkout usa los metodos del Dashboard.
 *
 * Body: { accepted_terms: true, expected_amount: number }
 * Misma validacion y misma aceptacion legal que el cobro off-session; la venta se
 * cierra cuando Stripe confirma el pago (webhook o /api/user/ownership/verify-purchase).
 */
export async function POST(req: NextRequest) {
  try {
    const supabaseUser = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabaseUser.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

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

    const { data: progress } = await supabaseAdmin
      .from("ownership_progress")
      .select("id, bag_id, accumulated, purchase_price")
      .eq("user_id", user.id)
      .eq("mode", "collect")
      .eq("status", "active")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!progress) return NextResponse.json({ error: "No hay compra en curso" }, { status: 404 })
    if (progress.purchase_price == null) return NextResponse.json({ error: "Precio no disponible" }, { status: 400 })

    const { data: bag } = await supabaseAdmin
      .from("bags")
      .select("brand, name, status, images, image_url")
      .eq("id", progress.bag_id)
      .maybeSingle()
    if (!bag) return NextResponse.json({ error: "Bolso no encontrado" }, { status: 404 })
    if (bag.status === "colecciona") {
      return NextResponse.json({ error: "Este bolso ya ha sido vendido", code: "already_sold" }, { status: 409 })
    }

    const accumulated = Number(progress.accumulated || 0)
    const target = Number(progress.purchase_price)
    const appliedCredit = getAppliedCredit(accumulated, target)
    const amountDue = getAmountDue(accumulated, target)
    const amountCents = Math.round(amountDue * 100)

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

    // Proteccion contra doble clic
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

    const bagLabel = `${bag.brand || ""} ${bag.name || ""}`.trim()

    // La aceptacion se guarda ANTES de crear el pago; si no se puede guardar, no se sigue
    const acceptanceId = await recordLegalAcceptance(supabaseAdmin, {
      userId: user.id,
      context: "colecciona_purchase",
      document: COLECCIONA_PURCHASE_DOCUMENT,
      documentVersion: COLECCIONA_PURCHASE_VERSION,
      referenceId: progress.id,
      textSnapshot:
        `Compra definitiva del bolso ${bagLabel}. Precio ${target.toFixed(2)} EUR; crédito aplicado ` +
        `${appliedCredit.toFixed(2)} EUR; importe a pagar ${amountDue.toFixed(2)} EUR. La socia declara conocer y ` +
        `aceptar el estado del bolso tras su uso durante la membresía y que no se admiten devoluciones por cambio de opinión.`,
      request: req,
      metadata: { bag_id: progress.bag_id, price: target, credit: appliedCredit, amount_due: amountDue },
    })
    if (!acceptanceId) {
      return NextResponse.json({ error: "No se pudo registrar tu aceptación. No se ha cobrado nada." }, { status: 500 })
    }

    // Customer de Stripe: el de la membresia (donde esta la tarjeta guardada) o el del perfil
    const { data: mem } = await supabaseAdmin
      .from("user_memberships")
      .select("stripe_customer_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    let customerId = mem?.stripe_customer_id as string | null | undefined
    if (!customerId) {
      const { data: profile } = await supabaseAdmin
        .from("profiles")
        .select("stripe_customer_id, email, full_name")
        .eq("id", user.id)
        .maybeSingle()
      customerId = profile?.stripe_customer_id
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: profile?.email || user.email || undefined,
          name: profile?.full_name || undefined,
          metadata: { supabase_user_id: user.id },
        })
        customerId = customer.id
        await supabaseAdmin.from("profiles").update({ stripe_customer_id: customerId }).eq("id", user.id)
      }
    }

    const vercelEnv = process.env.VERCEL_ENV
    const baseUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (vercelEnv === "preview" && process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "https://semzoprive.com")

    const productImage = bag.images?.[0]?.url || bag.images?.[0] || bag.image_url
    const metadata = {
      type: "colecciona_purchase",
      user_id: user.id,
      bag_id: progress.bag_id,
      ownership_progress_id: progress.id,
      legal_acceptance_id: acceptanceId,
    }

    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        customer: customerId,
        locale: "es",
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: {
                name: bagLabel || "Bolso Semzo Privé",
                description:
                  appliedCredit > 0
                    ? `Compra definitiva — Colecciona (crédito aplicado: ${appliedCredit.toFixed(2)} €)`
                    : "Compra definitiva — Colecciona Semzo Privé",
                ...(typeof productImage === "string" && productImage.startsWith("http") ? { images: [productImage] } : {}),
              },
              unit_amount: amountCents,
            },
            quantity: 1,
          },
        ],
        metadata,
        payment_intent_data: { metadata },
        success_url: `${baseUrl}/post-checkout/colecciona?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${baseUrl}/dashboard?colecciona=cancelled`,
        billing_address_collection: "auto",
        customer_update: { address: "auto", name: "auto" },
      },
      { idempotencyKey: `colecciona-checkout-${acceptanceId}` },
    )

    return NextResponse.json({ url: session.url, sessionId: session.id })
  } catch (err) {
    console.error("[colecciona-checkout] error:", err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "No se pudo iniciar el pago" },
      { status: 500 },
    )
  }
}
