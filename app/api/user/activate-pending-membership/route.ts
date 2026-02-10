import { type NextRequest, NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"

export async function POST(request: NextRequest) {
  try {
    const { email, userId } = await request.json()

    if (!email || !userId) {
      return NextResponse.json({ error: "Email y userId requeridos" }, { status: 400 })
    }

    // Buscar membresía pendiente por email
    const { data: pendingMembership } = await supabaseAdmin
      .from("pending_memberships")
      .select("*")
      .eq("email", email)
      .is("activated_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .single()

    if (!pendingMembership) {
      return NextResponse.json({ activated: false, message: "No hay membresía pendiente" })
    }

    // Activar la membresía en el perfil del usuario
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .update({
        membership_type: pendingMembership.membership_type,
        membership_status: "pending_delivery",
        updated_at: new Date().toISOString(),
      })
      .eq("id", userId)

    if (profileError) {
      console.error("Error activando membresía:", profileError)
      return NextResponse.json({ error: "Error al activar membresía" }, { status: 500 })
    }

    // Marcar la membresía pendiente como activada
    await supabaseAdmin
      .from("pending_memberships")
      .update({
        activated_at: new Date().toISOString(),
        user_id: userId,
      })
      .eq("id", pendingMembership.id)

    console.log(`✅ Membresía activada para usuario ${userId} - Plan: ${pendingMembership.membership_type}`)

    return NextResponse.json({
      activated: true,
      membershipType: pendingMembership.membership_type,
      message: "Membresía activada exitosamente",
    })
  } catch (error) {
    console.error("Error en activate-pending-membership:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
