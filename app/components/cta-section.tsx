"use client"

import { Button } from "@/components/ui/button"

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
        <div className="grid md:grid-cols-12 gap-8 items-center">
          <div className="md:col-span-6">
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

          <div className="md:col-span-5 md:col-start-8">
            <div
              className="pt-8 space-y-8 p-6 rounded-lg backdrop-blur-sm"
              style={{
                borderTop: "1px solid rgba(244, 196, 204, 0.3)",
                backgroundColor: "rgba(255, 240, 243, 0.3)",
              }}
            >
              <div>
                <div className="text-xs uppercase tracking-widest mb-2 font-medium" style={{ color: "#1a1a4b" }}>
                  Membresías disponibles
                </div>
                <div className="font-serif text-3xl" style={{ color: "#1a1a4b" }}>
                  50/100
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-widest mb-2 font-medium" style={{ color: "#1a1a4b" }}>
                  Próxima apertura de plazas
                </div>
                <div className="font-serif text-3xl" style={{ color: "#1a1a4b" }}>
                  15 de Junio
                </div>
              </div>

              <div>
                <div className="text-xs uppercase tracking-widest mb-2 font-medium" style={{ color: "#1a1a4b" }}>
                  Tiempo de espera actual
                </div>
                <div className="font-serif text-3xl" style={{ color: "#1a1a4b" }}>
                  2 semanas
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
