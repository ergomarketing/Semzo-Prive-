import { put, del, list } from "@vercel/blob"
import { promises as fs } from "fs"
import path from "path"

// Feature flag: Set to 'true' to use Blob, 'false' to use filesystem
const USE_BLOB = process.env.USE_BLOB === "true"
const CONTENT_DIR = path.join(process.cwd(), "content", "blog")

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
export function parseFrontmatter(content: string): { metadata: Record<string, string>; content: string } {
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

// List all blog posts
export async function listPosts(): Promise<BlogPost[]> {
  const posts: BlogPost[] = []

  if (USE_BLOB) {
    // Use Blob Storage
    const { blobs } = await list({ prefix: "blog/" })

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
        } catch {
          continue
        }
      }
    }
  } else {
    // Use Filesystem
    try {
      const files = await fs.readdir(CONTENT_DIR)
      
      for (const file of files) {
        if (file.endsWith(".md")) {
          try {
            const filePath = path.join(CONTENT_DIR, file)
            const content = await fs.readFile(filePath, "utf-8")
            const { metadata, content: markdownContent } = parseFrontmatter(content)

            const postSlug = metadata.slug || file.replace(".md", "")

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
          } catch {
            continue
          }
        }
      }
    } catch (error) {
      console.error("[v0] Error reading blog directory:", error)
    }
  }

  // Sort by date descending
  posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())

  return posts
}

// Get a single post by slug
export async function getPost(slug: string): Promise<BlogPost | null> {
  const posts = await listPosts()
  return posts.find((post) => post.slug === slug) || null
}

// Create a new blog post
export async function createPost(slug: string, content: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (USE_BLOB) {
      // Use Blob Storage
      const blob = await put(`blog/${slug}.md`, content, {
        access: "public",
        contentType: "text/markdown",
      })
      return { success: true, url: blob.url }
    } else {
      // Use Filesystem
      await fs.mkdir(CONTENT_DIR, { recursive: true })
      const filePath = path.join(CONTENT_DIR, `${slug}.md`)
      await fs.writeFile(filePath, content, "utf-8")
      return { success: true }
    }
  } catch (error) {
    console.error("[v0] Error creating post:", error)
    return { success: false, error: "Error creating post" }
  }
}

// Update an existing blog post
export async function updatePost(slug: string, content: string): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    if (USE_BLOB) {
      // Delete old version
      const { blobs } = await list({ prefix: `blog/${slug}` })
      for (const blob of blobs) {
        await del(blob.url)
      }

      // Upload new version
      const blob = await put(`blog/${slug}.md`, content, {
        access: "public",
        contentType: "text/markdown",
      })
      return { success: true, url: blob.url }
    } else {
      // Use Filesystem
      const filePath = path.join(CONTENT_DIR, `${slug}.md`)
      await fs.writeFile(filePath, content, "utf-8")
      return { success: true }
    }
  } catch (error) {
    console.error("[v0] Error updating post:", error)
    return { success: false, error: "Error updating post" }
  }
}

// Delete a blog post
export async function deletePost(slug: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (USE_BLOB) {
      // Use Blob Storage
      const { blobs } = await list({ prefix: `blog/${slug}` })
      for (const blob of blobs) {
        await del(blob.url)
      }
      return { success: true }
    } else {
      // Use Filesystem
      const filePath = path.join(CONTENT_DIR, `${slug}.md`)
      await fs.unlink(filePath)
      return { success: true }
    }
  } catch (error) {
    console.error("[v0] Error deleting post:", error)
    return { success: false, error: "Error deleting post" }
  }
}
