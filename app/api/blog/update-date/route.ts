import { type NextRequest, NextResponse } from "next/server"
import { put, list, del } from "@vercel/blob"

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

// POST - Update the date of a blog post
export async function POST(request: NextRequest) {
  try {
    const { slug, date } = await request.json()

    console.log("[v0] Update date request - slug:", slug, "date:", date)

    if (!slug || !date) {
      return NextResponse.json({ error: "Missing slug or date" }, { status: 400 })
    }

    const { blobs } = await list({ prefix: "blog/" })
    const blob = blobs.find((b) => b.pathname === `blog/${slug}.md`)

    if (!blob) {
      console.error("[v0] Post not found:", slug)
      return NextResponse.json({ error: "Post not found" }, { status: 404 })
    }

    console.log("[v0] Found blob:", blob.pathname)

    // Get the current content
    const response = await fetch(blob.url)
    const content = await response.text()
    const { metadata, content: markdownContent } = parseFrontmatter(content)

    console.log("[v0] Current metadata:", metadata)

    metadata.date = date

    // Rebuild the frontmatter
    const frontmatterLines = Object.entries(metadata).map(([key, value]) => `${key}: "${value}"`)
    const newContent = `---
${frontmatterLines.join("\n")}
---

${markdownContent}`

    console.log("[v0] Updating blob with new date")

    await del(blob.url)
    await put(`blog/${slug}.md`, newContent, {
      access: "public",
      contentType: "text/markdown",
    })

    console.log("[v0] Date updated successfully")

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error updating date:", error)
    return NextResponse.json({ error: "Error al actualizar la fecha" }, { status: 500 })
  }
}
