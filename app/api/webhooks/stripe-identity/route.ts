import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!)

export async function POST(request: Request) {
  const body = await request.text()
  const signature = request.headers.get("stripe-signature")!

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_IDENTITY_WEBHOOK_SECRET || process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch (err: any) {
    console.error("Webhook signature verification failed:", err.message)
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 })
  }

  const session = event.data.object as Stripe.Identity.VerificationSession

  switch (event.type) {
    case "identity.verification_session.verified":
      // Verificación exitosa
      await supabase
        .from("identity_verifications")
        .update({
          status: "verified",
          verified_at: new Date().toISOString(),
        })
        .eq("stripe_verification_id", session.id)

      // Actualizar perfil del usuario como verificado
      if (session.metadata?.user_id) {
        await supabase
          .from("profiles")
          .update({
            identity_verified: true,
            identity_verified_at: new Date().toISOString(),
          })
          .eq("id", session.metadata.user_id)

        // Notificar al admin
        await supabase.from("admin_notifications").insert({
          type: "identity_verified",
          title: "Identidad verificada",
          message: `Usuario ${session.metadata.user_id} ha completado la verificación de identidad`,
          severity: "info",
          user_id: session.metadata.user_id,
        })
      }
      break

    case "identity.verification_session.requires_input":
      // Verificación fallida o requiere más información
      await supabase
        .from("identity_verifications")
        .update({
          status: "requires_input",
          last_error: session.last_error?.code || "unknown",
        })
        .eq("stripe_verification_id", session.id)

      // Notificar al admin sobre fallo
      if (session.metadata?.user_id) {
        await supabase.from("admin_notifications").insert({
          type: "identity_failed",
          title: "Verificación de identidad fallida",
          message: `Usuario ${session.metadata.user_id} falló verificación: ${session.last_error?.reason || "Error desconocido"}`,
          severity: "warning",
          user_id: session.metadata.user_id,
        })
      }
      break

    case "identity.verification_session.canceled":
      await supabase
        .from("identity_verifications")
        .update({ status: "canceled" })
        .eq("stripe_verification_id", session.id)
      break
  }

  return NextResponse.json({ received: true })
}
