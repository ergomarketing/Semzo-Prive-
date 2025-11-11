import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email es requerido" }, { status: 400 })
    }

    const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
      cookies: {
        get(name: string) {
          return cookies().get(name)?.value
        },
        set(name: string, value: string, options: any) {
          cookies().set({ name, value, ...options })
        },
        remove(name: string, options: any) {
          cookies().set({ name, value: "", ...options })
        },
      },
    })

    // Buscar usuario en auth.users
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(email)

    if (authError) {
      console.error("Error buscando usuario:", authError)
      return NextResponse.json({ error: "Usuario no encontrado en auth" }, { status: 404 })
    }

    if (!authUser.user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Buscar perfil del usuario
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authUser.user.id)
      .single()

    const result = {
      id: authUser.user.id,
      email: authUser.user.email,
      created_at: authUser.user.created_at,
      email_confirmed_at: authUser.user.email_confirmed_at,
      last_sign_in_at: authUser.user.last_sign_in_at,
      profiles: profile || null,
    }

    return NextResponse.json(result)
  } catch (error) {
    console.error("Error en diagnóstico:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
