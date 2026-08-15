import { getSupabaseServiceRole } from "@/lib/supabase-server"

/**
 * Sistema de Partners B2B (villas, hoteles, wedding planners, concierge).
 *
 * Flujo:
 *  1. El partner recibe un codigo unico reutilizable (ej. MARBELLACLUB).
 *  2. El cliente aplica el codigo en checkout -> se guarda una "reclamacion"
 *     (partner_code_claims) vinculada al usuario. NO da descuento al cliente.
 *  3. Reconciliacion (sin tocar los flujos de pago de Stripe):
 *     - Alquiler corto: al devolver el bolso sin incidencias -> comision 'completed'.
 *     - Membresia: al detectar membresia activa -> comision 'completed' (una vez).
 *  4. El admin liquida manualmente la comision y la marca 'paid'.
 *
 * La comision se calcula SIEMPRE en servidor: commission_rate * base_amount.
 */

export type PartnerType = "villa" | "hotel" | "wedding_planner" | "concierge" | "other"
export type CommissionStatus = "pending" | "completed" | "rejected"
export type CommissionSource = "rental" | "membership"

export interface Partner {
  id: string
  business_name: string
  partner_type: PartnerType
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  code: string
  commission_rate: number
  iban: string | null
  notes: string | null
  status: "active" | "inactive"
  created_at: string
  updated_at: string
}

function normalizeCode(raw: string): string {
  return (raw || "").trim().toUpperCase()
}

/**
 * Valida un codigo de partner. Devuelve el partner si existe y esta activo.
 * No lanza; devuelve null en caso de codigo invalido/inactivo.
 */
export async function findActivePartnerByCode(code: string): Promise<Partner | null> {
  const supabase = getSupabaseServiceRole()
  if (!supabase) return null
  const normalized = normalizeCode(code)
  if (!normalized) return null

  const { data, error } = await supabase
    .from("partners")
    .select("*")
    .eq("code", normalized)
    .eq("status", "active")
    .maybeSingle()

  if (error || !data) return null
  return data as Partner
}

/**
 * Registra una reclamacion de atribucion para un usuario al aplicar un codigo
 * en checkout. Antifraude: el propio partner no puede usar su codigo (match por
 * email de contacto). Reemplaza cualquier reclamacion activa previa del usuario.
 */
export async function applyPartnerCode(params: {
  userId: string
  userEmail?: string | null
  code: string
}): Promise<{ ok: true; partner: Partner } | { ok: false; error: string; code: string }> {
  const supabase = getSupabaseServiceRole()
  if (!supabase) return { ok: false, error: "Servicio no disponible", code: "SERVICE_UNAVAILABLE" }

  const partner = await findActivePartnerByCode(params.code)
  if (!partner) {
    return { ok: false, error: "Código de partner no válido", code: "INVALID_PARTNER_CODE" }
  }

  // Antifraude: el partner no puede usar su propio codigo como cliente.
  if (
    params.userEmail &&
    partner.contact_email &&
    params.userEmail.trim().toLowerCase() === partner.contact_email.trim().toLowerCase()
  ) {
    return { ok: false, error: "No puedes usar tu propio código", code: "SELF_REFERRAL" }
  }

  // Cerrar reclamaciones activas previas del usuario (la ultima gana).
  await supabase
    .from("partner_code_claims")
    .update({ status: "expired", updated_at: new Date().toISOString() })
    .eq("user_id", params.userId)
    .eq("status", "active")

  const { error: insertError } = await supabase.from("partner_code_claims").insert({
    user_id: params.userId,
    partner_id: partner.id,
    code: partner.code,
    status: "active",
  })

  if (insertError) {
    return { ok: false, error: "No se pudo aplicar el código", code: "CLAIM_INSERT_FAILED" }
  }

  return { ok: true, partner }
}

