import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import Stripe from "stripe"
import { createRouteHandlerClient } from "@/lib/supabase"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    if (!sessionId) {
      return NextResponse.json({ error: "sessionId requerido" }, { status: 400 })
    }

    const supabase = createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    console.log("[v0 API] Verificando estado para sessionId:", sessionId)

    const verificationSession = await stripe.identity.verificationSessions.retrieve(sessionId)

    console.log("[v0 API] Estado:", verificationSession.status)

    const verified = verificationSession.status === "verified"

    if (verified) {
      // Actualizar base de datos
      await supabase
        .from("identity_verifications")
        .update({ status: "verified", verified_at: new Date().toISOString() })
        .eq("stripe_session_id", sessionId)

      await supabase
        .from("profiles")
        .update({ identity_verified: true, identity_verified_at: new Date().toISOString() })
        .eq("id", user.id)

      console.log("[v0 API] Usuario verificado en BD")
    }

    return NextResponse.json({
      verified,
      status: verificationSession.status,
    })
  } catch (error: any) {
    console.error("[v0 API] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
