import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies })

  // 1️⃣ Usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 2️⃣ Obtener perfil
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(`
      id,
      membership_type,
      membership_status,
      identity_verified,
      full_name,
      phone,
      document_number,
      address,
      city,
      postal_code
    `)
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 400 })
  }

  // 3️⃣ Validar datos personales
  const hasExtendedProfile =
    profile.full_name &&
    profile.phone &&
    profile.document_number &&
    profile.address &&
    profile.city &&
    profile.postal_code

  if (!hasExtendedProfile) {
    return NextResponse.json({ error: "Datos personales incompletos" }, { status: 400 })
  }

  // 4️⃣ Validar identidad verificada
  if (profile.identity_verified !== true) {
    return NextResponse.json({ error: "Identidad no verificada" }, { status: 400 })
  }

  // 5️⃣ Validar que está en estado pending_sepa (listo para activar)
  if (profile.membership_status !== "pending_sepa") {
    // Si ya está activo, retornar éxito
    if (profile.membership_status === "active") {
      return NextResponse.json({ success: true, membership_status: "active" })
    }
    return NextResponse.json({ error: "Estado de membresía inválido" }, { status: 400 })
  }

  // 6️⃣ Activar membresía en profiles
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      membership_status: "active",
      membership_started_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (updateError) {
    return NextResponse.json({ error: "Error activando membresía" }, { status: 500 })
  }

  // 7️⃣ Activar membresía en user_memberships
  await supabase
    .from("user_memberships")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id)
    .eq("status", "pending_sepa")

  return NextResponse.json({
    success: true,
    membership_status: "active",
  })
}
