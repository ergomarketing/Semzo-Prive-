import { createClient } from "@/utils/supabase/server"

export interface BlogPost {
  id?: string
  slug: string
  title: string
  content: string
  excerpt: string
  image_url?: string
  author: string
  published: boolean
  created_at?: string
  updated_at?: string
}

export async function listPosts(): Promise<BlogPost[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("published", true)
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error listando posts:", error.message)
    return []
  }
  return data || []
}

export async function listAllPosts(): Promise<BlogPost[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) {
    console.error("[v0] Error listando todos los posts:", error.message)
    return []
  }
  return data || []
}

export async function getPost(slug: string): Promise<BlogPost | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*")
    .eq("slug", slug)
    .single()

  if (error) {
    console.error("[v0] Error obteniendo post:", error.message)
    return null
  }
  return data
}

export async function createPost(post: Omit<BlogPost, "id" | "created_at" | "updated_at">): Promise<{ success: boolean; data?: BlogPost; error?: string }> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from("blog_posts")
    .insert([{ ...post, updated_at: new Date().toISOString() }])
    .select()
    .single()

  if (error) {
    console.error("[v0] Error creando post:", error.message)
    return { success: false, error: error.message }
  }
  return { success: true, data }
}

export async function updatePost(slug: string, updates: Partial<BlogPost>): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("blog_posts")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("slug", slug)

  if (error) {
    console.error("[v0] Error actualizando post:", error.message)
    return { success: false, error: error.message }
  }
  return { success: true }
}

export async function deletePost(slug: string): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient()
  const { error } = await supabase
    .from("blog_posts")
    .delete()
    .eq("slug", slug)

  if (error) {
    console.error("[v0] Error eliminando post:", error.message)
    return { success: false, error: error.message }
  }
  return { success: true }
}
