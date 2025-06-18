import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "../../../lib/supabase-direct"

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone } = await request.json()

    console.log("Intentando registrar usuario:", email)

    // Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    })

    if (authError) {
      console.error("Error de autenticación:", authError)
      return NextResponse.json({
        success: false,
        message: authError.message,
      })
    }

    console.log("Usuario creado en Auth:", authData.user?.id)

    // Crear perfil de usuario
    if (profileError) {
  console.error(
    "Error creating profile:",
    profileError.message,
    profileError.code,
    profileError.details,
    profileError.hint
  );
  return NextResponse.json({
    success: false,
    if (profileError) {
  console.error(
    "❌ Error creating profile:",
    profileError.message,
    profileError.code,
    profileError.details,
    profileError.hint
  )
  return NextResponse.json({
    success: false,
    message: `Error creando perfil: ${profileError.message}`,
    details: profileError.details,
    code: profileError.code,
    hint: profileError.hint,
  })
}

        console.error("Error creating profile:", profileError)
        return NextResponse.json({
          success: false,
          message: `Error creando perfil: ${profileError.message}`,
        })
      }
    }

    return NextResponse.json({
      success: true,
      message: "Cuenta creada exitosamente. Revisa tu email para confirmar.",
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({
      success: false,
      message: "Error interno del servidor",
    })
  }
}
