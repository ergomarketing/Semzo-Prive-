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

    // Leer membresia de user_memberships (FUENTE DE VERDAD)
    const { data: membership } = await supabase
      .from("user_memberships")
      .select("id, user_id, status, membership_type, stripe_subscription_id, end_date")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!membership || membership.status === "free" || membership.status === "cancelled") {
      return NextResponse.json({ error: "No tienes una membresia activa" }, { status: 400 })
    }

    // Leer datos de contacto de profiles (solo lectura)
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("id", user.id)
      .single()

    let cancelDate: string

    if (membership.stripe_subscription_id) {
      // Cancelar suscripcion en Stripe (al final del periodo)
      const subscription = await stripe.subscriptions.update(membership.stripe_subscription_id, {
        cancel_at_period_end: true,
      })

      // Actualizar en user_memberships (FUENTE DE VERDAD)
      await supabase
        .from("user_memberships")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", membership.id)

      cancelDate = new Date(subscription.current_period_end * 1000).toLocaleDateString("es-ES")
    } else {
      // Cancelar inmediatamente (prepaid/gift card)
      await supabase
        .from("user_memberships")
        .update({
          status: "cancelled",
          updated_at: new Date().toISOString(),
        })
        .eq("id", membership.id)

      cancelDate = membership.end_date
        ? new Date(membership.end_date).toLocaleDateString("es-ES")
        : new Date().toLocaleDateString("es-ES")
    }

    try {
      const emailService = EmailServiceProduction.getInstance()

      // Notify admin
      await emailService.sendWithResend({
        to: "mailbox@semzoprive.com",
        subject: `Membresia cancelada: ${profile?.full_name || "Usuario"}`,
        html: `
          <h2>Usuario ha cancelado su membresia</h2>
          <p><strong>Nombre:</strong> ${profile?.full_name || "N/A"}</p>
          <p><strong>Email:</strong> ${profile?.email || "N/A"}</p>
          <p><strong>Tipo de membresia:</strong> ${membership.membership_type}</p>
          <p><strong>Metodo de pago:</strong> ${membership.stripe_subscription_id ? "Stripe" : "Gift Card"}</p>
          <p><strong>Se cancela el:</strong> ${cancelDate}</p>
          ${
            membership.stripe_subscription_id
              ? "<p>La membresia permanecera activa hasta el final del periodo de facturacion.</p>"
              : "<p>Membresia activada con Gift Card - cancelada inmediatamente.</p>"
          }
        `,
      })

      // Notify user
      if (profile?.email) {
        await emailService.sendWithResend({
          to: profile.email,
          subject: "Membresia cancelada - Semzo Prive",
          html: `
            <h2>Hola ${profile.full_name},</h2>
            <p>Tu membresia ha sido cancelada.</p>
            ${
              membership.stripe_subscription_id
                ? `<p>Seguiras teniendo acceso completo hasta el <strong>${cancelDate}</strong>.</p>
                 <p>Si cambias de opinion, puedes reactivarla en cualquier momento desde tu panel.</p>`
                : `<p>Tu membresia ha sido cancelada efectivamente.</p>
                 <p>Puedes activar una nueva membresia en cualquier momento desde tu panel.</p>`
            }
            <p>Esperamos verte pronto!</p>
          `,
        })
      }
    } catch (emailError) {
      console.error("Error sending cancellation emails:", emailError)
    }

    return NextResponse.json({
      success: true,
      message: membership.stripe_subscription_id
        ? "Tu suscripcion se cancelara al final del periodo actual"
        : "Tu membresia ha sido cancelada",
      cancelDate: cancelDate,
    })
  } catch (error) {
    console.error("Error canceling subscription:", error)
    return NextResponse.json({ error: "Error al cancelar membresía" }, { status: 500 })
  }
}
