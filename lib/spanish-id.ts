/**
 * Validacion de DNI / NIE espanoles (formato + letra de control). No valida CIF.
 * Se usa para la factura completa de una compra Colecciona (por encima de 400 € la factura
 * simplificada no vale y hay que identificar a la compradora).
 */
const CONTROL_LETTERS = "TRWAGMYFPDXBNJZSQVHLCKE"

export type SpanishIdResult =
  | { ok: true; value: string; type: "dni" | "nie" }
  | { ok: false; reason: "format" | "letter" }

export function normalizeSpanishId(raw: unknown): SpanishIdResult {
  const value = String(raw ?? "")
    .toUpperCase()
    .replace(/[\s.\-]/g, "")

  let numeric: string
  let type: "dni" | "nie"
  if (/^\d{8}[A-Z]$/.test(value)) {
    numeric = value.slice(0, 8)
    type = "dni"
  } else if (/^[XYZ]\d{7}[A-Z]$/.test(value)) {
    numeric = `${"XYZ".indexOf(value[0])}${value.slice(1, 8)}`
    type = "nie"
  } else {
    return { ok: false, reason: "format" }
  }

  const expected = CONTROL_LETTERS[Number(numeric) % 23]
  if (value[value.length - 1] !== expected) return { ok: false, reason: "letter" }
  return { ok: true, value, type }
}