/** Devuelve la reclamacion activa de un usuario, con su partner, o null. */
export async function getActiveClaim(userId: string): Promise<{ partner: Partner; claimId: string } | null> {
  const supabase = getSupabaseServiceRole()
  if (!supabase) return null

  const { data, error } = await supabase
    .from("partner_code_claims")
    .select("id, partner_id, partners(*)")
    .eq("user_id", userId)
    .eq("status", "active")
    .maybeSingle()

  if (error || !data || !data.partners) return null
  return { partner: data.partners as unknown as Partner, claimId: data.id as string }
}

function round2(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100
}

/**
 * Reconciliacion de alquiler corto: crea la comision 'completed' para una
 * reserva devuelta sin incidencias, si el usuario tenia una reclamacion activa.
 * Idempotente gracias al UNIQUE en reservation_id.
 */
export async function reconcileRentalCommission(params: {
  reservationId: string
  userId: string
  baseAmount: number
}): Promise<{ created: boolean; reason?: string }> {
  const supabase = getSupabaseServiceRole()
  if (!supabase) return { created: false, reason: "SERVICE_UNAVAILABLE" }

  // Ya existe comision para esta reserva?
  const { data: existing } = await supabase
    .from("partner_commissions")
    .select("id")
    .eq("reservation_id", params.reservationId)
    .maybeSingle()
  if (existing) return { created: false, reason: "ALREADY_EXISTS" }

  const claim = await getActiveClaim(params.userId)
  if (!claim) return { created: false, reason: "NO_ACTIVE_CLAIM" }

  const base = Math.max(0, Number(params.baseAmount) || 0)
  if (base <= 0) return { created: false, reason: "ZERO_BASE" }

  const rate = claim.partner.commission_rate
  const amount = round2(base * rate)

  const { error: insertError } = await supabase.from("partner_commissions").insert({
    partner_id: claim.partner.id,
    reservation_id: params.reservationId,
    user_id: params.userId,
    base_amount: base,
    commission_rate: rate,
    commission_amount: amount,
    status: "completed",
    source: "rental",
  })
  if (insertError) return { created: false, reason: "INSERT_FAILED" }

  // Estampar el codigo en la reserva para trazabilidad.
  await supabase
    .from("reservations")
    .update({ partner_code: claim.partner.code })
    .eq("id", params.reservationId)

  return { created: true }
}

/**
 * Reconciliacion de membresia (primer mes, una sola vez): crea la comision
 * 'completed' si el usuario tenia una reclamacion activa. Marca la reclamacion
 * como 'converted'. Idempotente por el UNIQUE (partner_id, user_id) de membership.
 */
export async function reconcileMembershipCommission(params: {
  userId: string
  membershipId: string
  baseAmount: number
}): Promise<{ created: boolean; reason?: string }> {
  const supabase = getSupabaseServiceRole()
  if (!supabase) return { created: false, reason: "SERVICE_UNAVAILABLE" }

  const claim = await getActiveClaim(params.userId)
  if (!claim) return { created: false, reason: "NO_ACTIVE_CLAIM" }

  const base = Math.max(0, Number(params.baseAmount) || 0)
  if (base <= 0) return { created: false, reason: "ZERO_BASE" }

  // Ya existe comision de membresia para este (partner, usuario)?
  const { data: existing } = await supabase
    .from("partner_commissions")
    .select("id")
    .eq("partner_id", claim.partner.id)
    .eq("user_id", params.userId)
    .eq("source", "membership")
    .maybeSingle()
  if (existing) return { created: false, reason: "ALREADY_EXISTS" }

  const rate = claim.partner.commission_rate
  const amount = round2(base * rate)

  const { error: insertError } = await supabase.from("partner_commissions").insert({
    partner_id: claim.partner.id,
    user_id: params.userId,
    membership_id: params.membershipId,
    base_amount: base,
    commission_rate: rate,
    commission_amount: amount,
    status: "completed",
    source: "membership",
  })
  if (insertError) return { created: false, reason: "INSERT_FAILED" }

  await supabase
    .from("partner_code_claims")
    .update({ status: "converted", updated_at: new Date().toISOString() })
    .eq("id", claim.claimId)

  return { created: true }
}
