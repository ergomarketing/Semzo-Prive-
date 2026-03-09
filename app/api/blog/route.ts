import { type NextRequest, NextResponse } from "next/server"
import { listPosts, getPost, createPost, deletePost, listAllPosts } from "@/lib/blog-supabase"

export const dynamic = "force-dynamic"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get("slug")
    const all = searchParams.get("all") === "true"

    if (slug) {
      const post = await getPost(slug)
      if (!post) return NextResponse.json({ error: "Post not found" }, { status: 404 })
      return NextResponse.json(post)
    }

    const posts = all ? await listAllPosts() : await listPosts()
    return NextResponse.json(posts)
  } catch (error) {
    console.error("[v0] Error fetching blog posts:", error)
    return NextResponse.json({ error: "Error fetching posts" }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { title, slug, content, excerpt, image_url, author, published } = body

    if (!title || !slug || !content) {
      return NextResponse.json({ error: "title, slug y content son obligatorios" }, { status: 400 })
    }

    const result = await createPost({
      title,
      slug,
      content,
      excerpt: excerpt || content.substring(0, 150),
      image_url: image_url || "",
      author: author || "Semzo Privé",
      published: published ?? false,
    })

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true, data: result.data })
  } catch (error) {
    console.error("[v0] Error creando post:", error)
    return NextResponse.json({ error: "Error creating post" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { slug, ...updates } = body

    if (!slug) return NextResponse.json({ error: "Slug requerido" }, { status: 400 })

    const { updatePost } = await import("@/lib/blog-supabase")
    const result = await updatePost(slug, updates)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error actualizando post:", error)
    return NextResponse.json({ error: "Error updating post" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const slug = searchParams.get("slug")

    if (!slug) return NextResponse.json({ error: "Slug requerido" }, { status: 400 })

    const result = await deletePost(slug)

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[v0] Error eliminando post:", error)
    return NextResponse.json({ error: "Error deleting post" }, { status: 500 })
  }
}
