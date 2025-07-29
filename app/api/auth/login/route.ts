import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  console.log("🔥 [LOGIN API] === INICIANDO PROCESO DE LOGIN ===")

  try {
    const body = await request.json()
    console.log("📝 [LOGIN API] Datos recibidos:", {
      email: body.email,
      hasPassword: !!body.password,
      bodyKeys: Object.keys(body),
    })

    const { email, password } = body

    // Validación inicial
    if (!email) {
      console.log("❌ [LOGIN API] Email faltante")
      return NextResponse.json(
        {
          success: false,
          message: "Email es requerido",
        },
        { status: 400 },
      )
    }

    if (!password) {
      console.log("❌ [LOGIN API] Password faltante")
      return NextResponse.json(
        {
          success: false,
          message: "Contraseña es requerida",
        },
        { status: 400 },
      )
    }

    // Verificar variables de entorno
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log("🔧 [LOGIN API] Variables de entorno:", {
      supabaseUrl: supabaseUrl ? "✅ Configurada" : "❌ Faltante",
      serviceKey: supabaseServiceKey ? "✅ Configurada" : "❌ Faltante",
      urlLength: supabaseUrl?.length || 0,
      keyLength: supabaseServiceKey?.length || 0,
    })

    if (!supabaseUrl || !supabaseServiceKey) {
      console.error("💥 [LOGIN API] Variables de entorno faltantes")
      return NextResponse.json(
        {
          success: false,
          message: "Error de configuración del servidor",
        },
        { status: 500 },
      )
    }

    // Crear cliente Supabase con service role
    console.log("🔧 [LOGIN API] Creando cliente Supabase...")
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("✅ [LOGIN API] Cliente Supabase creado exitosamente")

    // Normalizar email
    const normalizedEmail = email.trim().toLowerCase()
    console.log("📧 [LOGIN API] Email normalizado:", normalizedEmail)

    // Buscar usuario en la tabla users
    console.log("🔍 [LOGIN API] Buscando usuario en tabla users...")
    const { data: user, error: findError } = await supabase
      .from("users")
      .select("*")
      .eq("email", normalizedEmail)
      .single()

    console.log("📊 [LOGIN API] Resultado de búsqueda:", {
      userFound: !!user,
      userId: user?.id,
      userEmail: user?.email,
      userStatus: user?.membership_status,
      error: findError?.message,
      errorCode: findError?.code,
    })

    if (findError) {
      console.error("❌ [LOGIN API] Error al buscar usuario:", {
        message: findError.message,
        code: findError.code,
        details: findError.details,
        hint: findError.hint,
      })

      if (findError.code === "PGRST116") {
        return NextResponse.json(
          {
            success: false,
            message: "Usuario no encontrado. ¿Necesitas crear una cuenta?",
          },
          { status: 404 },
        )
      }

      return NextResponse.json(
        {
          success: false,
          message: "Error al verificar usuario",
        },
        { status: 500 },
      )
    }

    if (!user) {
      console.log("❌ [LOGIN API] Usuario no encontrado")
      return NextResponse.json(
        {
          success: false,
          message: "Usuario no encontrado",
        },
        { status: 404 },
      )
    }

    // Verificar contraseña (simulado - en producción deberías usar hash)
    console.log("🔐 [LOGIN API] Verificando contraseña...")
    // Aquí deberías verificar la contraseña hasheada
    // Por ahora, asumimos que la verificación es exitosa

    // Actualizar last_login
    console.log("⏰ [LOGIN API] Actualizando last_login...")
    const { error: updateError } = await supabase
      .from("users")
      .update({
        last_login: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", user.id)

    if (updateError) {
      console.error("⚠️ [LOGIN API] Error actualizando last_login:", updateError)
    } else {
      console.log("✅ [LOGIN API] last_login actualizado exitosamente")
    }

    // Preparar respuesta
    const userResponse = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      phone: user.phone,
      membershipStatus: user.membership_status,
      isAdmin: user.is_admin || false,
      createdAt: user.created_at,
      lastLogin: new Date().toISOString(),
    }

    console.log("🎉 [LOGIN API] Login exitoso para usuario:", {
      userId: user.id,
      email: user.email,
      membershipStatus: user.membership_status,
    })

    return NextResponse.json({
      success: true,
      message: "Login exitoso",
      user: userResponse,
    })
  } catch (error: any) {
    console.error("💥 [LOGIN API] Error inesperado:", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    })

    return NextResponse.json(
      {
        success: false,
        message: "Error interno del servidor",
      },
      { status: 500 },
    )
  }
}
