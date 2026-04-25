import { NextResponse } from "next/server"
import Stripe from "stripe"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: "2024-12-18.acacia",
})

export async function POST(req: Request) {
  const cookieStore = await cookies()

  const { createClient } = await import("@supabase/supabase-js")
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )

  // Intentar obtener user_id del body primero (post-checkout con session_id)
  let userId: string | null = null
  let bodyUserId: string | null = null

  try {
    const body = await req.json().catch(() => ({}))
    bodyUserId = body?.user_id || null
  } catch {
    bodyUserId = null
  }

  if (bodyUserId) {
    // Verificar que el user_id existe en auth.users via service_role
    const { data: authUser } = await supabase.auth.admin.getUserById(bodyUserId)
    if (authUser?.user) {
      userId = authUser.user.id
    }
  }

  // Fallback: resolver desde cookie de sesion
  if (!userId) {
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
    userId = user?.id || null
  }

  if (!userId) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const user = { id: userId }

  // Verificar si ya tiene identidad verificada (FUENTE DE VERDAD: identity_verifications)
  const { data: existingVerified } = await supabase
    .from("identity_verifications")
    .select("status")
    .eq("user_id", user.id)
    .in("status", ["verified", "approved"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (existingVerified) {
    return NextResponse.json({ alreadyVerified: true })
  }

  // Buscar el intent más reciente del usuario (cualquier estado post-pago)
  const { data: intent } = await supabase
    .from("membership_intents")
    .select("id, membership_type, status")
    .eq("user_id", user.id)
    .in("status", [
      "paid_pending_verification",
      "pending_payment",
      "pending_verification",
      "pending_sepa",
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
      .in("status", ["active", "pending_verification", "pending_sepa"])
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

  // NO reutilizar sesiones anteriores: pueden tener return_url incorrecto
  // de versiones previas del código. Siempre crear una sesión nueva.
  // Esto garantiza que el return_url siempre apunte a semzoprive.com.

  // Prioridad: variable de entorno > dominio de produccion hardcodeado
  const appUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://semzoprive.com"

  const session = await stripe.identity.verificationSessions.create({
    type: "document",
    options: {
      document: {
        require_live_capture: true,
        require_matching_selfie: true,
      },
    },
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
