import { type NextRequest, NextResponse } from "next/server"
import { getPost, updatePost, parseFrontmatter } from "@/lib/blog-storage"

// POST - Update the date of a blog post
export async function POST(request: NextRequest) {
  try {
    const { slug, date } = await request.json()

    console.log("[v0] Update date request - slug:", slug, "date:", date)

    if (!slug || !date) {
      return NextResponse.json({ error: "Missing slug or date" }, { status: 400 })
    }

    const post = await getPost(slug)

    if (!post) {
      console.error("[v0] Post not found:", slug)
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    console.log("[v0] Found post:", slug)

    // Create updated content with new date
    const newContent = `---
title: "${post.title}"
date: "${date}"
author: "${post.author}"
excerpt: "${post.excerpt}"
slug: "${slug}"
${post.image ? `image: "${post.image}"` : ""}
${post.updatedAt ? `updatedAt: "${post.updatedAt}"` : ""}
---

${post.content}`

    console.log("[v0] Updating post with new date")

    const result = await updatePost(slug, newContent)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    console.log("[v0] Date updated successfully")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating date:", error)
    return NextResponse.json({ error: "Error al actualizar la fecha" }, { status: 500 })
  }
}
