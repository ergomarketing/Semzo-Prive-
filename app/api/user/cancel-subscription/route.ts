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
      // Marcamos cancellation_email_sent_at aqui para que el webhook
      // (subscription.updated con cancel_at_period_end) NO reenvie el email:
      // esta ruta ya envia el email de cancelacion mas abajo. Evita duplicado.
      await supabase
        .from("user_memberships")
        .update({
          status: "cancelled",
          cancellation_email_sent_at: new Date().toISOString(),
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
