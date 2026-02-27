import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    const cookieStore = cookies()
    const supabaseAdmin = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookieStore.set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookieStore.set({ name, value: "", ...options })
        },
      },
    })

    const { data: users, error: listError } = await supabaseAdmin.auth.admin.listUsers()

    if (listError) {
      console.log("Error listing users:", listError)
      return NextResponse.json({ success: false, error: "Error verificando usuarios" })
    }

    const existingUser = users.users.find((user) => user.email === email)

    if (existingUser) {
      console.log("User found:", existingUser.id, "Confirmed:", !!existingUser.email_confirmed_at)

      if (!existingUser.email_confirmed_at) {
        console.log("Auto-confirming user...")
        const { error: confirmError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
          email_confirm: true,
        })

        if (confirmError) {
          console.log("Error confirmando usuario:", confirmError)
          return NextResponse.json({ success: false, error: "Error confirmando usuario" })
        }
      }

      try {
        const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.admin.generateLink({
          type: "signup",
          email: email,
          password: password,
        })

        if (sessionError) {
          console.log("Error generating session:", sessionError)
          const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
            password: password,
            email_confirm: true,
          })

          if (updateError) {
            console.log("Error updating password:", updateError)
            return NextResponse.json({ success: false, error: "Error actualizando credenciales" })
          }

          console.log("Password updated successfully")
        }

        return NextResponse.json({
          success: true,
          message: "Usuario recuperado y credenciales actualizadas",
          shouldRetryLogin: true,
        })
      } catch (error) {
        console.log("Error in session generation:", error)
        return NextResponse.json({ success: false, error: "Error generando sesión" })
      }
    }

    return NextResponse.json({ success: false, error: "Usuario no encontrado" })
  } catch (error) {
    console.error("Error en recover-user:", error)
    return NextResponse.json({ success: false, error: "Error interno del servidor" })
  }
}
