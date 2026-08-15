import { type NextRequest, NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/admin-auth"
import { getSupabaseServiceRole } from "@/lib/supabase-server"

/** GET /api/admin/partners/commissions?partnerId=&status= — lista de comisiones */
export async function GET(request: NextRequest) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const supabase = getSupabaseServiceRole()
  if (!supabase) return NextResponse.json({ error: "Servicio no disponible" }, { status: 503 })

  const partnerId = request.nextUrl.searchParams.get("partnerId")
  const status = request.nextUrl.searchParams.get("status")

  let query = supabase
    .from("partner_commissions")
    .select("*, partners(business_name, code)")
    .order("created_at", { ascending: false })

  if (partnerId) query = query.eq("partner_id", partnerId)
  if (status) query = query.eq("status", status)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  return NextResponse.json({ commissions: data })
}

/**
 * PATCH /api/admin/partners/commissions — marcar una comision como pagada.
 * Solo se pueden pagar comisiones en estado 'completed'. Idempotente-safe:
 * no vuelve a pagar una comision ya pagada.
 */
export async function PATCH(request: NextRequest) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const supabase = getSupabaseServiceRole()
  if (!supabase) return NextResponse.json({ error: "Servicio no disponible" }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const id = body?.id
  const action = body?.action || "pay"
  if (!id) return NextResponse.json({ error: "id es obligatorio" }, { status: 400 })

  const { data: commission, error: fetchError } = await supabase
    .from("partner_commissions")
    .select("id, status, paid_at")
    .eq("id", id)
    .maybeSingle()

  if (fetchError) return NextResponse.json({ error: fetchError.message }, { status: 500 })
  if (!commission) return NextResponse.json({ error: "Comisión no encontrada" }, { status: 404 })

  if (action === "pay") {
    if (commission.status !== "completed") {
      return NextResponse.json(
        { error: "Solo se pueden liquidar comisiones completadas" },
        { status: 400 },
      )
    }
    if (commission.paid_at) {
      return NextResponse.json({ error: "Esta comisión ya está pagada" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("partner_commissions")
      .update({
        paid_at: new Date().toISOString(),
        paid_reference: body?.paid_reference?.trim() || null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ commission: data })
  }

  if (action === "reject") {
    const { data, error } = await supabase
      .from("partner_commissions")
      .update({ status: "rejected", updated_at: new Date().toISOString() })
      .eq("id", id)
      .select()
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ commission: data })
  }

  return NextResponse.json({ error: "Acción no válida" }, { status: 400 })
}
