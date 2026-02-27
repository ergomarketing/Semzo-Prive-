import type { MetadataRoute } from "next"
import { createClient } from "@supabase/supabase-js"
import { list } from "@vercel/blob"

function parseFrontmatter(content: string): { metadata: Record<string, string>; content: string } {
  const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/
  const match = content.match(frontmatterRegex)

  if (!match) {
    return { metadata: {}, content }
  }

  const frontmatter = match[1]
  const markdown = match[2]

  const metadata: Record<string, string> = {}
  frontmatter.split("\n").forEach((line) => {
    const [key, ...valueParts] = line.split(":")
    if (key && valueParts.length) {
      const value = valueParts
        .join(":")
        .trim()
        .replace(/^["']|["']$/g, "")
      metadata[key.trim()] = value
    }
  })

  return { metadata, content: markdown }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = "https://semzoprive.com"
  const currentDate = new Date().toISOString()

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
      url: `${baseUrl}/membership/upgrade`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${baseUrl}/membership/upgrade/signature`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/membership/upgrade/prive`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/membership/upgrade/essentiel`,
      lastModified: currentDate,
      changeFrequency: "weekly",
      priority: 0.85,
    },
    {
      url: `${baseUrl}/membership-signup`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.85,
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
      priority: 0.7,
    },
    {
      url: `${baseUrl}/support`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/signup`,
      lastModified: currentDate,
      changeFrequency: "monthly",
      priority: 0.7,
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
    const { blobs } = await list({ prefix: "blog/" })

    for (const blob of blobs) {
      if (blob.pathname.endsWith(".md")) {
        try {
          const response = await fetch(blob.url)
          const content = await response.text()
          const { metadata } = parseFrontmatter(content)

          const postSlug = metadata.slug || blob.pathname.replace("blog/", "").replace(".md", "")
          const postDate = metadata.date || currentDate

          blogUrls.push({
            url: `${baseUrl}/blog/${postSlug}`,
            lastModified: postDate,
            changeFrequency: "monthly" as const,
            priority: 0.75,
          })
        } catch (error) {
          console.error(`Error processing blog post ${blob.pathname}:`, error)
          continue
        }
      }
    }
  } catch (error) {
    console.error("Error generating blog URLs for sitemap:", error)
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
