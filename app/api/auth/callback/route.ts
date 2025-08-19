import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 === PROCESANDO CALLBACK DE CONFIRMACIÓN EMAIL ===")

    const { searchParams, origin } = new URL(request.url)
    const token_hash = searchParams.get("token_hash")
    const type = searchParams.get("type")
    const error = searchParams.get("error")
    const error_description = searchParams.get("error_description")

    console.log("📋 Parámetros recibidos:", { token_hash: !!token_hash, type, error })

    // Si hay error en los parámetros
    if (error) {
      console.error("❌ Error en callback:", error, error_description)
      const errorUrl = new URL("/auth/login", origin)
      errorUrl.searchParams.set("error", "confirmation_failed")
      return NextResponse.redirect(errorUrl)
    }

    // Validar parámetros requeridos
    if (!token_hash || !type) {
      console.error("❌ Faltan parámetros de confirmación")
      const errorUrl = new URL("/auth/login", origin)
      errorUrl.searchParams.set("error", "invalid_link")
      return NextResponse.redirect(errorUrl)
    }

    // Crear cliente de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
      console.error("❌ Variables de entorno faltantes")
      const errorUrl = new URL("/auth/login", origin)
      errorUrl.searchParams.set("error", "config_error")
      return NextResponse.redirect(errorUrl)
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("🔄 Verificando y confirmando token...")

    const { data, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
      token_hash,
      type: type as any,
    })

    if (verifyError || !data.user) {
      console.error("❌ Error verificando token:", verifyError?.message)
      const errorUrl = new URL("/auth/login", origin)
      errorUrl.searchParams.set("error", "invalid_token")
      return NextResponse.redirect(errorUrl)
    }

    const user = data.user
    console.log("✅ Token verificado y email confirmado para usuario:", user.id)
    console.log("✅ Email confirmado en Supabase:", !!user.email_confirmed_at)

    const { data: existingUser } = await supabaseAdmin
      .from("profiles")
      .select("email_confirmed")
      .eq("id", user.id)
      .single()

    if (existingUser?.email_confirmed && user.email_confirmed_at) {
      console.log("ℹ️ Usuario ya confirmado, redirigiendo al login")
      const loginUrl = new URL("/auth/login", origin)
      loginUrl.searchParams.set("message", "already_confirmed")
      return NextResponse.redirect(loginUrl)
    }

    console.log("🔄 Actualizando perfil de usuario...")

    const profileData = {
      id: user.id,
      email: user.email!,
      full_name:
        user.user_metadata?.full_name ||
        `${user.user_metadata?.first_name || ""} ${user.user_metadata?.last_name || ""}`.trim(),
      first_name: user.user_metadata?.first_name || "",
      last_name: user.user_metadata?.last_name || "",
      phone: user.user_metadata?.phone || "",
      email_confirmed: true, // Marcar como confirmado en profiles
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    // Crear o actualizar perfil
    const { error: profileError } = await supabaseAdmin.from("profiles").upsert(profileData)

    if (profileError) {
      console.error("❌ Error actualizando perfil:", profileError)
    } else {
      console.log("✅ Perfil actualizado con confirmación")
    }

    console.log("🔄 Redirigiendo al login...")
    const loginUrl = new URL("/auth/login", origin)
    loginUrl.searchParams.set("message", "email_confirmed")
    return NextResponse.redirect(loginUrl)
  } catch (error) {
    console.error("❌ Error inesperado en callback:", error)
    const errorUrl = new URL("/auth/login", request.url)
    errorUrl.searchParams.set("error", "unexpected_error")
    return NextResponse.redirect(errorUrl)
  }
}
