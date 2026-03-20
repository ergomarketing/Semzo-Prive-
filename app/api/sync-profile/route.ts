import { createServerClient } from "@supabase/ssr"
import type { SupabaseClient } from "@supabase/supabase-js"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

/**
 * Garantiza que el perfil SIEMPRE existe antes de cualquier lógica.
 * Si no existe lo crea con valores mínimos seguros.
 */
async function getOrCreateProfile(supabase: SupabaseClient, userId: string) {
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .maybeSingle()

  if (!profile) {
    console.log("[SYNC PROFILE] Perfil no encontrado, creando perfil base para userId:", userId)
    const { data: newProfile, error } = await supabase
      .from("profiles")
      .insert({
        id: userId,
        membership_status: "free",
        created_at: new Date().toISOString(),
      })
      .select()
      .single()

    if (error) throw new Error(`Error creando perfil base: ${error.message}`)
    console.log("[PROFILE FOUND]", newProfile?.id)
    return newProfile
  }

  console.log("[PROFILE FOUND]", profile?.id)
  return profile
}

export async function POST(request: NextRequest) {
  console.log("[SYNC PROFILE] sync-profile endpoint called:", new Date().toISOString())

  try {
    const body = await request.json()
    const { firstName, lastName, phone } = body

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
      console.error("[SYNC PROFILE] No authenticated user:", authError)
      return NextResponse.json(
        { success: false, message: "No autenticado", error: "UNAUTHORIZED" },
        { status: 401 },
      )
    }

    const userId = user.id

    // Guard crítico: nunca continuar con userId nulo
    if (!userId) {
      console.error("[SYNC PROFILE] userId es null — abortando")
      return NextResponse.json({ success: false, message: "Missing userId", error: "MISSING_USER_ID" }, { status: 400 })
    }

    console.log("[SYNC PROFILE]", { userId })

    // SIEMPRE garantizar que el perfil existe antes de cualquier lógica
    const existingProfile = await getOrCreateProfile(supabase, userId)

    const currentStatus = existingProfile?.membership_status
    const keepStatus = currentStatus && currentStatus !== "free"

    // Si viene phone, verificar que no pertenezca a otro usuario antes de incluirlo
    let safePhone: string | null = phone || null
    if (safePhone) {
      const { data: phoneOwner } = await supabase
        .from("profiles")
        .select("id")
        .eq("phone", safePhone)
        .neq("id", userId)
        .maybeSingle()
      if (phoneOwner) {
        console.log("[SYNC PROFILE] Phone ya existe en otro perfil, omitiendo campo phone")
        safePhone = null
      }
    }

    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email: user.email!,
        full_name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        ...(safePhone !== null ? { phone: safePhone } : {}),
        ...(keepStatus ? {} : { membership_status: "free" }),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )

    if (profileError) {
      // Error 23505 = duplicate key — no es un crash, continuar sin bloquear
      if (profileError.code === "23505") {
        console.log("[SYNC PROFILE] Conflicto de unicidad ignorado:", profileError.message)
      } else {
        console.error("[SYNC PROFILE] Profile upsert error:", profileError)
        return NextResponse.json(
          { success: false, message: `Error al sincronizar perfil: ${profileError.message}`, error: "PROFILE_ERROR" },
          { status: 500 },
        )
      }
    }

    console.log("[SYNC PROFILE] Perfil sincronizado correctamente para userId:", userId)

    return NextResponse.json({
      success: true,
      message: "Perfil sincronizado correctamente",
      profile: {
        id: userId,
        email: user.email,
        full_name: `${firstName} ${lastName}`,
      },
    })
  } catch (error) {
    console.error("[SYNC PROFILE] Error inesperado:", error)
    return NextResponse.json(
      { success: false, message: "Error inesperado al sincronizar perfil", error: "INTERNAL_ERROR" },
      { status: 500 },
    )
  }
}
