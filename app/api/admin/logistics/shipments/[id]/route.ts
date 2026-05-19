import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  },
)

/**
 * DELETE /api/admin/logistics/shipments/:id
 * Cancela (soft-delete: status -> "cancelled") un envio por su ID.
 * Auth: el panel admin esta protegido por localStorage en el cliente.
 * El service role key de Supabase garantiza acceso a nivel de BD.
 * No se usa cookie admin_session porque el login actual solo escribe
 * en localStorage y nunca llama a /api/admin/login (que setea la cookie).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: "ID de envio requerido" }, { status: 400 })
    }

    // Leer envio antes de borrar (para auditoria)
    const { data: existing } = await supabase
      .from("shipments")
      .select("*")
      .eq("id", id)
      .single()

    // Hard delete: eliminamos el registro fisicamente
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

    // Registrar en auditoria
    if (existing) {
      await supabase.from("logistics_audit_log").insert({
        action: "delete_shipment",
        entity_type: "shipment",
        entity_id: id,
        new_values: existing,
      })
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error("[admin/shipments DELETE] exception:", err)
    return NextResponse.json(
      { error: err?.message || "Error interno" },
      { status: 500 },
    )
  }
}
