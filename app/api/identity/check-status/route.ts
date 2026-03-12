import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import Stripe from "stripe"
import { createServerClient } from "@supabase/ssr"
import { EmailServiceProduction } from "@/app/lib/email-service-production"

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

      // Activar membresía si no está activa aún
      const membershipActivated = await activateMembershipIfNeeded(supabase, user.id, now)

      return NextResponse.json({
        verified: true,
        status: "verified",
        membershipActivated,
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

async function activateMembershipIfNeeded(
  supabase: any,
  userId: string,
  now: string
): Promise<boolean> {
  // Verificar si ya tiene membresía activa
  const { data: existing } = await supabase
    .from("user_memberships")
    .select("id, membership_type, status")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle()

  if (existing) return true // Ya activa, nothing to do

  // Buscar intent pagado
  const { data: intent } = await supabase
    .from("membership_intents")
    .select("id, membership_type, stripe_subscription_id")
    .eq("user_id", userId)
    .in("status", ["paid_pending_verification", "pending_payment"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!intent?.stripe_subscription_id) return false

  // Activar membresía
  await supabase
    .from("user_memberships")
    .upsert(
      {
        user_id: userId,
        membership_type: intent.membership_type,
        status: "active",
        stripe_subscription_id: intent.stripe_subscription_id,
        identity_verified: true,
        updated_at: now,
      },
      { onConflict: "stripe_subscription_id" }
    )

  await supabase
    .from("profiles")
    .update({
      membership_status: "active",
      membership_type: intent.membership_type,
      updated_at: now,
    })
    .eq("id", userId)

  await supabase
    .from("membership_intents")
    .update({ status: "active", updated_at: now })
    .eq("id", intent.id)

  // Email de bienvenida con acceso completo
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", userId)
      .single()

    if (profile?.email) {
      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"
      const membershipLabels: Record<string, string> = {
        petite: "L'Essentiel",
        essentiel: "L'Essentiel",
        signature: "Signature",
        prive: "Privé",
      }
      const label = membershipLabels[intent.membership_type] || intent.membership_type

      const emailService = EmailServiceProduction.getInstance()
      await emailService.sendWithResend({
        to: profile.email,
        subject: `Acceso completo desbloqueado — Semzo Privé`,
        html: `
          <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; padding: 32px; background: #fff;">
            <h1 style="color: #1a1a4b; font-size: 24px; margin-bottom: 8px;">Bienvenida al club, ${profile.full_name?.split(" ")[0] || ""}.</h1>
            <p style="color: #444; line-height: 1.7;">Tu identidad ha sido verificada y tu membresía <strong>${label}</strong> está completamente activa.</p>
            <p style="color: #444; line-height: 1.7;">Ya puedes acceder al catálogo completo y realizar tus primeras reservas.</p>
            <div style="margin: 32px 0;">
              <a href="${siteUrl}/catalog" style="background: #1a1a4b; color: white; padding: 14px 32px; text-decoration: none; font-size: 13px; letter-spacing: 1.5px; text-transform: uppercase;">
                Ver el catálogo
              </a>
            </div>
            <hr style="border: none; border-top: 1px solid #e8e4df; margin: 32px 0;" />
            <p style="color: #999; font-size: 12px;">Semzo Privé · <a href="mailto:info@semzoprive.com" style="color: #999;">info@semzoprive.com</a></p>
          </div>
        `,
      })
    }
  } catch {
    // Email no crítico
  }

  return true
}
