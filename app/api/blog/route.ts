import { type NextRequest, NextResponse } from "next/server"
import { listPosts, getPost, parseFrontmatter } from "@/lib/blog-storage"

// Cache GET requests for 7 days (posts published 1-2x/week)
export const revalidate = 604800

// GET - List all blog posts or get a single post by slug
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get("slug")

    if (slug) {
      const post = await getPost(slug)
      return NextResponse.json(post, {
        headers: {
          "Cache-Control": "public, s-maxage=604800, stale-while-revalidate=86400",
        },
      })
    }

    const posts = await listPosts()
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

    const { createPost } = await import("@/lib/blog-storage")
    const result = await createPost(slug, content)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      slug,
      url: result.url,
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

    const { deletePost } = await import("@/lib/blog-storage")
    const result = await deletePost(slug)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deleting blog post:", error)
    return NextResponse.json({ error: "Error deleting post" }, { status: 500 })
  }
}
