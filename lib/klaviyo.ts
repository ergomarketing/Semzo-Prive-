/**
 * Cliente minimo de Klaviyo (API de servidor). Envia a Klaviyo QUIEN es cada persona y QUE hace
 * (eventos): registro, acceso al catalogo, membresia activada o cancelada, compra Colecciona...
 * Con eso se montan los flujos en Klaviyo.
 *
 * Reglas:
 *  - Nunca lanza ni bloquea: si falta la clave o Klaviyo falla, solo se registra en consola.
 *  - Sin clave (KLAVIYO_PRIVATE_API_KEY) no hace nada.
 *  - NO suscribe a nadie a listas de marketing: eso requiere consentimiento expreso y se hace aparte.
 *    Crear el perfil y registrar eventos no envia ningun correo por si solo.
 *  - Cada evento lleva unique_id: reenviarlo (webhooks repetidos) no lo duplica en Klaviyo.
 */
import type { SupabaseClient } from "@supabase/supabase-js"

const API_URL = "https://a.klaviyo.com/api"
const API_REVISION = "2024-10-15"
const TIMEOUT_MS = 5000

export function klaviyoConfigured(): boolean {
  return !!process.env.KLAVIYO_PRIVATE_API_KEY
}

export interface KlaviyoTrackInput {
  email: string
  metric: string
  properties?: Record<string, unknown>
  /** Importe asociado (p. ej. venta), en la moneda indicada. */
  value?: number
  currency?: string
  /** Clave de idempotencia: el mismo hecho enviado dos veces cuenta una sola vez. */
  uniqueId?: string
  profile?: { firstName?: string | null; lastName?: string | null; phone?: string | null; properties?: Record<string, unknown> }
  time?: Date
}

export type KlaviyoResult = { ok: true } | { ok: false; skipped?: boolean; status?: number; error?: string }

export async function klaviyoTrack(input: KlaviyoTrackInput): Promise<KlaviyoResult> {
  const apiKey = process.env.KLAVIYO_PRIVATE_API_KEY
  if (!apiKey) return { ok: false, skipped: true }
  const email = (input.email || "").toLowerCase().trim()
  if (!email || !email.includes("@")) return { ok: false, skipped: true }

  const profileAttributes: Record<string, unknown> = { email }
  if (input.profile?.firstName) profileAttributes.first_name = input.profile.firstName
  if (input.profile?.lastName) profileAttributes.last_name = input.profile.lastName
  if (input.profile?.phone) profileAttributes.phone_number = input.profile.phone
  if (input.profile?.properties && Object.keys(input.profile.properties).length > 0) {
    profileAttributes.properties = input.profile.properties
  }

  const attributes: Record<string, unknown> = {
    properties: input.properties ?? {},
    time: (input.time ?? new Date()).toISOString(),
    metric: { data: { type: "metric", attributes: { name: input.metric } } },
    profile: { data: { type: "profile", attributes: profileAttributes } },
  }
  if (typeof input.value === "number" && Number.isFinite(input.value)) {
    attributes.value = input.value
    attributes.value_currency = input.currency || "EUR"
  }
  if (input.uniqueId) attributes.unique_id = input.uniqueId

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS)
  try {
    const response = await fetch(`${API_URL}/events/`, {
      method: "POST",
      headers: {
        Authorization: `Klaviyo-API-Key ${apiKey}`,
        revision: API_REVISION,
        accept: "application/vnd.api+json",
        "content-type": "application/vnd.api+json",
      },
      body: JSON.stringify({ data: { type: "event", attributes } }),
      signal: controller.signal,
    })
    if (!response.ok) {
      const text = await response.text().catch(() => "")
      console.warn(`[klaviyo] ${input.metric}: HTTP ${response.status} ${text.slice(0, 300)}`)
      return { ok: false, status: response.status, error: text.slice(0, 300) }
    }
    return { ok: true }
  } catch (err) {
    console.warn(`[klaviyo] ${input.metric} fallo (no bloquea):`, err instanceof Error ? err.message : err)
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  } finally {
    clearTimeout(timer)
  }
}

/** Igual que klaviyoTrack, pero buscando nombre y correo de la socia en profiles. */
export async function klaviyoTrackForUser(
  supabase: SupabaseClient,
  userId: string,
  event: Omit<KlaviyoTrackInput, "email" | "profile"> & { profile?: KlaviyoTrackInput["profile"] },
): Promise<KlaviyoResult> {
  if (!klaviyoConfigured()) return { ok: false, skipped: true }
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("email, first_name, last_name, full_name")
      .eq("id", userId)
      .maybeSingle()
    if (!profile?.email) return { ok: false, skipped: true }
    const [firstFromFull, ...restFull] = (profile.full_name || "").trim().split(/\s+/)
    return await klaviyoTrack({
      ...event,
      email: profile.email,
      profile: {
        firstName: profile.first_name || firstFromFull || null,
        lastName: profile.last_name || restFull.join(" ") || null,
        ...(event.profile ?? {}),
      },
    })
  } catch (err) {
    console.warn(`[klaviyo] ${event.metric} (usuario ${userId}) fallo (no bloquea):`, err instanceof Error ? err.message : err)
    return { ok: false, error: err instanceof Error ? err.message : String(err) }
  }
}
