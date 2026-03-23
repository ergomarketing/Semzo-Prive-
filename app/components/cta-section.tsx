"use client"

import { Button } from "@/components/ui/button"
import Image from "next/image"

export default function CTASection() {
  return (
    <section
      className="py-16 md:py-24"
      style={{
        background: "linear-gradient(180deg, #fdf2f4 0%, #fce8ec 50%, #f8dce2 100%)",
      }}
    >
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Two columns side by side */}
        <div className="grid md:grid-cols-2 gap-0 md:gap-0 items-stretch">
          
          {/* LEFT COLUMN - Fendi + SEO Text */}
          <div className="flex flex-col">
            <div className="relative aspect-[4/3] w-full overflow-hidden">
              <Image
                src="/images/fendi-white-cta.jpeg"
                alt="Bolso Fendi blanco de lujo - Alquiler de bolsos Semzo Prive"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-8 md:p-10 flex-1">
              <h2 className="font-serif text-2xl md:text-3xl font-light leading-tight mb-4" style={{ color: "#1a1a4b" }}>
                Alquiler de bolsos de lujo en España
              </h2>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-4">
                Semzo Prive es un servicio especializado en el alquiler de bolsos de lujo en Madrid y Marbella. 
                Nuestra coleccion incluye modelos iconicos de Chanel, Dior, Louis Vuitton, Hermes y otras casas 
                de moda de prestigio.
              </p>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed">
                El alquiler de bolsos permite acceder a piezas exclusivas para eventos especiales o uso cotidiano, 
                sin necesidad de compra permanente. Con envio en 24-48 horas y seguro incluido.
              </p>
            </div>
          </div>

          {/* RIGHT COLUMN - Gift Card + CTA Text */}
          <div className="flex flex-col">
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-[#fdf0f3]">
              <Image
                src="/images/gift-card-semzo.jpg"
                alt="Gift Cards Semzo Prive - Tarjeta regalo de lujo"
                fill
                className="object-contain p-6"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            </div>
            <div className="bg-white/80 backdrop-blur-sm p-8 md:p-10 flex-1">
              <p className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: "#c9a86c" }}>
                Unete ahora
              </p>
              <h2 className="font-serif text-2xl md:text-3xl font-light leading-tight mb-4" style={{ color: "#1a1a4b" }}>
                Comienza tu experiencia de lujo hoy mismo
              </h2>
              <p className="text-slate-600 text-sm md:text-base leading-relaxed mb-6">
                Se parte de una comunidad exclusiva de mujeres que valoran la calidad, el diseno y la sostenibilidad. 
                Nuestras plazas son limitadas para garantizar un servicio impecable.
              </p>

              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  onClick={() => {
                    const membresiaSection = document.getElementById("membresias")
                    if (membresiaSection) {
                      membresiaSection.scrollIntoView({ behavior: "smooth" })
                    }
                  }}
                  className="rounded-none px-6 py-5 text-xs uppercase tracking-widest font-medium transition-all duration-300"
                  style={{
                    backgroundColor: "#f4c4cc",
                    color: "#1a1a4b",
                  }}
                >
                  Comenzar suscripcion
                </Button>
                <Button
                  onClick={() => (window.location.href = "/gift-cards")}
                  className="rounded-none px-6 py-5 text-xs uppercase tracking-widest font-medium transition-all duration-300"
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
      </div>
    </section>
  )
}
