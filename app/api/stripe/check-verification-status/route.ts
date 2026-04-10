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
      // Actualizar identity_verifications (FUENTE DE VERDAD)
      await supabase
        .from("identity_verifications")
        .upsert({
          user_id: userId,
          stripe_verification_id: sessionId,
          status: "verified",
          verified_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }, { onConflict: "stripe_verification_id" })

      // Activar membresia pendiente en user_memberships (FUENTE DE VERDAD)
      await supabase
        .from("user_memberships")
        .update({ status: "active", updated_at: new Date().toISOString() })
        .eq("user_id", userId)
        .in("status", ["paid_pending_verification", "pending_verification", "pending"])
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
