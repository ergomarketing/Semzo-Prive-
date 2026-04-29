import { type NextRequest, NextResponse } from "next/server"
import { cookies } from "next/headers"
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
 * Elimina un envio del sistema. Requiere cookie admin_session.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    // Auth admin via cookie de sesion (mismo patron que el resto del panel)
    const cookieStore = await cookies()
    const adminSession = cookieStore.get("admin_session")
    if (!adminSession || adminSession.value !== "authenticated") {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 })
    }

    const { id } = await params
    if (!id) {
      return NextResponse.json({ error: "ID de envio requerido" }, { status: 400 })
    }

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
  } catch (err: any) {
    console.error("[admin/shipments DELETE] exception:", err)
    return NextResponse.json(
      { error: err?.message || "Error interno" },
      { status: 500 },
    )
  }
}
