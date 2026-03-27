import { NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"
import { syncMembershipFromStripe } from "@/app/api/membership/activate/orchestrator"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get("session_id")

  if (!sessionId) {
    return NextResponse.json({ error: "Missing session_id" }, { status: 400 })
  }

  try {
    const session = await stripe.checkout.sessions.retrieve(sessionId)

    // --- MODO PAYMENT (pase de bolso) ---
    // No tiene subscription, el pago fue único → redirigir directo al dashboard
    if (session.mode === "payment") {
      // Pases de bolso: sin verificacion de identidad — siempre directo al dashboard
      if (session.payment_status === "paid") {
        return NextResponse.json({
          status: "active",
          identity_verified: true,
          mode: "payment",
        })
      }
      return NextResponse.json({ status: "incomplete" })
    }

    // --- MODO SUBSCRIPTION (membresia) ---
    if (!session.subscription) {
      return NextResponse.json({ status: "incomplete" })
    }

    const subscription = await stripe.subscriptions.retrieve(
      session.subscription as string
    )

    // Sincronizar en background — no bloquear la respuesta
    syncMembershipFromStripe(subscription).catch(() => {})

    // Prioridad: client_reference_id > session.metadata > subscription.metadata
    const userId =
      session.client_reference_id ||
      session.metadata?.user_id ||
      subscription.metadata?.user_id ||
      null

    console.log("[v0] verify-session: userId lookup", {
      client_reference_id: session.client_reference_id,
      session_metadata_user_id: session.metadata?.user_id,
      sub_metadata_user_id: subscription.metadata?.user_id,
      resolved_userId: userId,
    })

    if (!userId) {
      console.error("[verify-session] No user_id encontrado")
      // Aun sin userId, si Stripe confirma el pago, redirigir a identity
      // para que el usuario pueda verificarse manualmente
      if (subscription.status === "active" || subscription.status === "trialing") {
        return NextResponse.json({
          status: "active",
          identity_verified: false,
          user_id: null,
          mode: "subscription",
        })
      }
      return NextResponse.json({ status: "incomplete" })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("identity_verified, membership_status")
      .eq("id", userId)
      .single()

    // Si la suscripcion de Stripe esta activa o en trial, el pago fue exitoso
    // No dependemos de que el webhook haya activado la fila — eso puede tardar
    const stripePaymentOk =
      subscription.status === "active" ||
      subscription.status === "trialing" ||
      subscription.status === "incomplete" // primer pago puede quedar en incomplete momentáneamente

    if (stripePaymentOk) {
      return NextResponse.json({
        status: "active",
        identity_verified: profile?.identity_verified ?? false,
        user_id: userId,
        mode: "subscription",
      })
    }

    return NextResponse.json({ status: "incomplete" })
  } catch (error: any) {
    return NextResponse.json({ error: "Failed to verify session" }, { status: 500 })
  }
}
