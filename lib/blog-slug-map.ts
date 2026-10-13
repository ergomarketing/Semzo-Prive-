import slugMap from "./blog-slug-map.json"

/**
 * Slugs publicos del blog que difieren del slug guardado en Supabase.
 *
 * Los slugs de la tabla blog_posts NO se tocan (guion inicial/final, palabras
 * pegadas). La URL publica limpia se resuelve aqui, en codigo:
 *   - clave  = slug antiguo (el de la base de datos, y la URL indexada hasta ahora)
 *   - valor  = slug nuevo (el que se enlaza, se publica en sitemap y canonical)
 *
 * Los datos viven en blog-slug-map.json para que next.config.mjs (que no puede
 * importar .ts) genere desde la misma fuente las redirecciones 301
 * antiguo -> nuevo. Para revertir un slug basta con quitar su linea del JSON.
 */
const DB_TO_PUBLIC: Record<string, string> = slugMap

const PUBLIC_TO_DB: Record<string, string> = Object.fromEntries(
  Object.entries(DB_TO_PUBLIC).map(([db, pub]) => [pub, db]),
)

/** Slug que se muestra en la URL publica (enlaces, sitemap, canonical). */
export function publicBlogSlug(dbSlug: string): string {
  return DB_TO_PUBLIC[dbSlug] ?? dbSlug
}

/** Slug real en Supabase a partir del slug de la URL. */
export function dbBlogSlug(urlSlug: string): string {
  return PUBLIC_TO_DB[urlSlug] ?? urlSlug
}

export const BLOG_SLUG_REDIRECTS = DB_TO_PUBLIC
