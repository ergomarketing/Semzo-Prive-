"use client"

import { useState } from "react"
import { Plus, Minus } from "lucide-react"

interface FAQ {
  q: string
  a: React.ReactNode
}

const faqs: FAQ[] = [
  {
    q: "¿Puedo cambiar de bolso cuando quiera?",
    a: (
      <>
        Sí, en <strong>Modo Descubre</strong> puedes solicitar el cambio cuando quieras dentro de los límites de tu
        membresía. En <strong>Modo Colecciona</strong> el bolso es tuyo desde el día uno, así que se queda contigo
        hasta que decidas hacerlo definitivamente tuyo o renunciar a él.
      </>
    ),
  },
  {
    q: "¿Cuánto tarda un bolso en ser mío?",
    a: (
      <>
        Cada bolso tiene un precio de compra fijado. Tu cuota mensual suma hacia ese precio hasta completarlo. También
        puedes adelantar la compra en cualquier momento pagando la diferencia pendiente desde tu panel.
      </>
    ),
  },
  {
    q: "¿Qué pasa si cancelo la membresía?",
    a: (
      <>
        Conservas el acceso completo hasta el final del ciclo facturado. Si estabas en Modo Colecciona, el crédito
        acumulado se pierde al cancelar — por eso recomendamos hacerlo solo cuando estés segura de no continuar.
      </>
    ),
  },
  {
    q: "¿Hay seguro o cobertura del bolso?",
    a: (
      <div className="space-y-3">
        <p>
          <strong>Modo Descubre:</strong> incluido en tu cuota mensual. Cubre el desgaste por uso normal — pequeños
          arañazos, suciedad superficial, etc. <strong>No cubre</strong> negligencia, pérdida, robo no denunciado ni
          daños graves causados por mal uso.
        </p>
        <p>
          <strong>Modo Colecciona:</strong> la responsabilidad sobre el bolso es tuya mientras lo tienes en proceso
          de compra, igual que ocurre con cualquier compra a plazos. Si decides abandonar la compra, pierdes el
          crédito acumulado hasta ese momento — por eso solo recomendamos este modo si estás segura del bolso.
        </p>
      </div>
    ),
  },
  {
    q: "¿Puedo pasar de un modo al otro?",
    a: (
      <>
        Sí. Si estás en Modo Descubre y te enamoras del bolso que llevas, puedes convertirlo en Modo Colecciona desde
        tu panel — el crédito empieza a acumular desde ese momento. Si estás en Modo Colecciona y prefieres cambiar
        de bolso, puedes renunciar y volver a Modo Descubre (pierdes el crédito acumulado en ese bolso).
      </>
    ),
  },
  {
    q: "¿El certificado de autenticidad es real?",
    a: (
      <>
        Sí. Todos nuestros bolsos pasan por verificación profesional (Entrupy y partners equivalentes). Las socias en
        Modo Colecciona pueden ver y descargar el certificado desde su panel desde el primer día.
      </>
    ),
  },
]

export default function FAQModesSection() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section
      id="faq"
      className="py-24"
      style={{
        background:
          "linear-gradient(180deg, #ffffff 0%, rgba(255, 240, 243, 0.4) 50%, #ffffff 100%)",
      }}
    >
      <div className="container mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          {/* Encabezado */}
          <div className="text-center mb-14">
            <p className="text-xs uppercase tracking-widest mb-5 font-medium" style={{ color: "#1a1a4b" }}>
              Preguntas frecuentes
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-light leading-tight" style={{ color: "#1a1a4b" }}>
              Todo lo que necesitas saber
            </h2>
          </div>

          {/* Lista FAQ */}
          <div className="space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openIndex === idx
              return (
                <div
                  key={idx}
                  className="rounded-xl border bg-white transition-all"
                  style={{ borderColor: "rgba(244, 196, 204, 0.4)" }}
                >
                  <button
                    type="button"
                    onClick={() => setOpenIndex(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between gap-4 px-6 py-5 text-left"
                    aria-expanded={isOpen}
                  >
                    <span className="font-medium text-base md:text-lg" style={{ color: "#1a1a4b" }}>
                      {faq.q}
                    </span>
                    <span
                      className="shrink-0 h-8 w-8 rounded-full flex items-center justify-center transition-transform"
                      style={{ backgroundColor: isOpen ? "#1a1a4b" : "rgba(244, 196, 204, 0.3)" }}
                    >
                      {isOpen ? (
                        <Minus className="h-4 w-4 text-white" />
                      ) : (
                        <Plus className="h-4 w-4" style={{ color: "#1a1a4b" }} />
                      )}
                    </span>
                  </button>
                  {isOpen && (
                    <div className="px-6 pb-6 text-slate-600 font-light leading-relaxed">{faq.a}</div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
