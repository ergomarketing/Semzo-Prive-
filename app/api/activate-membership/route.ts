import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase"
import { cookies } from "next/headers"

export async function POST() {
  const supabase = createRouteHandlerClient({ cookies })

  // 1️⃣ Verificar usuario autenticado
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "Usuario no autenticado" }, { status: 401 })
  }

  // 2️⃣ Obtener perfil del usuario
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("id, membership_plan, membership_status")
    .eq("id", user.id)
    .single()

  if (profileError || !profile) {
    return NextResponse.json({ error: "Perfil no encontrado" }, { status: 404 })
  }

  // 3️⃣ Verificar que el usuario está en pending_verification
  if (profile.membership_status !== "pending_verification") {
    return NextResponse.json({ error: "La membresía no está en estado pendiente de verificación" }, { status: 403 })
  }

  // 4️⃣ Verificar que la identidad está aprobada
  const { data: verification, error: verificationError } = await supabase
    .from("identity_verifications")
    .select("status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (verificationError || !verification) {
    return NextResponse.json({ error: "No se encontró verificación de identidad" }, { status: 403 })
  }

  if (verification.status !== "approved") {
    return NextResponse.json({ error: "La verificación de identidad no está aprobada" }, { status: 403 })
  }

  // 5️⃣ ACTIVAR MEMBRESÍA (único lugar permitido)
  const { error: updateError } = await supabase
    .from("profiles")
    .update({
      membership_status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  if (updateError) {
    console.error("[activate-membership] Error actualizando perfil:", updateError)
    return NextResponse.json({ error: "Error al activar membresía" }, { status: 500 })
  }

  // 6️⃣ Log de auditoría (opcional pero recomendado)
  await supabase.from("audit_log").insert({
    user_id: user.id,
    action: "membership_activated",
    resource_type: "membership",
    resource_id: user.id,
    details: {
      membership_plan: profile.membership_plan,
      previous_status: "pending_verification",
      new_status: "active",
    },
  })

  return NextResponse.json({
    success: true,
    membership_status: "active",
    membership_plan: profile.membership_plan,
  })
}
