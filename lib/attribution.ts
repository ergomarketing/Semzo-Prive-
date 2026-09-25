/**
 * Atribucion de registro: "como nos encontraron".
 *
 * Dos fuentes complementarias:
 *  - AUTOMATICA: primer y ultimo contacto (UTM, click ids, referrer host,
 *    pagina de entrada) capturados en el navegador por AttributionCapture.
 *  - DECLARADA: el desplegable opcional "¿Como nos conociste?" del signup.
 *
 * Este modulo es puro y seguro para importar en servidor y cliente: valida y
 * normaliza lo que llega (NUNCA se confia en el payload del navegador) y
 * deriva un `channel` agrupable. La escritura en BD es SIEMPRE best-effort:
 * un fallo aqui (p.ej. la tabla aun no migrada) no debe romper un registro.
 */
import type { SupabaseClient } from "@supabase/supabase-js"
import type { LeadSource } from "@/lib/leads/enroll"

export const CLICK_ID_TYPES = ["gclid", "fbclid", "ttclid", "msclkid", "srsltid"] as const
export type ClickIdType = (typeof CLICK_ID_TYPES)[number]

export const SELF_REPORTED_OPTIONS = [
  "instagram",
  "tiktok",
  "google",
  "pinterest",
  "friend",
  "press",
  "event",
  "other",
] as const
export type SelfReported = (typeof SELF_REPORTED_OPTIONS)[number]

export type Touch = {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
  click_id_type?: ClickIdType
  click_id?: string
  referrer_host?: string
  landing_path?: string
  ts?: string
}

export type AttributionPayload = {
  firstTouch: Touch | null
  lastTouch: Touch | null
  selfReported: SelfReported | null
  selfReportedDetail: string | null
}

const TOUCH_TEXT_LIMITS: Record<string, number> = {
  utm_source: 100,
  utm_medium: 100,
  utm_campaign: 150,
  utm_content: 150,
  utm_term: 150,
  click_id: 200,
  referrer_host: 100,
  landing_path: 200,
}

function cleanText(value: unknown, max: number): string | undefined {
  if (typeof value !== "string") return undefined
  const trimmed = value.trim().slice(0, max)
  return trimmed || undefined
}

/** Whitelist + recorte de un touch recibido del navegador. */
export function sanitizeTouch(input: unknown): Touch | null {
  if (!input || typeof input !== "object") return null
  const raw = input as Record<string, unknown>
  const touch: Touch = {}

  const texts: Record<string, string> = {}
  for (const key of Object.keys(TOUCH_TEXT_LIMITS)) {
    const value = cleanText(raw[key], TOUCH_TEXT_LIMITS[key])
    if (value) texts[key] = value
  }
  Object.assign(touch, texts)

  if (typeof raw.click_id_type === "string" && (CLICK_ID_TYPES as readonly string[]).includes(raw.click_id_type)) {
    touch.click_id_type = raw.click_id_type as ClickIdType
  }

  if (typeof raw.ts === "string") {
    const parsed = new Date(raw.ts)
    if (!Number.isNaN(parsed.getTime())) touch.ts = parsed.toISOString()
  }

  return Object.keys(touch).length > 0 ? touch : null
}

export function sanitizeAttribution(input: unknown): AttributionPayload {
  const raw = (input && typeof input === "object" ? input : {}) as Record<string, unknown>

  const selfReported =
    typeof raw.selfReported === "string" && (SELF_REPORTED_OPTIONS as readonly string[]).includes(raw.selfReported)
      ? (raw.selfReported as SelfReported)
      : null

  return {
    firstTouch: sanitizeTouch(raw.firstTouch),
    lastTouch: sanitizeTouch(raw.lastTouch),
    selfReported,
    selfReportedDetail: cleanText(raw.selfReportedDetail, 200) ?? null,
  }
}

function hasSignal(touch: Touch | null): touch is Touch {
  return !!touch && !!(touch.utm_source || touch.utm_medium || touch.click_id_type || touch.referrer_host)
}

/**
 * Canal normalizado para agrupar. Prioriza el ultimo contacto con senal (para
 * un registro desde un anuncio, el clic del anuncio) y cae al primero.
 */
export function deriveChannel(firstTouch: Touch | null, lastTouch: Touch | null): string {
  const pick = hasSignal(lastTouch) ? lastTouch : hasSignal(firstTouch) ? firstTouch : null
  if (!pick) return "direct"

  const source = (pick.utm_source || "").toLowerCase()
  const medium = (pick.utm_medium || "").toLowerCase()
  const host = (pick.referrer_host || "").toLowerCase()

  if (pick.click_id_type === "gclid" || (source === "google" && ["cpc", "ppc", "paid", "paidsearch"].includes(medium))) {
    return "google_ads"
  }
  if (pick.click_id_type === "ttclid" || source.includes("tiktok") || host.includes("tiktok.com")) return "tiktok"
  if (source.includes("instagram") || source === "ig" || host.includes("instagram.com")) return "instagram"
  if (
    pick.click_id_type === "fbclid" ||
    source.includes("facebook") ||
    source === "fb" ||
    source === "meta" ||
    host.includes("facebook.com")
  ) {
    return "facebook"
  }
  if (source.includes("pinterest") || host.includes("pinterest.")) return "pinterest"
  if (medium === "email" || medium === "newsletter" || source === "newsletter") return "email"
  if (
    pick.click_id_type === "srsltid" ||
    /(^|\.)google\.[a-z.]+$/.test(host) ||
    host.includes("bing.com") ||
    host.includes("duckduckgo.com") ||
    host.includes("ecosia.org")
  ) {
    return "organic_search"
  }
  if (host) return "referral_site"
  if (source) return "other_campaign"
  return "direct"
}

/** Mapeo al enum que ya usa el embudo de leads (y el panel /admin/leads). */
export function leadSourceFromChannel(channel: string): LeadSource {
  if (channel === "google_ads") return "google_ads"
  if (["instagram", "tiktok", "facebook", "pinterest"].includes(channel)) return "social"
  return "organic_web"
}

/**
 * Guarda la atribucion de un usuario. Best-effort e idempotente: la primera
 * escritura gana (no pisa un registro previo). Nunca lanza.
 */
export async function saveAttribution(
  supabase: SupabaseClient,
  userId: string,
  payload: AttributionPayload,
): Promise<{ ok: boolean; channel: string; reason?: string }> {
  const channel = deriveChannel(payload.firstTouch, payload.lastTouch)
  try {
    const { error } = await supabase.from("signup_attribution").upsert(
      {
        user_id: userId,
        self_reported: payload.selfReported,
        self_reported_detail: payload.selfReportedDetail,
        channel,
        first_touch: payload.firstTouch,
        last_touch: payload.lastTouch,
      },
      { onConflict: "user_id", ignoreDuplicates: true },
    )
    if (error) {
      console.error("[attribution] No se pudo guardar:", error.message)
      return { ok: false, channel, reason: error.message }
    }
    return { ok: true, channel }
  } catch (err) {
    console.error("[attribution] Error inesperado:", err)
    return { ok: false, channel, reason: "unexpected_error" }
  }
}
