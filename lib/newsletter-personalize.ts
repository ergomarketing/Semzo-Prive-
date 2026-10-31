const NAME_PLACEHOLDER = /\{\{\s*(?:name|nombre)\s*\}\}/gi
const NAME_PLACEHOLDER_WITH_LEADING_SPACE = /[ \t\u00a0]*\{\{\s*(?:name|nombre)\s*\}\}/gi
const UNSUBSCRIBE_PLACEHOLDER = /\{\{\s*unsubscribe_url\s*\}\}/gi

/**
 * Sustituye {{name}} / {{nombre}} y {{unsubscribe_url}}. Si el destinatario no
 * tiene nombre, también elimina el espacio previo al placeholder para que
 * "Hola {{nombre}}," quede "Hola," y no "Hola ,".
 */
export function personalizeNewsletter(html: string, name: string, unsubscribeUrl: string): string {
  const trimmed = name.trim()
  const withName = trimmed
    ? html.replace(NAME_PLACEHOLDER, () => trimmed)
    : html.replace(NAME_PLACEHOLDER_WITH_LEADING_SPACE, "")
  return withName.replace(UNSUBSCRIBE_PLACEHOLDER, () => unsubscribeUrl)
}
