"use client"

// Build: 2026-05-11T16:50 (forzar revalidacion SSR y carga de imagenes)
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

export default function CTASection() {
  return (
    <section
      // Padding vertical reducido: antes py-16/24, ahora py-10/14.
      // El bloque era demasiado alto y aburria el scroll sin aportar.
      className="py-10 md:py-14"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #fdf2f4 20%, #fce8ec 60%, #f8dce2 100%)",
      }}
    >
      {/* space-y-24 era exagerado entre filas: lo bajo a space-y-12 (md) para
       * que ambos bloques sean visibles juntos en un scroll mas compacto. */}
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl space-y-10 md:space-y-12">
        
        {/* Fila 1: Fendi + Agendar Consulta */}
        <div className="grid md:grid-cols-[1.2fr_1fr] gap-6 md:gap-12 items-center">
          {/* aspect ratio mas horizontal (16/9 en vez de 3/2) para que la
           * imagen ocupe menos altura sin perder presencia visual. */}
          <div className="relative aspect-[16/9] rounded-3xl overflow-hidden shadow-xl">
            <Image
              src="/images/fendi-white-cta.jpeg"
              alt="Bolso Fendi blanco de lujo - Semzo Prive"
              fill
              className="object-cover object-[center_20%]"
              sizes="(max-width: 768px) 100vw, 55vw"
              priority
            />
          </div>
          
          {/* space-y-6 -> space-y-4, pt-4 eliminado: texto mas compacto */}
          <div className="space-y-4">
            <p 
              className="text-sm uppercase tracking-widest font-medium"
              style={{ color: "#c9a86c" }}
            >
              Atención Personalizada
            </p>
            <h2 
              className="font-serif text-3xl md:text-4xl lg:text-5xl font-light leading-tight"
              style={{ color: "#1a1a4b" }}
            >
              Descubre tu bolso ideal
            </h2>
            <p className="text-slate-600 leading-relaxed text-base md:text-lg max-w-lg">
              Nuestro equipo de estilistas está disponible para ayudarte a elegir 
              la pieza perfecta para cada ocasión. Agenda una consulta gratuita 
              y recibe recomendaciones personalizadas.
            </p>
            <div className="pt-2">
              <Link href="/contacto">
                <Button
                  className="rounded-none px-10 py-6 text-sm uppercase tracking-widest font-medium transition-all duration-300 hover:bg-[#1a1a4b] hover:text-white"
                  style={{
                    backgroundColor: "transparent",
                    color: "#1a1a4b",
                    border: "2px solid #1a1a4b",
                  }}
                >
                  Agendar Consulta
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Fila 2: Comienza tu experiencia + Gift Card */}
        <div className="grid md:grid-cols-[1fr_1fr] gap-6 md:gap-12 items-center">
          <div className="space-y-4 order-2 md:order-1">
            <p 
              className="text-sm uppercase tracking-widest font-medium"
              style={{ color: "#c9a86c" }}
            >
              Únete Ahora
            </p>
            <h2 
              className="font-serif text-3xl md:text-4xl lg:text-5xl font-light leading-tight"
              style={{ color: "#1a1a4b" }}
            >
              Comienza tu experiencia de lujo hoy mismo
            </h2>
            <p className="text-slate-600 leading-relaxed text-base md:text-lg max-w-lg">
              Sé parte de una comunidad exclusiva de mujeres que valoran la calidad, 
              el diseño y la sostenibilidad. Nuestras plazas son limitadas para 
              garantizar un servicio impecable.
            </p>
            <div className="pt-2 flex justify-center md:justify-start">
              <Link href="/gift-cards">
                <Button
                  className="rounded-none px-10 py-6 text-sm uppercase tracking-widest font-medium transition-all duration-300"
                  style={{
                    backgroundColor: "#1a1a4b",
                    color: "#ffffff",
                  }}
                >
                  Comprar Gift Card
                </Button>
              </Link>
            </div>
          </div>
          
          {/* Imagen gift card: aspect 4/5 -> 4/3 para reducir altura
           * dramaticamente sin sacrificar legibilidad. */}
          <div className="relative aspect-[4/3] w-full order-1 md:order-2 rounded-3xl overflow-hidden">
            <Image
              src="/images/gift-card-semzo.jpg"
              alt="Gift Cards Semzo Prive - Tarjeta regalo de lujo"
              fill
              className="object-contain"
              sizes="(max-width: 768px) 100vw, 50vw"
              priority
            />
          </div>
        </div>
        
      </div>
    </section>
  )
}
