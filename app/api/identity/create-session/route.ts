import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import Stripe from "stripe"
import { createRouteHandlerClient } from "@/lib/supabase"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

export async function POST() {
  try {
    const supabase = await createRouteHandlerClient({ cookies })
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    console.log("[v0 API] Creando sesión de verificación para userId:", user.id)

    // Crear sesión de Stripe Identity
    const verificationSession = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: {
        user_id: user.id,
      },
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/cart`,
    })

    console.log("[v0 API] Sesión creada:", verificationSession.id)

    // Guardar en Supabase
    await supabase.from("identity_verifications").insert({
      user_id: user.id,
      stripe_session_id: verificationSession.id,
      status: "pending",
    })

    return NextResponse.json({
      sessionId: verificationSession.id,
      url: verificationSession.url,
    })
  } catch (error: any) {
    console.error("[v0 API] Error:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
