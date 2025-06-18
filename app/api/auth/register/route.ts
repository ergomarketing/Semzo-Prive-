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
    if (authData.user) {
  const { error: profileError } = await supabase.from("users").insert({
    id: authData.user.id,
    email,
    first_name: firstName,
    last_name: lastName,
    phone: phone || null,
    membership_status: "free",
  });

  if (profileError) {
    console.error(
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
  code: profileError.code,
  details: profileError.details,
  hint: profileError.hint,
})

  details: profileError.details,
  hint: profileError.hint,
})

      message: `Error creando perfil: ${profileError.message}`,
      details: profileError.details,
      code: profileError.code,
      hint: profileError.hint,
    });
  }
}

    
    
