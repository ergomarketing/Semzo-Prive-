import { createClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 })
    }

    const supabaseService = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    const { data: users, error: searchError } = await supabaseService.auth.admin.listUsers()

    if (searchError) {
      return NextResponse.json({ error: "Error buscando usuario" }, { status: 500 })
    }

    const user = users.users.find((u) => u.email === email)

    if (!user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    const { data: updatedUser, error: updateError } = await supabaseService.auth.admin.updateUserById(user.id, {
      email_confirm: true,
    })

    if (updateError) {
      return NextResponse.json({ error: "Error confirmando usuario" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: `Usuario ${email} confirmado exitosamente`,
      userId: user.id,
    })
  } catch (error) {
    console.error("Error en fix-user:", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
