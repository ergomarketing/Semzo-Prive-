import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName, phone } = await request.json()

    // Verificar variables de entorno paso a paso
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    console.log("[API] Verificando variables:")
    console.log("[API] URL existe:", !!supabaseUrl)
    console.log("[API] Service Key existe:", !!supabaseServiceKey)
    console.log("[API] URL:", supabaseUrl?.substring(0, 30) + "...")
    console.log("[API] Service Key:", supabaseServiceKey?.substring(0, 30) + "...")

    if (!supabaseUrl) {
      return NextResponse.json({
        success: false,
        message: "NEXT_PUBLIC_SUPABASE_URL no configurada",
      })
    }

    if (!supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        message: "SUPABASE_SERVICE_ROLE_KEY no configurada",
      })
    }

    // Cliente con service_role para operaciones admin
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    console.log("[API] Cliente Supabase creado correctamente")

    // 1. Crear usuario directamente con admin
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password.trim(),
      email_confirm: true,
    })

    if (authError) {
      console.error("[API] Error creando usuario:", authError)
      return NextResponse.json({
        success: false,
        message: `Error Auth: ${authError.message}`,
      })
    }

    const userId = authData.user?.id
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "No se pudo obtener ID de usuario",
      })
    }

    console.log("[API] Usuario creado en Auth:", userId)

    // 2. Insertar en tabla users
    const { error: dbError } = await supabaseAdmin.from("users").insert({
      id: userId,
      email: email.trim().toLowerCase(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone?.trim() || null,
      membership_status: "free",
    })

    if (dbError) {
      console.error("[API] Error insertando en users:", dbError)

      // Limpiar usuario de auth si falla la inserción
      await supabaseAdmin.auth.admin.deleteUser(userId)

      return NextResponse.json({
        success: false,
        message: `Error DB: ${dbError.message}`,
      })
    }

    console.log("[API] Usuario guardado en tabla users")

    return NextResponse.json({
      success: true,
      message: "Cuenta creada exitosamente",
    })
  } catch (err: any) {
    console.error("[API] Error general:", err)
    return NextResponse.json({
      success: false,
      message: `Error: ${err.message}`,
    })
  }
}
