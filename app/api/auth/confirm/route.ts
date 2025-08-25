import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { token_hash, type } = body

    console.log("[CONFIRM] === INICIO CONFIRMACIÓN ===")
    console.log("[CONFIRM] Token hash:", token_hash ? "✓" : "✗")
    console.log("[CONFIRM] Type:", type)

    if (!token_hash || type !== "signup") {
      return NextResponse.json(
        {
          success: false,
          error: "Parámetros de confirmación inválidos",
        },
        { status: 400 },
      )
    }

    // Obtener variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("[CONFIRM] Variables de entorno faltantes")
      return NextResponse.json(
        {
          success: false,
          error: "Configuración del servidor incompleta",
        },
        { status: 500 },
      )
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verificar el token de confirmación
    console.log("[CONFIRM] Verificando token de confirmación...")
    const { data: verifyData, error: verifyError } = await supabaseAdmin.auth.verifyOtp({
      token_hash,
      type: "signup",
    })

    if (verifyError || !verifyData.user) {
      console.error("[CONFIRM] Error verificando token:", verifyError)
      return NextResponse.json(
        {
          success: false,
          error: "Token de confirmación inválido o expirado",
        },
        { status: 400 },
      )
    }

    const user = verifyData.user
    console.log("[CONFIRM] Usuario confirmado:", user.id)

    // Crear perfil en tabla users
    console.log("[CONFIRM] Creando perfil en tabla users...")
    const { error: usersError } = await supabaseAdmin.from("users").upsert([
      {
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || "",
        last_name: user.user_metadata?.last_name || "",
        phone: user.user_metadata?.phone || null,
        membership_status: "free",
        email_confirmed: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      },
    ])

    if (usersError) {
      console.error("[CONFIRM] Error creando perfil en users:", usersError)
    } else {
      console.log("[CONFIRM] ✅ Perfil creado en tabla users")
    }

    // Crear perfil en tabla profiles también
    console.log("[CONFIRM] Creando perfil en tabla profiles...")
    const { error: profilesError } = await supabaseAdmin.from("profiles").upsert([
      {
        id: user.id,
        email: user.email,
        first_name: user.user_metadata?.first_name || "",
        last_name: user.user_metadata?.last_name || "",
        phone: user.user_metadata?.phone || null,
        membership_status: "free",
        email_confirmed: true,
      },
    ])

    if (profilesError) {
      console.error("[CONFIRM] Error creando perfil en profiles:", profilesError)
    } else {
      console.log("[CONFIRM] ✅ Perfil creado en tabla profiles")
    }

    console.log("[CONFIRM] ✅ Confirmación completada exitosamente")

    return NextResponse.json({
      success: true,
      message: "Email confirmado exitosamente. Ya puedes iniciar sesión.",
      user: {
        id: user.id,
        email: user.email,
        emailConfirmed: true,
      },
    })
  } catch (error: any) {
    console.error("[CONFIRM] ❌ Error inesperado:", error)
    return NextResponse.json(
      {
        success: false,
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 },
    )
  }
}
