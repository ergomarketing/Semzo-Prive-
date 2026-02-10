import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import Stripe from "stripe"
import { EmailServiceProduction } from "@/app/lib/email-service-production"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { pauseMonths = 1 } = body

    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("stripe_subscription_id, stripe_customer_id, email, full_name, membership_type")
      .eq("id", user.id)
      .single()

    if (profileError || !profile?.stripe_subscription_id) {
      return NextResponse.json({ error: "No se encontró una suscripción activa" }, { status: 404 })
    }

    const pauseDate = new Date()
    pauseDate.setMonth(pauseDate.getMonth() + pauseMonths)

    const subscription = await stripe.subscriptions.update(profile.stripe_subscription_id, {
      pause_collection: {
        behavior: "void",
        resumes_at: Math.floor(pauseDate.getTime() / 1000),
      },
    })

    await supabase
      .from("profiles")
      .update({
        membership_status: "paused",
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    try {
      const emailService = EmailServiceProduction.getInstance()
      await emailService.sendWithResend({
        to: "mailbox@semzoprive.com",
        subject: `Membresía pausada: ${profile.full_name}`,
        html: `
          <h2>Usuario ha pausado su membresía</h2>
          <p><strong>Nombre:</strong> ${profile.full_name}</p>
          <p><strong>Email:</strong> ${profile.email}</p>
          <p><strong>Tipo de membresía:</strong> ${profile.membership_type}</p>
          <p><strong>Pausada hasta:</strong> ${pauseDate.toLocaleDateString("es-ES")}</p>
        `,
      })

      await emailService.sendWithResend({
        to: profile.email,
        subject: "Membresía pausada - Semzo Privé",
        html: `
          <h2>Hola ${profile.full_name},</h2>
          <p>Tu membresía ha sido pausada exitosamente.</p>
          <p>Se reactivará automáticamente el <strong>${pauseDate.toLocaleDateString("es-ES")}</strong></p>
          <p>Puedes reanudarla antes desde tu panel si lo deseas.</p>
        `,
      })
    } catch (emailError) {
      console.error("Error sending pause emails:", emailError)
    }

    return NextResponse.json({
      success: true,
      message: `Membresía pausada hasta ${pauseDate.toLocaleDateString("es-ES")}`,
      subscription,
    })
  } catch (error) {
    console.error("Error pausing subscription:", error)
    return NextResponse.json({ error: "Error al pausar la suscripción" }, { status: 500 })
  }
}
