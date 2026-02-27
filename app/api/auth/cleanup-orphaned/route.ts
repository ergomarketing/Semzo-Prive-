import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function POST(request: NextRequest) {
  try {
    console.log("[CLEANUP] === INICIO LIMPIEZA ===")

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

    const analysis = {
      email,
      userInAuth: false,
      profileInDatabase: false,
      isOrphaned: false,
      actionTaken: "none" as "none" | "deleted_orphan" | "created_profile" | "no_action_needed",
    }

    // Verificar usuario en auth
    console.log("[CLEANUP] Verificando usuario en auth...")
    const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserByEmail(email)

    if (authError && authError.message !== "User not found") {
      console.error("[CLEANUP] Error verificando auth:", authError)
      return NextResponse.json({ error: "Error verificando usuario en auth" }, { status: 500 })
    }

    if (authUser?.user) {
      analysis.userInAuth = true
      console.log("[CLEANUP] Usuario encontrado en auth:", authUser.user.id)

      // Verificar perfil en database
      const { data: profile, error: profileError } = await supabaseAdmin
        .from("users")
        .select("*")
        .eq("id", authUser.user.id)
        .single()

      if (profileError && profileError.code !== "PGRST116") {
        console.error("[CLEANUP] Error verificando perfil:", profileError)
        return NextResponse.json({ error: "Error verificando perfil" }, { status: 500 })
      }

      if (profile) {
        analysis.profileInDatabase = true
        analysis.actionTaken = "no_action_needed"
        console.log("[CLEANUP] Usuario tiene perfil completo")
      } else {
        // Usuario huérfano detectado
        analysis.isOrphaned = true
        console.log("[CLEANUP] Usuario huérfano detectado, eliminando...")

        const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(authUser.user.id)
        if (deleteError) {
          console.error("[CLEANUP] Error eliminando usuario huérfano:", deleteError)
          return NextResponse.json({ error: "Error eliminando usuario huérfano" }, { status: 500 })
        }

        analysis.actionTaken = "deleted_orphan"
        console.log("[CLEANUP] ✓ Usuario huérfano eliminado")
      }
    } else {
      console.log("[CLEANUP] Usuario no encontrado en auth")
    }

    console.log("[CLEANUP] === ANÁLISIS COMPLETO ===")
    console.log("[CLEANUP] Resultado:", analysis)

    return NextResponse.json({
      message: "Análisis completado",
      analysis,
    })
  } catch (error) {
    console.error("[CLEANUP] Error inesperado:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
