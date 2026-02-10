import { NextResponse } from "next/server"
import { list } from "@vercel/blob"

// Cache Pinterest RSS feed for 6 hours to reduce Vercel Blob API calls
export const revalidate = 21600

interface BlogPost {
  slug: string
  title: string
  date: string
  excerpt: string
  image?: string
}

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

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function truncateTitle(title: string, maxLength = 100): string {
  if (title.length <= maxLength) return title
  return title.substring(0, maxLength - 3) + "..."
}

function optimizeDescriptionForPinterest(excerpt: string): string {
  const hashtags = "#bolsosdelujo #modasostenible #alquilerdebolsos #lujoconsciente #fashionrental"
  const cleanExcerpt = excerpt.substring(0, 300).trim()
  return `${cleanExcerpt} ${hashtags}`
}

export async function GET() {
  try {
    const baseUrl = "https://semzoprive.com"

    const { blobs } = await list({ prefix: "blog/" })
    const posts: BlogPost[] = []

    for (const blob of blobs) {
      if (blob.pathname.endsWith(".md")) {
        try {
          const response = await fetch(blob.url)
          const content = await response.text()
          const { metadata, content: markdownContent } = parseFrontmatter(content)

          if (!metadata.image) continue

          const postSlug = metadata.slug || blob.pathname.replace("blog/", "").replace(".md", "")

          posts.push({
            slug: postSlug,
            title: metadata.title || "Sin título",
            date: metadata.date || new Date().toISOString().split("T")[0],
            excerpt: metadata.excerpt || markdownContent.substring(0, 150) + "...",
            image: metadata.image,
          })
        } catch (error) {
          console.error("Error processing Pinterest RSS blog post:", blob.pathname, error)
          continue
        }
      }
    }

    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    const rssItems = posts
      .map((post) => {
        const pubDate = new Date(post.date).toUTCString()
        const postUrl = `${baseUrl}/blog/${post.slug}`
        const shortTitle = truncateTitle(post.title, 100)
        const pinterestDescription = optimizeDescriptionForPinterest(post.excerpt)

        return `
    <item>
      <title>${escapeXml(shortTitle)}</title>
      <link>${postUrl}</link>
      <guid>${postUrl}</guid>
      <description><![CDATA[${pinterestDescription}]]></description>
      <pubDate>${pubDate}</pubDate>
      <enclosure url="${escapeXml(post.image!)}" type="image/jpeg" length="0" />
    </item>`
      })
      .join("")

    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>Semzo Privé - Bolsos de Lujo</title>
    <link>${baseUrl}</link>
    <description>Alquila bolsos de diseñador: Chanel, Dior, Louis Vuitton y más.</description>
    <language>es</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>${rssItems}
  </channel>
</rss>`

    return new NextResponse(rss, {
      headers: {
        "Content-Type": "application/rss+xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (error) {
    console.error("Error generating Pinterest RSS feed:", error)
    return new NextResponse("Error generating Pinterest RSS feed", { status: 500 })
  }
}
