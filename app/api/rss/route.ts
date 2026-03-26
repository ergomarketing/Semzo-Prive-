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

export async function GET() {
  try {
    const baseUrl = "https://semzoprive.com"
    const posts = await listPosts()

    const rssItems = posts
      .map((post) => {
        const pubDate = new Date(post.date).toUTCString()
        const postUrl = `${baseUrl}/blog/${post.slug}`
        const imageTag = post.image ? `<enclosure url="${escapeXml(post.image)}" type="image/jpeg" />` : ""

        return `
    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${postUrl}</link>
      <guid isPermaLink="true">${postUrl}</guid>
      <description>${escapeXml(post.excerpt)}</description>
      <pubDate>${pubDate}</pubDate>
      <author>${escapeXml(post.author)}</author>
      ${imageTag}
    </item>`
      })
      .join("")

    const rss = `<?xml version="1.0" encoding="UTF-8" ?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Semzo Privé Magazine - Blog de Lujo Consciente</title>
    <link>${baseUrl}/blog</link>
    <description>Artículos editoriales sobre lujo consciente, bolsos de diseñador y nuevas formas de consumir moda.</description>
    <language>es-ES</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="${baseUrl}/api/rss" rel="self" type="application/rss+xml" />
    ${rssItems}
  </channel>
</rss>`

    return new NextResponse(rss, {
      headers: {
        "Content-Type": "application/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
      },
    })
  } catch (error) {
    console.error("Error generating RSS feed:", error)
    return new NextResponse("Error generating RSS feed", { status: 500 })
  }
}
