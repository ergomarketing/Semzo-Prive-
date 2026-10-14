/**
 * Preparacion de los emails de la secuencia de leads (tabla email_templates):
 * rastreo de clics, enlace de baja y destino seguro del redireccionador.
 *
 * Por que existe: las plantillas de marca de email_templates llevan enlaces
 * directos (https://semzoprive.com/catalog ...) y no el marcador {{cta_url}},
 * asi que NINGUN clic pasaba por /api/track/click (0 clics en 546 envios).
 * Aqui los enlaces propios se reescriben al enviar, sin tocar las plantillas.
 */

const OWN_HOSTS = ["semzoprive.com", "www.semzoprive.com"]

/** Destinos que /api/track/click puede redirigir (evita ser un redireccionador abierto). */
export function isAllowedDestination(raw: string): boolean {
  // host exacto: rechaza semzoprive.com.otro.dominio y semzoprive.com@otro.dominio
  const m = /^https?:\/\/([^\/?#:@]+)(?::\d+)?(?:[\/?#]|$)/i.exec(String(raw).trim())
  return !!m && OWN_HOSTS.includes(m[1].toLowerCase())
}

export interface LeadEmailLinkOptions {
  appUrl: string
  leadId: string
  /** id de la fila de email_sequence_log (uuid): es el que usa /api/track/* */
  sequenceRowId: string
  unsubscribeUrl: string
}

/**
 * 1. "Darse de baja" con href="#" (enlace muerto en las plantillas) -> URL de baja real.
 * 2. Enlaces <a> a semzoprive.com -> /api/track/click?...&url=<destino>.
 * Los enlaces de redes sociales y las fuentes no se tocan.
 */
export function rewriteLeadEmailLinks(html: string, opts: LeadEmailLinkOptions): string {
  const { appUrl, leadId, sequenceRowId, unsubscribeUrl } = opts

  // 1) enlace de baja muerto
  let out = html.replace(
    /(<a\b[^>]*?\shref=")#("[^>]*>\s*(?:<[^>]+>\s*)*Darse de baja)/gi,
    (_m, before, after) => `${before}${unsubscribeUrl}${after}`,
  )

  // 2) enlaces propios rastreables
  out = out.replace(/(<a\b[^>]*?\shref=")(https?:\/\/[^"]+)(")/gi, (match, before, url, after) => {
    const clean = String(url).replace(/&amp;/g, "&")
    if (clean.includes("/api/track/") || clean.includes("/api/webhooks/unsubscribe")) return match
    if (!isAllowedDestination(clean)) return match
    const tracked = `${appUrl}/api/track/click?lid=${leadId}&eid=${sequenceRowId}&url=${encodeURIComponent(clean)}`
    return `${before}${tracked}${after}`
  })

  return out
}

/**
 * Si el HTML no contiene ya el enlace de baja (p. ej. la plantilla del email 1),
 * se anade una linea discreta al final. No altera el diseno de la plantilla.
 */
export function ensureUnsubscribeFooter(html: string, unsubscribeUrl: string): string {
  if (html.includes(unsubscribeUrl)) return html
  const footer =
    `<div style="max-width:600px;margin:0 auto;padding:16px 20px 28px;text-align:center;` +
    `font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#9a9a9a;">` +
    `Si no quieres recibir mas emails, puedes <a href="${unsubscribeUrl}" style="color:#9a9a9a;">darte de baja</a>.` +
    `</div>`
  return html.includes("</body>") ? html.replace("</body>", `${footer}</body>`) : html + footer
}
