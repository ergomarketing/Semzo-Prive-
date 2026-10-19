import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { createClient } from "@supabase/supabase-js"
import { leadSourceFromChannel, sanitizeAttribution, saveAttribution } from "@/lib/attribution"

/**
 * ============================================================================
 * FLUJO VALIDADO — NO MODIFICAR SIN CONSULTAR
 * ============================================================================
 * PASO 3 del flujo de suscripcion: REGISTRO
 *
 * Responsabilidades (validado 2026-04-16):
 * - Crear usuario en Supabase Auth con signUp
 * - Guardar pending_plan / pending_bag en user_metadata (fallback cross-device)
 * - Construir callbackUrl con next, plan, bag, origin (contexto en URL)
 * - Upsert en profiles: id, email, full_name, first_name, last_name, auth_method
 * - Phone se guarda en paso separado para respetar constraint profiles_phone_unique
 * - Notificar al admin del nuevo registro (no bloqueante)
 * - Atribucion ("como nos encontraron"): body.attribution es OPCIONAL y se
 *   guarda aparte en signup_attribution (best-effort, nunca bloquea ni cambia
 *   la respuesta). Ademas informa el `source` del lead. Ver lib/attribution.ts.
 *
 * NO tocar sin avisar: este endpoint forma parte del contrato con signup/page.tsx,
 * auth/callback y auth/welcome. Cambiar el shape del body o la respuesta rompe el flujo.
 * ============================================================================
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, password, firstName, lastName, phone, plan, bag, origin, returnUrl, marketing_consent, locale } = body

    if (!email || !password) {
      return NextResponse.json({ success: false, message: "Email y contraseña son requeridos" }, { status: 400 })
    }

    if (password.length < 8) {

      return NextResponse.json(
        { success: false, message: "La contraseña debe tener al menos 8 caracteres" },
        { status: 400 },
      )
    }

    // FLUJO MÍNIMO: Solo Auth, sin tocar profiles ni metadata complejo
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    // Construir redirect_to con el returnUrl para restaurar contexto tras confirmación
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"
    const callbackUrl = new URL(`${siteUrl}/auth/callback`)
    if (returnUrl) callbackUrl.searchParams.set("next", returnUrl)
    if (plan) callbackUrl.searchParams.set("plan", plan)
    if (bag) callbackUrl.searchParams.set("bag", bag)
    if (origin) callbackUrl.searchParams.set("origin", origin)

    const normalizedEmail = email.toLowerCase().trim()
    const userMetadata = {
      first_name: firstName || null,
      last_name: lastName || null,
      pending_plan: plan || null,
      pending_bag: bag || null,
    }

    // El correo de "Confirmar mi cuenta" sale de NUESTRO sistema (Resend, con la plantilla de marca) y no del
    // de Supabase. Se crea el usuario sin confirmar con admin.generateLink (no envia nada) y se manda el enlace
    // a /auth/callback con token_hash, que ya lo sabe verificar. Poner SIGNUP_CONFIRMATION_VIA_CODE=0 en Vercel
    // vuelve al correo de Supabase. Si algo falla al enviar, se reenvia con el de Supabase: nadie se queda sin enlace.
    let authData: { user: any } | null = null
    let authError: { message?: string; code?: string } | null = null

    if (process.env.SIGNUP_CONFIRMATION_VIA_CODE !== "0" && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const adminClient = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false },
      })
      const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
        type: "signup",
        email: normalizedEmail,
        password,
        options: { data: userMetadata, redirectTo: callbackUrl.toString() },
      })

      if (linkError || !linkData?.user) {
        authError = linkError || { message: "No se pudo crear el usuario" }
      } else {
        authData = { user: linkData.user }

        let sent = false
        const tokenHash = linkData.properties?.hashed_token
        if (tokenHash) {
          try {
            const confirmUrl = new URL(callbackUrl.toString())
            confirmUrl.searchParams.set("token_hash", tokenHash)
            confirmUrl.searchParams.set("type", "signup")
            const { EmailServiceProduction } = await import("@/app/lib/email-service-production")
            sent = await EmailServiceProduction.getInstance().sendWelcomeEmail(
              normalizedEmail,
              firstName || "",
              confirmUrl.toString(),
            )
          } catch (sendError) {
            console.error("[BACKEND] Error enviando confirmacion por Resend:", sendError)
          }
        }
        if (!sent) {
          console.warn("[BACKEND] Confirmacion por Resend fallo: se reenvia con el correo de Supabase")
          await supabase.auth.resend({
            type: "signup",
            email: normalizedEmail,
            options: { emailRedirectTo: callbackUrl.toString() },
          })
        }
      }
    } else {
      const result = await supabase.auth.signUp({
        email: normalizedEmail,
        password: password,
        options: { emailRedirectTo: callbackUrl.toString(), data: userMetadata },
      })
      authData = result.data
      authError = result.error
    }

    if (authError) {
      const alreadyRegistered =
        authError.code === "email_exists" ||
        authError.message?.toLowerCase().includes("already registered") ||
        authError.message?.toLowerCase().includes("already been registered")
      if (alreadyRegistered) {
        return NextResponse.json(
          {
            success: false,
            message: "Este correo ya está registrado. Por favor inicia sesión.",
            error: "EMAIL_ALREADY_EXISTS",
          },
          { status: 409 },
        )
      }

      return NextResponse.json(
        { 
          success: false, 
          message: `Error al crear usuario: ${authError.message}`, 
          error: "AUTH_ERROR" 
        },
        { status: 500 },
      )
    }

    if (!authData?.user) {
      console.error("[BACKEND] No user returned from auth.signUp")
      return NextResponse.json(
        { success: false, message: "No se pudo crear el usuario", error: "USER_CREATION_FAILED" },
        { status: 500 },
      )
    }

    // PASO 2: Upsert completo de profiles con todos los datos del registro
    const supabaseService = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    )

    const fullName = `${firstName || ""} ${lastName || ""}`.trim()

    console.log("[v0] Register: Creating profile for user:", authData.user.id, email)

    // Upsert sin phone para evitar constraint profiles_phone_unique
    const { error: profileError } = await supabaseService
      .from("profiles")
      .upsert({
        id: authData.user.id,
        email: email.toLowerCase().trim(),
        full_name: fullName || null,
        first_name: firstName || null,
        last_name: lastName || null,
        auth_method: "email",
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" })

    if (profileError) {
      console.error("[v0] Register: Profile upsert error:", profileError)
    } else {
      console.log("[v0] Register: Profile created successfully for:", authData.user.id)
    }

    // Phone en paso separado solo si no pertenece a otro usuario
    if (phone) {
      const { data: phoneOwner } = await supabaseService
        .from("profiles")
        .select("id")
        .eq("phone", phone)
        .neq("id", authData.user.id)
        .maybeSingle()

      if (!phoneOwner) {
        await supabaseService
          .from("profiles")
          .update({ phone })
          .eq("id", authData.user.id)
      }
    }

    // Atribucion de registro (aditivo y no bloqueante): saveAttribution nunca
    // lanza y, si la tabla aun no existe, solo lo loguea.
    const attribution = sanitizeAttribution(body.attribution)
    const attributionResult = await saveAttribution(supabaseService, authData.user.id, attribution)
    const attributionTouch = attribution.lastTouch || attribution.firstTouch

    // Notificar al admin del nuevo registro
    try {
      const { adminNotifications } = await import("@/lib/admin-notifications")
      await adminNotifications.notifyNewUserRegistration({
        userName: fullName || email.toLowerCase().trim(),
        userEmail: email.toLowerCase().trim(),
      })
    } catch (notifError) {
      // No bloquear el registro si falla la notificación
    }

    // Consentimiento de marketing: SOLO si marco la casilla. Guarda la prueba y suscribe a la lista de Klaviyo.
    if (marketing_consent === true) {
      try {
        const { recordMarketingConsent } = await import("@/lib/marketing-consent")
        await recordMarketingConsent(supabaseService, {
          email: email.toLowerCase().trim(),
          userId: authData.user.id,
          source: "signup",
          locale,
          firstName: firstName || null,
          lastName: lastName || null,
          request,
        })
      } catch {
        // nunca bloquea el registro
      }
    }

    // Klaviyo: perfil + evento "Signed Up" (best-effort; no suscribe a ninguna lista)
    try {
      const { klaviyoTrack } = await import("@/lib/klaviyo")
      await klaviyoTrack({
        email: email.toLowerCase().trim(),
        metric: "Signed Up",
        properties: { source: "register" },
        uniqueId: `signed_up:${authData.user.id}`,
        profile: { firstName: firstName || null, lastName: lastName || null },
      })
    } catch {
      // nunca bloquea el registro
    }

    // Registrarse como socia NO mete en la secuencia de leads (esa es para quien deja su correo en el catalogo).
    // Si ya estaba como lead, se le paran los correos que le quedaban.
    try {
      const { stopLeadSequenceForMember } = await import("@/lib/leads/enroll")
      await stopLeadSequenceForMember(email)
    } catch {
      // nunca bloquea el registro
    }

    return NextResponse.json({
      success: true,
      message: !authData.session 
        ? "Cuenta creada. Por favor revisa tu email para confirmar tu cuenta." 
        : "Cuenta creada exitosamente. Ya puedes iniciar sesión.",
      requiresEmailConfirmation: !authData.session,
      user: {
        id: authData.user.id,
        email: authData.user.email,
        full_name: `${firstName} ${lastName}`,
      },
    })

  } catch (error) {
    console.error("Error en registro:", error)
    return NextResponse.json(
      { success: false, message: "Error interno del servidor", error: "INTERNAL_SERVER_ERROR" },
      { status: 500 },
    )
  }
}
