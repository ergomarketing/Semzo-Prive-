/**
 * Correos de servicio con plantilla HTML propia (diseno de Erika). Cada plantilla vive como constante en
 * lib/service-emails/<nombre>.ts, con huecos {{variable}}. Esta funcion los rellena escapando los valores.
 * Fuente unica: se prueban desde /admin/email-preview con el mismo codigo con el que se envian.
 */
const escapeHtml = (value: string) =>
  value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

/**
 * Sustituye {{clave}} por su valor. `raw` son claves cuyo valor ya es seguro (p. ej. una URL propia):
 * se insertan sin escapar el '&' de la URL para no romper el enlace; el resto se escapa.
 */
export function renderServiceTemplate(
  template: string,
  vars: Record<string, string>,
  raw: string[] = [],
): string {
  return template.replace(/\{\{\s*(\w+)\s*\}\}/g, (match, key: string) => {
    if (!(key in vars)) return match
    return raw.includes(key) ? vars[key].replace(/"/g, "%22") : escapeHtml(vars[key])
  })
}
