/**
 * Censo de contactos de Semzo para Klaviyo: une socias, leads, contactos del catalogo y newsletter
 * (por correo, sin duplicados) con datos utiles para segmentar. La membresia sale de user_memberships
 * (fuente fiable), no de las copias antiguas de profiles.
 *
 * El censo SOLO crea perfiles. No suscribe a nadie a marketing (el consentimiento de las listas actuales
 * no es expreso). Las personas que ya se dieron de baja se marcan como "suprimidas" para que Klaviyo
 * nunca les escriba.
 */
import type { SupabaseClient } from "@supabase/supabase-js"

export interface CensusEntry {
  email: string
  firstName: string | null
  lastName: string | null
  origins: Set<string>
  membershipPlan: string | null
  membershipStatus: string | null
  signupDate: string | null
  leadSource: string | null
  utmCampaign: string | null
  unsubscribed: boolean
}

const norm = (value: string | null | undefined) => (value || "").toLowerCase().trim()

function splitName(full: string | null | undefined): [string | null, string | null] {
  const parts = (full || "").trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return [null, null]
  return [parts[0], parts.slice(1).join(" ") || null]
}

export async function buildCensus(supabase: SupabaseClient): Promise<Map<string, CensusEntry>> {
  const census = new Map<string, CensusEntry>()
  const entry = (email: string): CensusEntry => {
    let current = census.get(email)
    if (!current) {
      current = {
        email,
        firstName: null,
        lastName: null,
        origins: new Set(),
        membershipPlan: null,
        membershipStatus: null,
        signupDate: null,
        leadSource: null,
        utmCampaign: null,
        unsubscribed: false,
      }
      census.set(email, current)
    }
    return current
  }
  const earliest = (a: string | null, b: string | null | undefined) => (!a || (b && b < a) ? b ?? a : a)

  // Socias (cuentas) + su membresia real
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, email, first_name, last_name, full_name, created_at")
  const { data: memberships } = await supabase.from("user_memberships").select("user_id, membership_type, status")
  const membershipByUser = new Map((memberships || []).map((m) => [m.user_id as string, m]))
  for (const p of profiles || []) {
    const email = norm(p.email)
    if (!email.includes("@")) continue
    const e = entry(email)
    e.origins.add("socia")
    const [first, last] = splitName(p.full_name)
    e.firstName = e.firstName || p.first_name || first
    e.lastName = e.lastName || p.last_name || last
    e.signupDate = earliest(e.signupDate, p.created_at)
    const membership = membershipByUser.get(p.id as string)
    if (membership) {
      e.membershipPlan = membership.membership_type
      e.membershipStatus = membership.status
    }
  }

  // Leads (secuencia de 5 correos)
  const { data: leads } = await supabase
    .from("leads")
    .select("email, name, source, utm_campaign, status, created_at, unsubscribed_at")
  for (const l of leads || []) {
    const email = norm(l.email)
    if (!email.includes("@")) continue
    const e = entry(email)
    e.origins.add("lead")
    const [first, last] = splitName(l.name)
    e.firstName = e.firstName || first
    e.lastName = e.lastName || last
    e.leadSource = e.leadSource || l.source || null
    e.utmCampaign = e.utmCampaign || l.utm_campaign || null
    e.signupDate = earliest(e.signupDate, l.created_at)
    if (l.status === "unsubscribed" || l.unsubscribed_at) e.unsubscribed = true
  }

  // Contactos del catalogo
  const { data: catalog } = await supabase.from("catalog_leads").select("email, full_name, source, created_at")
  for (const c of catalog || []) {
    const email = norm(c.email)
    if (!email.includes("@")) continue
    const e = entry(email)
    e.origins.add("catalogo")
    const [first, last] = splitName(c.full_name)
    e.firstName = e.firstName || first
    e.lastName = e.lastName || last
    e.leadSource = e.leadSource || c.source || null
    e.signupDate = earliest(e.signupDate, c.created_at)
  }

  // Newsletter
  const { data: newsletter } = await supabase
    .from("newsletter_subscriptions")
    .select("email, name, status, subscribed_at, unsubscribed_at")
  for (const n of newsletter || []) {
    const email = norm(n.email)
    if (!email.includes("@")) continue
    const e = entry(email)
    e.origins.add("newsletter")
    const [first, last] = splitName(n.name)
    e.firstName = e.firstName || first
    e.lastName = e.lastName || last
    e.signupDate = earliest(e.signupDate, n.subscribed_at)
    if ((n.status && n.status !== "active") || n.unsubscribed_at) e.unsubscribed = true
  }

  // Fuera lo que no es una persona real: direcciones de relleno de registros por telefono y cuentas de prueba internas.
  for (const email of Array.from(census.keys())) {
    if (/@phone\.semzopriv/.test(email) || /^ergomara\d*@/.test(email)) census.delete(email)
  }
  // "canceled" y "cancelled" son el mismo estado: un unico valor para que los segmentos no se partan en dos.
  for (const e of census.values()) {
    if (e.membershipStatus === "canceled") e.membershipStatus = "cancelled"
  }

  return census
}

/** Perfil de Klaviyo (formato API) para una entrada del censo. */
export function toKlaviyoProfile(e: CensusEntry) {
  const properties: Record<string, unknown> = {
    semzo_origin: Array.from(e.origins).sort().join(","),
    semzo_is_member: e.origins.has("socia"),
  }
  if (e.membershipPlan) properties.membership_plan = e.membershipPlan
  if (e.membershipStatus) properties.membership_status = e.membershipStatus
  if (e.signupDate) properties.semzo_signup_date = e.signupDate.slice(0, 10)
  if (e.leadSource) properties.lead_source = e.leadSource
  if (e.utmCampaign) properties.utm_campaign = e.utmCampaign
  const attributes: Record<string, unknown> = { email: e.email, properties }
  if (e.firstName) attributes.first_name = e.firstName
  if (e.lastName) attributes.last_name = e.lastName
  return { type: "profile", attributes }
}

/** Version anonimizada para mostrar en la prueba en seco (sin datos personales completos). */
export function maskEmail(email: string): string {
  const [user, domain] = email.split("@")
  return `${user.slice(0, 2)}***@${domain}`
}
