/**
 * Renovacion automatica del pase semanal en Modo Colecciona (socias Petite).
 *
 * Una socia Petite que pasa a Colecciona se queda el bolso semana a semana: cada pase semanal se cobra solo
 * (con aviso previo) hasta que compra el bolso, lo devuelve o cancela. Este archivo reune lo comun:
 * la autorizacion de la socia, los importes y quien esta cubierta por la renovacion automatica.
 */
import type { SupabaseClient } from "@supabase/supabase-js"

export const AUTOCHARGE_CONTEXT = "colecciona_pass_autocharge"
export const AUTOCHARGE_REVOKED_CONTEXT = "colecciona_pass_autocharge_revoked"
export const AUTOCHARGE_DOCUMENT = "Autorización de renovación semanal del pase (Modo Colecciona)"
export const AUTOCHARGE_VERSION = "v1"

/** Tope de renovaciones seguidas por bolso: evita cobros sin fin; al llegar se avisa a administracion. */
export const MAX_AUTO_RENEWALS = 8
export const PASS_DAYS = 7

/** Precio del pase semanal por categoria, IVA incluido, en centimos. */
export const PASS_PRICE_CENTS: Record<string, number> = {
  essentiel: 5200,
  signature: 9900,
  prive: 13700,
}

export function normalizePassTier(raw: unknown): "essentiel" | "signature" | "prive" | null {
  const t = String(raw ?? "")
    .toLowerCase()
    .replace(/^l'/, "")
    .replace(/['’]/g, "")
    .trim()
  if (t === "essentiel" || t === "lessentiel") return "essentiel"
  if (t === "signature") return "signature"
  if (t === "prive" || t === "privé") return "prive"
  return null
}

export function formatEurosFromCents(cents: number): string {
  const euros = cents / 100
  return Number.isInteger(euros) ? String(euros) : euros.toFixed(2).replace(".", ",")
}

/** Texto exacto que acepta la socia; se guarda tal cual en legal_acceptances (text_snapshot). */
export function autochargeConsentText(): string {
  return (
    "Renovación automática del pase semanal. Si conservo el bolso al terminar mi pase semanal, autorizo a " +
    "SEMZO PRIVÉ a cobrar en mi tarjeta guardada, cada semana, el importe del pase correspondiente a ese bolso " +
    "(52 €, 99 € o 137 €, IVA incluido, según su categoría), hasta que complete la compra del bolso, lo devuelva, " +
    "cancele el Modo Colecciona o cancele mi membresía. Recibiré un aviso por correo antes de cada cobro y cada " +
    "pase pagado suma crédito Colecciona por su importe íntegro. El número máximo de renovaciones automáticas " +
    `seguidas es ${MAX_AUTO_RENEWALS}; después tendré que comprar el bolso o devolverlo. Puedo revocar esta ` +
    "autorización en cualquier momento desde mi panel o escribiendo a info@semzoprive.com: la revocación evita " +
    "los cobros futuros, pero no me exime de devolver el bolso al terminar el pase en curso."
  )
}

/**
 * De todas las aceptaciones/revocaciones de cada progreso, la mas reciente manda.
 * Devuelve los ids de progreso con la autorizacion vigente.
 */
export async function getConsentedProgressIds(
  supabase: SupabaseClient,
  progressIds: string[],
): Promise<Set<string>> {
  const result = new Set<string>()
  if (progressIds.length === 0) return result
  const { data, error } = await supabase
    .from("legal_acceptances")
    .select("reference_id, context, accepted_at")
    .in("context", [AUTOCHARGE_CONTEXT, AUTOCHARGE_REVOKED_CONTEXT])
    .in("reference_id", progressIds)
    .order("accepted_at", { ascending: true })
  if (error) throw error
  // Orden ascendente: la ultima fila de cada progreso decide.
  for (const row of data ?? []) {
    const id = String(row.reference_id)
    if (row.context === AUTOCHARGE_CONTEXT) result.add(id)
    else result.delete(id)
  }
  return result
}

/**
 * Reservas cubiertas por la renovacion automatica (autorizacion vigente, Colecciona activo del mismo bolso,
 * membresia activa y por debajo del tope). Los recordatorios de devolucion de esas reservas no se envian:
 * a cambio la socia recibe el aviso del cobro.
 */
export async function getAutoRenewalCoveredReservationIds(
  supabase: SupabaseClient,
  reservations: { id: string; user_id: string; bag_id: string }[],
): Promise<Set<string>> {
  const covered = new Set<string>()
  if (reservations.length === 0) return covered
  try {
    const userIds = [...new Set(reservations.map((r) => r.user_id))]
    const { data: progresses } = await supabase
      .from("ownership_progress")
      .select("id, user_id, bag_id")
      .eq("mode", "collect")
      .eq("status", "active")
      .in("user_id", userIds)
    const progressByKey = new Map((progresses ?? []).map((p) => [`${p.user_id}|${p.bag_id}`, p.id as string]))
    const progressIds = [...progressByKey.values()]
    if (progressIds.length === 0) return covered

    const [consented, membershipsRes, doneRes, gaveUpRes] = await Promise.all([
      getConsentedProgressIds(supabase, progressIds),
      supabase.from("user_memberships").select("user_id, status").in("user_id", userIds),
      supabase
        .from("colecciona_pass_renewals")
        .select("ownership_progress_id")
        .eq("status", "succeeded")
        .in("ownership_progress_id", progressIds),
      // Si se agotaron los reintentos de cobro, la reserva vuelve al circuito normal de devolucion.
      supabase
        .from("colecciona_pass_renewals")
        .select("reservation_id")
        .eq("status", "gave_up")
        .in("reservation_id", reservations.map((r) => r.id)),
    ])
    const gaveUp = new Set((gaveUpRes.data ?? []).map((g) => String(g.reservation_id)))
    const activeUsers = new Set((membershipsRes.data ?? []).filter((m) => m.status === "active").map((m) => m.user_id))
    const doneCount = new Map<string, number>()
    for (const row of doneRes.data ?? []) {
      const id = String(row.ownership_progress_id)
      doneCount.set(id, (doneCount.get(id) ?? 0) + 1)
    }

    for (const r of reservations) {
      const progressId = progressByKey.get(`${r.user_id}|${r.bag_id}`)
      if (!progressId) continue
      if (!consented.has(progressId)) continue
      if (!activeUsers.has(r.user_id)) continue
      if (gaveUp.has(r.id)) continue
      if ((doneCount.get(progressId) ?? 0) >= MAX_AUTO_RENEWALS) continue
      covered.add(r.id)
    }
  } catch (err) {
    // Si no se puede saber, no se cubre a nadie: lo seguro es que el recordatorio de devolucion salga como siempre.
    console.error("[colecciona-autocharge] No se pudo calcular quien esta cubierta:", err)
    return new Set<string>()
  }
  return covered
}
