"use client"

import { useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import HeroSection from "./components/hero-section"
import CollectionSection from "./components/collection-section"
import MembershipSection from "./components/membership-section"
import HowItWorks from "./components/how-it-works"
import TestimonialSection from "./components/testimonial-section"
import MagazineSection from "./components/magazine-section"
import CTASection from "./components/cta-section"

export default function ClientHomePage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    const type = searchParams.get("type")
    const accessToken = searchParams.get("access_token")
    const refreshToken = searchParams.get("refresh_token")

    // Si hay tokens de recovery en la URL, redirigir a /auth/reset
    if (type === "recovery" && accessToken) {
      console.log("[v0] Recovery tokens detected, redirecting to /auth/reset")
      const params = new URLSearchParams()
      params.set("access_token", accessToken)
      if (refreshToken) params.set("refresh_token", refreshToken)
      params.set("type", type)

      router.push(`/auth/reset?${params.toString()}`)
    }
  }, [searchParams, router])

  return (
    <main className="min-h-screen">
      <HeroSection />
      <div id="coleccion">
        <CollectionSection />
      </div>
      <div id="membresias">
        <MembershipSection />
      </div>
      <div id="como-funciona">
        <HowItWorks />
      </div>
      <div id="testimonios">
        <TestimonialSection />
      </div>
      <div id="magazine">
        <MagazineSection />
      </div>
      <CTASection />
    </main>
  )
}
