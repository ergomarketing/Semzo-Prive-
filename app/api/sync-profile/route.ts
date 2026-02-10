import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  console.log("[BACKEND] sync-profile endpoint called:", new Date().toISOString())

  try {
    const body = await request.json()
    const { firstName, lastName, phone } = body

    console.log("[BACKEND] Sync-profile request:", {
      firstName,
      lastName,
      hasPhone: !!phone,
    })

    // Obtener sesión del usuario autenticado
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      console.error("[BACKEND] No authenticated user:", authError)
      return NextResponse.json(
        { success: false, message: "No autenticado", error: "UNAUTHORIZED" },
        { status: 401 },
      )
    }

    console.log("[BACKEND] Authenticated user:", user.id)

    // Sincronizar profile con upsert (idempotente)
    console.log("[BACKEND] Upserting profile...")
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: user.id,
        email: user.email!,
        full_name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        phone: phone || null,
        membership_status: "free",
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "id",
      },
    )

    if (profileError) {
      console.error("[BACKEND] Profile upsert error:", profileError)
      return NextResponse.json(
        { success: false, message: `Error al sincronizar perfil: ${profileError.message}`, error: "PROFILE_ERROR" },
        { status: 500 },
      )
    }

    console.log("[BACKEND] Profile synced successfully for user:", user.id)

    return NextResponse.json({
      success: true,
      message: "Perfil sincronizado correctamente",
      profile: {
        id: user.id,
        email: user.email,
        full_name: `${firstName} ${lastName}`,
      },
    })
  } catch (error) {
    console.error("[BACKEND] Unexpected error in sync-profile:", error)
    return NextResponse.json(
      { success: false, message: "Error inesperado al sincronizar perfil", error: "INTERNAL_ERROR" },
      { status: 500 },
    )
  }
}
