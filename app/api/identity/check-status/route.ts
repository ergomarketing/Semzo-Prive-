import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import Stripe from "stripe"
import { createServerClient } from "@supabase/ssr"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")

    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll(),
          setAll: () => {},
        },
      }
    )

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "No autenticado" }, { status: 401 })
    }

    // 1. Buscar la verificación más reciente del usuario en DB
    const query = supabase
      .from("identity_verifications")
      .select("stripe_verification_id, status, membership_type, verified_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)

    if (sessionId) {
      query.eq("stripe_verification_id", sessionId)
    }

    const { data: verification } = await query.maybeSingle()

    // 2. Si ya tenemos estado final en DB, no llamar a Stripe
    if (verification?.status === "verified") {
      return NextResponse.json({
        verified: true,
        status: "verified",
        membershipActivated: true,
      })
    }

    if (verification?.status === "failed" || verification?.status === "requires_input") {
      return NextResponse.json({
        verified: false,
        status: "requires_input",
        membershipActivated: false,
      })
    }

    // 3. No hay sesión registrada → no iniciada
    if (!verification?.stripe_verification_id) {
      return NextResponse.json({
        verified: false,
        status: "not_started",
        membershipActivated: false,
      })
    }

    // 4. Estado pendiente/procesando → consultar Stripe para ver si cambió
    const stripeSession = await stripe.identity.verificationSessions.retrieve(
      verification.stripe_verification_id
    )

    const now = new Date().toISOString()

    if (stripeSession.status === "verified") {
      // Actualizar DB en cascada
      await supabase
        .from("identity_verifications")
        .update({
          status: "verified",
          verified_at: now,
          updated_at: now,
        })
        .eq("stripe_verification_id", verification.stripe_verification_id)

      await supabase
        .from("profiles")
        .update({
          identity_verified: true,
          identity_verified_at: now,
          updated_at: now,
        })
        .eq("id", user.id)

      return NextResponse.json({
        verified: true,
        status: "verified",
        membershipActivated: false,
      })
    }

    if (stripeSession.status === "requires_input" || stripeSession.status === "canceled") {
      await supabase
        .from("identity_verifications")
        .update({
          status: "requires_input",
          updated_at: now,
        })
        .eq("stripe_verification_id", verification.stripe_verification_id)

      return NextResponse.json({
        verified: false,
        status: "requires_input",
        membershipActivated: false,
      })
    }

    // processing o pending
    return NextResponse.json({
      verified: false,
      status: stripeSession.status,
      membershipActivated: false,
    })
  } catch (error: any) {
    console.error("[Identity Check Status Error]:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


