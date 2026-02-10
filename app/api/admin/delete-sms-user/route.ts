import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export async function POST(request: Request) {
  try {
    const { phone } = await request.json()

    if (!phone) {
      return NextResponse.json({ success: false, message: "Phone number required" }, { status: 400 })
    }

    // Verificar que el usuario actual es admin (opcional - puedes activar esto más adelante)
    // const cookieStore = await cookies()
    // const supabase = createServerClient(...)
    // const { data: { user } } = await supabase.auth.getUser()
    // if (!user || user.email !== 'admin@semzoprive.com') { ... }

    // Usar SERVICE_ROLE_KEY para eliminar usuarios
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )

    console.log("[ADMIN] Attempting to delete SMS user with phone:", phone)

    // 1. Buscar profile por teléfono
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, full_name, email")
      .eq("phone", phone)
      .maybeSingle()

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "No se encontró usuario con ese teléfono" },
        { status: 404 },
      )
    }

    console.log("[ADMIN] Found profile:", profile.id, profile.full_name)

    // 2. Eliminar usuario de auth.users (esto eliminará en cascada de profiles si hay FK)
    const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(profile.id)

    if (authDeleteError) {
      console.error("[ADMIN] Error deleting from auth.users:", authDeleteError)
      return NextResponse.json(
        { success: false, message: `Error eliminando usuario: ${authDeleteError.message}` },
        { status: 500 },
      )
    }

    // 3. Asegurar que profile también se elimine (por si FK no está configurado)
    const { error: profileDeleteError } = await supabaseAdmin.from("profiles").delete().eq("id", profile.id)

    if (profileDeleteError) {
      console.warn("[ADMIN] Error deleting profile (may already be deleted by cascade):", profileDeleteError)
    }

    console.log("[ADMIN] User deleted successfully:", profile.id)

    return NextResponse.json({
      success: true,
      message: `Usuario ${profile.full_name || profile.email} eliminado correctamente`,
      deletedUser: {
        id: profile.id,
        name: profile.full_name,
        email: profile.email,
        phone: phone,
      },
    })
  } catch (error: any) {
    console.error("[ADMIN] Unexpected error:", error)
    return NextResponse.json({ success: false, message: error.message }, { status: 500 })
  }
}
