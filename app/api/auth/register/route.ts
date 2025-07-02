import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "../../../lib/supabase-direct"

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone } = await request.json()

    // 1. Registrar usuario en Supabase Auth
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
      console.error("Error en registro auth:", authError)
      return NextResponse.json({
        success: false,
        message: authError.message,
      })
    }

    console.log("Usuario creado en Auth:", authData.user?.id)

    // 2. Crear perfil en public.profiles con reintento
    if (authData.user) {
      const fullName = `${firstName} ${lastName}`;
      let profileCreated = false;
      let retries = 0;
      
      while (!profileCreated && retries < 3) {
        const { error: profileError } = await supabase
          .from("profiles")
          .insert({
            id: authData.user.id,
            email: authData.user.email,
            full_name: fullName,
            first_name: firstName,
            last_name: lastName,
            phone: phone || null,
          })
          
        if (!profileError) {
          profileCreated = true;
          console.log("Perfil creado exitosamente");
        } else {
          console.error(`Intento ${retries+1}/3 - Error creando perfil:`, profileError);
          await new Promise(resolve => setTimeout(resolve, 1000)); // Esperar 1s
          retries++;
        }
      }
      
      if (!profileCreated) {
        console.error("Fallo crítico creando perfil después de 3 intentos");
        return NextResponse.json({
          success: false,
          message: "Error creando perfil de usuario",
        })
      }
    }

    // 3. Forzar confirmación en desarrollo (eliminar en producción)
    if (process.env.NODE_ENV === "development") {
      await supabase.auth.admin.updateUserById(authData.user!.id, {
        email_confirm: true
      })
    }

    return NextResponse.json({
      success: true,
      message: "¡Cuenta creada exitosamente!",
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
