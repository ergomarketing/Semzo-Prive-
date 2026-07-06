import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { Resend } from "resend"
import {
  generateDunningE1HTML,
  generateDunningAdminHTML,
} from "@/lib/email-templates-membership"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "", {
  apiVersion: "2025-02-24.acacia",
})

const resend = new Resend(process.env.EMAIL_API_KEY || process.env.RESEND_API_KEY)

const ADMIN_EMAIL = "mailbox@semzoprive.com"
const FROM_EMAIL = "hola@semzoprive.com"
const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_ENV === "production"
    ? "https://semzoprive.com"
    : process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://localhost:3000")

function getSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  )
}

/**
 * Webhook de Stripe — maneja:
 *  - invoice.payment_failed → E1 amable a la socia + alerta al admin
 *
 * El endpoint espera la firma del webhook en STRIPE_WEBHOOK_SECRET.
 * Si no está configurada, procesa el evento sin verificar (solo en dev).
 */
export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature") || ""
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  let event: Stripe.Event

  try {
    if (webhookSecret && sig) {
      event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
    } else {
      // Sin webhook secret configurado (dev / primer deploy)
      event = JSON.parse(body) as Stripe.Event
    }
  } catch (err: any) {
    console.error("[webhook] Firma inválida:", err.message)
    return NextResponse.json({ error: "Firma inválida" }, { status: 400 })
  }

  try {
    if (event.type === "invoice.payment_failed") {
      await handlePaymentFailed(event.data.object as Stripe.Invoice)
    }
    // Espacio para futuros eventos de Stripe
  } catch (err: any) {
    console.error("[webhook] Error procesando evento:", event.type, err.message)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }

  return NextResponse.json({ received: true })
}

async function handlePaymentFailed(invoice: Stripe.Invoice) {
  const customerId = typeof invoice.customer === "string" ? invoice.customer : invoice.customer?.id
  if (!customerId) return

  const supabase = getSupabase()

  // 1. Buscar la membresía por stripe_customer_id
  const { data: membership } = await supabase
    .from("user_memberships")
    .select("id, user_id, membership_type, status, dunning_status, failed_payment_count")
    .eq("stripe_customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!membership) {
    console.error("[webhook] No se encontró membresía para customer:", customerId)
    return
  }

  // 2. Evitar reenviar E1 si dunning ya está iniciado
  if (membership.dunning_status && membership.dunning_status !== "none") {
    console.log("[webhook] Dunning ya iniciado para user:", membership.user_id, "| estado:", membership.dunning_status)
    return
  }

  // 3. Datos de la socia
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name, email")
    .eq("id", membership.user_id)
    .maybeSingle()

  if (!profile?.email) return

  const userName = [profile.first_name, profile.last_name].filter(Boolean).join(" ") || "socia"

  // 4. Bolso activo en posesión (si tiene uno)
  const { data: activeReservation } = await supabase
    .from("reservations")
    .select("id, bags(name, brand)")
    .eq("user_id", membership.user_id)
    .not("status", "in", "(completed,cancelled,canceled)")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  const bag = (activeReservation?.bags as any)
  const bagName = bag ? `${bag.brand} ${bag.name}` : undefined

  const updatePaymentUrl = `${SITE_URL}/dashboard/membresia`

  // 5. Enviar E1 a la socia
  const e1Html = generateDunningE1HTML({
    userName,
    membershipType: membership.membership_type,
    bagName,
    updatePaymentUrl,
  })

  await resend.emails.send({
    from: `Semzo Privé <${FROM_EMAIL}>`,
    to: profile.email,
    subject: "Un pequeño recordatorio sobre tu pago — Semzo Privé",
    html: e1Html,
  })

  // 6. Notificar al admin
  const adminHtml = generateDunningAdminHTML({
    userName,
    userEmail: profile.email,
    membershipType: membership.membership_type,
    bagName,
    failedAt: new Date().toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" }),
    dunningStep: 1,
  })

  await resend.emails.send({
    from: `Semzo Privé <${FROM_EMAIL}>`,
    to: ADMIN_EMAIL,
    subject: `[Semzo Admin] Pago fallido — ${userName}`,
    html: adminHtml,
  })

  // 7. Actualizar estado dunning en BD
  await supabase
    .from("user_memberships")
    .update({
      dunning_status: "e1_sent",
      failed_payment_count: (membership.failed_payment_count || 0) + 1,
      updated_at: new Date().toISOString(),
    })
    .eq("id", membership.id)

  console.log("[webhook] Dunning E1 enviado a:", profile.email, "| bolso:", bagName || "ninguno")
}
