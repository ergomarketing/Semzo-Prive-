"use client"
import { useEffect, useState, useRef } from "react"
import Link from "next/link"
import Image from "next/image"
import { Calendar, User, ChevronLeft, ChevronRight } from "lucide-react"

interface BlogPost {
  slug: string
  title: string
  date: string
  author: string
  excerpt: string
  image?: string
  content: string
}

export default function MagazineSection() {
  const [posts, setPosts] = useState<BlogPost[]>([])
  const [loading, setLoading] = useState(true)
  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

  useEffect(() => {
    async function fetchPosts() {
      try {
        const response = await fetch("/api/blog", {
          next: { revalidate: 604800 }, // Cache for 7 days (1-2 posts/week)
        })

        if (!response.ok) {
          setPosts([])
          return
        }

        const data = await response.json()
        setPosts(data)
      } catch {
        setPosts([])
      } finally {
        setLoading(false)
      }
    }

    fetchPosts()
  }, [])

  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current
      setCanScrollLeft(scrollLeft > 0)
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
    }
  }

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 400
      scrollContainerRef.current.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      })
    }
  }

  useEffect(() => {
    const container = scrollContainerRef.current
    if (container) {
      container.addEventListener("scroll", checkScrollability)
      checkScrollability()
      return () => container.removeEventListener("scroll", checkScrollability)
    }
  }, [posts])

  if (loading) {
    return (
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <p className="text-xs uppercase tracking-widest mb-4 font-medium text-indigo-dark">Semzo Magazine</p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-slate-900 mb-6">
              Historias del Mundo del Lujo
            </h2>
          </div>
          <div className="text-center py-12">
            <p className="text-gray-500">Cargando artículos...</p>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-16 bg-gray-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-xs uppercase tracking-widest mb-4 font-medium text-indigo-dark">Semzo Magazine</p>
          <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-slate-900 mb-6">
            Historias del Mundo del Lujo
          </h2>
          <p className="text-slate-600 text-base md:text-lg leading-relaxed font-light max-w-3xl mx-auto mb-8">
            Descubre las últimas tendencias, consejos de estilo y las historias detrás de los bolsos más icónicos del
            mundo.
          </p>
        </div>

        {posts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500">No hay artículos publicados aún.</p>
            <p className="text-sm text-gray-400 mt-2">Publica tu primer artículo desde el panel de administración.</p>
          </div>
        ) : (
          <div className="relative group">
            {/* Left Arrow */}
            {canScrollLeft && (
              <button
                onClick={() => scroll("left")}
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                aria-label="Scroll left"
              >
                <ChevronLeft className="h-6 w-6 text-indigo-dark" />
              </button>
            )}

            {/* Right Arrow */}
            {canScrollRight && (
              <button
                onClick={() => scroll("right")}
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 bg-white/90 hover:bg-white rounded-full p-3 shadow-lg transition-all opacity-0 group-hover:opacity-100"
                aria-label="Scroll right"
              >
                <ChevronRight className="h-6 w-6 text-indigo-dark" />
              </button>
            )}

            <div ref={scrollContainerRef} className="overflow-x-auto -mx-4 px-4 scroll-smooth scrollbar-hide">
              <div className="flex gap-4 md:gap-6 pb-4">
                {posts.map((post) => (
                  <Link
                    key={post.slug}
                    href={`/blog/${post.slug}`}
                    className="flex-shrink-0 w-[85vw] md:w-[45vw] lg:w-[30vw] group/card"
                  >
                    <div className="flex flex-col rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 bg-white">
                      <div className="relative aspect-[3/4] w-full overflow-hidden">
                        <Image
                          src={post.image || "/placeholder.svg?height=800&width=600"}
                          alt={post.title}
                          fill
                          sizes="(max-width: 768px) 85vw, (max-width: 1024px) 45vw, 30vw"
                          className="object-cover w-full h-full group-hover/card:scale-105 transition-transform duration-500"
                        />
                      </div>

                      {/* Text content below image */}
                      <div className="p-6 bg-white">
                        <h3 className="font-serif text-xl text-indigo-dark mb-3 line-clamp-2 group-hover/card:text-rose-dark transition-colors">
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
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
