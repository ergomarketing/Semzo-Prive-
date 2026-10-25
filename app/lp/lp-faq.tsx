"use client"

import type { LpFaqItem } from "./faq-content"

function trackEvent(name: string, params: Record<string, unknown> = {}) {
  if (typeof window === "undefined") return
  const w = window as unknown as { dataLayer?: unknown[] }
  w.dataLayer = w.dataLayer || []
  w.dataLayer.push({ event: name, ...params })
}

/**
 * Preguntas frecuentes de las landings. Usa <details>: el texto de cada respuesta
 * esta en el HTML (lo leen buscadores y lectores de pantalla) y funciona sin JavaScript.
 * Mismo estilo que el resto de la landing: serif, indigo, fondo blanco.
 */
export default function LpFaq({
  items,
  id = "preguntas",
  title = "Preguntas frecuentes",
}: {
  items: LpFaqItem[]
  id?: string
  title?: string
}) {
  return (
    <section id={id} className="bg-white py-12 md:py-16">
      <div className="mx-auto max-w-3xl px-6 md:px-10">
        <h2 className="mb-8 text-balance text-center font-serif text-2xl leading-tight md:text-3xl">
          {title}
        </h2>

        <div className="divide-y divide-indigo-dark/10 border-y border-indigo-dark/10">
          {items.map((item) => (
            <details
              key={item.question}
              className="group py-4"
              onToggle={(e) => {
                if ((e.currentTarget as HTMLDetailsElement).open) trackEvent("faq_open", { question: item.question })
              }}
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-serif text-base md:text-lg [&::-webkit-details-marker]:hidden">
                {item.question}
                <span aria-hidden="true" className="text-2xl leading-none transition group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-indigo-dark/80 md:text-base">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  )
}
