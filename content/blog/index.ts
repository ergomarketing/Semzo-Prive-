// Blog posts index - When USE_BLOB=false, posts are loaded from here
// Currently empty - waiting for Blob storage to be restored with original articles
export const blogPosts: Record<string, string> = {
  // Your original blog posts will be restored when Blob storage is reactivated
  // Set USE_BLOB=true in environment variables to load from Blob
}

export function getAllBlogSlugs() {
  return Object.keys(blogPosts)
}

export function getBlogPostContent(slug: string): string | null {
  return blogPosts[slug as keyof typeof blogPosts] || null
}
