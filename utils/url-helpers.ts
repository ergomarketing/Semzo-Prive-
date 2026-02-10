/**
 * Utilidades para generar URLs SEO-friendly
 */

/**
 * Convierte texto a slug SEO-friendly
 * Ejemplo: "Louis Vuitton Neverfull MM" → "louis-vuitton-neverfull-mm"
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .normalize("NFD") // Normaliza caracteres acentuados
    .replace(/[\u0300-\u036f]/g, "") // Elimina acentos
    .replace(/[^\w\s-]/g, "") // Elimina caracteres especiales
    .trim()
    .replace(/\s+/g, "-") // Reemplaza espacios con guiones
    .replace(/--+/g, "-") // Reemplaza múltiples guiones con uno solo
}

/**
 * Genera slug de producto basado en marca y nombre
 * Ejemplo: generateProductSlug("Louis Vuitton", "Neverfull MM", "123")
 * Resultado: "louis-vuitton-neverfull-mm-123"
 */
export function generateProductSlug(brand: string, name: string, id: string): string {
  const brandSlug = slugify(brand)
  const nameSlug = slugify(name)
  return `${brandSlug}-${nameSlug}-${id}`
}

/**
 * Extrae el ID de un slug de producto
 * Ejemplo: extractProductId("louis-vuitton-neverfull-mm-123") → "123"
 */
export function extractProductId(slug: string): string {
  const parts = slug.split("-")
  return parts[parts.length - 1]
}

/**
 * Genera canonical URL completa
 */
export function getCanonicalUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://semzoprive.com"
  return `${baseUrl}${path.startsWith("/") ? path : `/${path}`}`
}

/**
 * Normaliza URLs para evitar duplicados
 * - Remueve trailing slashes excepto en homepage
 * - Convierte a minúsculas
 */
export function normalizeUrl(url: string): string {
  let normalized = url.toLowerCase().trim()

  // Remover trailing slash excepto en homepage
  if (normalized !== "/" && normalized.endsWith("/")) {
    normalized = normalized.slice(0, -1)
  }

  return normalized
}
