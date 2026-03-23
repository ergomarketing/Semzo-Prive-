"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function CTASection() {
  return (
    <section
      className="py-20 md:py-28"
      style={{
        background:
          "linear-gradient(45deg, #fff0f3 0%, rgba(248, 232, 235, 0.3) 25%, rgba(240, 216, 221, 0.2) 50%, rgba(232, 200, 207, 0.15) 75%, rgba(244, 196, 204, 0.1) 100%)",
      }}
    >
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Top - CTA Content Centered */}
        <div className="text-center mb-16">
          <p className="text-xs uppercase tracking-widest mb-4 font-medium" style={{ color: "#1a1a4b" }}>
            Unete ahora
          </p>
          <h2 className="font-serif text-3xl md:text-5xl font-light leading-tight mb-6" style={{ color: "#1a1a4b" }}>
            Comienza tu experiencia de lujo hoy mismo
          </h2>
          <p className="text-slate-600 text-base md:text-lg leading-relaxed font-light mb-8 max-w-2xl mx-auto">
            Se parte de una comunidad exclusiva de mujeres que valoran la calidad, el diseno y la sostenibilidad.
            Nuestras plazas son limitadas para garantizar un servicio impecable.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
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
              Comenzar suscripcion
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

        {/* Bottom - Two Cards in Horizontal Row */}
        <div className="grid md:grid-cols-2 gap-8 items-stretch">
          {/* Card 1 - Fendi Bag */}
          <div className="group relative rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src="/images/fendi-white-cta.jpeg"
                alt="Bolso Fendi blanco - Membresia Semzo Prive"
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
            </div>
            <div className="p-6 text-center">
              <h3 className="font-serif text-xl md:text-2xl font-light mb-2" style={{ color: "#1a1a4b" }}>
                Acceso exclusivo cada mes
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Descubre piezas iconicas que elevan tu estilo. Cambia tu bolso tan a menudo como desees.
              </p>
              <Button
                onClick={() => (window.location.href = "/coleccion")}
                className="rounded-none px-6 py-3 text-xs uppercase tracking-widest font-medium transition-all duration-300"
                style={{
                  backgroundColor: "rgba(244, 196, 204, 0.6)",
                  color: "#1a1a4b",
                }}
              >
                Ver coleccion
              </Button>
            </div>
          </div>

          {/* Card 2 - Gift Card */}
          <div className="group relative rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-lg transition-all duration-300">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#fdf0f3]">
              <Image
                src="/images/gift-card-semzo.jpg"
                alt="Gift Cards Semzo Prive - Tarjeta regalo de lujo"
                fill
                className="object-contain p-4 transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>
            <div className="p-6 text-center">
              <h3 className="font-serif text-xl md:text-2xl font-light mb-2" style={{ color: "#1a1a4b" }}>
                Gift Cards de Semzo Prive
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed mb-4">
                Regala acceso a lujo y diseno exclusivo. El regalo perfecto para quien valora la elegancia.
              </p>
              <Button
                onClick={() => (window.location.href = "/gift-cards")}
                className="rounded-none px-6 py-3 text-xs uppercase tracking-widest font-medium transition-all duration-300"
                style={{
                  backgroundColor: "#1a1a4b",
                  color: "#ffffff",
                }}
              >
                Comprar Gift Card
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
