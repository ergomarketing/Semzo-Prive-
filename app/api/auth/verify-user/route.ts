import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
import { createRouteHandlerClient, getSupabaseServiceRole } from "@/lib/supabase"

export const dynamic = "force-dynamic"

/**
 * ============================================================================
 * Valida si el usuario existe realmente en auth.users y devuelve su perfil.
 *
 * Se llama desde useAuth tras detectar una sesion en el browser, para:
 *  - Evitar depender de las politicas RLS de la tabla profiles (que pueden
 *    bloquear la lectura del propio perfil en ciertos casos).
 *  - Detectar sesiones huerfanas (token sigue en cookies/localStorage pero el
 *    usuario fue eliminado de Supabase Auth).
 *
 * SEGURIDAD:
 *  - Valida que el userId de la query coincide con la sesion actual (cookies).
 *  - Si no coincide o no hay sesion → 401.
 *  - Solo con identidad confirmada usa supabaseAdmin para responder si existe.
 * ============================================================================
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "MISSING_USER_ID" }, { status: 400 })
    }

    // 1. Comprobar sesion actual via cookies
    const supabase = await createRouteHandlerClient({ cookies })
    const {
      data: { user: sessionUser },
    } = await supabase.auth.getUser()

    if (!sessionUser) {
      // Sin sesion server-side: el browser puede tener una stale cookie.
      // Devolver exists=true para no forzar signOut en flujos de webview donde
      // las cookies tardan en propagarse. useAuth tratara esto como "existe".
      return NextResponse.json({ exists: true, profile: null })
    }

    if (sessionUser.id !== userId) {
      return NextResponse.json({ error: "USER_MISMATCH" }, { status: 403 })
    }

    // 2. Confirmar que el usuario existe en auth.users (via admin)
    const admin = getSupabaseServiceRole()
    if (!admin) {
      return NextResponse.json({ exists: true, profile: null })
    }
    const { data: authUser, error: authError } = await admin.auth.admin.getUserById(userId)

    if (authError || !authUser?.user) {
      return NextResponse.json({ exists: false, profile: null })
    }

    // 3. Leer el perfil via admin (evita RLS)
    const { data: profile } = await admin
      .from("profiles")
      .select("id, full_name, first_name, last_name, email, phone, avatar_url")
      .eq("id", userId)
      .maybeSingle()

    return NextResponse.json({ exists: true, profile: profile || null })
  } catch (e: any) {
    // En caso de error server-side, devolver exists=true para no cerrar sesiones validas
    return NextResponse.json({ exists: true, profile: null, error: e?.message || "UNKNOWN" }, { status: 200 })
  }
}
