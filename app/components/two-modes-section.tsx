import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Repeat, Heart } from "lucide-react"

/**
 * Sección "Tu bolso, tus reglas"
 * Presenta los 2 modos (Descubre / Colecciona) como propuesta de valor.
 * NO menciona terminología técnica (rent-to-own, crédito, etc.) — eso
 * la socia lo descubre dentro del producto cuando reserva su primer bolso.
 */
export default function TwoModesSection() {
  return (
    <section id="modos" className="py-24 bg-white">
      <div className="container mx-auto px-4">
        {/* Encabezado editorial */}
        <div className="grid md:grid-cols-12 gap-8 mb-16">
          <div className="md:col-span-5">
            <p className="text-xs uppercase tracking-widest mb-6 font-medium" style={{ color: "#1a1a4b" }}>
              Tu bolso, tus reglas
            </p>
            <h2 className="font-serif text-4xl md:text-5xl font-light leading-tight" style={{ color: "#1a1a4b" }}>
              Dos formas de vivir el lujo
            </h2>
          </div>
          <div className="md:col-span-1"></div>
          <div className="md:col-span-6 flex items-end">
            <p className="text-slate-600 text-lg leading-relaxed font-light">
              Una sola membresía. Dos caminos para disfrutarla. Eliges cuando reservas tu primer bolso y puedes cambiar
              de opinión en cualquier momento.
            </p>
          </div>
        </div>

        {/* 2 modos en grid */}
        <div className="grid md:grid-cols-2 gap-8">
          {/* Modo Descubre */}
          <article
            className="group relative overflow-hidden rounded-2xl border border-rose-pastel/30 bg-rose-nude/10 transition-all hover:shadow-xl hover:-translate-y-1"
            style={{ backgroundColor: "rgba(255, 240, 243, 0.4)" }}
          >
            <div className="relative w-full aspect-[4/3] overflow-hidden">
              <Image
                src="/images/hero-luxury-bags-flatlay.jpeg"
                alt="Modo Descubre — varios bolsos para rotar"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute top-5 left-5 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-sm">
                <Repeat className="h-3.5 w-3.5" style={{ color: "#1a1a4b" }} />
                <span className="text-xs font-medium uppercase tracking-wider" style={{ color: "#1a1a4b" }}>
                  Modo Descubre
                </span>
              </div>
            </div>

            <div className="p-8 md:p-10">
              <h3 className="font-serif text-3xl mb-4 font-light" style={{ color: "#1a1a4b" }}>
                Cambia cuando quieras
              </h3>
              <p className="text-slate-600 font-light leading-relaxed mb-6">
                Prueba marcas, modelos y estilos. Tu membresía te abre las puertas de toda la colección para que cada
                temporada lleves algo diferente.
              </p>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <span
                    className="mt-2 h-1 w-1 rounded-full shrink-0"
                    style={{ backgroundColor: "#1a1a4b" }}
                  />
                  Acceso completo al catálogo curado
                </li>
                <li className="flex items-start gap-3">
                  <span
                    className="mt-2 h-1 w-1 rounded-full shrink-0"
                    style={{ backgroundColor: "#1a1a4b" }}
                  />
                  Rotación incluida en tu cuota mensual
                </li>
                <li className="flex items-start gap-3">
                  <span
                    className="mt-2 h-1 w-1 rounded-full shrink-0"
                    style={{ backgroundColor: "#1a1a4b" }}
                  />
                  Cobertura por uso normal incluida
                </li>
              </ul>
            </div>
          </article>

          {/* Modo Colecciona */}
          <article
            className="group relative overflow-hidden rounded-2xl border transition-all hover:shadow-xl hover:-translate-y-1"
            style={{
              borderColor: "rgba(244, 196, 204, 0.5)",
              backgroundColor: "rgba(248, 232, 235, 0.5)",
            }}
          >
            <div className="relative w-full aspect-[4/3] overflow-hidden">
              <Image
                src="/images/dior-saddle-hero.jpeg"
                alt="Modo Colecciona — un solo bolso para hacerlo tuyo"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div
                className="absolute top-5 left-5 flex items-center gap-2 px-3 py-1.5 rounded-full backdrop-blur-sm"
                style={{ backgroundColor: "rgba(26, 26, 75, 0.9)" }}
              >
                <Heart className="h-3.5 w-3.5 text-white" />
                <span className="text-xs font-medium uppercase tracking-wider text-white">Modo Colecciona</span>
              </div>
            </div>

            <div className="p-8 md:p-10">
              <h3 className="font-serif text-3xl mb-4 font-light" style={{ color: "#1a1a4b" }}>
                Hazlo tuyo
              </h3>
              <p className="text-slate-600 font-light leading-relaxed mb-6">
                ¿Te has enamorado? Reserva el bolso que ya no quieres soltar. Cada cuota suma hacia su compra. Cuando
                completes su precio, es tuyo para siempre.
              </p>
              <ul className="space-y-3 text-sm text-slate-700">
                <li className="flex items-start gap-3">
                  <span
                    className="mt-2 h-1 w-1 rounded-full shrink-0"
                    style={{ backgroundColor: "#1a1a4b" }}
                  />
                  El bolso es solo tuyo desde el día uno
                </li>
                <li className="flex items-start gap-3">
                  <span
                    className="mt-2 h-1 w-1 rounded-full shrink-0"
                    style={{ backgroundColor: "#1a1a4b" }}
                  />
                  Cada mes suma hacia su propiedad
                </li>
                <li className="flex items-start gap-3">
                  <span
                    className="mt-2 h-1 w-1 rounded-full shrink-0"
                    style={{ backgroundColor: "#1a1a4b" }}
                  />
                  Certificado de autenticidad desde el inicio
                </li>
              </ul>
            </div>
          </article>
        </div>

        {/* CTA único + nota */}
        <div className="mt-14 text-center">
          <Link
            href="#membresias"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-full text-white font-medium tracking-wide transition-all hover:gap-3"
            style={{ backgroundColor: "#1a1a4b" }}
          >
            Hazte socia
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="mt-5 text-sm text-slate-500 font-light">
            Decides al reservar tu primer bolso. Sin compromiso, sin permanencia.
          </p>
        </div>
      </div>
    </section>
  )
}
