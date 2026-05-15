"use client"

import Image from "next/image"
import Link from "next/link"
import MembershipSection from "@/app/components/membership-section"

export default function ProcesoClient() {
  return (
    <div className="min-h-screen bg-white">
      <main className="pt-20">
        {/* Hero Section con estilo editorial */}
        <section
          className="py-24"
          style={{
            background:
              "linear-gradient(135deg, #fff0f3 0%, rgba(248, 232, 235, 0.4) 25%, rgba(240, 216, 221, 0.3) 50%, rgba(232, 200, 207, 0.2) 75%, rgba(244, 196, 204, 0.1) 100%)",
          }}
        >
          <div className="container mx-auto px-4">
            {/* Encabezado editorial */}
            <div className="grid md:grid-cols-12 gap-8 mb-20">
              <div className="md:col-span-4">
                <p className="text-xs uppercase tracking-widest mb-6 font-medium" style={{ color: "#1a1a4b" }}>
                  El proceso
                </p>
                <h1 className="font-serif text-4xl md:text-5xl font-light leading-tight" style={{ color: "#1a1a4b" }}>
                  Simplicidad y elegancia en cada paso
                </h1>
              </div>
              <div className="md:col-span-1"></div>
              <div className="md:col-span-7">
                <p className="text-slate-600 text-lg leading-relaxed font-light">
                  Hemos diseñado un proceso intuitivo que te permite disfrutar de bolsos de lujo sin complicaciones.
                  Desde la selección hasta la entrega, cada detalle ha sido cuidadosamente considerado.
                </p>
              </div>
            </div>

            {/* Pasos en formato editorial - 4 tarjetas */}
            <div className="grid md:grid-cols-2 gap-x-8 gap-y-16">
              {/* Paso 01: Elige tu bolso */}
              <div
                className="pt-8 p-6 rounded-lg backdrop-blur-sm"
                style={{
                  borderTop: "1px solid rgba(244, 196, 204, 0.3)",
                  backgroundColor: "rgba(255, 240, 243, 0.3)",
                }}
              >
                <div className="text-xs uppercase tracking-widest mb-6 font-medium" style={{ color: "#1a1a4b" }}>
                  Paso 01
                </div>

                <div className="relative w-full aspect-[4/3] mb-6 rounded-lg overflow-hidden">
                  <Image
                    src="/images/chanel-woc-step1.jpeg"
                    alt="Chanel WOC - Selecciona tu membresía"
                    fill
                    className="object-cover"
                  />
                </div>

                <h2 className="font-serif text-2xl mb-4" style={{ color: "#1a1a4b" }}>
                  Elige tu bolso
                </h2>
                <p className="text-slate-600 font-light mb-4">
                  Explora nuestra colección exclusiva y selecciona el bolso perfecto para tu estilo y ocasión. Accede a
                  marcas icónicas como Chanel, Hermès, Louis Vuitton y Dior desde tu primera membresía.
                </p>
                <ul className="space-y-2 text-sm text-slate-600 font-light">
                  <li className="flex items-start">
                    <span className="mr-2" style={{ color: "#1a1a4b" }}>
                      •
                    </span>
                    <span>Catálogo actualizado mensualmente con las últimas colecciones</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2" style={{ color: "#1a1a4b" }}>
                      •
                    </span>
                    <span>Filtros por marca, color, ocasión y disponibilidad en tiempo real</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2" style={{ color: "#1a1a4b" }}>
                      •
                    </span>
                    <span>Cada bolso incluye descripción detallada, fotos profesionales y condición verificada</span>
                  </li>
                </ul>
              </div>

              {/* Paso 02: Disfrútalo con total tranquilidad */}
              <div
                className="pt-8 p-6 rounded-lg backdrop-blur-sm"
                style={{
                  borderTop: "1px solid rgba(244, 196, 204, 0.3)",
                  backgroundColor: "rgba(255, 240, 243, 0.3)",
                }}
              >
                <div className="text-xs uppercase tracking-widest mb-6 font-medium" style={{ color: "#1a1a4b" }}>
                  Paso 02
                </div>

                <div className="relative w-full aspect-[4/3] mb-6 rounded-lg overflow-hidden">
                  <Image
                    src="/images/prada-street-step2.jpeg"
                    alt="Prada - Explora nuestra colección"
                    fill
                    className="object-cover scale-125 object-[center_35%]"
                  />
                </div>

                <h2 className="font-serif text-2xl mb-4" style={{ color: "#1a1a4b" }}>
                  Disfrútalo con total tranquilidad
                </h2>
                <p className="text-slate-600 font-light mb-4">
                  Usa tu bolso con total confianza. Está completamente asegurado durante todo el período de alquiler,
                  protegiéndote contra daños accidentales y desgaste normal.
                </p>
                <ul className="space-y-2 text-sm text-slate-600 font-light">
                  <li className="flex items-start">
                    <span className="mr-2" style={{ color: "#1a1a4b" }}>
                      •
                    </span>
                    <span>Seguro completo incluido en todas las membresías sin costo adicional</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2" style={{ color: "#1a1a4b" }}>
                      •
                    </span>
                    <span>Protección contra daños accidentales, manchas y desgaste del uso cotidiano</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2" style={{ color: "#1a1a4b" }}>
                      •
                    </span>
                    <span>Envío express gratuito en 24-48 horas con empaquetado premium y seguimiento en tiempo real</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2" style={{ color: "#1a1a4b" }}>
                      •
                    </span>
                    <span>Soporte dedicado 24/7 para cualquier consulta o incidencia</span>
                  </li>
                </ul>
              </div>

              {/* Paso 03: Intercambia cuando quieras */}
              <div
                className="pt-8 p-6 rounded-lg backdrop-blur-sm"
                style={{
                  borderTop: "1px solid rgba(244, 196, 204, 0.3)",
                  backgroundColor: "rgba(255, 240, 243, 0.3)",
                }}
              >
                <div className="text-xs uppercase tracking-widest mb-6 font-medium" style={{ color: "#1a1a4b" }}>
                  Paso 03
                </div>

                <div className="relative w-full aspect-[4/3] mb-6 rounded-lg overflow-hidden">
                  <Image
                    src="/images/ysl-step3.jpg"
                    alt="YSL - Recibe y disfruta"
                    fill
                    className="object-cover object-[center_60%]"
                  />
                </div>

                <h2 className="font-serif text-2xl mb-4" style={{ color: "#1a1a4b" }}>
                  Intercambia cuando quieras
                </h2>
                <p className="text-slate-600 font-light mb-4">
                  La flexibilidad es el corazón de Semzo Privé. Intercambia tu bolso por otro de la colección siempre
                  que desees, sin costos adicionales ni compromisos a largo plazo.
                </p>
                <ul className="space-y-2 text-sm text-slate-600 font-light">
                  <li className="flex items-start">
                    <span className="mr-2" style={{ color: "#1a1a4b" }}>
                      •
                    </span>
                    <span>Intercambios ilimitados según tu plan de membresía (mensual o cada 3 meses)</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2" style={{ color: "#1a1a4b" }}>
                      •
                    </span>
                    <span>Sin costos adicionales: el envío de ida y vuelta está incluido</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2" style={{ color: "#1a1a4b" }}>
                      •
                    </span>
                    <span>Proceso simple: solicita el cambio, devuelve el bolso actual y recibe el nuevo en días</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2" style={{ color: "#1a1a4b" }}>
                      •
                    </span>
                    <span>Renueva tu estilo constantemente sin la necesidad de comprar ni acumular</span>
                  </li>
                </ul>
              </div>

              {/* Paso 04: Un modelo de lujo consciente y circular */}
              <div
                className="pt-8 p-6 rounded-lg backdrop-blur-sm"
                style={{
                  borderTop: "1px solid rgba(244, 196, 204, 0.3)",
                  backgroundColor: "rgba(255, 240, 243, 0.3)",
                }}
              >
                <div className="text-xs uppercase tracking-widest mb-6 font-medium" style={{ color: "#1a1a4b" }}>
                  Paso 04
                </div>

                <div className="relative w-full aspect-[4/3] mb-6 rounded-lg overflow-hidden">
                  <Image
                    src="/images/hero-luxury-bags.jpeg"
                    alt="Modelo de lujo consciente"
                    fill
                    className="object-cover"
                  />
                </div>

                <h2 className="font-serif text-2xl mb-4" style={{ color: "#1a1a4b" }}>
                  Un modelo de lujo consciente y circular
                </h2>
                <p className="text-slate-600 font-light mb-4">
                  Semzo Privé reimagina el lujo para el mundo actual. En lugar de acumular, compartimos. En lugar de
                  desechar, cuidamos. Nuestro modelo circular maximiza el uso de cada bolso, reduciendo el impacto
                  ambiental mientras democratizamos el acceso a piezas exclusivas.
                </p>
                <ul className="space-y-2 text-sm text-slate-600 font-light">
                  <li className="flex items-start">
                    <span className="mr-2" style={{ color: "#1a1a4b" }}>
                      •
                    </span>
                    <span>Economía circular: cada bolso es utilizado por múltiples clientas, extendiendo su vida útil</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2" style={{ color: "#1a1a4b" }}>
                      •
                    </span>
                    <span>Consumo consciente: disfruta del lujo sin la necesidad de poseer ni acumular</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2" style={{ color: "#1a1a4b" }}>
                      •
                    </span>
                    <span>Accesibilidad democratizada: accede a bolsos de 3.000-10.000€ por una fracción de su precio</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2" style={{ color: "#1a1a4b" }}>
                      •
                    </span>
                    <span>Curación profesional: cada pieza es autenticada, limpiada y restaurada por expertos</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2" style={{ color: "#1a1a4b" }}>
                      •
                    </span>
                    <span>Comunidad de lujo inteligente: únete a miles de mujeres que eligen elegancia sin exceso</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Marquee de Marcas — estilo editorial */}
        <section className="py-16 md:py-20 bg-white overflow-hidden border-y border-slate-100">
          <div className="marquee-track flex items-center" style={{ color: "#1a1a4b" }}>
            {[...Array(2)].map((_, loop) => (
              <div
                key={loop}
                className="flex items-center shrink-0"
                aria-hidden={loop === 1}
              >
                {[
                  "BOTTEGA VENETA",
                  "CELINE",
                  "CHANEL",
                  "CHRISTIAN DIOR",
                  "FENDI",
                  "GUCCI",
                  "HERMÈS",
                  "LOEWE",
                  "LOUIS VUITTON",
                  "MIU MIU",
                  "PRADA",
                  "SAINT LAURENT",
                ].map((brand) => (
                  <span key={brand} className="flex items-center shrink-0">
                    <span className="font-serif text-2xl md:text-4xl lg:text-5xl font-light tracking-tight px-8 md:px-12 whitespace-nowrap">
                      {brand}
                    </span>
                    <span className="text-xl md:text-3xl font-light opacity-30">·</span>
                  </span>
                ))}
              </div>
            ))}
          </div>
        </section>

        {/* Planes — reutilizamos la sección de Membresías de la home */}
        <section className="proceso-memberships">
          <MembershipSection />
        </section>

        {/* Pases de Bolso — bloque editorial horizontal, pertenecen a Petite */}
        <section className="py-24 md:py-32 bg-white">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-12 gap-8 md:gap-12 max-w-6xl mx-auto items-center">
              {/* Imagen editorial */}
              <div className="md:col-span-5">
                <div className="relative aspect-[4/5] overflow-hidden">
                  <Image
                    src="/images/jacquemus-le-chiquito.jpg"
                    alt="Pases de Bolso Semzo Privé"
                    fill
                    className="object-cover"
                  />
                </div>
                <p
                  className="text-xs uppercase tracking-[0.25em] mt-6 font-medium"
                  style={{ color: "#1a1a4b" }}
                >
                  Exclusivo para Petite
                </p>
              </div>

              {/* Contenido */}
              <div className="md:col-span-7">
                <h2
                  className="font-serif font-light leading-tight mb-6 text-3xl md:text-5xl tracking-tight"
                  style={{ color: "#1a1a4b" }}
                >
                  <em className="italic font-light">Pases</em>{" "}
                  <span className="font-medium uppercase tracking-wide">de bolso</span>
                </h2>

                <p className="text-slate-600 font-light leading-relaxed mb-10 text-base md:text-lg">
                  Los Pases de Bolso son un <strong className="font-medium" style={{ color: "#1a1a4b" }}>complemento exclusivo de la membresía Petite</strong>.
                  Permiten acceder durante una semana a una pieza de nuestras colecciones superiores
                  sin cambiar tu plan, perfectos para una ocasión especial.
                </p>

                <ul className="space-y-6">
                  {[
                    {
                      name: "L'Essentiel",
                      desc: "Una pieza de la colección L'Essentiel durante una semana",
                      price: "52€",
                    },
                    {
                      name: "Signature",
                      desc: "Una pieza de la colección Signature durante una semana",
                      price: "99€",
                    },
                    {
                      name: "Privé",
                      desc: "Una pieza exclusiva de la colección Privé durante una semana",
                      price: "137€",
                    },
                  ].map((pass) => (
                    <li
                      key={pass.name}
                      className="flex items-baseline justify-between gap-6 pb-6 border-b"
                      style={{ borderColor: "rgba(26, 26, 75, 0.15)" }}
                    >
                      <div className="flex-1">
                        <h3
                          className="font-serif text-xl md:text-2xl font-light mb-1"
                          style={{ color: "#1a1a4b" }}
                        >
                          Pase {pass.name}
                        </h3>
                        <p className="text-sm text-slate-600 font-light leading-relaxed">
                          {pass.desc}
                        </p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <span
                          className="font-serif text-2xl md:text-3xl font-light"
                          style={{ color: "#1a1a4b" }}
                        >
                          {pass.price}
                        </span>
                        <span className="text-xs text-slate-500 font-light ml-1">/semana</span>
                      </div>
                    </li>
                  ))}
                </ul>

                <p className="text-xs text-slate-500 font-light mt-8 leading-relaxed">
                  Los Pases se activan desde tu área privada de socia al reservar la pieza.
                  Opción de extender disponible.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Beneficios — lista editorial centrada estilo cocoon */}
        <section className="py-24 md:py-32" style={{ backgroundColor: "#faf8f5" }}>
          <div className="container mx-auto px-4">
            <h2
              className="text-center font-serif font-light leading-tight mb-16 md:mb-20 text-3xl md:text-5xl tracking-tight"
              style={{ color: "#1a1a4b" }}
            >
              <span className="font-medium uppercase tracking-wide">Beneficios de</span>{" "}
              <em className="italic font-light">Membresía</em>
            </h2>

            <ul className="max-w-3xl mx-auto text-center space-y-7">
              {[
                "Bolsos de lujo cuando quieras, por una fracción de su precio",
                "Conserva tu pieza durante todo el periodo de tu membresía",
                "Seguro y cobertura por desgaste habitual ya incluidos",
                "Solicita una segunda pieza con nuestros Pases de Bolso",
                "Acceso prioritario a las nuevas incorporaciones de la colección",
                "Atención dedicada por WhatsApp antes, durante y después del alquiler",
                "Pausa o cancela cuando lo necesites, sin compromisos",
                "Apoya la moda circular con cada alquiler que realizas",
              ].map((perk) => (
                <li
                  key={perk}
                  className="font-serif text-lg md:text-xl font-light leading-relaxed"
                  style={{ color: "#3a3a5e" }}
                >
                  {perk}
                </li>
              ))}
            </ul>

            <div className="text-center mt-16 md:mt-20">
              <a
                href="#faqs"
                className="inline-block uppercase tracking-[0.25em] text-xs font-medium border-b pb-1 hover:opacity-60 transition-opacity"
                style={{ color: "#1a1a4b", borderColor: "#1a1a4b" }}
              >
                Leer preguntas frecuentes
              </a>
            </div>
          </div>
        </section>

        {/* FAQs — hairline editorial estilo cocoon */}
        <section id="faqs" className="py-24 md:py-32 bg-white">
          <div className="container mx-auto px-4">
            <h2
              className="text-center font-serif font-light leading-tight mb-16 md:mb-20 text-3xl md:text-5xl tracking-tight"
              style={{ color: "#1a1a4b" }}
            >
              <span className="font-medium">Preguntas</span>{" "}
              <em className="italic font-light">frecuentes</em>
            </h2>

            <div className="max-w-3xl mx-auto">
              {[
                {
                  q: "Acabo de inscribirme, ¿qué pasa después?",
                  a: "Recibirás un email de bienvenida con los pasos para activar tu cuenta. Una vez verificada tu identidad, podrás elegir tu primer bolso de la colección disponible según tu membresía. Lo enviamos a tu domicilio en 24-48h dentro de la península.",
                },
                {
                  q: "¿Plazo mínimo de membresía?",
                  a: "Las membresías mensuales se renuevan cada mes y puedes cancelar en cualquier momento antes del siguiente cobro. La membresía trimestral tiene un compromiso inicial de 3 meses y posteriormente se renueva trimestralmente.",
                },
                {
                  q: "¿Cuántos bolsos puedo disfrutar cada mes?",
                  a: "Petite y L'Essentiel incluyen un bolso al mes. Signature permite un intercambio mensual con acceso a piezas premium. Privé ofrece la mayor flexibilidad con acceso a las casas más exclusivas. Si quieres una pieza adicional, puedes adquirir un Pase de Bolso semanal.",
                },
                {
                  q: "¿Cuánto tiempo puedo conservar mi bolso?",
                  a: "Durante todo tu periodo de membresía activa. Cuando quieras cambiarlo por otro, solicita el intercambio desde tu área privada y recogemos el actual al entregar el nuevo.",
                },
                {
                  q: "¿Qué sucede si pierdo o daño un bolso?",
                  a: "Todas las membresías incluyen cobertura para desgaste habitual. En caso de daño accidental grave o pérdida, contacta inmediatamente con nuestro equipo y te acompañaremos en el proceso de resolución, sin sorpresas ni letra pequeña.",
                },
                {
                  q: "¿Los bolsos son 100% auténticos?",
                  a: "Sí. Cada pieza es autenticada por expertos antes de incorporarse a la colección y revisada de nuevo entre alquileres. Trabajamos exclusivamente con piezas originales de las casas de lujo más reconocidas del mundo.",
                },
                {
                  q: "¿Cómo cancelo mi membresía?",
                  a: "Desde tu área privada de socia puedes cancelar en cualquier momento, sin penalizaciones. Mantendrás el acceso hasta el final del periodo ya pagado.",
                },
                {
                  q: "¿Hacéis envíos fuera de España peninsular?",
                  a: "Actualmente operamos en territorio peninsular español. Estamos trabajando para ampliar a Baleares, Canarias y resto de Europa próximamente. Suscríbete a nuestra lista privada para ser de las primeras en saberlo.",
                },
              ].map((faq, idx) => (
                <details
                  key={idx}
                  className="group border-b first:border-t"
                  style={{ borderColor: "rgba(26, 26, 75, 0.15)" }}
                >
                  <summary
                    className="flex items-center justify-between py-6 md:py-7 cursor-pointer list-none"
                    style={{ color: "#1a1a4b" }}
                  >
                    <span className="font-serif text-lg md:text-xl font-light pr-6 leading-snug">
                      {faq.q}
                    </span>
                    <span
                      className="flex-shrink-0 text-2xl font-light transition-transform duration-300 group-open:rotate-45"
                      aria-hidden="true"
                    >
                      +
                    </span>
                  </summary>
                  <div className="pb-7 pr-10 md:pr-12 -mt-2">
                    <p className="text-slate-600 font-light leading-relaxed text-base">
                      {faq.a}
                    </p>
                  </div>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 text-center">
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto font-light">
              Descubre más sobre nuestras{" "}
              <Link href="/#membresias" className="underline hover:no-underline" style={{ color: "#1a1a4b" }}>
                membresías disponibles
              </Link>{" "}
              o explora nuestra{" "}
              <Link href="/catalog" className="underline hover:no-underline" style={{ color: "#1a1a4b" }}>
                colección completa
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
    </div>
  )
}
