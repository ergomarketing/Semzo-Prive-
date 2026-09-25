/**
 * Captura de atribucion en el navegador (solo cliente).
 *
 * Guarda en localStorage el PRIMER contacto y el ULTIMO contacto con senal
 * (UTM, click id de anuncios, referrer externo) para poder enviarlos al
 * registrarse. Solo se guardan claves en lista blanca: la URL completa nunca
 * (podria llevar tokens, p.ej. ?access_token= de recuperacion de contraseña).
 *
 * Todo esta envuelto en try/catch: localStorage puede fallar (modo privado) y
 * la atribucion jamas debe romper la navegacion.
 */
import { CLICK_ID_TYPES, type Touch } from "@/lib/attribution"

const FIRST_TOUCH_KEY = "semzo_first_touch"
const LAST_TOUCH_KEY = "semzo_last_touch"
const SYNCED_KEY = "semzo_attribution_synced"
const MAX_AGE_MS = 90 * 24 * 60 * 60 * 1000

// Referrers que NO son captacion (retornos de pago/auth o el propio sitio).
const IGNORED_REFERRER_HOSTS = ["semzoprive.com", "stripe.com", "supabase.co", "vercel.app", "accounts.google.com"]

function hasSignal(touch: Touch | null): boolean {
  return !!touch && !!(touch.utm_source || touch.utm_medium || touch.click_id_type || touch.referrer_host)
}

function readTouch(key: string): Touch | null {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const touch = JSON.parse(raw) as Touch
    if (touch.ts && Date.now() - new Date(touch.ts).getTime() > MAX_AGE_MS) {
      localStorage.removeItem(key)
      return null
    }
    return touch
  } catch {
    return null
  }
}

function writeTouch(key: string, touch: Touch) {
  try {
    localStorage.setItem(key, JSON.stringify(touch))
  } catch {
    // ignorado: modo privado / cuota
  }
}

function externalReferrerHost(): string | undefined {
  try {
    if (!document.referrer) return undefined
    const host = new URL(document.referrer).hostname.replace(/^www\./, "").toLowerCase()
    if (!host || host === window.location.hostname.replace(/^www\./, "").toLowerCase()) return undefined
    if (IGNORED_REFERRER_HOSTS.some((ignored) => host === ignored || host.endsWith(`.${ignored}`))) return undefined
    return host.slice(0, 100)
  } catch {
    return undefined
  }
}

/** Touch de la visita actual, solo con claves en lista blanca. */
export function buildTouchFromLocation(): Touch {
  const params = new URLSearchParams(window.location.search)
  const touch: Touch = { landing_path: window.location.pathname.slice(0, 200), ts: new Date().toISOString() }

  for (const key of ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"] as const) {
    const value = params.get(key)?.trim()
    if (value) touch[key] = value.slice(0, 150)
  }

  for (const type of CLICK_ID_TYPES) {
    const value = params.get(type)?.trim()
    if (value) {
      touch.click_id_type = type
      touch.click_id = value.slice(0, 200)
      break
    }
  }

  const referrerHost = externalReferrerHost()
  if (referrerHost) touch.referrer_host = referrerHost

  return touch
}

/**
 * Registra la visita actual: el primer contacto se conserva (salvo que fuera
 * "directo" y ahora llegue con senal) y el ultimo se actualiza solo si la
 * visita trae senal.
 */
export function captureTouch() {
  try {
    const current = buildTouchFromLocation()
    const first = readTouch(FIRST_TOUCH_KEY)

    if (!first || (!hasSignal(first) && hasSignal(current))) writeTouch(FIRST_TOUCH_KEY, current)
    if (hasSignal(current)) writeTouch(LAST_TOUCH_KEY, current)
  } catch {
    // no bloquear nunca la navegacion
  }
}

export function getStoredAttribution(): { firstTouch: Touch | null; lastTouch: Touch | null } {
  return { firstTouch: readTouch(FIRST_TOUCH_KEY), lastTouch: readTouch(LAST_TOUCH_KEY) }
}

export function isAttributionSynced(): boolean {
  try {
    return localStorage.getItem(SYNCED_KEY) === "1"
  } catch {
    return true // sin localStorage no podemos deduplicar: mejor no reenviar
  }
}

export function markAttributionSynced() {
  try {
    localStorage.setItem(SYNCED_KEY, "1")
  } catch {
    // ignorado
  }
}
