"use client"

import Link from "next/link"
import Image from "next/image"
import { ArrowLeft, Calendar, User, Share2, Link2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

import ReactMarkdown from "react-markdown"
import type { BlogPost } from "@/utils/blog"
import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { usePathname } from "next/navigation"

function ShareMenu({ title, slug, imageUrl, excerpt }: { title: string; slug: string; imageUrl?: string; excerpt?: string }) {
  const [open, setOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const url = typeof window !== "undefined"
    ? `${window.location.origin}/blog/${slug}`
    : `https://semzoprive.com/blog/${slug}`

  useEffect(() => {
    setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent))
  }, [])

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url)
    } catch {
      const ta = document.createElement("textarea")
      ta.value = url
      document.body.appendChild(ta)
      ta.select()
      document.execCommand("copy")
      document.body.removeChild(ta)
    }
    setCopied(true)
    setTimeout(() => { setCopied(false); setOpen(false) }, 2000)
  }

  // Instagram Stories (móvil): copia el link y abre Instagram.
  // El usuario pega el link en la pegatina de enlace de la historia.
  const handleInstagramStory = async () => {
    await navigator.clipboard.writeText(url).catch(() => {})
    // Deep link a Instagram en móvil
    window.location.href = "instagram://story-camera"
    setOpen(false)
  }

  // Instagram Feed (móvil): copia link y abre Instagram directamente
  const handleInstagramFeed = async () => {
    await navigator.clipboard.writeText(url).catch(() => {})
    window.location.href = "instagram://"
    setOpen(false)
  }

  // Pinterest: abre el pin creator con imagen y descripción del artículo
  const coverImage = imageUrl || "https://semzoprive.com/images/hero-luxury-bags.jpeg"
  const pinterestUrl = `https://pinterest.com/pin/create/button/?url=${encodeURIComponent(url)}&media=${encodeURIComponent(coverImage)}&description=${encodeURIComponent(title)}`

  // WhatsApp
  const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(`${title}\n\n${excerpt ? excerpt + "\n\n" : ""}${url}`)}`

  const itemClass = "w-full flex items-center gap-3 px-4 py-3 hover:bg-rose-nude text-indigo-dark text-sm transition-colors text-left"

  return (
    <div className="relative" ref={menuRef}>
      <Button
        variant="outline"
        className="border-indigo-dark text-indigo-dark bg-transparent hover:bg-indigo-dark hover:text-white"
        onClick={() => setOpen((v) => !v)}
      >
        <Share2 className="mr-2 h-4 w-4" />
        Compartir
      </Button>

      {open && (
        <div className="absolute right-0 bottom-full mb-2 w-60 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden z-50">

          {/* Instagram — solo en móvil donde existe el deep link */}
          {isMobile && (
            <>
              <button onClick={handleInstagramStory} className={itemClass}>
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                  <defs>
                    <linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f09433"/>
                      <stop offset="25%" stopColor="#e6683c"/>
                      <stop offset="50%" stopColor="#dc2743"/>
                      <stop offset="75%" stopColor="#cc2366"/>
                      <stop offset="100%" stopColor="#bc1888"/>
                    </linearGradient>
                  </defs>
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="url(#ig-grad)"/>
                  <circle cx="12" cy="12" r="4.5" stroke="white" strokeWidth="1.5" fill="none"/>
                  <circle cx="17.5" cy="6.5" r="1" fill="white"/>
                </svg>
                Añadir a Historia de Instagram
              </button>
              <button onClick={handleInstagramFeed} className={itemClass}>
                <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="none">
                  <defs>
                    <linearGradient id="ig-grad2" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#f09433"/>
                      <stop offset="25%" stopColor="#e6683c"/>
                      <stop offset="50%" stopColor="#dc2743"/>
                      <stop offset="75%" stopColor="#cc2366"/>
                      <stop offset="100%" stopColor="#bc1888"/>
                    </linearGradient>
                  </defs>
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5" fill="url(#ig-grad2)"/>
                  <rect x="7" y="7" width="4" height="4" rx="0.5" fill="white"/>
                  <rect x="13" y="7" width="4" height="4" rx="0.5" fill="white"/>
                  <rect x="7" y="13" width="4" height="4" rx="0.5" fill="white"/>
                  <rect x="13" y="13" width="4" height="4" rx="0.5" fill="white"/>
                </svg>
                Compartir en Feed de Instagram
              </button>
              <div className="border-t border-gray-100" />
            </>
          )}

          {/* Pinterest */}
          <a
            href={pinterestUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={itemClass}
            onClick={() => setOpen(false)}
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="#E60023">
              <path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
            </svg>
            Guardar en Pinterest
          </a>

          {/* WhatsApp */}
          <a
            href={whatsappUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={itemClass}
            onClick={() => setOpen(false)}
          >
            <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24" fill="#25D366">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
            </svg>
            Enviar por WhatsApp
          </a>

          {/* Copiar enlace */}
          <button onClick={handleCopy} className={`${itemClass} border-t border-gray-100`}>
            {copied
              ? <Check className="h-4 w-4 shrink-0 text-green-600" />
              : <Link2 className="h-4 w-4 shrink-0" />
            }
            {copied ? "Enlace copiado" : "Copiar enlace"}
          </button>
        </div>
      )}
    </div>
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
          {post.image_url && (
            <Image
              src={post.image_url || "/placeholder.svg"}
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
                  {post.created_at ? new Date(post.created_at).toLocaleDateString("es-ES", {
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  }) : "—"}
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
                <ShareMenu
                  title={post.title}
                  slug={slug}
                  imageUrl={post.image_url}
                  excerpt={post.excerpt}
                />
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
