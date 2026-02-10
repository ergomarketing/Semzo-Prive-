import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import { Calendar, User } from "lucide-react"
import { Badge } from "@/components/ui/badge"

import { BlogScrollContainer } from "./blog-scroll-container"

// ISR: Revalidate every 7 days (604800 seconds) - posts published 1-2x/week
export const revalidate = 604800

interface BlogPost {
  slug: string
  title: string
  date: string
  author: string
  excerpt: string
  image?: string
  content: string
}

async function getPosts(): Promise<BlogPost[]> {
  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/blog`, {
      next: { revalidate: 604800 }, // Cache for 7 days (1-2 posts/week)
    })

    if (!response.ok) {
      return []
    }

    const posts = await response.json()
    return posts
  } catch {
    return []
  }
}

export const metadata: Metadata = {
  title: "SEMZO Magazine | Lujo consciente, moda y estilo",
  description: "Artículos editoriales sobre lujo consciente, bolsos de diseñador y nuevas formas de consumir moda.",
  alternates: {
    canonical: "https://semzoprive.com/blog",
  },
  openGraph: {
    type: "website",
    locale: "es_ES",
    title: "SEMZO Magazine | Lujo consciente, moda y estilo",
    description: "Artículos editoriales sobre lujo consciente, bolsos de diseñador y nuevas formas de consumir moda.",
    url: "https://semzoprive.com/blog",
    siteName: "Semzo Privé",
    images: [
      {
        url: "https://semzoprive.com/images/fendi-beige-hero.jpeg",
        width: 1200,
        height: 630,
        alt: "SEMZO Magazine - Blog de lujo consciente",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SEMZO Magazine | Lujo consciente, moda y estilo",
    description: "Artículos editoriales sobre lujo consciente, bolsos de diseñador y nuevas formas de consumir moda.",
    images: ["https://semzoprive.com/images/fendi-beige-hero.jpeg"],
  },
}

export default async function BlogPage() {
  const posts = await getPosts()

  return (
    <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden">
          <Image
            src="/images/fendi-beige-hero.jpeg"
            alt="Fendi luxury handbag lifestyle"
            fill
            className="object-cover object-center"
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-black/40" />

          <div className="relative z-10 text-center max-w-3xl mx-auto px-4">
            <Badge className="bg-white/90 backdrop-blur-sm text-indigo-dark border-0 mb-6">Semzo Magazine</Badge>
            <h1 className="text-4xl md:text-6xl font-serif text-white mb-6">Historias del Mundo del Lujo</h1>
            <p className="text-lg md:text-xl text-white/90">
              Descubre las últimas tendencias, consejos de estilo y las historias detrás de los bolsos más icónicos del
              mundo.
            </p>
          </div>
        </section>

        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <p className="text-lg text-indigo-dark/70 mb-8">Todas las tendencias del momento</p>

            {posts.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500 text-lg">Los artículos están temporalmente inaccesibles.</p>
                <p className="text-sm text-gray-400 mt-2">
                  Estamos trabajando para restaurar el acceso. Tus artículos originales están seguros y volverán pronto.
                </p>
              </div>
            ) : (
              <BlogScrollContainer>
                {posts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="flex-shrink-0 w-[85vw] md:w-[45vw] lg:w-[30vw] group"
                  >
                    <div className="flex flex-col rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 bg-white">
                      {/* Image container with aspect-ratio */}
                      <div className="relative aspect-[3/4] w-full overflow-hidden">
                        <Image
                          src={post.image || "/placeholder.svg?height=800&width=600"}
                          alt={post.title}
                          fill
                          sizes="(max-width: 768px) 85vw, (max-width: 1024px) 45vw, 30vw"
                          className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                        />
                      </div>

                      {/* Text content below image */}
                      <div className="p-6 bg-white">
                        <h3 className="font-serif text-xl text-indigo-dark mb-3 line-clamp-2 group-hover:text-rose-dark transition-colors">
                          {post.title}
                        </h3>
                        <p className="text-sm text-indigo-dark/70 line-clamp-2 mb-4">{post.excerpt}</p>

                        <div className="flex items-center gap-3 text-xs text-indigo-dark/50">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(post.date).toLocaleDateString("es-ES", {
                              day: "numeric",
                              month: "short",
                            })}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {post.author}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </BlogScrollContainer>
            )}
          </div>
        </section>
      </main>
  )
}
