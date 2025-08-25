import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 === PROCESANDO CALLBACK DE CONFIRMACIÓN EMAIL ===")

    const { searchParams, origin } = new URL(request.url)

    // Loggear TODOS los parámetros que llegan
    console.log("📋 TODOS los parámetros recibidos:")
    for (const [key, value] of searchParams.entries()) {
      console.log(`- ${key}:`, value)
    }

    // Para confirmación de email, Supabase envía token_hash y type
    const token_hash = searchParams.get("token_hash")
    const type = searchParams.get("type")
    const error = searchParams.get("error")
    const error_description = searchParams.get("error_description")
    const next = searchParams.get("next") || "/dashboard"

    console.log("📋 Parámetros específicos:")
    console.log("- Token Hash:", !!token_hash, token_hash?.substring(0, 10) + "...")
    console.log("- Type:", type)
    console.log("- Error:", error)
    console.log("- Error Description:", error_description)
    console.log("- Next:", next)
    console.log("- Origin:", origin)

    // Si hay error en los parámetros
    if (error) {
      console.error("❌ Error en callback:", error, error_description)
      const errorUrl = new URL("/auth/error", origin)
      errorUrl.searchParams.set("error", error)
      errorUrl.searchParams.set("description", error_description || "")
      return NextResponse.redirect(errorUrl)
    }

    // Para confirmación de email necesitamos token_hash y type
    if (!token_hash || !type) {
      console.error("❌ Faltan parámetros de confirmación:", { token_hash: !!token_hash, type })
      const errorUrl = new URL("/auth/error", origin)
      errorUrl.searchParams.set("error", "missing_params")
      errorUrl.searchParams.set("description", `Missing token_hash: ${!token_hash}, type: ${!type}`)
      return NextResponse.redirect(errorUrl)
    }

    // Crear cliente de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    console.log("🔧 Variables de entorno:")
    console.log("- Supabase URL:", !!supabaseUrl, supabaseUrl?.substring(0, 30) + "...")
    console.log("- Supabase Anon Key:", !!supabaseAnonKey, supabaseAnonKey?.substring(0, 10) + "...")

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error("❌ Variables de entorno faltantes")
      const errorUrl = new URL("/auth/error", origin)
      errorUrl.searchParams.set("error", "config_error")
      errorUrl.searchParams.set("description", "Missing environment variables")
      return NextResponse.redirect(errorUrl)
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey)

    console.log("🔄 Verificando token de confirmación de email...")
    console.log("🔄 Usando verifyOtp con:", { token_hash: token_hash.substring(0, 10) + "...", type })

    // CORRECCIÓN: El template usa type=signup, necesitamos manejar ambos casos
    let verifyType: "email" | "signup" = "email"
    if (type === "signup") {
      verifyType = "signup"
    }

    console.log("🔄 Tipo de verificación:", verifyType)

    // Para confirmación de email usar verifyOtp
    const { data, error: verifyError } = await supabase.auth.verifyOtp({
      token_hash,
      type: verifyType,
    })

    console.log("📊 Resultado de verifyOtp:")
    console.log("- Data:", !!data)
    console.log("- User:", !!data?.user)
    console.log("- Session:", !!data?.session)
    console.log("- Error:", !!verifyError)

    if (verifyError) {
      console.error("❌ Error verificando token:", verifyError)
      console.error("❌ Error completo:", JSON.stringify(verifyError, null, 2))

      // Si falla con 'signup', intentar con 'email'
      if (verifyType === "signup") {
        console.log("🔄 Intentando con type='email'...")
        const { data: retryData, error: retryError } = await supabase.auth.verifyOtp({
          token_hash,
          type: "email",
        })

        if (retryError) {
          console.error("❌ Error en segundo intento:", retryError)
          const errorUrl = new URL("/auth/error", origin)
          errorUrl.searchParams.set("error", "verification_failed")
          errorUrl.searchParams.set("description", `Primary: ${verifyError.message}, Retry: ${retryError.message}`)
          return NextResponse.redirect(errorUrl)
        }

        if (retryData?.user) {
          console.log("✅ Segundo intento exitoso")
          // Continuar con retryData
          return await handleSuccessfulVerification(retryData, origin, next, supabaseUrl)
        }
      }

      const errorUrl = new URL("/auth/error", origin)
      errorUrl.searchParams.set("error", "verification_failed")
      errorUrl.searchParams.set("description", verifyError.message)
      return NextResponse.redirect(errorUrl)
    }

    if (!data.user) {
      console.error("❌ No se obtuvo usuario después de verificación")
      const errorUrl = new URL("/auth/error", origin)
      errorUrl.searchParams.set("error", "no_user")
      errorUrl.searchParams.set("description", "No user obtained after verification")
      return NextResponse.redirect(errorUrl)
    }

    return await handleSuccessfulVerification(data, origin, next, supabaseUrl)
  } catch (error) {
    console.error("❌ Error inesperado en callback:", error)
    console.error("❌ Stack trace:", error instanceof Error ? error.stack : "No stack")
    const errorUrl = new URL("/auth/error", request.url)
    errorUrl.searchParams.set("error", "unexpected")
    errorUrl.searchParams.set("description", error instanceof Error ? error.message : "Unknown error")
    return NextResponse.redirect(errorUrl)
  }
}

async function handleSuccessfulVerification(data: any, origin: string, next: string, supabaseUrl: string) {
  console.log("✅ Email confirmado exitosamente:")
  console.log("- User ID:", data.user.id)
  console.log("- Email:", data.user.email)
  console.log("- Email confirmado:", !!data.user.email_confirmed_at)
  console.log("- User metadata:", JSON.stringify(data.user.user_metadata, null, 2))

  // Crear o actualizar perfil
  if (process.env.SUPABASE_SERVICE_KEY) {
    try {
      console.log("🔄 Manejando perfil con service key...")
      const supabaseAdmin = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_KEY)

      // Verificar si el perfil ya existe
      const { data: existingProfile, error: selectError } = await supabaseAdmin
        .from("profiles")
        .select("id")
        .eq("id", data.user.id)
        .single()

      console.log("📊 Perfil existente:", !!existingProfile, selectError?.message)

      if (existingProfile) {
        // Actualizar perfil existente
        const { error: updateError } = await supabaseAdmin
          .from("profiles")
          .update({
            updated_at: new Date().toISOString(),
          })
          .eq("id", data.user.id)

        if (updateError) {
          console.warn("⚠️ Error actualizando perfil:", updateError)
        } else {
          console.log("✅ Perfil actualizado después de confirmación")
        }
      } else {
        // Crear perfil nuevo
        const profileData = {
          id: data.user.id,
          email: data.user.email!,
          full_name: data.user.user_metadata?.full_name || "",
          first_name: data.user.user_metadata?.first_name || "",
          last_name: data.user.user_metadata?.last_name || "",
          phone: data.user.user_metadata?.phone || "",
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }

        console.log("🔄 Creando perfil:", profileData)

        const { error: insertError } = await supabaseAdmin.from("profiles").insert(profileData)

        if (insertError) {
          console.warn("⚠️ Error creando perfil:", insertError)
        } else {
          console.log("✅ Perfil creado después de confirmación")
        }
      }
    } catch (profileError) {
      console.warn("⚠️ Error manejando perfil:", profileError)
    }
  } else {
    console.warn("⚠️ No hay SUPABASE_SERVICE_KEY para crear perfil")
  }

  // Redirigir a página de éxito
  console.log("🔄 Redirigiendo a:", next)
  const successUrl = new URL(next, origin)
  return NextResponse.redirect(successUrl)
}
