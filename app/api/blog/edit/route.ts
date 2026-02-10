import { type NextRequest, NextResponse } from "next/server"
import { put, del, list } from "@vercel/blob"

// PUT/POST - Edit an existing blog post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { slug, title, date, author, excerpt, image, content } = body

    if (!slug || !title || !content) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Create updated frontmatter
    const frontmatter = `---
title: "${title}"
date: "${date}"
author: "${author || "Semzo Privé"}"
excerpt: "${excerpt || content.substring(0, 150)}"
slug: "${slug}"
${image ? `image: "${image}"` : ""}
updatedAt: "${new Date().toISOString().split("T")[0]}"
---

${content}`

    // Delete old version
    const { blobs } = await list({ prefix: `blog/${slug}` })
    for (const blob of blobs) {
      await del(blob.url)
    }

    // Upload new version
    const blob = await put(`blog/${slug}.md`, frontmatter, {
      access: "public",
      contentType: "text/markdown",
    })

    return NextResponse.json({
      success: true,
      slug,
      url: blob.url,
    })
  } catch (error) {
    console.error("Error editing blog post:", error)
    return NextResponse.json({ error: "Error editing post" }, { status: 500 })
  }
}
