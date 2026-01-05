import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs"
import { cookies } from "next/headers"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
})

export async function POST(req: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = await createRouteHandlerClient({ cookies: () => cookieStore })

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("membership_status, verification_status")
      .eq("id", user.id)
      .single()

    if (!profile) {
      return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
    }

    if (profile.membership_status !== "pending_verification") {
      return NextResponse.json(
        {
          error: "Solo puedes iniciar verificación si tu membresía está pendiente de verificación",
          membership_status: profile.membership_status,
        },
        { status: 403 },
      )
    }

    const verificationSession = await stripe.identity.verificationSessions.create({
      type: "document",
      metadata: {
        user_id: user.id,
      },
    })

    await supabase.from("identity_verifications").insert({
      user_id: user.id,
      stripe_verification_session_id: verificationSession.id,
      status: "pending",
    })

    return NextResponse.json({
      url: verificationSession.url,
      sessionId: verificationSession.id,
    })
  } catch (error: any) {
    console.error("[v0] Error técnico creando sesión de verificación:", error)
    return NextResponse.json(
      {
        error: "Error técnico al crear sesión de verificación",
        canRetry: true,
      },
      { status: 500 },
    )
  }
}
