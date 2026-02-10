import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ exists: false, error: "Email es requerido" }, { status: 400 })
    }

    const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verificar en auth.users usando admin client
    const { data, error } = await supabaseAdmin.auth.admin.listUsers()

    if (error) {
      return NextResponse.json({ exists: false, error: "Error al verificar email" }, { status: 500 })
    }

    const userExists = data.users.some((user) => user.email?.toLowerCase() === email.toLowerCase().trim())

    return NextResponse.json({ exists: userExists })
  } catch (error) {
    return NextResponse.json({ exists: false, error: "Error interno del servidor" }, { status: 500 })
  }
}
