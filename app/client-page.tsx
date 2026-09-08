"use client"

// Marker para invalidar cache SSR tras cambios en cta-section: 2026-05-11T14:45
import { useEffect } from "react"
import { useRouter } from "next/navigation"
import HeroSection from "./components/hero-section"
import CollectionSection from "./components/collection-section"
import MembershipSection from "./components/membership-section"
import TwoModesSection from "./components/two-modes-section"
import HowItWorks from "./components/how-it-works"
import TestimonialSection from "./components/testimonial-section"
import MagazineSection from "./components/magazine-section"
import CTASection from "./components/cta-section"
import SEOBlock from "./components/seo-block"
import MarqueeBanner from "./components/marquee-banner"

export default function ClientHomePage() {
  const router = useRouter()

  // PERF: NO usar useSearchParams() aqui. Sin un <Suspense> por encima, ese hook
  // fuerza a Next.js a renderizar TODA la home en el cliente (CSR bailout): el
  // HTML llega vacio y el JS reconstruye la pagina entera -> CLS y TBT altos.
  // Leemos los query params desde window en un efecto (solo cliente) y asi la
  // home vuelve a pre-renderizarse estaticamente (ISR).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const type = params.get("type")
    const accessToken = params.get("access_token")
    const refreshToken = params.get("refresh_token")

    // Si hay tokens de recovery en la URL, redirigir a /auth/reset
    if (type === "recovery" && accessToken) {
      console.log("[v0] Recovery tokens detected, redirecting to /auth/reset")
      const next = new URLSearchParams()
      next.set("access_token", accessToken)
      if (refreshToken) next.set("refresh_token", refreshToken)
      next.set("type", type)

      router.push(`/auth/reset?${next.toString()}`)
    }
  }, [router])

  // Redirect de compatibilidad: /#membresias paso a ser pagina propia
  // (/membresias). El fragmento #... no llega al servidor, asi que el salto
  // se hace aqui en el cliente para enlaces antiguos, marcadores y emails.
  useEffect(() => {
    if (window.location.hash === "#membresias") {
      router.replace("/membresias")
    }
  }, [router])

  // Scroll al ancla (#coleccion, #como-funciona, etc.) tras montar el contenido.
  // El scroll nativo del navegador falla porque las imagenes del hero cargan
  // despues y desplazan el layout, dejando al usuario arriba.
  useEffect(() => {
    const hash = window.location.hash?.replace("#", "")
    if (!hash || hash === "membresias") return

    const scrollToHash = () => {
      const element = document.getElementById(hash)
      if (element) {
        const headerOffset = 80
        const offsetPosition = element.getBoundingClientRect().top + window.scrollY - headerOffset
        window.scrollTo({ top: offsetPosition, behavior: "smooth" })
      }
    }

    // Reintentos para esperar a que las imagenes carguen y el layout se estabilice.
    const timers = [300, 700, 1200].map((delay) => setTimeout(scrollToHash, delay))
    return () => timers.forEach(clearTimeout)
  }, [])

  return (
    <main className="min-h-screen">
      <HeroSection />
      <MarqueeBanner />
      <div id="coleccion">
        <CollectionSection />
      </div>
      <div id="membresias">
        <MembershipSection />
      </div>
      <TwoModesSection />
      <div id="como-funciona">
        <HowItWorks />
      </div>
      <div id="testimonios">
        <TestimonialSection />
      </div>
      <div id="magazine">
        <MagazineSection />
      </div>
      <SEOBlock />
      <CTASection />
    </main>
  )
}
