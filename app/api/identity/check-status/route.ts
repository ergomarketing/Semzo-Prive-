import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import Stripe from "stripe"
import { createServerClient } from "@supabase/ssr"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

/**
 * ============================================================================
 * FLUJO VALIDADO — NO MODIFICAR SIN CONSULTAR
 * ============================================================================
 * PASO 7c del flujo de suscripcion: CHECK STATUS DE IDENTITY
 *
 * Consulta Stripe directamente con el session_id (no depende de la DB que
 * puede no haberse actualizado via webhook todavia).
 *
 * Si stripeSession.status === "verified":
 *  - Upsert en identity_verifications (FUENTE DE VERDAD identidad)
 *    con status "verified" y verified_at
 *  - Update user_memberships a status "active" si estaba en
 *    paid_pending_verification / pending_verification / pending
 *
 * Aceptar ambos status "verified" y "approved" en consumidores
 * (compatibilidad historica con versiones previas).
 * ============================================================================
 */
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
        if (userId) {
          // Actualizar identity_verifications (FUENTE DE VERDAD para identidad)
          await supabase
            .from("identity_verifications")
            .upsert({
              user_id: userId,
              stripe_verification_id: sessionId,
              status: "verified",
              verified_at: now,
              updated_at: now,
            }, { onConflict: "stripe_verification_id" })

          // Activar user_memberships si hay una pendiente (FUENTE DE VERDAD para membresia)
          await supabase
            .from("user_memberships")
            .update({ status: "active", updated_at: now })
            .eq("user_id", userId)
            .in("status", ["paid_pending_verification", "pending_verification", "pending"])
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

    // Buscar estado en identity_verifications (FUENTE DE VERDAD)
    const { data: identityRecord } = await supabase
      .from("identity_verifications")
      .select("status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    // Buscar estado de membresia en user_memberships (FUENTE DE VERDAD)
    const { data: membershipRecord } = await supabase
      .from("user_memberships")
      .select("status")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    const isVerified = identityRecord?.status === "verified" || identityRecord?.status === "approved"

    return NextResponse.json({
      verified: isVerified,
      status: identityRecord?.status || "not_started",
      membership_status: membershipRecord?.status,
    })
  } catch (error: any) {
    console.error("[Identity Check Status Error]:", error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}


