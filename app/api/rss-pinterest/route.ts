import { NextResponse } from "next/server"
import { listPosts } from "@/lib/blog-storage"

export const revalidate = 21600

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
    const allPosts = await listPosts()
    const posts = allPosts.filter((p) => p.image)

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
