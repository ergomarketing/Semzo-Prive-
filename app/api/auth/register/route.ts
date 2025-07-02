import { type NextRequest, NextResponse } from "next/server"
import { supabase } from "../../../lib/supabase-direct"

export async function POST(request: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone } = await request.json()

    console.log("Iniciando registro para:", email)

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
      console.error("Error en registro auth:", authError.message)
      return NextResponse.json({
        success: false,
        message: authError.message,
      }, { status: 400 })
    }

    console.log("Usuario creado en Auth:", authData.user?.id)

    // 2. Crear perfil con reintentos
    let profileCreated = false
    let retries = 0
    const maxRetries = 3
    
    if (authData.user) {
      const fullName = `${firstName} ${lastName}`
      
      while (!profileCreated && retries < maxRetries) {
        try {
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
          
          if (profileError) {
            console.error(`Intento ${retries+1}/${maxRetries} - Error creando perfil:`, profileError.message)
            retries++
            await new Promise(resolve => setTimeout(resolve, 500)) // Esperar 0.5s
          } else {
            profileCreated = true
            console.log("Perfil creado exitosamente")
          }
        } catch (error) {
          console.error(`Intento ${retries+1}/${maxRetries} - Error inesperado:`, error)
          retries++
          await new Promise(resolve => setTimeout(resolve, 500))
        }
      }
      
      if (!profileCreated) {
        console.error("Fallo crítico creando perfil después de 3 intentos")
        
        // Intentar eliminar usuario si no se pudo crear perfil
        try {
          await supabase.auth.admin.deleteUser(authData.user.id)
          console.log("Usuario eliminado por fallo en creación de perfil")
        } catch (deleteError) {
          console.error("Error eliminando usuario:", deleteError)
        }
        
        return NextResponse.json({
          success: false,
          message: "Error creando perfil de usuario. Por favor intenta de nuevo.",
        }, { status: 500 })
      }
    }

    // 3. Forzar confirmación en desarrollo
    if (process.env.NODE_ENV !== "production" && authData.user) {
      try {
        await supabase.auth.admin.updateUserById(authData.user.id, {
          email_confirm: true
        })
        console.log("Email confirmado automáticamente (entorno desarrollo)")
      } catch (confirmError) {
        console.error("Error confirmando email:", confirmError)
      }
    }

    return NextResponse.json({
      success: true,
      message: "¡Cuenta creada exitosamente!",
      user: {
        id: authData.user?.id,
        email: authData.user?.email,
        firstName,
        lastName
      },
    })
  } catch (error) {
    console.error("Error en registro:", error)
    return NextResponse.json({
      success: false,
      message: "Error interno del servidor",
    }, { status: 500 })
  }
}
