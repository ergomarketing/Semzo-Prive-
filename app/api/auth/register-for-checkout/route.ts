import { type NextRequest, NextResponse } from "next/server"
import { getSupabaseServiceRole } from "@/lib/supabase"

// Endpoint dedicado para registros que vienen directamente del flujo de compra
// (carrito → modal de auth → pagar). Crea el usuario con email_confirm=true para
// saltarse la verificacion de correo SOLO en este flujo, ya que el usuario va a
// pagar con Stripe inmediatamente. El email se valida implicitamente al pagar.
//
// Los registros "normales" (sin compra) siguen pasando por supabase.auth.signUp
// desde el cliente y requieren confirmacion de email.
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Email y contrasena son obligatorios" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "La contrasena debe tener al menos 6 caracteres" }, { status: 400 })
    }

    const admin = getSupabaseServiceRole()
    if (!admin) {
      return NextResponse.json({ error: "Servicio no disponible" }, { status: 500 })
    }

    const normalizedEmail = String(email).trim().toLowerCase()

    // Si el usuario ya existe, devolvemos exists=true para que el cliente haga login
    // normal con esa misma contrasena (sabra si es correcta o no).
    const { data: existing } = await admin.auth.admin.listUsers()
    const existingUser = existing?.users?.find((u) => u.email?.toLowerCase() === normalizedEmail)
    if (existingUser) {
      return NextResponse.json({ exists: true })
    }

    const { data, error } = await admin.auth.admin.createUser({
      email: normalizedEmail,
      password,
      email_confirm: true, // saltarse verificacion por ser flujo de compra
    })

    if (error || !data?.user) {
      console.error("[v0] register-for-checkout createUser error:", error)
      return NextResponse.json(
        { error: error?.message || "No se pudo crear la cuenta" },
        { status: 500 },
      )
    }

    // Crear perfil basico (el trigger DB no existe en algunos entornos, hacemos upsert
    // para garantizar que el perfil exista antes de proceder al pago).
    try {
      await admin.from("profiles").upsert(
        {
          id: data.user.id,
          email: normalizedEmail,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      )
    } catch (profileErr) {
      console.error("[v0] register-for-checkout profile upsert error:", profileErr)
    }

    return NextResponse.json({ success: true, userId: data.user.id })
  } catch (err: any) {
    console.error("[v0] register-for-checkout exception:", err)
    return NextResponse.json({ error: err?.message || "Error interno" }, { status: 500 })
  }
}
