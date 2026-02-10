"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function CTASection() {
  return (
    <section
      className="py-24"
      style={{
        background:
          "linear-gradient(45deg, #fff0f3 0%, rgba(248, 232, 235, 0.3) 25%, rgba(240, 216, 221, 0.2) 50%, rgba(232, 200, 207, 0.15) 75%, rgba(244, 196, 204, 0.1) 100%)",
      }}
    >
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 gap-12 items-center max-w-6xl mx-auto">
          {/* Left side - CTA Content */}
          <div>
            <p className="text-xs uppercase tracking-widest mb-6 font-medium" style={{ color: "#1a1a4b" }}>
              Únete ahora
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-light leading-tight mb-8" style={{ color: "#1a1a4b" }}>
              Comienza tu experiencia de lujo hoy mismo
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed font-light mb-10 max-w-lg">
              Sé parte de una comunidad exclusiva de mujeres que valoran la calidad, el diseño y la sostenibilidad.
              Nuestras plazas son limitadas para garantizar un servicio impecable.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => {
                  const membresiaSection = document.getElementById("membresias")
                  if (membresiaSection) {
                    membresiaSection.scrollIntoView({ behavior: "smooth" })
                  }
                }}
                className="rounded-none px-8 py-6 text-sm uppercase tracking-widest font-medium transition-all duration-300"
                style={{
                  backgroundColor: "rgba(244, 196, 204, 0.6)",
                  color: "#1a1a4b",
                }}
              >
                Comenzar suscripción
              </Button>
              <Button
                onClick={() => (window.location.href = "/support")}
                className="rounded-none px-8 py-6 text-sm uppercase tracking-widest font-medium backdrop-blur-sm transition-all duration-300"
                style={{
                  backgroundColor: "rgba(255, 240, 243, 0.6)",
                  color: "#1a1a4b",
                  border: "1px solid rgba(244, 196, 204, 0.3)",
                }}
              >
                Agendar consulta
              </Button>
            </div>
          </div>

          {/* Right side - Lifestyle Image */}
          <div className="relative">
            {/* Ambient background glow */}
            <div
              className="absolute inset-0 rounded-3xl blur-3xl opacity-30"
              style={{
                background: "radial-gradient(circle, rgba(244, 196, 204, 0.4) 0%, transparent 70%)",
              }}
            />

            <div className="relative w-full aspect-[4/3] rounded-2xl overflow-hidden">
              <Image
                src="/images/fendi-white-cta.jpeg"
                alt="Bolso Fendi blanco de lujo - Membresía Semzo Privé"
                fill
                className="object-cover transition-transform duration-500 hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
            </div>

            {/* Info section below image */}
            <div className="text-center space-y-4 mt-8">
              <h3 className="font-serif text-2xl md:text-3xl font-light" style={{ color: "#1a1a4b" }}>
                Acceso exclusivo cada mes
              </h3>
              <p className="text-sm md:text-base text-slate-600 leading-relaxed max-w-md mx-auto px-4">
                Descubre piezas icónicas que elevan tu estilo. Cambia tu bolso tan a menudo como desees.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
