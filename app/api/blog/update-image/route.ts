import { type NextRequest, NextResponse } from "next/server"
import { getPost, updatePost } from "@/lib/blog-storage"

// POST - Update image of an existing blog post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { slug, imageUrl } = body

    if (!slug || !imageUrl) {
      return NextResponse.json({ error: "Slug and imageUrl are required" }, { status: 400 })
    }

    console.log("[v0] Updating image for slug:", slug, "to:", imageUrl)

    const post = await getPost(slug)

    if (!post) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
    }

    // Create updated content with new image
    const newContent = `---
title: "${post.title}"
date: "${post.date}"
author: "${post.author}"
excerpt: "${post.excerpt}"
slug: "${slug}"
image: "${imageUrl}"
${post.updatedAt ? `updatedAt: "${post.updatedAt}"` : ""}
---

${post.content}`

    const result = await updatePost(slug, newContent)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    console.log("[v0] Successfully updated image for:", slug)

    return NextResponse.json({
      success: true,
      slug,
      url: result.url,
      message: "Image updated successfully",
    })
  } catch (error) {
    console.error("[v0] Error updating blog post image:", error)
    return NextResponse.json({ error: "Error updating image" }, { status: 500 })
  }
}
