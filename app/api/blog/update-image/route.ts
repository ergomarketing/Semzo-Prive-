import { type NextRequest, NextResponse } from "next/server"
import { put, list } from "@vercel/blob"

interface BlogPost {
  slug: string
  title: string
  date: string
  author: string
  excerpt: string
  image?: string
  content: string
  updatedAt?: string
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

// POST - Update image of an existing blog post
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { slug, imageUrl } = body

    if (!slug || !imageUrl) {
      return NextResponse.json({ error: "Slug and imageUrl are required" }, { status: 400 })
    }

    console.log("[v0] Updating image for slug:", slug, "to:", imageUrl)

    // Find the existing blog post
    const { blobs } = await list({ prefix: "blog/" })
    const blogBlob = blobs.find((b) => b.pathname === `blog/${slug}.md`)

    if (!blogBlob) {
      return NextResponse.json({ error: "Blog post not found" }, { status: 404 })
    }

    // Fetch the current content
    const response = await fetch(blogBlob.url)
    const currentContent = await response.text()
    const { metadata, content } = parseFrontmatter(currentContent)

    // Update the image in metadata
    metadata.image = imageUrl

    // Reconstruct the frontmatter with updated image
    const newFrontmatter = Object.entries(metadata)
      .map(([key, value]) => `${key}: "${value}"`)
      .join("\n")

    const newContent = `---
${newFrontmatter}
---

${content}`

    // Upload the updated content
    const updatedBlob = await put(`blog/${slug}.md`, newContent, {
      access: "public",
      contentType: "text/markdown",
    })

    console.log("[v0] Successfully updated image for:", slug)

    return NextResponse.json({
      success: true,
      slug,
      url: updatedBlob.url,
      message: "Image updated successfully",
    })
  } catch (error) {
    console.error("[v0] Error updating blog post image:", error)
    return NextResponse.json({ error: "Error updating image" }, { status: 500 })
  }
}
