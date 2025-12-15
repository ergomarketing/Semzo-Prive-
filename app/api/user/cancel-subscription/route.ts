import { NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import Stripe from "stripe"
import { EmailServiceProduction } from "@/app/lib/email-service-production"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-06-20",
})

export async function POST() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
        },
      },
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("stripe_subscription_id, email, full_name, membership_type, membership_status, subscription_end_date")
      .eq("id", user.id)
      .single()

    if (!profile?.membership_status || profile.membership_status === "free") {
      return NextResponse.json({ error: "No tienes una membresía activa" }, { status: 400 })
    }

    let cancelDate: string

    if (profile.stripe_subscription_id) {
      // Cancelar suscripción en Stripe (al final del período)
      const subscription = await stripe.subscriptions.update(profile.stripe_subscription_id, {
        cancel_at_period_end: true,
      })

      // Actualizar en nuestra base de datos
      await supabase
        .from("subscriptions")
        .update({
          cancel_at_period_end: true,
          updated_at: new Date().toISOString(),
        })
        .eq("stripe_subscription_id", profile.stripe_subscription_id)

      cancelDate = new Date(subscription.current_period_end * 1000).toLocaleDateString("es-ES")
    } else {
      // Just set end date to now to cancel immediately since it's prepaid
      const now = new Date()

      await supabase
        .from("profiles")
        .update({
          membership_status: "cancelled",
          updated_at: now.toISOString(),
        })
        .eq("id", user.id)

      // Update user_memberships table if it exists
      await supabase
        .from("user_memberships")
        .update({
          status: "cancelled",
        })
        .eq("user_id", user.id)

      cancelDate = profile.subscription_end_date
        ? new Date(profile.subscription_end_date).toLocaleDateString("es-ES")
        : new Date().toLocaleDateString("es-ES")
    }

    try {
      const emailService = EmailServiceProduction.getInstance()

      // Notify admin
      await emailService.sendWithResend({
        to: "mailbox@semzoprive.com",
        subject: `Membresía cancelada: ${profile.full_name}`,
        html: `
          <h2>Usuario ha cancelado su membresía</h2>
          <p><strong>Nombre:</strong> ${profile.full_name}</p>
          <p><strong>Email:</strong> ${profile.email}</p>
          <p><strong>Tipo de membresía:</strong> ${profile.membership_type}</p>
          <p><strong>Método de pago:</strong> ${profile.stripe_subscription_id ? "Stripe" : "Gift Card"}</p>
          <p><strong>Se cancela el:</strong> ${cancelDate}</p>
          ${
            profile.stripe_subscription_id
              ? "<p>La membresía permanecerá activa hasta el final del período de facturación.</p>"
              : "<p>Membresía activada con Gift Card - cancelada inmediatamente.</p>"
          }
        `,
      })

      // Notify user
      await emailService.sendWithResend({
        to: profile.email,
        subject: "Membresía cancelada - Semzo Privé",
        html: `
          <h2>Hola ${profile.full_name},</h2>
          <p>Tu membresía ha sido cancelada.</p>
          ${
            profile.stripe_subscription_id
              ? `<p>Seguirás teniendo acceso completo hasta el <strong>${cancelDate}</strong>.</p>
               <p>Si cambias de opinión, puedes reactivarla en cualquier momento desde tu panel.</p>`
              : `<p>Tu membresía ha sido cancelada efectivamente.</p>
               <p>Puedes activar una nueva membresía en cualquier momento desde tu panel.</p>`
          }
          <p>¡Esperamos verte pronto!</p>
        `,
      })
    } catch (emailError) {
      console.error("Error sending cancellation emails:", emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: profile.stripe_subscription_id
        ? "Tu suscripción se cancelará al final del período actual"
        : "Tu membresía ha sido cancelada",
      cancelDate: cancelDate,
    })
  } catch (error) {
    console.error("Error canceling subscription:", error)
    return NextResponse.json({ error: "Error al cancelar membresía" }, { status: 500 })
  }
}
