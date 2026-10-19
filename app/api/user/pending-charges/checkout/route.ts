import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { createClient } from "@/lib/supabase/server"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: "2024-12-18.acacia" as Stripe.LatestApiVersion })

/**
 * POST /api/user/pending-charges/checkout  { reservation_id }
 * Pago manual (Stripe Checkout) de un cargo por no devolucion que el banco rechazo. El importe sale de la propia
 * reserva (nunca del cliente). Al pagarse, el webhook marca la reserva como pagada.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const reservationId = String(body?.reservation_id || "")
    if (!reservationId) return NextResponse.json({ error: "Falta reservation_id" }, { status: 400 })

    const admin = createServiceClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
    const { data: reservation } = await admin
      .from("reservations")
      .select("id, user_id, sepa_charge_amount, sepa_charge_failed_at, sepa_charged_at, sepa_manual_paid_at, bags(brand, name)")
      .eq("id", reservationId)
      .eq("user_id", user.id)
      .maybeSingle()
    if (!reservation || !reservation.sepa_charge_failed_at || reservation.sepa_charged_at || reservation.sepa_manual_paid_at) {
      return NextResponse.json({ error: "No hay ningún pago pendiente para esta reserva" }, { status: 404 })
    }
    const amountCents = Math.round(Number(reservation.sepa_charge_amount) * 100)
    if (!Number.isFinite(amountCents) || amountCents < 50) {
      return NextResponse.json({ error: "Importe no válido. Escríbenos a info@semzoprive.com." }, { status: 400 })
    }

    const bag = (Array.isArray(reservation.bags) ? reservation.bags[0] : reservation.bags) as {
      brand?: string
      name?: string
    } | null
    const bagLabel = bag ? `${bag.brand || ""} ${bag.name || ""}`.trim() : "Bolso"

    const { data: profile } = await admin
      .from("profiles")
      .select("stripe_customer_id, email")
      .eq("id", user.id)
      .maybeSingle()

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"
    const metadata = {
      type: "non_return_manual_payment",
      reservation_id: reservation.id,
      user_id: user.id,
    }
    const session = await stripe.checkout.sessions.create(
      {
        mode: "payment",
        locale: "es",
        ...(profile?.stripe_customer_id
          ? { customer: profile.stripe_customer_id }
          : { customer_email: profile?.email || user.email || undefined }),
        line_items: [
          {
            price_data: {
              currency: "eur",
              product_data: { name: `Compra ${bagLabel}`, description: "Regularización de bolso no devuelto" },
              unit_amount: amountCents,
            },
            quantity: 1,
          },
        ],
        metadata,
        payment_intent_data: { metadata },
        success_url: `${baseUrl}/dashboard?cargo=pagado`,
        cancel_url: `${baseUrl}/dashboard`,
      },
      { idempotencyKey: `non-return-manual-${reservation.id}-${amountCents}-${Math.floor(Date.now() / 600000)}` },
    )

    await admin.from("reservations").update({ sepa_manual_payment_session_id: session.id }).eq("id", reservation.id)
    return NextResponse.json({ url: session.url })
  } catch (err) {
    console.error("[pending-charges] checkout error:", err)
    return NextResponse.json({ error: "No se pudo iniciar el pago" }, { status: 500 })
  }
}
