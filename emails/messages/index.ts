import { es } from "./es"
import { en } from "./en"
import type { Messages } from "./es"

export type Locale = "es" | "en"

const catalog: Record<Locale, Messages> = { es, en }

/** Devuelve el catálogo de textos para el idioma solicitado. "es" es el idioma por defecto. */
export function getMessages(locale: Locale = "es"): Messages {
  return catalog[locale] ?? catalog.es
}

export type { Messages }
