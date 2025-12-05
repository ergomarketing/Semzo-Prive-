import Link from "next/link"
import Image from "next/image"
import { Calendar, User, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { defaultPosts, type BlogPost } from "@/utils/blog"
import Navbar from "@/app/components/navbar"
import Footer from "@/app/components/footer"

async function getPosts(): Promise<BlogPost[]> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

    const response = await fetch(`${baseUrl}/api/blog`, {
      next: { revalidate: 60 },
    })

    if (!response.ok) return defaultPosts

    const posts = await response.json()
    return posts.length > 0 ? posts : defaultPosts
  } catch {
    return defaultPosts
  }
}

export default async function BlogPage() {
  const posts = await getPosts()
  const featuredPost = posts[0]
  const otherPosts = posts.slice(1)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        {/* Hero Section */}
        <section className="bg-gradient-to-b from-rose-nude to-white py-20">
          <div className="container mx-auto px-4">
            <div className="text-center max-w-3xl mx-auto">
              <Badge className="bg-rose-pastel/30 text-indigo-dark border-0 mb-4">Semzo Magazine</Badge>
              <h1 className="text-4xl md:text-5xl font-serif text-indigo-dark mb-4">Historias del Mundo del Lujo</h1>
              <p className="text-lg text-indigo-dark/70">
                Descubre las últimas tendencias, consejos de estilo y las historias detrás de los bolsos más icónicos
                del mundo.
              </p>
            </div>
          </div>
        </section>

        {/* Featured Post */}
        {featuredPost && (
          <section className="py-16 container mx-auto px-4">
            <Link href={`/blog/${featuredPost.slug}`}>
              <Card className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-shadow bg-rose-nude/30">
                <div className="grid md:grid-cols-2 gap-0">
                  <div className="relative h-64 md:h-auto">
                    <Image
                      src={featuredPost.image || "/placeholder.svg?height=400&width=600&query=luxury handbag fashion"}
                      alt={featuredPost.title}
                      fill
                      className="object-cover"
                    />
                    <Badge className="absolute top-4 left-4 bg-indigo-dark text-white">Destacado</Badge>
                  </div>
                  <CardContent className="p-8 flex flex-col justify-center">
                    <div className="flex items-center gap-4 text-sm text-indigo-dark/60 mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(featuredPost.date).toLocaleDateString("es-ES", {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        })}
                      </span>
                      <span className="flex items-center gap-1">
                        <User className="h-4 w-4" />
                        {featuredPost.author}
                      </span>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-serif text-indigo-dark mb-4">{featuredPost.title}</h2>
                    <p className="text-indigo-dark/70 mb-6">{featuredPost.excerpt}</p>
                    <div className="flex items-center text-indigo-dark font-medium">
                      Leer artículo
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </div>
                  </CardContent>
                </div>
              </Card>
            </Link>
          </section>
        )}

        {/* Other Posts */}
        {otherPosts.length > 0 && (
          <section className="py-16 bg-gray-50">
            <div className="container mx-auto px-4">
              <h2 className="text-2xl font-serif text-indigo-dark mb-8">Más Artículos</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {otherPosts.map((post) => (
                  <Link key={post.slug} href={`/blog/${post.slug}`}>
                    <Card className="overflow-hidden border-0 shadow hover:shadow-lg transition-shadow h-full">
                      <div className="relative h-48">
                        <Image
                          src={post.image || "/placeholder.svg?height=300&width=400&query=luxury fashion"}
                          alt={post.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                      <CardContent className="p-6">
                        <div className="flex items-center gap-2 text-xs text-indigo-dark/60 mb-3">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.date).toLocaleDateString("es-ES", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <h3 className="font-serif text-lg text-indigo-dark mb-2 line-clamp-2">{post.title}</h3>
                        <p className="text-sm text-indigo-dark/70 line-clamp-3">{post.excerpt}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </>
  )
}
