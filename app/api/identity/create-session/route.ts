import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

export async function POST() {
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

  // Buscar el intent más reciente del usuario (cualquier estado post-pago)
  const { data: intent } = await supabase
    .from("membership_intents")
    .select("id, membership_type, status")
    .eq("user_id", user.id)
    .in("status", [
      "paid_pending_verification",
      "pending_payment",
      "active",
      "completed",
      "pending",
      "created",
    ])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  // Si no hay intent, buscar membresía activa directamente como fallback
  let membershipType = intent?.membership_type || "essentiel"
  let intentId = intent?.id || null

  if (!intent) {
    const { data: membership } = await supabase
      .from("user_memberships")
      .select("id, membership_type")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle()

    if (!membership) {
      return NextResponse.json(
        { error: "No hay membresía activa o pendiente de verificación" },
        { status: 400 }
      )
    }
    membershipType = membership.membership_type
    intentId = membership.id
  }

  // Reutilizar sesión pending existente si aún es válida
  const { data: existing } = await supabase
    .from("identity_verifications")
    .select("stripe_verification_id, status")
    .eq("user_id", user.id)
    .in("status", ["pending", "processing"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existing?.stripe_verification_id) {
    try {
      const session = await stripe.identity.verificationSessions.retrieve(
        existing.stripe_verification_id
      )
      // Solo reusar si no está cancelada ni expirada
      if (session.url && session.status !== "canceled") {
        return NextResponse.json({ url: session.url, sessionId: session.id })
      }
    } catch {
      // Sesión inválida — crear nueva
    }
  }

  const appUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  const session = await stripe.identity.verificationSessions.create({
    type: "document",
    return_url: `${appUrl}/verify-identity/result?session_id={VERIFICATION_SESSION_ID}`,
    metadata: {
      user_id: user.id,
      intent_id: intentId || "",
      membership_type: membershipType,
    },
  })

  // Usar stripe_verification_id como clave de conflicto para no duplicar por usuario
  await supabase.from("identity_verifications").upsert(
    {
      user_id: user.id,
      stripe_verification_id: session.id,
      status: "pending",
      membership_type: membershipType,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    { onConflict: "stripe_verification_id" }
  )

  // Vincular la sesión al intent
  if (intentId) {
    await supabase
      .from("membership_intents")
      .update({
        stripe_verification_session_id: session.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", intentId)
  }

  return NextResponse.json({ url: session.url, sessionId: session.id })
}
