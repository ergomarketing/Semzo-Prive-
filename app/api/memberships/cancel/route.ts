import Stripe from "stripe"
import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { EmailServiceProduction } from "@/app/lib/email-service-production"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export async function POST(req: Request) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      { cookies: { getAll: () => cookieStore.getAll() } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

    const body = await req.json()
    const subscriptionId = body.subscriptionId || null

    // Leer membresía activa desde BD (fuente de verdad)
    const { data: membership } = await supabase
      .from("user_memberships")
      .select("id, user_id, status, membership_type, stripe_subscription_id, end_date, start_date")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!membership || ["free", "cancelled", "canceled", "cancelling"].includes(membership.status)) {
      return NextResponse.json({ error: "No tienes una membresía activa" }, { status: 400 })
    }

    // Leer perfil del usuario para emails
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user.id)
      .single()

    let cancelDate: string

    if (subscriptionId || membership.stripe_subscription_id) {
      // Stripe subscription: cancelar al final del periodo
      const subId = subscriptionId || membership.stripe_subscription_id
      try {
        const subscription = await stripe.subscriptions.update(subId, {
          cancel_at_period_end: true,
        })
        cancelDate = new Date(subscription.current_period_end * 1000).toLocaleDateString("es-ES")
      } catch (stripeError: any) {
        console.error("[memberships/cancel] Stripe error:", stripeError.message)
        // Continuar con BD update aunque Stripe falle (p.ej. sub ya cancelada)
        cancelDate = membership.end_date
          ? new Date(membership.end_date).toLocaleDateString("es-ES")
          : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString("es-ES")
      }

      // Update BD: cancelled con acceso vigente hasta end_date.
      // can_make_reservations queda en true para que el usuario siga pudiendo
      // gestionar reservas hasta el final del periodo pagado.
      await supabase
        .from("user_memberships")
        .update({
          status: "cancelled",
          can_make_reservations: true,
          updated_at: new Date().toISOString(),
        })
        .eq("id", membership.id)
    } else {
      // Prepaid/gift card: cancelar inmediatamente.
      // Si aún hay end_date futuro mantenemos acceso, si no, se corta.
      const endDate = membership.end_date ? new Date(membership.end_date) : null
      const stillValid = endDate ? endDate.getTime() > Date.now() : false

      await supabase
        .from("user_memberships")
        .update({
          status: "cancelled",
          can_make_reservations: stillValid,
          updated_at: new Date().toISOString(),
        })
        .eq("id", membership.id)

      cancelDate = endDate
        ? endDate.toLocaleDateString("es-ES")
        : new Date().toLocaleDateString("es-ES")
    }

    // Enviar emails (usuario + admin)
    try {
      const emailService = EmailServiceProduction.getInstance()

      // Correo de MARCA de cancelacion (al usuario y aviso al admin), el mismo que usa el webhook de Stripe.
      // Antes esta ruta mandaba un texto sencillo sin marca (<h2>) y un aviso admin aparte.
      const tierLabels: Record<string, string> = {
        petite: "Petite",
        essentiel: "L'Essentiel",
        signature: "Signature",
        prive: "Privé",
      }
      if (profile?.email) {
        await emailService.sendMembershipCancelledEmail({
          userName: profile.full_name || "",
          userEmail: profile.email,
          membershipType: tierLabels[membership.membership_type] || membership.membership_type,
          endDate: cancelDate,
        })
      }

      // Marca de enviado: el webhook de Stripe (subscription.updated) NO repite el correo.
      await supabase
        .from("user_memberships")
        .update({ cancellation_email_sent_at: new Date().toISOString() })
        .eq("id", membership.id)
    } catch (emailError) {
      console.error("[memberships/cancel] Error sending emails:", emailError)
      // No fallar la request si el email falla
    }

    return NextResponse.json({
      success: true,
      cancelDate,
      message:
        subscriptionId || membership.stripe_subscription_id
          ? `Tu membresía se cancelará el ${cancelDate}`
          : "Tu membresía ha sido cancelada",
    })
  } catch (error: any) {
    console.error("[memberships/cancel] Error:", error)
    return NextResponse.json({ error: error.message || "Error al cancelar membresía" }, { status: 500 })
  }
}
