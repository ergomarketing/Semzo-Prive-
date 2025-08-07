import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token_hash = searchParams.get("token_hash")
    const type = searchParams.get("type")
    const next = searchParams.get("next") ?? "/dashboard"

    console.log("[CALLBACK] === INICIO CONFIRMACIÓN ===")
    console.log("[CALLBACK] Token hash:", token_hash ? "✓" : "✗")
    console.log("[CALLBACK] Type:", type)

    if (!token_hash || type !== "signup") {
      console.log("[CALLBACK] Parámetros inválidos")
      return NextResponse.redirect(new URL("/auth/error?message=invalid_params", request.url))
    }

    // Crear cliente admin de Supabase
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY!

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[CALLBACK] Variables de entorno faltantes")
      return NextResponse.redirect(new URL("/auth/error?message=server_error", request.url))
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verificar si el usuario existe en auth.users
    console.log("[CALLBACK] Verificando usuario en auth.users...")
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(token_hash)

    if (userError || !userData.user) {
      console.error("[CALLBACK] Usuario no encontrado en auth.users:", userError)
      return NextResponse.redirect(new URL("/auth/error?message=user_not_found", request.url))
    }

    // Confirmar el email del usuario en auth.users (el trigger actualizará profiles automáticamente)
    console.log("[CALLBACK] Confirmando email en auth.users...")
    const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(
      token_hash,
      { email_confirm: true }
    )

    if (confirmError) {
      console.error("[CALLBACK] Error confirmando en auth.users:", confirmError)
      return NextResponse.redirect(new URL("/auth/error?message=confirmation_failed", request.url))
    }

    console.log("[CALLBACK] ✅ Email confirmado en auth.users")
    console.log("[CALLBACK] ✅ Perfil actualizado automáticamente por trigger")

    console.log("[CALLBACK] ✅ Confirmación completada exitosamente")

    // Redirigir a página de éxito
    return NextResponse.redirect(new URL("/auth/confirmed", request.url))
  } catch (error: any) {
    console.error("[CALLBACK] ❌ Error inesperado:", error)
    return NextResponse.redirect(new URL("/auth/error?message=server_error", request.url))
  }
}
