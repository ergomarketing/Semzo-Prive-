"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Calendar, User, Share2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import ReactMarkdown from "react-markdown"
import type { BlogPost } from "@/utils/blog"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"

function ShareButton({ title, slug }: { title: string; slug: string }) {
  const [copied, setCopied] = useState(false)

  const handleShare = async () => {
    const url = `${window.location.origin}/blog/${slug}`

    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      console.error("Error copying to clipboard:", error)
      const textArea = document.createElement("textarea")
      textArea.value = url
      document.body.appendChild(textArea)
      textArea.select()
      try {
        document.execCommand("copy")
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error("Fallback copy failed:", err)
      }
      document.body.removeChild(textArea)
    }
  }

  return (
    <Button
      variant="outline"
      className="border-indigo-dark text-indigo-dark bg-transparent hover:bg-indigo-dark hover:text-white"
      onClick={handleShare}
    >
      <Share2 className="mr-2 h-4 w-4" />
      {copied ? "¡Enlace copiado!" : "Compartir"}
    </Button>
  )
}

export default function BlogContent({ post, slug }: { post: BlogPost; slug: string }) {
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [])

  const handleNavigateToMembresias = () => {
    if (pathname === "/") {
      const element = document.getElementById("membresias")
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" })
      }
    } else {
      router.push("/")
      setTimeout(() => {
        const element = document.getElementById("membresias")
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" })
        }
      }, 300)
    }
  }

  return (
    <main className="min-h-screen bg-white">
        {/* Hero Image */}
        <div className="relative w-full aspect-[16/9] md:aspect-[21/9] bg-indigo-dark">
          {post.image && (
            <Image
              src={post.image || "/placeholder.svg"}
              alt={post.title}
              fill
              sizes="100vw"
              className="object-cover object-center"
              priority
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-indigo-dark/90 via-indigo-dark/40 to-transparent" />
          <div className="absolute inset-0 flex items-end">
            <div className="container mx-auto max-w-4xl p-8">
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
                <ShareButton title={post.title} slug={slug} />
              </div>
            </div>

            {/* CTA */}
            <div className="mt-12 p-8 bg-rose-nude rounded-2xl text-center">
              <h3 className="text-2xl font-serif text-indigo-dark mb-4">Experimenta el Lujo con Semzo Privé</h3>
              <p className="text-indigo-dark/70 mb-6">
                Accede a los bolsos más exclusivos del mundo con nuestra membresía.
              </p>
              <Button
                className="bg-indigo-dark hover:bg-indigo-dark/90 text-white"
                onClick={handleNavigateToMembresias}
              >
                Explorar Membresías
              </Button>
            </div>
          </div>
        </article>
      </main>
  )
}
