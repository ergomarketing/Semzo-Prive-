import { createClient } from "@/utils/supabase/server"
import { NextRequest, NextResponse } from "next/server"

export const dynamic = "force-dynamic"

/**
 * DELETE /api/admin/logistics/shipments/:id
 * Elimina un envio del sistema (soft o hard delete segun politica).
 * Solo admins.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  if (!id) {
    return NextResponse.json({ error: "ID de envio requerido" }, { status: 400 })
  }

  const supabase = await createClient()

  // Auth + admin check
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle()

  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  // Borrado fisico. Si en el futuro se quiere conservar historial,
  // cambiar a UPDATE status = 'deleted'.
  const { error: deleteError } = await supabase
    .from("shipments")
    .delete()
    .eq("id", id)

  if (deleteError) {
    console.error("[admin/shipments DELETE] error:", deleteError)
    return NextResponse.json(
      { error: deleteError.message || "Error al eliminar envio" },
      { status: 500 },
    )
  }

  return NextResponse.json({ success: true })
}
