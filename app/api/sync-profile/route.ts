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

    // Paso 1: upsert sin phone para evitar cualquier conflicto de unicidad
    const { error: profileError } = await supabase.from("profiles").upsert(
      {
        id: userId,
        email: user.email!,
        full_name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        ...(keepStatus ? {} : { membership_status: "free" }),
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )

    if (profileError) {
      console.error("[SYNC PROFILE] Profile upsert error:", profileError)
      return NextResponse.json(
        { success: false, message: `Error al sincronizar perfil: ${profileError.message}`, error: "PROFILE_ERROR" },
        { status: 500 },
      )
    }

    // Paso 2: actualizar phone por separado solo si no pertenece a otro usuario
    if (phone) {
      const { data: phoneOwner } = await supabase
        .from("profiles")
        .select("id")
        .eq("phone", phone)
        .neq("id", userId)
        .maybeSingle()

      if (!phoneOwner) {
        const { error: phoneError } = await supabase
          .from("profiles")
          .update({ phone })
          .eq("id", userId)

        if (phoneError && phoneError.code !== "23505") {
          console.log("[SYNC PROFILE] Phone update ignorado:", phoneError.message)
        }
      } else {
        console.log("[SYNC PROFILE] Phone ya existe en otro perfil, omitiendo")
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
