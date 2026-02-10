import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function GET() {
  try {
    console.log("🔍 === DEBUG USERS ===")

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      return NextResponse.json({
        success: false,
        error: "Variables de entorno faltantes para acceso admin",
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

    // Obtener usuarios de auth.users
    const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers()

    if (authError) {
      console.error("❌ Error obteniendo usuarios de auth:", authError)
      return NextResponse.json({
        success: false,
        error: "Error obteniendo usuarios: " + authError.message,
      })
    }

    // Obtener perfiles
    const { data: profiles, error: profilesError } = await supabaseAdmin.from("profiles").select("*")

    if (profilesError) {
      console.error("❌ Error obteniendo perfiles:", profilesError)
    }

    console.log("📊 Usuarios encontrados:")
    console.log("- Auth users:", authUsers?.users?.length || 0)
    console.log("- Profiles:", profiles?.length || 0)

    return NextResponse.json({
      success: true,
      authUsers: authUsers?.users || [],
      profiles: profiles || [],
      counts: {
        authUsers: authUsers?.users?.length || 0,
        profiles: profiles?.length || 0,
      },
    })
  } catch (error) {
    console.error("❌ Error en debug users:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    })
  }
}
