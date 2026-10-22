/**
 * Aviso de "registro de cuenta real" para Google Tag Manager.
 *
 * Se llama SOLO cuando el servidor ha confirmado que la cuenta se ha creado. En Tag Manager, la conversion de
 * Google Ads ("Formulario") debe dispararse unicamente con un activador de tipo "Evento personalizado" cuyo
 * nombre sea `semzo_sign_up`. Nunca con "All Pages" (contaria cada visita como conversion).
 */
export function trackSignUp(method: "email" | "phone" | "checkout" | "free"): void {
  if (typeof window === "undefined") return
  try {
    const w = window as unknown as { dataLayer?: unknown[] }
    w.dataLayer = w.dataLayer || []
    w.dataLayer.push({ event: "semzo_sign_up", method })
  } catch {
    // La medicion nunca debe romper un registro.
  }
}
