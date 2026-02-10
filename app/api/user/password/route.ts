import { createClient } from "@/utils/supabase/server"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { password, currentPassword } = body

    if (!password) {
      return NextResponse.json({ error: "Contraseña requerida" }, { status: 400 })
    }

    // Validar longitud mínima
    if (password.length < 8) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 8 caracteres" }, { status: 400 })
    }

    console.log("[v0] Setting/updating password for user:", user.id)

    // Si existe currentPassword, verificar que sea correcta antes de cambiar
    if (currentPassword) {
      const supabaseVerify = await createClient()
      const { error: verifyError } = await supabaseVerify.auth.signInWithPassword({
        email: user.email || "",
        password: currentPassword,
      })

      if (verifyError) {
        console.error("[v0] Current password verification failed:", verifyError)
        return NextResponse.json({ error: "Contraseña actual incorrecta" }, { status: 400 })
      }
    }

    // Actualizar contraseña usando updateUser
    const { error: updateError } = await supabase.auth.updateUser({
      password: password,
    })

    if (updateError) {
      console.error("[v0] Error updating password:", updateError)
      return NextResponse.json({ error: "Error actualizando contraseña" }, { status: 500 })
    }

    console.log("[v0] Password updated successfully")

    return NextResponse.json({
      success: true,
      message: currentPassword ? "Contraseña cambiada correctamente" : "Contraseña establecida correctamente",
    })
  } catch (error) {
    console.error("[v0] Error in POST /api/user/password:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
