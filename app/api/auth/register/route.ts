import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "../../../lib/supabase-direct"

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone } = await request.json()

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
      return NextResponse.json({ error: authError.message }, { status: 400 })
    }

    // 2. Crear perfil en public.profiles
    if (authData.user) {
      const fullName = `${firstName} ${lastName}`;
      
      await supabase.from("profiles").upsert({
        id: authData.user.id,
        email: authData.user.email,
        full_name: fullName,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
      }, {
        onConflict: 'id' // Actualiza si ya existe
      });
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
    return NextResponse.json({
      success: false,
      message: "Error interno del servidor",
    })
  }
}
