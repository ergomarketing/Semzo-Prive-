import type { MetadataRoute } from "next"
import { createClient } from "@supabase/supabase-js"

/**
 * Sitemap dinamico con valores SEO realistas:
 *
 * PRIORITIES (jerarquia clara, sin inflar):
 *   1.0  home
 *   0.9  catalog (pagina comercial principal)
 *   0.7  proceso, lista-privada
 *   0.6  calculadora-ahorro, gift-cards, blog (index), bolsos top
 *   0.5  bolsos resto del catalogo
 *   0.4  support
 *   0.2  legal/*
 *
 * CHANGEFREQ realista (no daily si no cambia diario):
 *   weekly  home, catalog (anaden bolsos a veces)
 *   monthly proceso, blog posts, gift-cards, bolsos
 *   yearly  legal
 *
 * LASTMOD:
 *   - Estaticas: fecha estable (cuando se publico el deploy de SEO).
 *     NO usamos new Date() siempre porque Google detecta sitemap regenerado
 *     diariamente sin cambios reales como "spam de frescura" y baja prioridad.
 *   - Bolsos: bag.updated_at real de la BD.
 *   - Blog posts: post.date real.
 *   - Catalog: max(updated_at) del catalogo (cuando realmente cambio).
 */

// Forzar regeneracion cada hora para que cambios en BD (nuevos bolsos,
// updated_at, imagenes) se reflejen sin esperar a un nuevo deploy.
// Google no penaliza esto; al contrario, ayuda a descubrir contenido.
export const revalidate = 3600

// Fecha estable del ultimo cambio significativo de paginas estaticas.
// Actualizar SOLO cuando se hagan cambios reales en home/proceso/legal.
const STATIC_PAGES_LASTMOD = "2026-04-29"
const LEGAL_LASTMOD = "2026-01-01"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://semzoprive.com"

  let bagUrls: MetadataRoute.Sitemap = []
  const blogUrls: MetadataRoute.Sitemap = []
  let catalogLastMod = STATIC_PAGES_LASTMOD

  // Blog posts (con fecha real del articulo + imagen para Google Images)
  try {
    const { listPosts } = await import("@/lib/blog-storage")
    const posts = await listPosts()
    for (const post of posts) {
      const postImage = (post as { image?: string }).image
      blogUrls.push({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.date || STATIC_PAGES_LASTMOD,
        changeFrequency: "monthly" as const,
        priority: 0.6,
        ...(postImage ? { images: [postImage.startsWith("http") ? postImage : `${baseUrl}${postImage}`] } : {}),
      })
    }
  } catch {
    // silencioso - no bloquear el sitemap si el blog falla
  }

  // Bolsos del catalogo (con updated_at real, prioridad diferenciada, imagenes para Google Images)
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data: bags } = await supabase
        .from("bags")
        .select("id, slug, updated_at, membership_type, image_url, images")
        .eq("status", "available")
        .order("updated_at", { ascending: false })

      if (bags && bags.length > 0) {
        // El primer bolso (mas reciente) define el lastmod del listado /catalog
        catalogLastMod = bags[0].updated_at?.split("T")[0] || STATIC_PAGES_LASTMOD

        bagUrls = bags.map((bag) => {
          // Bolsos de membresia Prive son productos top -> 0.6
          // Resto -> 0.5
          const isTopProduct = bag.membership_type === "prive" || bag.membership_type === "signature"

          // Construir array de imagenes para Google Images.
          // Priorizar bag.images (galeria), fallback a image_url. Maximo 5 por URL (Google).
          const imagesArr = Array.isArray(bag.images) && bag.images.length > 0 ? bag.images : []
          const finalImages = (imagesArr.length > 0 ? imagesArr : bag.image_url ? [bag.image_url] : [])
            .filter((u): u is string => typeof u === "string" && u.length > 0)
            .slice(0, 5)

          return {
            // Solo URL canonica con slug (no duplicamos UUID + slug).
            // Fallback a UUID solo si por alguna razon no hay slug en BD.
            url: `${baseUrl}/catalog/${bag.slug || bag.id}`,
            lastModified: bag.updated_at?.split("T")[0] || STATIC_PAGES_LASTMOD,
            changeFrequency: "monthly" as const,
            priority: isTopProduct ? 0.6 : 0.5,
            ...(finalImages.length > 0 ? { images: finalImages } : {}),
          }
        })
      }
    }
  } catch (error) {
    console.error("[v0] Error generating bag URLs for sitemap:", error)
  }

  // Paginas estaticas con valores realistas
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: STATIC_PAGES_LASTMOD,
      changeFrequency: "weekly",
      priority: 1.0,
      images: [`${baseUrl}/images/hero-luxury-bags.jpeg`],
    },
    {
      url: `${baseUrl}/catalog`,
      lastModified: catalogLastMod, // refleja el bolso mas reciente
      changeFrequency: "weekly",
      priority: 0.9,
      images: [`${baseUrl}/images/hero-luxury-bags.jpeg`],
    },
    {
      url: `${baseUrl}/proceso`,
      lastModified: STATIC_PAGES_LASTMOD,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/lista-privada`,
      lastModified: STATIC_PAGES_LASTMOD,
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${baseUrl}/calculadora-ahorro`,
      lastModified: STATIC_PAGES_LASTMOD,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/gift-cards`,
      lastModified: STATIC_PAGES_LASTMOD,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: blogUrls[0]?.lastModified || STATIC_PAGES_LASTMOD,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: STATIC_PAGES_LASTMOD,
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${baseUrl}/legal/terms`,
      lastModified: LEGAL_LASTMOD,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/legal/privacy`,
      lastModified: LEGAL_LASTMOD,
      changeFrequency: "yearly",
      priority: 0.2,
    },
    {
      url: `${baseUrl}/legal/cookies`,
      lastModified: LEGAL_LASTMOD,
      changeFrequency: "yearly",
      priority: 0.2,
    },
  ]

  return [...staticUrls, ...blogUrls, ...bagUrls]
}
