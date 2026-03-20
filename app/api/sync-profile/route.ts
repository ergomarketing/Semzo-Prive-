import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { firstName, lastName, phone } = body

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
      return NextResponse.json({ success: false, error: "UNAUTHORIZED" }, { status: 401 })
    }

    const userId = user.id

    // Verificar que el perfil existe — si no existe, NO crearlo (solo signup puede crearlo)
    const { data: existingProfile } = await supabase
      .from("profiles")
      .select("id, membership_status")
      .eq("id", userId)
      .maybeSingle()

    if (!existingProfile) {
      console.error("[SYNC PROFILE] Perfil no encontrado para userId:", userId, "— abortando sin crear")
      return NextResponse.json({ success: false, error: "PROFILE_NOT_FOUND" }, { status: 404 })
    }

    const keepStatus = existingProfile.membership_status && existingProfile.membership_status !== "free"

    // Update campos básicos — sin phone para evitar constraint profiles_phone_unique
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        email: user.email!,
        full_name: `${firstName} ${lastName}`,
        first_name: firstName,
        last_name: lastName,
        ...(keepStatus ? {} : { membership_status: "free" }),
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (updateError) {
      console.error("[SYNC PROFILE] Update error:", updateError)
      return NextResponse.json({ success: false, error: "PROFILE_ERROR" }, { status: 500 })
    }

    // Phone: update separado solo si no pertenece a otro usuario
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

        if (phoneError) {
          console.log("[SYNC PROFILE] Phone update ignorado:", phoneError.message)
        }
      } else {
        console.log("[SYNC PROFILE] Phone ya existe en otro perfil, omitiendo")
      }
    }

    console.log("[SYNC PROFILE] OK:", userId)

    return NextResponse.json({
      success: true,
      profile: { id: userId, email: user.email, full_name: `${firstName} ${lastName}` },
    })
  } catch (error) {
    console.error("[SYNC PROFILE] Error inesperado:", error)
    return NextResponse.json({ success: false, error: "INTERNAL_ERROR" }, { status: 500 })
  }
}
