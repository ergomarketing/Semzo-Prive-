import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createRouteHandlerClient } from "@/lib/supabase"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const sessionId = searchParams.get("sessionId")
    const userId = searchParams.get("userId")

    if (!sessionId || !userId) {
      return NextResponse.json({ error: "sessionId y userId requeridos" }, { status: 400 })
    }

    // Verificar estado en Stripe
    const verificationSession = await stripe.identity.verificationSessions.retrieve(sessionId)

    const isVerified = verificationSession.status === "verified"

    // Actualizar en Supabase si está verificado
    if (isVerified) {
      const supabase = await createRouteHandlerClient()
      await supabase
        .from("profiles")
        .update({ identity_verified: true, identity_verified_at: new Date().toISOString() })
        .eq("id", userId)
    }

    return NextResponse.json({
      verified: isVerified,
      status: verificationSession.status,
    })
  } catch (error: any) {
    console.error("[v0] Error verificando estado:", error)
    return NextResponse.json({ error: error.message || "Error al verificar estado" }, { status: 500 })
  }
}
