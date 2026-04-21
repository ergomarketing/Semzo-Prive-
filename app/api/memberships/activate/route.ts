import { NextResponse } from "next/server"
import { createRouteHandlerClient } from "@/lib/supabase"
import { cookies } from "next/headers"

/**
 * ============================================================================
 * FLUJO VALIDADO — NO MODIFICAR SIN CONSULTAR
 * ============================================================================
 * PASO 9 del flujo de suscripcion: ACTIVAR MEMBRESIA
 *
 * Se llama DESPUES de save-mandate y solo activa si:
 *  - Identity esta verified / approved
 *  - profiles.sepa_payment_method_id esta seteado
 *  - Membresia existe en estado activable (pending_sepa, pending_verification,
 *    paid_pending_verification) o ya activa (idempotente)
 *
 * Al activar:
 *  - user_memberships.status = "active"  (FUENTE DE VERDAD)
 *  - profiles.membership_status = "active"  (sync para dashboard)
 *  - profiles.membership_type = <plan>  (sync para dashboard)
 *
 * NO valida campos de direccion de envio: eso se completa al reservar
 * (paso 10 → bag-detail), no aqui. No anadir validaciones de shipping_*.
 * ============================================================================
 */
export async function POST() {
  const supabase = createRouteHandlerClient({ cookies })

  // 1️⃣ Usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  // 2. Obtener membresia (FUENTE DE VERDAD)
  const { data: membership, error: membershipError } = await supabase
    .from("user_memberships")
    .select("id, user_id, membership_type, status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (membershipError || !membership) {
    return NextResponse.json({ error: "Membresia no encontrada" }, { status: 400 })
  }

  // 3. Validar identidad verificada (FUENTE DE VERDAD: identity_verifications)
  // El perfil extendido (direccion, telefono, documento) se completa al reservar, no aqui.
  const { data: identityCheck } = await supabase
    .from("identity_verifications")
    .select("status")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .single()

  if (!identityCheck || (identityCheck.status !== "approved" && identityCheck.status !== "verified")) {
    return NextResponse.json({ error: "Identidad no verificada" }, { status: 400 })
  }

  // 4. Validar SEPA guardado (FUENTE DE VERDAD: profiles.sepa_payment_method_id)
  const { data: sepaProfile } = await supabase
    .from("profiles")
    .select("sepa_payment_method_id")
    .eq("id", user.id)
    .single()

  if (!sepaProfile?.sepa_payment_method_id) {
    return NextResponse.json({ error: "Mandato SEPA no configurado" }, { status: 400 })
  }

  // 5. Si ya esta activa, devolver exito (idempotente)
  if (membership.status === "active") {
    return NextResponse.json({ success: true, membership_status: "active" })
  }

  // 6. Aceptar pending_sepa, pending_verification, paid_pending_verification como validos para activar
  const activatableStatuses = ["pending_sepa", "pending_verification", "paid_pending_verification"]
  if (!activatableStatuses.includes(membership.status)) {
    return NextResponse.json({ error: `Estado de membresia invalido: ${membership.status}` }, { status: 400 })
  }

  // 7. Activar membresia en user_memberships (FUENTE DE VERDAD)
  const { error: updateError } = await supabase
    .from("user_memberships")
    .update({
      status: "active",
      updated_at: new Date().toISOString(),
    })
    .eq("id", membership.id)

  if (updateError) {
    return NextResponse.json({ error: "Error activando membresia" }, { status: 500 })
  }

  // 8. Sincronizar profiles.membership_status para que el dashboard refleje estado correcto
  await supabase
    .from("profiles")
    .update({
      membership_status: "active",
      membership_type: membership.membership_type,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id)

  return NextResponse.json({
    success: true,
    membership_status: "active",
  })
}
