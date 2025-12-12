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
      .select("stripe_subscription_id, email, full_name, membership_type")
      .eq("id", user.id)
      .single()

    if (!profile?.stripe_subscription_id) {
      return NextResponse.json({ error: "No tienes una suscripción activa" }, { status: 400 })
    }

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

    try {
      const emailService = EmailServiceProduction.getInstance()
      const cancelDate = new Date(subscription.current_period_end * 1000).toLocaleDateString("es-ES")

      // Notify admin
      await emailService.sendWithResend({
        to: "mailbox@semzoprive.com",
        subject: `Membresía cancelada: ${profile.full_name}`,
        html: `
          <h2>Usuario ha cancelado su membresía</h2>
          <p><strong>Nombre:</strong> ${profile.full_name}</p>
          <p><strong>Email:</strong> ${profile.email}</p>
          <p><strong>Tipo de membresía:</strong> ${profile.membership_type}</p>
          <p><strong>Se cancela el:</strong> ${cancelDate}</p>
          <p>La membresía permanecerá activa hasta el final del período de facturación.</p>
        `,
      })

      // Notify user
      await emailService.sendWithResend({
        to: profile.email,
        subject: "Membresía cancelada - Semzo Privé",
        html: `
          <h2>Hola ${profile.full_name},</h2>
          <p>Tu membresía ha sido programada para cancelación.</p>
          <p>Seguirás teniendo acceso completo hasta el <strong>${cancelDate}</strong>.</p>
          <p>Si cambias de opinión, puedes reactivarla en cualquier momento desde tu panel.</p>
          <p>¡Esperamos verte pronto!</p>
        `,
      })
    } catch (emailError) {
      console.error("Error sending cancellation emails:", emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({
      success: true,
      message: "Tu suscripción se cancelará al final del período actual",
      cancelAt: subscription.current_period_end,
    })
  } catch (error) {
    console.error("Error canceling subscription:", error)
    return NextResponse.json({ error: "Error al cancelar suscripción" }, { status: 500 })
  }
}
