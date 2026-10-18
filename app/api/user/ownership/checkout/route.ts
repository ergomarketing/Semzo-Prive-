import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { createServerSupabaseClient } from "@/lib/supabase-server"
import { getClientIp, recordLegalAcceptance } from "@/lib/legal-acceptance"
import {
  COLECCIONA_ANNEX_DOCUMENT,
  COLECCIONA_ANNEX_PHRASE,
  COLECCIONA_CONDITIONS_DOCUMENT,
  COLECCIONA_CONDITIONS_VERSION,
  COLECCIONA_CONTEXT_ANNEX,
  COLECCIONA_CONTEXT_CONDITIONS,
  COLECCIONA_CONTEXT_CONTRACT,
  COLECCIONA_CONTRACT_DOCUMENT,
  COLECCIONA_CONTRACT_VERSION,
  blocksToPlainText,
  buildAnnexBlocks,
  buildConditionsBlocks,
  buildContractBlocks,
} from "@/lib/colecciona-legal"
import { formatAcceptanceMoment, loadPurchaseContext, siteUrl } from "@/lib/ownership-purchase-data"

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
 * Body: { accepted_conditions?, accepted_contract: true, accepted_annex: true, expected_amount: number }
 * Antes de crear el pago se guardan, con el texto exacto, la fecha, la hora y la IP:
 *  1) Condiciones del Programa Colecciona (solo si la socia no las habia aceptado en esta version),
 *  2) Contrato de compraventa (v2) y 3) Anexo I — estado del bolso, esta ultima en casilla SEPARADA.
 * La venta se cierra cuando Stripe confirma el pago (webhook o /api/user/ownership/verify-purchase).
 */
