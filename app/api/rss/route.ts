import { NextResponse } from "next/server"
import { list } from "@vercel/blob"

// Cache RSS feed for 6 hours to reduce Vercel Blob API calls
export const revalidate = 21600

interface BlogPost {
  slug: string
  title: string
  date: string
  author: string
  excerpt: string
  image?: string
  content: string
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

          const postSlug = metadata.slug || blob.pathname.replace("blog/", "").replace(".md", "")

          posts.push({
            slug: postSlug,
            title: metadata.title || "Sin título",
            date: metadata.date || new Date().toISOString().split("T")[0],
            author: metadata.author || "Semzo Privé",
            excerpt: metadata.excerpt || markdownContent.substring(0, 150) + "...",
            image: metadata.image,
            content: markdownContent,
          })
        } catch (error) {
          console.error("Error processing RSS blog post:", blob.pathname, error)
          continue
        }
      }
    }

    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

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
