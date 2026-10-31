export const MADRID_TZ = "Europe/Madrid"

const wallFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: MADRID_TZ,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
})

const dayFormatter = new Intl.DateTimeFormat("es-ES", {
  timeZone: MADRID_TZ,
  weekday: "long",
  day: "numeric",
  month: "long",
})

const timeFormatter = new Intl.DateTimeFormat("es-ES", {
  timeZone: MADRID_TZ,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
})

const LOCAL_INPUT_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/

const pad = (n: number) => String(n).padStart(2, "0")

function madridWallParts(utcMs: number) {
  const parts = Object.fromEntries(
    wallFormatter.formatToParts(new Date(utcMs)).map((p) => [p.type, p.value]),
  )
  return {
    y: Number(parts.year),
    mo: Number(parts.month),
    d: Number(parts.day),
    h: Number(parts.hour) % 24,
    mi: Number(parts.minute),
    s: Number(parts.second),
  }
}

/** Desfase de Madrid respecto a UTC, en minutos, para un instante dado (60 en invierno, 120 en verano). */
export function madridOffsetMinutes(utcMs: number): number {
  const p = madridWallParts(utcMs)
  const wallAsUtc = Date.UTC(p.y, p.mo - 1, p.d, p.h, p.mi, p.s)
  return Math.round((wallAsUtc - Math.floor(utcMs / 1000) * 1000) / 60000)
}

/** Valor para un <input type="datetime-local"> con la hora de pared de Madrid de un instante. */
export function madridInputValue(utcMs: number): string {
  const p = madridWallParts(utcMs)
  return `${p.y}-${pad(p.mo)}-${pad(p.d)}T${pad(p.h)}:${pad(p.mi)}`
}

/**
 * Convierte la hora de pared de Madrid ("2026-11-02T10:00") a un ISO 8601 con
 * su desfase real ("2026-11-02T10:00:00+01:00"), respetando el cambio de
 * horario verano/invierno. Devuelve null si la hora no existe (salto de
 * primavera) o el formato es inválido. En la hora repetida de otoño se usa
 * la segunda ocurrencia (horario de invierno).
 */
export function madridLocalToUtc(local: string): { iso: string; date: Date } | null {
  const m = LOCAL_INPUT_RE.exec(local)
  if (!m) return null
  const [y, mo, d, h, mi] = m.slice(1).map(Number)
  const wallMs = Date.UTC(y, mo - 1, d, h, mi)

  let offset = madridOffsetMinutes(wallMs)
  let utcMs = wallMs - offset * 60000
  const settled = madridOffsetMinutes(utcMs)
  if (settled !== offset) {
    offset = settled
    utcMs = wallMs - offset * 60000
  }
  if (utcMs + madridOffsetMinutes(utcMs) * 60000 !== wallMs) return null

  const sign = offset >= 0 ? "+" : "-"
  const abs = Math.abs(offset)
  const iso = `${local}:00${sign}${pad(Math.floor(abs / 60))}:${pad(abs % 60)}`
  return { iso, date: new Date(utcMs) }
}

export function formatMadridDay(date: Date): string {
  return dayFormatter.format(date)
}

export function formatMadridTime(date: Date): string {
  return timeFormatter.format(date)
}
