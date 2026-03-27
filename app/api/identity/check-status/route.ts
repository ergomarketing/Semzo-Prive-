import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import Stripe from "stripe"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId") || searchParams.get("session_id")

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Si tenemos sessionId de Stripe, consultar Stripe DIRECTAMENTE
    // No depender de la DB que puede no haberse actualizado
    if (sessionId) {
      const stripeSession = await stripe.identity.verificationSessions.retrieve(sessionId)
      const now = new Date().toISOString()

      // Obtener userId del metadata de la sesion de Stripe
      const userId = stripeSession.metadata?.user_id || null

      console.log("[v0] check-status: Stripe session status:", stripeSession.status, "userId:", userId)

      if (stripeSession.status === "verified") {
        // Actualizar DB
        if (userId) {
          console.log("[v0] check-status: Updating profile to active for userId:", userId)
          
          const { error: profileError } = await supabase
            .from("profiles")
            .update({
              identity_verified: true,
              identity_verified_at: now,
              membership_status: "active",
              updated_at: now,
            })
            .eq("id", userId)

          if (profileError) {
            console.error("[v0] check-status: Profile update error:", profileError)
          } else {
            console.log("[v0] check-status: Profile updated to active for userId:", userId)
          }

          await supabase
            .from("identity_verifications")
            .upsert({
              user_id: userId,
              stripe_verification_id: sessionId,
              status: "verified",
              verified_at: now,
              updated_at: now,
            }, { onConflict: "stripe_verification_id" })
        }

        return NextResponse.json({
          verified: true,
          status: "verified",
          user_id: userId,
        })
      }

      if (stripeSession.status === "requires_input" || stripeSession.status === "canceled") {
        return NextResponse.json({
          verified: false,
          status: "requires_input",
        })
      }

      // processing — Stripe Identity es instantaneo, esto no deberia pasar
      return NextResponse.json({
        verified: false,
        status: stripeSession.status,
      })
    }

    // Sin sessionId, intentar obtener usuario de la sesion para buscar en DB
    const cookieStore = await cookies()
    const supabaseAuth = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    )
    const { data: { user } } = await supabaseAuth.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // Buscar estado en profile
    const { data: profile } = await supabase
      .from("profiles")
      .select("identity_verified, membership_status")
      .eq("id", user.id)
      .single()

    return NextResponse.json({
      verified: profile?.identity_verified === true,
      status: profile?.identity_verified ? "verified" : "not_started",
      membership_status: profile?.membership_status,
    })
  } catch (error: any) {
    console.error("[Identity Check Status Error]:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


