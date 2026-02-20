"use client"

import { Button } from "@/components/ui/button"
import { Shield, CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden">
      {/* Background Image */}
      <div className="absolute inset-0">
        <Image
          src="/images/hero-luxury-bags-flatlay.jpeg"
          alt="Bolsos de lujo de diseñador"
          fill
          className="object-cover object-center"
          priority
        />
        {/* Dark gradient overlay for text contrast */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/50 to-black/70" />
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 pt-32 md:pt-40 pb-12 md:pb-20 relative z-10">
        <div className="max-w-4xl">
          {/* Contenido principal */}
          <div className="space-y-8 md:space-y-12 text-center lg:text-left">
            <div>
              <p className="text-xs uppercase tracking-widest text-white/80 mb-4 md:mb-6 font-medium">
                Membresía exclusiva
              </p>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light text-white leading-[1.1] tracking-tight">
                Tu puerta de acceso al
                <br />
                <span className="text-rose-pastel">armario de</span>
                <br />
                tus sueños
              </h1>
            </div>

            <p className="text-white/90 text-lg md:text-xl leading-relaxed font-light max-w-2xl mx-auto lg:mx-0">
              Accede a bolsos de las marcas más exclusivas del mundo. Hermès, Chanel, Louis Vuitton y más.
            </p>

            {/* Botones */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-6">
              <Button
                onClick={() => {
                  const membresiaSection = document.getElementById("membresias")
                  if (membresiaSection) {
                    membresiaSection.scrollIntoView({ behavior: "smooth" })
                  }
                }}
                className="w-full sm:w-auto rounded-none px-6 md:px-8 py-4 md:py-6 text-sm uppercase tracking-widest font-medium transition-all duration-300 bg-rose-pastel text-indigo-dark hover:bg-rose-pastel/90 hover:scale-105 transform"
              >
                Comenzar suscripción
              </Button>
              <Link href="/catalog">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto rounded-none px-6 md:px-8 py-4 md:py-6 text-sm uppercase tracking-widest font-medium transition-all duration-300 border-2 border-white text-white hover:bg-white hover:text-indigo-dark hover:scale-105 transform bg-transparent"
                >
                  Ver colección
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
    // </CHANGE>
  )
}
