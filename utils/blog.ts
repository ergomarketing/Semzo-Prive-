export interface BlogPost {
  slug: string
  title: string
  date: string
  author: string
  excerpt: string
  image?: string
  content: string
}

// Default posts when no posts exist in blob storage
export const defaultPosts: BlogPost[] = []

export async function getBlogPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/blog`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      console.error("[v0] Failed to fetch blog posts from API")
      return []
    }

    const posts = await response.json()
    console.log("[v0] Fetched posts from Vercel Blob:", posts.length)
    return posts
  } catch (error) {
    console.error("[v0] Error fetching blog posts:", error)
    return []
  }
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || ""}/api/blog?slug=${slug}`, {
      next: { revalidate: 3600 }, // Cache for 1 hour
    })

    if (!response.ok) {
      console.error("[v0] Failed to fetch blog post:", slug)
      return null
    }

    const post = await response.json()
    console.log("[v0] Fetched post from Vercel Blob:", post?.title || "not found")
    return post
  } catch (error) {
    console.error("[v0] Error fetching blog post:", error)
    return null
  }
}
