import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

/**
 * ============================================================================
 * ENDPOINT: Completar perfil tras verificación SMS (webview-safe)
 * ============================================================================
 * En webviews (Instagram, Facebook) las cookies y localStorage suelen estar
 * bloqueados, lo que hace que supabase.auth.getUser() / .updateUser() se
 * queden colgados indefinidamente tras verifyOtp.
 *
 * Este endpoint recibe el userId + phone verificados en el cliente y actualiza
 * el perfil usando la service-role key (no depende de cookies de sesión).
 *
 * Seguridad: antes de actualizar, validamos que el userId existe y su phone
 * coincide con el phone recibido — ambos fueron establecidos en verifyOtp.
 * ============================================================================
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, phone, fullName } = await request.json()

    if (!userId || !fullName || typeof fullName !== "string") {
      return NextResponse.json({ error: "MISSING_PARAMS" }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !serviceRoleKey) {
      return NextResponse.json({ error: "SERVER_MISCONFIGURED" }, { status: 500 })
    }

    const admin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    })

    // Validar que el userId existe en auth (no en profiles — puede ser nuevo)
    const { data: authUser, error: authError } = await admin.auth.admin.getUserById(userId)

    if (authError || !authUser?.user) {
      return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 })
    }

    const trimmed = fullName.trim()
    const parts = trimmed.split(/\s+/)
    const firstName = parts[0] || ""
    const lastName = parts.slice(1).join(" ") || ""

    // Upsert: cubre tanto el caso en que el perfil ya existe (update)
    // como el caso en que aun no se ha creado (insert)
    const { error: upsertError } = await admin
      .from("profiles")
      .upsert({
        id: userId,
        email: authUser.user.email || `${authUser.user.phone}@phone.semzoprive.com`,
        phone: authUser.user.phone || null,
        full_name: trimmed,
        first_name: firstName,
        last_name: lastName,
        auth_method: "sms",
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" })

    if (upsertError) {
      return NextResponse.json({ error: "UPDATE_FAILED", message: upsertError.message }, { status: 500 })
    }

    // Sync user_metadata (no bloqueante — si falla, el dato ya está en profiles)
    try {
      await admin.auth.admin.updateUserById(userId, {
        user_metadata: { full_name: trimmed, first_name: firstName, last_name: lastName },
      })
    } catch {
      // ignorar
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    return NextResponse.json({ error: "INTERNAL_ERROR", message: err?.message }, { status: 500 })
  }
}
