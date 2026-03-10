import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-11-20.acacia",
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

  // Buscar intent en cualquier estado post-pago válido
  // El webhook puede no haber actualizado a "paid_pending_verification" aún
  const { data: intent } = await supabase
    .from("membership_intents")
    .select("id, membership_type, status")
    .eq("user_id", user.id)
    .in("status", [
      "paid_pending_verification",
      "pending_payment",
      "completed",
      "active",
      "pending",
      "created",
    ])
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  // Si no hay intent, verificar si tiene membresía activa directamente
  if (!intent) {
    const { data: membership } = await supabase
      .from("user_memberships")
      .select("id, membership_type")
      .eq("user_id", user.id)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!membership) {
      return NextResponse.json(
        { error: "No hay membresía pendiente de verificación" },
        { status: 400 }
      )
    }

    // Usar la membresía activa como fallback para crear la sesión de verificación
    const fallbackIntent = { id: membership.id, membership_type: membership.membership_type }
    return createVerificationSession(supabase, user.id, fallbackIntent)
  }

  return createVerificationSession(supabase, user.id, intent)
}

async function createVerificationSession(
  supabase: any,
  userId: string,
  intent: { id: string; membership_type: string }
) {
  // Reutilizar sesión pendiente si existe
  const { data: existing } = await supabase
    .from("identity_verifications")
    .select("stripe_verification_id, status")
    .eq("user_id", userId)
    .eq("status", "pending")
    .maybeSingle()

  if (existing?.stripe_verification_id) {
    try {
      const session = await stripe.identity.verificationSessions.retrieve(
        existing.stripe_verification_id
      )
      if (session.url) {
        return NextResponse.json({ url: session.url })
      }
    } catch {
      // Sesion expirada o inválida — crear una nueva
    }
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL
    || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000")

  const session = await stripe.identity.verificationSessions.create({
    type: "document",
    return_url: `${appUrl}/verify-identity/result?session_id={VERIFICATION_SESSION_ID}`,
    metadata: {
      user_id: userId,
      intent_id: intent.id,
      membership_type: intent.membership_type,
    },
  })

  await supabase.from("identity_verifications").upsert(
    {
      user_id: userId,
      stripe_verification_id: session.id,
      status: "pending",
      membership_type: intent.membership_type,
    },
    { onConflict: "user_id" }
  )

  await supabase
    .from("membership_intents")
    .update({
      stripe_verification_session_id: session.id,
      updated_at: new Date().toISOString(),
    })
    .eq("id", intent.id)

  return NextResponse.json({ url: session.url })
}
