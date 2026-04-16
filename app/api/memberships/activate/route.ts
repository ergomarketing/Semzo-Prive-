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

  // 3. Validar datos personales (profiles solo como datos de contacto)
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, phone, document_number, shipping_address, shipping_city, shipping_postal_code")
    .eq("id", user.id)
    .single()

  const hasExtendedProfile =
    profile?.full_name &&
    profile?.phone &&
    profile?.document_number &&
    profile?.shipping_address &&
    profile?.shipping_city &&
    profile?.shipping_postal_code

  if (!hasExtendedProfile) {
    return NextResponse.json({ error: "Datos personales incompletos" }, { status: 400 })
  }

  // 4. Validar identidad verificada (FUENTE DE VERDAD: identity_verifications)
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

  // 5. Validar que esta en estado pending_sepa (listo para activar)
  if (membership.status !== "pending_sepa") {
    if (membership.status === "active") {
      return NextResponse.json({ success: true, membership_status: "active" })
    }
    return NextResponse.json({ error: "Estado de membresia invalido" }, { status: 400 })
  }

  // 6. Activar membresia en user_memberships (FUENTE DE VERDAD)
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

  return NextResponse.json({
    success: true,
    membership_status: "active",
  })
}
