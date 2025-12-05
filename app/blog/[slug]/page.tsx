import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Calendar, User, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { defaultPosts, type BlogPost } from "@/utils/blog"
import Navbar from "@/app/components/navbar"
import Footer from "@/app/components/footer"
import ReactMarkdown from "react-markdown"

async function getPost(slug: string): Promise<BlogPost | null> {
  try {
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"

    const response = await fetch(`${baseUrl}/api/blog?slug=${slug}`, {
      next: { revalidate: 60 },
    })

    if (!response.ok) {
      return defaultPosts.find((p) => p.slug === slug) || null
    }

    const post = await response.json()
    return post || defaultPosts.find((p) => p.slug === slug) || null
  } catch {
    return defaultPosts.find((p) => p.slug === slug) || null
  }
}

export default async function BlogPostPage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const post = await getPost(slug)

  if (!post) {
    notFound()
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white">
        {/* Hero Image */}
        <div className="relative h-[40vh] md:h-[50vh] bg-indigo-dark">
          {post.image && (
            <Image
              src={post.image || "/placeholder.svg"}
              alt={post.title}
              fill
              className="object-cover opacity-60"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-dark/80 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8">
            <div className="container mx-auto max-w-4xl">
              <Link href="/blog">
                <Button variant="ghost" className="text-white hover:bg-white/20 mb-4">
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver al blog
                </Button>
              </Link>
              <Badge className="bg-rose-pastel text-indigo-dark mb-4">Semzo Magazine</Badge>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif text-white mb-4">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-4 text-white/80">
                <span className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  {new Date(post.date).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <span className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  {post.author}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <article className="py-12">
          <div className="container mx-auto max-w-3xl px-4">
            <div className="prose prose-lg max-w-none prose-headings:font-serif prose-headings:text-indigo-dark prose-p:text-indigo-dark/80 prose-strong:text-indigo-dark prose-a:text-rose-pastel hover:prose-a:text-indigo-dark prose-li:text-indigo-dark/80">
              <ReactMarkdown>{post.content}</ReactMarkdown>
            </div>

            {/* Share */}
            <div className="mt-12 pt-8 border-t border-gray-200">
              <div className="flex items-center justify-between">
                <p className="text-indigo-dark/60">¿Te gustó este artículo?</p>
                <Button variant="outline" className="border-indigo-dark text-indigo-dark bg-transparent">
                  <Share2 className="mr-2 h-4 w-4" />
                  Compartir
                </Button>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-12 p-8 bg-rose-nude rounded-2xl text-center">
              <h3 className="text-2xl font-serif text-indigo-dark mb-4">Experimenta el Lujo con Semzo Privé</h3>
              <p className="text-indigo-dark/70 mb-6">
                Accede a los bolsos más exclusivos del mundo con nuestra membresía.
              </p>
              <Link href="/membership-signup">
                <Button className="bg-indigo-dark hover:bg-indigo-dark/90 text-white">Explorar Membresías</Button>
              </Link>
            </div>
          </div>
        </article>
      </main>
      <Footer />
    </>
  )
}
