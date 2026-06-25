/**
 * POST /api/stripe/pay-membership
 *
 * Permite a una socia con membresía impagada (past_due / unpaid) PAGAR
 * directamente la factura pendiente de SU suscripción existente, sin pasar
 * por el catálogo de membresías (que crearía una suscripción nueva).
 *
 * Stripe es la fuente de verdad: devolvemos la URL hospedada de la factura
 * abierta (hosted_invoice_url), que gestiona 3DS/SCA de forma segura.
 *
 * NO crea suscripciones nuevas. NO modifica el sistema de pagos.
 */

import { NextResponse } from "next/server"
import { createClient } from "@/utils/supabase/server"
import Stripe from "stripe"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2025-02-24.acacia",
})

export async function POST() {
  try {
    const supabase = await createClient()

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Suscripción Stripe de la socia (user_memberships, fallback profiles)
    const { data: membership } = await supabase
      .from("user_memberships")
      .select("stripe_subscription_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    let subId = membership?.stripe_subscription_id || null

    if (!subId) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("stripe_subscription_id")
        .eq("id", user.id)
        .single()
      subId = profile?.stripe_subscription_id || null
    }

    if (!subId) {
      return NextResponse.json(
        { error: "No encontramos una suscripción asociada a tu cuenta." },
        { status: 404 },
      )
    }

    // Recuperar la suscripción y su última factura
    const subscription = await stripe.subscriptions.retrieve(subId, {
      expand: ["latest_invoice"],
    })

    const invoice = subscription.latest_invoice
    if (!invoice || typeof invoice === "string") {
      return NextResponse.json(
        { error: "No hay ninguna factura pendiente de pago en este momento." },
        { status: 404 },
      )
    }

    // Si ya está pagada, no hay nada que cobrar
    if (invoice.status === "paid") {
      return NextResponse.json(
        { error: "Tu última factura ya está pagada.", alreadyPaid: true },
        { status: 409 },
      )
    }

    // URL hospedada por Stripe para pagar la factura (gestiona 3DS/SCA)
    if (invoice.hosted_invoice_url) {
      return NextResponse.json({ url: invoice.hosted_invoice_url })
    }

    // Fallback: finalizar la factura para generar la URL si aún no existe
    if (invoice.id) {
      const finalized = await stripe.invoices.finalizeInvoice(invoice.id)
      if (finalized.hosted_invoice_url) {
        return NextResponse.json({ url: finalized.hosted_invoice_url })
      }
    }

    return NextResponse.json(
      { error: "No se pudo generar el enlace de pago. Inténtalo de nuevo." },
      { status: 500 },
    )
  } catch (error: any) {
    console.error("[pay-membership] Error:", error?.message || error)
    return NextResponse.json({ error: "Error al generar el enlace de pago." }, { status: 500 })
  }
}
