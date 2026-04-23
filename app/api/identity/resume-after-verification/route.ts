import { type NextRequest, NextResponse } from "next/server"
import Stripe from "stripe"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

/**
 * Endpoint puente server-side para llamar a resume-onboarding tras completar
 * Stripe Identity en iOS Safari (donde la cookie de sesion se pierde al volver
 * del WebView de Stripe).
 *
 * Flujo:
 *  1. Recibe { userId, sessionId } del cliente.
 *  2. Valida que el sessionId de Stripe corresponde al userId (seguridad).
 *  3. Llama a resume-onboarding en modo interno con x-internal-secret.
 *  4. Devuelve la misma respuesta al cliente.
 *
 * No expone STRIPE_WEBHOOK_SECRET al cliente.
 */

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { userId, sessionId } = body

    if (!userId || !sessionId) {
      return NextResponse.json({ error: "userId y sessionId requeridos" }, { status: 400 })
    }

    // Validar que el sessionId pertenece al userId (evita spoofing)
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } },
    )

    // Verificar en Stripe que el session_id tiene user_id en metadata
    let stripeUserId: string | null = null
    try {
      const stripeSession = await stripe.identity.verificationSessions.retrieve(sessionId)
      stripeUserId = stripeSession.metadata?.user_id || null
    } catch {
      // Si Stripe falla, validar contra identity_verifications en DB
    }

    if (!stripeUserId) {
      // Fallback: verificar en identity_verifications
      const { data: dbRecord } = await supabase
        .from("identity_verifications")
        .select("user_id")
        .eq("stripe_verification_id", sessionId)
        .maybeSingle()
      stripeUserId = dbRecord?.user_id || null
    }

    if (!stripeUserId || stripeUserId !== userId) {
      console.error("[resume-after-verification] userId mismatch:", { userId, stripeUserId })
      return NextResponse.json({ error: "No autorizado" }, { status: 403 })
    }

    // Llamar a resume-onboarding en modo interno (sin cookie de sesion)
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ||
      (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

    console.log("[RESUME ONBOARDING TRIGGERED]")
    const resumeRes = await fetch(`${siteUrl}/api/resume-onboarding`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.STRIPE_WEBHOOK_SECRET || "",
      },
      body: JSON.stringify({ userId }),
    })

    const resume = await resumeRes.json().catch(() => ({}))
    return NextResponse.json(resume, { status: resumeRes.ok ? 200 : resumeRes.status })
  } catch (error: any) {
    console.error("[resume-after-verification] error:", error?.message)
    return NextResponse.json({ error: error?.message || "Error interno" }, { status: 500 })
  }
}
