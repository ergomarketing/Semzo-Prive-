"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

export default function CTASection() {
  return (
    <section
      className="py-16 md:py-24"
      style={{
        background: "linear-gradient(180deg, #ffffff 0%, #fdf2f4 20%, #fce8ec 60%, #f8dce2 100%)",
      }}
    >
      <div className="container mx-auto px-4 lg:px-8 max-w-7xl space-y-24">
        
        {/* Fila 1: Fendi + Agendar Consulta - Fendi protagonista */}
        <div className="grid md:grid-cols-[1.2fr_1fr] gap-10 md:gap-20 items-start">
          <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-xl">
            <Image
              src="/images/fendi-white-cta.jpeg"
              alt="Bolso Fendi blanco de lujo - Semzo Prive"
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 55vw"
              priority
            />
          </div>
          
          <div className="space-y-6 pt-4">
            <p 
              className="text-sm uppercase tracking-widest font-medium"
              style={{ color: "#c9a86c" }}
            >
              Atencion Personalizada
            </p>
            <h2 
              className="font-serif text-3xl md:text-4xl lg:text-5xl font-light leading-tight"
              style={{ color: "#1a1a4b" }}
            >
              Descubre tu bolso ideal
            </h2>
            <p className="text-slate-600 leading-relaxed text-lg max-w-lg">
              Nuestro equipo de estilistas esta disponible para ayudarte a elegir 
              la pieza perfecta para cada ocasion. Agenda una consulta gratuita 
              y recibe recomendaciones personalizadas.
            </p>
            <div className="pt-4">
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
        <div className="grid md:grid-cols-[1fr_1fr] gap-10 md:gap-20 items-start">
          <div className="space-y-6 order-2 md:order-1 pt-4">
            <p 
              className="text-sm uppercase tracking-widest font-medium"
              style={{ color: "#c9a86c" }}
            >
              Unete Ahora
            </p>
            <h2 
              className="font-serif text-3xl md:text-4xl lg:text-5xl font-light leading-tight"
              style={{ color: "#1a1a4b" }}
            >
              Comienza tu experiencia de lujo hoy mismo
            </h2>
            <p className="text-slate-600 leading-relaxed text-lg max-w-lg">
              Se parte de una comunidad exclusiva de mujeres que valoran la calidad, 
              el diseño y la sostenibilidad. Nuestras plazas son limitadas para 
              garantizar un servicio impecable.
            </p>
            <div className="pt-4 flex justify-center md:justify-start">
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
          
          <div className="relative aspect-[4/5] w-full order-1 md:order-2 rounded-3xl overflow-hidden">
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
