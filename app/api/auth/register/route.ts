import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { email, password, firstName, lastName, phone } = await request.json()

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        message: "Variables de Supabase no configuradas",
      })
    }

    // Cliente con service_role para operaciones admin
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // 1. Crear usuario directamente con admin (sin confirmación de email)
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password.trim(),
      email_confirm: true, // Confirmar automáticamente
    })

    if (authError) {
      console.error("[API] Error creando usuario:", authError)
      return NextResponse.json({
        success: false,
        message: authError.message,
      })
    }

    const userId = authData.user?.id
    if (!userId) {
      return NextResponse.json({
        success: false,
        message: "No se pudo crear el usuario",
      })
    }

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

      // Si falla la inserción, eliminar el usuario de auth
      await supabaseAdmin.auth.admin.deleteUser(userId)

      return NextResponse.json({
        success: false,
        message: `Error guardando perfil: ${dbError.message}`,
      })
    }

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
