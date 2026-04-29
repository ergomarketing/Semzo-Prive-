import type { MetadataRoute } from "next"
import { createClient } from "@supabase/supabase-js"

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://semzoprive.com"
  const currentDate = new Date().toISOString()

  // Solo URLs publicas con valor SEO real.
  // EXCLUIDAS: /membership/upgrade/* (requieren auth + membresia activa),
  // /signup, /onboarding, /cart, /checkout, /dashboard, /admin, /reservations,
  // /wishlist, /my-account, /post-checkout, /verification-complete, /verify-identity,
  // /recommendations (requiere auth), /test-* (paginas internas),
  // /invitation, /invitacion (noindex por privacidad).
  const staticUrls: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/catalog`,
      lastModified: currentDate,
      changeFrequency: "daily",
      priority: 0.95,
    },
    {
      url: `${baseUrl}/proceso`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/lista-privada`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/calculadora-ahorro`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/gift-cards`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.75,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/legal/terms`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/privacy`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/legal/cookies`,
      lastModified: currentDate,
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ]

  let bagUrls: MetadataRoute.Sitemap = []
  const blogUrls: MetadataRoute.Sitemap = []

  try {
    const { listPosts } = await import("@/lib/blog-storage")
    const posts = await listPosts()
    for (const post of posts) {
      blogUrls.push({
        url: `${baseUrl}/blog/${post.slug}`,
        lastModified: post.date || currentDate,
        changeFrequency: "monthly" as const,
        priority: 0.75,
      })
    }
  } catch {
    // silencioso - no bloquear el sitemap si el blog falla
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (supabaseUrl && supabaseKey) {
      const supabase = createClient(supabaseUrl, supabaseKey)
      const { data: bags } = await supabase.from("bags").select("id, updated_at").eq("status", "available")

      if (bags) {
        bagUrls = bags.map((bag) => ({
          url: `${baseUrl}/catalog/${bag.id}`,
          lastModified: bag.updated_at || currentDate,
          changeFrequency: "weekly" as const,
          priority: 0.8,
        }))
      }
    }
  } catch (error) {
    console.error("Error generating bag URLs for sitemap:", error)
  }

  return [...staticUrls, ...blogUrls, ...bagUrls]
}
