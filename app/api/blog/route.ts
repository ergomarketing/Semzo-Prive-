import { type NextRequest, NextResponse } from "next/server"
import { put, del, list } from "@vercel/blob"

// Cache GET requests for 7 days (posts published 1-2x/week)
export const revalidate = 604800

interface BlogPost {
  slug: string
  title: string
  date: string
  author: string
  excerpt: string
  image?: string
  content: string
  updatedAt?: string // Agregado campo updatedAt
}

// Parse frontmatter from markdown content
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

// GET - List all blog posts or get a single post by slug
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get("slug")

    const { blobs } = await list({ prefix: "blog/" })
    const posts: BlogPost[] = []

    for (const blob of blobs) {
      if (blob.pathname.endsWith(".md")) {
        try {
          const response = await fetch(blob.url, {
            next: { revalidate: 604800 }, // Cache blob content for 7 days
          }).catch(() => null)
          if (!response || !response.ok) {
            continue
          }
          const content = await response.text()
          const { metadata, content: markdownContent } = parseFrontmatter(content)

          const postSlug = metadata.slug || blob.pathname.replace("blog/", "").replace(".md", "")

          if (slug && postSlug !== slug) continue

          posts.push({
            slug: postSlug,
            title: metadata.title || "Sin título",
            date: metadata.date || new Date().toISOString().split("T")[0],
            author: metadata.author || "Semzo Privé",
            excerpt: metadata.excerpt || markdownContent.substring(0, 150) + "...",
            image: metadata.image,
            content: markdownContent,
            updatedAt: metadata.updatedAt,
          })

          if (slug && postSlug === slug) break
        } catch {
          continue
        }
      }
    }

    // Sort by date descending
    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

    if (slug) {
      const post = posts[0] || null
      return NextResponse.json(post, {
        headers: {
          "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
        },
      })
    }

    return NextResponse.json(posts, {
      headers: {
        "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
      },
    })
  } catch (error) {
    console.error("[v0] Error fetching blog posts:", error)
    return NextResponse.json({ error: "Error fetching posts" }, { status: 500 })
  }
}

// POST - Create a new blog post
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get("file") as File | null
    const directContent = formData.get("content") as string | null
    const directTitle = formData.get("title") as string | null
    const directSlug = formData.get("slug") as string | null
    const directExcerpt = formData.get("excerpt") as string | null
    const directAuthor = formData.get("author") as string | null
    const directImage = formData.get("image") as string | null

    let content: string
    let slug: string

    if (file) {
      // Handle file upload
      content = await file.text()
      const { metadata } = parseFrontmatter(content)
      slug = metadata.slug || file.name.replace(".md", "").toLowerCase().replace(/\s+/g, "-")
    } else if (directContent && directTitle && directSlug) {
      const frontmatter = `---
title: "${directTitle}"
date: "${new Date().toISOString().split("T")[0]}"
author: "${directAuthor || "Semzo Privé"}"
excerpt: "${directExcerpt || directContent.substring(0, 150)}"
slug: "${directSlug}"
${directImage ? `image: "${directImage}"` : ""}
---

${directContent}`
      content = frontmatter
      slug = directSlug
    } else {
      return NextResponse.json({ error: "Missing file or content" }, { status: 400 })
    }

    // Upload to Vercel Blob
    const blob = await put(`blog/${slug}.md`, content, {
      access: "public",
      contentType: "text/markdown",
    })

    return NextResponse.json({
      success: true,
      slug,
      url: blob.url,
    })
  } catch (error) {
    console.error("Error creating blog post:", error)
    return NextResponse.json({ error: "Error creating post" }, { status: 500 })
  }
}

// DELETE - Delete a blog post
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get("slug")

    if (!slug) {
      return NextResponse.json({ error: "Slug required" }, { status: 400 })
    }

    const { blobs } = await list({ prefix: `blog/${slug}` })

    for (const blob of blobs) {
      await del(blob.url)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting blog post:", error)
    return NextResponse.json({ error: "Error deleting post" }, { status: 500 })
  }
}
