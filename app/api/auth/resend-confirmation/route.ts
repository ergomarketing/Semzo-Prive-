import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    console.log("[RESEND] === INICIO REENVÍO ===")

    const body = await request.json()
    const { email } = body

    if (!email) {
      return NextResponse.json({ error: "Email es requerido" }, { status: 400 })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })

    // Verificar que el usuario existe
    const { data: user, error: userError } = await supabaseAdmin.auth.admin.getUserByEmail(email)

    if (userError || !user.user) {
      return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
    }

    // Reenviar email de confirmación
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"
    const { error: emailError } = await supabaseAdmin.auth.admin.generateLink({
      type: "signup",
      email,
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    })

    if (emailError) {
      console.error("[RESEND] Error enviando email:", emailError)
      return NextResponse.json({ error: "Error enviando email de confirmación" }, { status: 500 })
    }

    console.log("[RESEND] ✓ Email reenviado exitosamente")
    return NextResponse.json({
      message: "Email de confirmación reenviado. Revisa tu bandeja de entrada.",
    })
  } catch (error) {
    console.error("[RESEND] Error inesperado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
