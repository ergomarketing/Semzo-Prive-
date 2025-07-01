import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "../../../lib/supabase-direct"

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone } = await request.json()
    console.log("Intentando registrar usuario:", email)

    // 1. Crear usuario en Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { 
          first_name: firstName,
          last_name: lastName
        }
      }
    })

    if (authError) {
      console.error("Error de autenticación:", authError)
      return NextResponse.json({
        success: false,
        message: authError.message,
      })
    }

    console.log("Usuario creado en Auth:", authData.user?.id)

    // 2. Crear perfil en la tabla 'profiles'
    if (authData.user) {
      const fullName = `${firstName} ${lastName}`;
      
      const { error: profileError } = await supabase.from("profiles").insert({
        id: authData.user.id,
        email,
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        email: email //
      })

      if (profileError) {
        console.error("Error creating profile:", profileError)
        // No fallar si hay error en el perfil
      } else {
        console.log("Perfil creado en tabla profiles")
      }
    }

    return NextResponse.json({
      success: true,
      message: "Cuenta creada exitosamente. Revisa tu email para confirmar.",
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
        firstName,
        lastName
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
