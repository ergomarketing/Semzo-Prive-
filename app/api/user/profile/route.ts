import { createClient } from "@/utils/supabase/server"
import { createClient as createAdminClient } from "@supabase/supabase-js"
import { NextResponse } from "next/server"

// Supabase Admin Client (Service Role) para actualizar auth.users
const supabaseAdmin = createAdminClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

export async function PATCH(request: Request) {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { email, first_name, last_name } = body

    // If updating email
    if (email) {
      // Validar formato de email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(email)) {
        return NextResponse.json({ error: "Email inválido" }, { status: 400 })
      }

      // No permitir emails de teléfono
      if (email.endsWith("@phone.semzoprive.com")) {
        return NextResponse.json({ error: "Debes usar un email real" }, { status: 400 })
      }

      // Check if email already exists in another account
      const { data: existingProfile, error: checkError } = await supabase
        .from("profiles")
        .select("id")
        .eq("email", email)
        .neq("id", user.id)
        .maybeSingle()

      if (checkError) {
        console.error("[v0] Error checking email:", checkError)
        return NextResponse.json({ error: "Error al verificar email" }, { status: 500 })
      }

      if (existingProfile) {
        return NextResponse.json({ error: "Este email ya está en uso por otra cuenta" }, { status: 400 })
      }

      console.log("[v0] Updating email for user:", user.id, "to:", email)
    }

    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString(),
    }

    if (email) updateData.email = email
    if (first_name) updateData.first_name = first_name
    if (last_name) updateData.last_name = last_name
    if (first_name && last_name) updateData.full_name = `${first_name} ${last_name}`

    // 1. Actualizar profiles
    const { error: profileError } = await supabase
      .from("profiles")
      .update(updateData)
      .eq("id", user.id)

    if (profileError) {
      console.error("[v0] Error updating profile:", profileError)
      return NextResponse.json({ error: "Error actualizando perfil" }, { status: 500 })
    }

    console.log("[v0] Profile updated successfully")

    // 2. Si hay email, actualizar en auth.users con Service Role
    if (email) {
      const { data: authUpdate, error: authError } = await supabaseAdmin.auth.admin.updateUserById(user.id, {
        email: email,
        email_confirm: false, // No confirmado aún, se enviará OTP
      })

      if (authError) {
        console.error("[v0] Error updating auth.users email:", authError)
        // Revertir el cambio en profiles
        await supabase.from("profiles").update({ email: user.email || "" }).eq("id", user.id)
        return NextResponse.json({ error: "Error actualizando email de autenticación" }, { status: 500 })
      }

      console.log("[v0] Auth.users email updated successfully")
    }

    return NextResponse.json({
      success: true,
      message: email ? "Email actualizado correctamente" : "Perfil actualizado correctamente",
    })

  } catch (error) {
    console.error("[v0] Error in PATCH /api/user/profile:", error)
    return NextResponse.json({ error: "Error del servidor" }, { status: 500 })
  }
}
