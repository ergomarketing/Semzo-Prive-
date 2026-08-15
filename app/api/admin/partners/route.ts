import { type NextRequest, NextResponse } from "next/server"
import { requireAdminAuth } from "@/lib/admin-auth"
import { getSupabaseServiceRole } from "@/lib/supabase-server"

const VALID_TYPES = ["villa", "hotel", "wedding_planner", "concierge", "other"]

function normalizeCode(raw: string): string {
  return (raw || "").trim().toUpperCase()
}

/** GET /api/admin/partners — lista de partners con totales de comisiones */
export async function GET() {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const supabase = getSupabaseServiceRole()
  if (!supabase) return NextResponse.json({ error: "Servicio no disponible" }, { status: 503 })

  const { data: partners, error } = await supabase
    .from("partners")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Totales de comision por partner (pendiente de pago vs pagado).
  const { data: commissions } = await supabase
    .from("partner_commissions")
    .select("partner_id, commission_amount, status, paid_at")

  const totals: Record<string, { payable: number; paid: number; count: number }> = {}
  for (const c of commissions || []) {
    const pid = c.partner_id as string
    if (!totals[pid]) totals[pid] = { payable: 0, paid: 0, count: 0 }
    totals[pid].count++
    if (c.status === "completed" && !c.paid_at) totals[pid].payable += Number(c.commission_amount) || 0
    if (c.paid_at) totals[pid].paid += Number(c.commission_amount) || 0
  }

  const enriched = (partners || []).map((p) => ({
    ...p,
    totals: totals[p.id] || { payable: 0, paid: 0, count: 0 },
  }))

  return NextResponse.json({ partners: enriched })
}

/** POST /api/admin/partners — crear partner */
export async function POST(request: NextRequest) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const supabase = getSupabaseServiceRole()
  if (!supabase) return NextResponse.json({ error: "Servicio no disponible" }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const businessName = (body?.business_name || "").trim()
  const code = normalizeCode(body?.code || "")
  const partnerType = VALID_TYPES.includes(body?.partner_type) ? body.partner_type : "other"
  const commissionRate = Number(body?.commission_rate)

  if (!businessName) return NextResponse.json({ error: "El nombre del negocio es obligatorio" }, { status: 400 })
  if (!code) return NextResponse.json({ error: "El código es obligatorio" }, { status: 400 })
  if (!/^[A-Z0-9]{3,20}$/.test(code)) {
    return NextResponse.json({ error: "El código debe tener 3-20 caracteres (letras y números)" }, { status: 400 })
  }
  if (!Number.isFinite(commissionRate) || commissionRate < 0 || commissionRate > 1) {
    return NextResponse.json({ error: "La comisión debe estar entre 0 y 1 (ej. 0.15 = 15%)" }, { status: 400 })
  }

  const { data, error } = await supabase
    .from("partners")
    .insert({
      business_name: businessName,
      partner_type: partnerType,
      contact_name: body?.contact_name?.trim() || null,
      contact_email: body?.contact_email?.trim() || null,
      contact_phone: body?.contact_phone?.trim() || null,
      code,
      commission_rate: commissionRate,
      iban: body?.iban?.trim() || null,
      notes: body?.notes?.trim() || null,
      status: body?.status === "inactive" ? "inactive" : "active",
    })
    .select()
    .single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ya existe un partner con ese código" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ partner: data }, { status: 201 })
}

/** PATCH /api/admin/partners — actualizar partner */
export async function PATCH(request: NextRequest) {
  const authError = await requireAdminAuth()
  if (authError) return authError

  const supabase = getSupabaseServiceRole()
  if (!supabase) return NextResponse.json({ error: "Servicio no disponible" }, { status: 503 })

  const body = await request.json().catch(() => ({}))
  const id = body?.id
  if (!id) return NextResponse.json({ error: "id es obligatorio" }, { status: 400 })

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() }
  if (body.business_name !== undefined) update.business_name = String(body.business_name).trim()
  if (body.partner_type !== undefined && VALID_TYPES.includes(body.partner_type)) update.partner_type = body.partner_type
  if (body.contact_name !== undefined) update.contact_name = body.contact_name?.trim() || null
  if (body.contact_email !== undefined) update.contact_email = body.contact_email?.trim() || null
  if (body.contact_phone !== undefined) update.contact_phone = body.contact_phone?.trim() || null
  if (body.iban !== undefined) update.iban = body.iban?.trim() || null
  if (body.notes !== undefined) update.notes = body.notes?.trim() || null
  if (body.status !== undefined) update.status = body.status === "inactive" ? "inactive" : "active"
  if (body.code !== undefined) {
    const code = normalizeCode(body.code)
    if (!/^[A-Z0-9]{3,20}$/.test(code)) {
      return NextResponse.json({ error: "Código inválido (3-20 caracteres alfanuméricos)" }, { status: 400 })
    }
    update.code = code
  }
  if (body.commission_rate !== undefined) {
    const rate = Number(body.commission_rate)
    if (!Number.isFinite(rate) || rate < 0 || rate > 1) {
      return NextResponse.json({ error: "La comisión debe estar entre 0 y 1" }, { status: 400 })
    }
    update.commission_rate = rate
  }

  const { data, error } = await supabase.from("partners").update(update).eq("id", id).select().single()

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json({ error: "Ya existe un partner con ese código" }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ partner: data })
}
