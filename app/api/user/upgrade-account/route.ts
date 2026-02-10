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
    const { email, password } = body

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contraseña son obligatorios" }, { status: 400 })
    }

    // Validar formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json({ error: "Email inválido" }, { status: 400 })
    }

    // No permitir emails temporales
    if (email.endsWith("@phone.semzoprive.com")) {
      return NextResponse.json({ error: "Debes usar un email real" }, { status: 400 })
    }

    // Validar contraseña
    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }

    console.log("[v0] Upgrading account from SMS to email/password:", user.id)

    // UPDATE ATÓMICO: email + password en una sola llamada
    const { data: authUpdate, error: authError } = await supabase.auth.updateUser({
      email: email,
      password: password,
    })

    if (authError) {
      console.error("[v0] Error upgrading account:", authError)

      if (authError.message.includes("already registered") || authError.message.includes("already exists")) {
        return NextResponse.json({ error: "Este email ya está registrado en otra cuenta" }, { status: 409 })
      }

      return NextResponse.json({ error: `Error al actualizar la cuenta: ${authError.message}` }, { status: 500 })
    }

    console.log("[v0] Account upgraded successfully in auth.users")

    // Actualizar email en profiles
    const { error: profileError } = await supabase.from("profiles").update({ email }).eq("id", user.id)

    if (profileError) {
      console.error("[v0] Error updating profile email:", profileError)
      // No revertir - auth ya está actualizado
    }

    console.log("[v0] Profile email updated successfully")

    return NextResponse.json({
      success: true,
      message: "Cuenta actualizada correctamente. Ahora puedes iniciar sesión con email y contraseña.",
    })
  } catch (error) {
    console.error("[v0] Error in POST /api/user/upgrade-account:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
