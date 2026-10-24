import Link from "next/link"
import Image from "next/image"
import { Calendar, User } from "lucide-react"

import { BlogScrollContainer } from "./blog-scroll-container"
import { BlogHero, BlogSectionIntro, BlogEmptyState } from "./blog-texts"
import { listPosts } from "@/lib/blog-supabase"
import { publicBlogSlug } from "@/lib/blog-slug-map"
import { BLOG_CATEGORIES, getBlogCategory } from "@/lib/blog-categories"

/**
 * Portada del blog (todas las secciones) o de una sola seccion.
 * Las pestañas son enlaces reales a /blog y /blog/seccion/<slug>: cada seccion
 * es una URL propia indexable.
 */
export async function BlogIndex({ categorySlug }: { categorySlug?: string }) {
  const all = await listPosts()
  const current = getBlogCategory(categorySlug)
  const posts = current ? all.filter((p) => p.category === current.slug) : all

  const tab = (active: boolean) =>
    `whitespace-nowrap rounded-full px-5 py-2 text-sm transition-colors border ${
      active
        ? "bg-indigo-dark text-white border-indigo-dark"
        : "bg-white text-indigo-dark/80 border-gray-200 hover:border-indigo-dark/40"
    }`

  return (
    <main className="min-h-screen bg-white">
      <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden">
        <Image
          src="/images/fendi-beige-hero.jpeg"
          alt="Fendi luxury handbag lifestyle"
          fill
          className="object-cover object-center"
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/40" />
        <BlogHero />
      </section>

      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <nav aria-label="Secciones del blog" className="-mx-4 px-4 mb-8 overflow-x-auto scrollbar-hide">
            <ul className="flex gap-2 md:gap-3 md:flex-wrap">
              <li>
                <Link href="/blog" className={tab(!current)} aria-current={!current ? "page" : undefined}>
                  Todo
                </Link>
              </li>
              {BLOG_CATEGORIES.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/blog/seccion/${c.slug}`}
                    className={tab(current?.slug === c.slug)}
                    aria-current={current?.slug === c.slug ? "page" : undefined}
                  >
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {current ? (
            <div className="mb-8">
              <h2 className="font-serif text-3xl text-indigo-dark mb-2">{current.label}</h2>
              <p className="text-lg text-indigo-dark/70">{current.description}</p>
            </div>
          ) : (
            <BlogSectionIntro />
          )}

          {posts.length === 0 ? (
            <BlogEmptyState />
          ) : (
            <BlogScrollContainer>
              {posts.map((post) => {
                const cat = getBlogCategory(post.category)
                return (
                  <Link
                    key={post.slug}
                    href={`/blog/${publicBlogSlug(post.slug)}`}
                    className="flex-shrink-0 w-[85vw] md:w-[45vw] lg:w-[30vw] group"
                  >
                    <div className="flex flex-col rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 bg-white">
                      <div className="relative aspect-[3/4] w-full overflow-hidden">
                        <Image
                          src={post.image_url || "/placeholder.svg?height=800&width=600"}
                          alt={post.title}
                          fill
                          sizes="(max-width: 768px) 85vw, (max-width: 1024px) 45vw, 30vw"
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      <div className="p-6 bg-white">
                        {cat && (
                          <p className="text-xs uppercase tracking-[0.15em] text-[#7a5f33] mb-2">{cat.label}</p>
                        )}
                        <h3 className="font-serif text-xl text-indigo-dark mb-3 line-clamp-2 group-hover:text-rose-dark transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-sm text-indigo-dark/70 line-clamp-2 mb-4">{post.excerpt}</p>

                        <div className="flex items-center gap-3 text-xs text-indigo-dark/75">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {post.created_at
                              ? new Date(post.created_at).toLocaleDateString("es-ES", {
                                  day: "numeric",
                                  month: "short",
                                })
                              : "—"}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {post.author}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                )
              })}
            </BlogScrollContainer>
          )}
        </div>
      </section>
    </main>
  )
}