export async function POST(req: NextRequest) {
  try {
    const supabaseUser = await createServerSupabaseClient()
    const {
      data: { user },
    } = await supabaseUser.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const expectedAmount = Number(body?.expected_amount)
    if (!Number.isFinite(expectedAmount) || expectedAmount <= 0) {
      return NextResponse.json({ error: "Importe a confirmar no válido", code: "amount_required" }, { status: 400 })
    }

    const loaded = await loadPurchaseContext(supabaseAdmin, user.id)
    if (!loaded.ok) {
      const status = loaded.code === "price_missing" ? 400 : 404
      return NextResponse.json({ error: loaded.message, code: loaded.code }, { status })
    }
    const { context } = loaded

    if (context.bag.status === "colecciona") {
      return NextResponse.json({ error: "Este bolso ya ha sido vendido", code: "already_sold" }, { status: 409 })
    }

    // Sin la ficha del estado (Anexo I) completa no se puede vender: el contrato no seria valido.
    if (!context.report) {
      await supabaseAdmin.from("admin_notifications").insert({
        type: "colecciona_report_missing",
        priority: "high",
        title: `Falta la ficha del estado para vender ${context.bag.brand} ${context.bag.name}`.trim(),
        message: `${context.member.full_name} quiere comprar ${context.bag.brand} ${context.bag.name} en Colecciona, pero la ficha del estado (Anexo I) no está completa. Rellénala en Inventario → editar bolso → Modo Colecciona.`,
        metadata: { user_id: user.id, bag_id: context.bag.id },
      })
      return NextResponse.json(
        {
          error: "Estamos terminando la ficha del estado de tu bolso. Te avisaremos en cuanto puedas completar la compra.",
          code: "condition_report_missing",
        },
        { status: 409 },
      )
    }

    // Aceptaciones: contrato y Anexo I SIEMPRE (casillas separadas); Condiciones del Programa si faltan.
    const missing: string[] = []
    if (body?.accepted_contract !== true) missing.push("accepted_contract")
    if (body?.accepted_annex !== true) missing.push("accepted_annex")
    if (!context.conditionsAccepted && body?.accepted_conditions !== true) missing.push("accepted_conditions")
    if (missing.length > 0) {
      return NextResponse.json(
        { error: "Debes aceptar las condiciones, el contrato y el estado del bolso antes de pagar", code: "terms_required", missing },
        { status: 400 },
      )
    }

    const { price, credit, due } = context.amounts
    const amountCents = Math.round(due * 100)

    if (Math.abs(Math.round(expectedAmount * 100) - amountCents) > 1) {
      return NextResponse.json(
        {
          error: "El importe ha cambiado. Revisa el detalle y confirma de nuevo.",
          code: "amount_mismatch",
          amount_due: due,
        },
        { status: 409 },
      )
    }

    // Proteccion contra doble clic
    const { data: recent } = await supabaseAdmin
      .from("legal_acceptances")
      .select("id")
      .eq("user_id", user.id)
      .eq("context", COLECCIONA_CONTEXT_CONTRACT)
      .eq("reference_id", context.progress.id)
      .gte("accepted_at", new Date(Date.now() - 30_000).toISOString())
      .limit(1)
    if (recent && recent.length > 0) {
      return NextResponse.json({ error: "Ya hay un pago en curso. Espera unos segundos." }, { status: 429 })
    }

    const bagLabel = `${context.bag.brand} ${context.bag.name}`.trim()
    const stamp = {
      fecha_hora_aceptacion: formatAcceptanceMoment(),
      ip_aceptacion: getClientIp(req) || "no disponible",
    }

    // Las aceptaciones se guardan ANTES de crear el pago; si alguna no se puede guardar, no se sigue.
    if (!context.conditionsAccepted) {
      const conditionsId = await recordLegalAcceptance(supabaseAdmin, {
        userId: user.id,
        context: COLECCIONA_CONTEXT_CONDITIONS,
        document: COLECCIONA_CONDITIONS_DOCUMENT,
        documentVersion: COLECCIONA_CONDITIONS_VERSION,
        referenceId: context.progress.id,
        textSnapshot: blocksToPlainText(buildConditionsBlocks()),
        request: req,
        metadata: { bag_id: context.bag.id },
      })
      if (!conditionsId) {
        return NextResponse.json({ error: "No se pudo registrar tu aceptación. No se ha cobrado nada." }, { status: 500 })
      }
    }

    const annexId = await recordLegalAcceptance(supabaseAdmin, {
      userId: user.id,
      context: COLECCIONA_CONTEXT_ANNEX,
      document: COLECCIONA_ANNEX_DOCUMENT,
      documentVersion: COLECCIONA_CONTRACT_VERSION,
      referenceId: context.progress.id,
      textSnapshot: `${blocksToPlainText(buildAnnexBlocks(context.vars))}\n\n${COLECCIONA_ANNEX_PHRASE}`,
      request: req,
      metadata: { bag_id: context.bag.id, report: context.report },
    })
    if (!annexId) {
      return NextResponse.json({ error: "No se pudo registrar tu aceptación. No se ha cobrado nada." }, { status: 500 })
    }

    const acceptanceId = await recordLegalAcceptance(supabaseAdmin, {
      userId: user.id,
      context: COLECCIONA_CONTEXT_CONTRACT,
      document: COLECCIONA_CONTRACT_DOCUMENT,
      documentVersion: COLECCIONA_CONTRACT_VERSION,
      referenceId: context.progress.id,
      textSnapshot: blocksToPlainText(buildContractBlocks(context.vars, stamp)),
      request: req,
      // vars + stamp bastan para reconstruir el PDF identico tras el pago
      metadata: {
        bag_id: context.bag.id,
        price,
        credit,
        amount_due: due,
        conditions_version: COLECCIONA_CONDITIONS_VERSION,
        annex_acceptance_id: annexId,
        vars: context.vars,
        stamp,
      },
    })
    if (!acceptanceId) {
      return NextResponse.json({ error: "No se pudo registrar tu aceptación. No se ha cobrado nada." }, { status: 500 })
    }

    const progress = { id: context.progress.id, bag_id: context.progress.bag_id }
    const bag = { images: context.bag.images, image_url: context.bag.image_url }
    const appliedCredit = credit

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
