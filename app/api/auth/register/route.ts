// app/api/auth/register/route.ts

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
        message: "Error de configuración: faltan variables de entorno necesarias.",
      })
    }

    // Crear cliente Supabase admin (con service_role)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // 1. Crear el usuario en Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password: password.trim(),
      email_confirm: true,
    })

    if (authError || !authData?.user?.id) {
      console.error("[API] Error creando usuario en Auth:", authError)
      return NextResponse.json({
        success: false,
        message: `Error al crear cuenta: ${authError?.message || "Desconocido"}`,
      })
    }

    const userId = authData.user.id

    // 2. Insertar datos adicionales en tabla `users`
    const { error: dbError } = await supabaseAdmin.from("users").insert({
      id: userId,
      email: email.trim().toLowerCase(),
      first_name: firstName.trim(),
      last_name: lastName.trim(),
      phone: phone?.trim() || null,
      membership_status: "free",
    })

    if (dbError) {
      console.error("[API] Error insertando en tabla users:", dbError)
      // Eliminar usuario de Auth si falla la inserción en DB
      await supabaseAdmin.auth.admin.deleteUser(userId)
      return NextResponse.json({
        success: false,
        message: `Error al guardar usuario en la base de datos: ${dbError.message}`,
      })
    }

    return NextResponse.json({
      success: true,
      message: "Cuenta creada exitosamente.",
    })
  } catch (err: any) {
    console.error("[API] Error general:", err)
    return NextResponse.json({
      success: false,
      message: `Error interno del servidor: ${err.message}`,
    })
  }
}
