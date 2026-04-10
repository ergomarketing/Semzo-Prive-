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

  // 2. Obtener membresia del usuario (FUENTE DE VERDAD)
  const { data: membership, error: membershipError } = await supabase
    .from("user_memberships")
    .select("id, user_id, membership_type, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (membershipError || !membership) {
    return NextResponse.json({ error: "Membresia no encontrada" }, { status: 404 })
  }

  // 3. Verificar que la membresia esta en pending_verification
  if (membership.status !== "pending_verification") {
    return NextResponse.json({ error: "La membresia no esta en estado pendiente de verificacion" }, { status: 403 })
  }

  // 4. Verificar que la identidad esta aprobada (FUENTE DE VERDAD: identity_verifications)
  const { data: verification, error: verificationError } = await supabase
    .from("identity_verifications")
    .select("status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (verificationError || !verification) {
    return NextResponse.json({ error: "No se encontro verificacion de identidad" }, { status: 403 })
  }

  if (verification.status !== "approved" && verification.status !== "verified") {
    return NextResponse.json({ error: "La verificacion de identidad no esta aprobada" }, { status: 403 })
  }

  // 5. ACTIVAR MEMBRESIA en user_memberships (FUENTE DE VERDAD)
  const { error: updateError } = await supabase
    .from("user_memberships")
    .update({
      status: "pending",
      updated_at: new Date().toISOString(),
    })
    .eq("id", membership.id)

  if (updateError) {
    console.error("[activate-membership] Error actualizando membresia:", updateError)
    return NextResponse.json({ error: "Error al activar membresia" }, { status: 500 })
  }

  await supabase.from("audit_log").insert({
    user_id: user.id,
    action: "membership_pending",
    resource_type: "membership",
    resource_id: membership.id,
    details: {
      membership_type: membership.membership_type,
      previous_status: "pending_verification",
      new_status: "pending",
    },
  })

  return NextResponse.json({
    success: true,
    membership_status: "pending",
    membership_type: membership.membership_type,
  })
}
