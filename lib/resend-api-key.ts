// Descarta valores placeholder/inválidos (p.ej. "re_xxxxx") y devuelve la
// primera clave de Resend realmente utilizable entre las variables de entorno
// disponibles. RESEND_API_KEY puede existir con un valor de ejemplo sin uso
// real; en ese caso un `||` simple nunca cae al fallback porque el string es
// no vacío. Por eso toda lectura de la clave de Resend debe pasar por aquí.
export function isValidResendKey(key: string | undefined | null): key is string {
  if (!key) return false
  const trimmed = key.trim()
  if (!trimmed.startsWith("re_")) return false
  if (/^re_x+$/i.test(trimmed)) return false // placeholder tipo "re_xxxxx"
  if (trimmed.length < 20) return false
  return true
}

export function getResendApiKey(): string {
  const candidates = [process.env.RESEND_API_KEY, process.env.EMAIL_API_KEY]
  for (const candidate of candidates) {
    if (isValidResendKey(candidate)) return candidate
  }
  return ""
}
