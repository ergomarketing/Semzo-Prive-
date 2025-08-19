import { createClient } from "@supabase/supabase-js"
import { type NextRequest, NextResponse } from "next/server"

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_KEY!, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ message: "Email es requerido" }, { status: 400 })
    }

    console.log("[Admin] Confirmando usuario:", email)

    const { data: users, error: searchError } = await supabaseAdmin.auth.admin.listUsers()

    if (searchError) {
      console.error("[Admin] Error buscando usuarios:", searchError)
      return NextResponse.json({ message: "Error buscando usuario" }, { status: 500 })
    }

    const user = users.users.find((u) => u.email === email)

    if (!user) {
      return NextResponse.json({ message: "Usuario no encontrado" }, { status: 404 })
    }

    console.log("[Admin] Usuario encontrado:", user.id, "Email confirmado:", user.email_confirmed_at)

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
      email_confirmed_at: new Date().toISOString(),
    })

    if (error) {
      console.error("[Admin] Error confirmando usuario:", error)
      return NextResponse.json({ message: "Error confirmando usuario: " + error.message }, { status: 500 })
    }

    console.log("[Admin] Usuario confirmado exitosamente:", data.user.email)

    return NextResponse.json({
      message: `Usuario ${email} confirmado exitosamente. Ahora puede hacer login.`,
      user: data.user,
    })
  } catch (error) {
    console.error("[Admin] Error en confirmación manual:", error)
    return NextResponse.json({ message: "Error interno del servidor" }, { status: 500 })
  }
}
