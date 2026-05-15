"use client"

import Image from "next/image"
import Link from "next/link"

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

        {/* Marcas Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <p className="text-xs uppercase tracking-widest mb-6 font-medium" style={{ color: "#1a1a4b" }}>
                Las marcas
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-light leading-tight mb-6" style={{ color: "#1a1a4b" }}>
                Las casas de lujo más icónicas, en tus manos
              </h2>
              <p className="text-slate-600 text-lg leading-relaxed font-light">
                Trabajamos con una curación exclusiva de marcas reconocidas mundialmente.
                Cada pieza es autenticada y verificada por expertos antes de unirse a nuestra colección.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-px bg-slate-100 max-w-5xl mx-auto">
              {[
                "Bottega Veneta",
                "Celine",
                "Chanel",
                "Dior",
                "Fendi",
                "Gucci",
                "Hermès",
                "Loewe",
                "Louis Vuitton",
                "Miu Miu",
                "Prada",
                "Saint Laurent",
              ].map((brand) => (
                <div
                  key={brand}
                  className="bg-white py-10 px-4 flex items-center justify-center text-center hover:bg-slate-50 transition-colors"
                >
                  <span
                    className="font-serif text-base md:text-lg font-light tracking-wide"
                    style={{ color: "#1a1a4b" }}
                  >
                    {brand}
                  </span>
                </div>
              ))}
            </div>

            <p className="text-center text-sm text-slate-500 font-light mt-10 max-w-xl mx-auto">
              La disponibilidad de cada marca varía según el plan de membresía contratado.
              Las membresías Signature y Privé incluyen acceso a las casas más exclusivas.
            </p>
          </div>
        </section>

        {/* Beneficios / Perks Section */}
        <section
          className="py-24"
          style={{
            background:
              "linear-gradient(180deg, rgba(255, 240, 243, 0.4) 0%, rgba(248, 232, 235, 0.2) 100%)",
          }}
        >
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <p className="text-xs uppercase tracking-widest mb-6 font-medium" style={{ color: "#1a1a4b" }}>
                Beneficios de la membresía
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-light leading-tight" style={{ color: "#1a1a4b" }}>
                Todo lo que incluye ser parte de Semzo Privé
              </h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
              {[
                {
                  title: "Envío y devolución gratuitos",
                  desc: "Empaquetado premium, seguimiento en tiempo real y entregas express en 24-48 horas dentro de España.",
                },
                {
                  title: "Seguro completo incluido",
                  desc: "Cada bolso está protegido contra daños accidentales y desgaste normal durante todo el periodo de uso.",
                },
                {
                  title: "Autenticación garantizada",
                  desc: "Cada pieza es verificada por expertos en autenticación de lujo antes de llegar a tus manos.",
                },
                {
                  title: "Intercambios flexibles",
                  desc: "Cambia tu bolso por otro de la colección según tu plan, sin costos ocultos ni penalizaciones.",
                },
                {
                  title: "Pausa tu membresía",
                  desc: "Pausa tu suscripción cuando lo necesites y reactívala cuando quieras volver a disfrutarla.",
                },
                {
                  title: "Acceso prioritario a novedades",
                  desc: "Las socias acceden primero a las nuevas piezas que se incorporan a la colección cada mes.",
                },
                {
                  title: "Lujo circular y consciente",
                  desc: "Disfruta de bolsos de 3.000-10.000€ por una fracción del precio, reduciendo el impacto de tu consumo.",
                },
                {
                  title: "Atención personalizada",
                  desc: "Soporte dedicado por WhatsApp y email para resolver cualquier consulta antes, durante o después del alquiler.",
                },
                {
                  title: "Sin compromisos a largo plazo",
                  desc: "Cancela cuando quieras. Sin penalizaciones ni letra pequeña. Tú decides cuánto tiempo quedarte.",
                },
              ].map((perk) => (
                <div
                  key={perk.title}
                  className="bg-white p-8 rounded-lg border border-slate-100"
                >
                  <h3 className="font-serif text-xl font-light mb-3" style={{ color: "#1a1a4b" }}>
                    {perk.title}
                  </h3>
                  <p className="text-slate-600 font-light text-sm leading-relaxed">{perk.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQs Section */}
        <section className="py-24 bg-white">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16 max-w-3xl mx-auto">
              <p className="text-xs uppercase tracking-widest mb-6 font-medium" style={{ color: "#1a1a4b" }}>
                Preguntas frecuentes
              </p>
              <h2 className="font-serif text-3xl md:text-4xl font-light leading-tight" style={{ color: "#1a1a4b" }}>
                Resolvemos tus dudas
              </h2>
            </div>

            <div className="max-w-3xl mx-auto space-y-4">
              {[
                {
                  q: "¿Cómo funciona la membresía?",
                  a: "Elige el plan que mejor se adapte a tu estilo de vida, selecciona tu bolso favorito de nuestra colección y nosotros nos encargamos del resto. Recibes el bolso en 24-48h, lo disfrutas el tiempo que dure tu periodo y al finalizar lo intercambias por otro o lo devuelves.",
                },
                {
                  q: "¿Los bolsos son auténticos?",
                  a: "Sí, absolutamente. Cada bolso es autenticado por expertos antes de entrar en nuestra colección y verificado de nuevo entre alquileres. Trabajamos solo con piezas 100% genuinas de las casas de lujo más reconocidas del mundo.",
                },
                {
                  q: "¿Qué pasa si daño el bolso accidentalmente?",
                  a: "Todas nuestras membresías incluyen seguro completo que cubre daños accidentales y el desgaste normal del uso. Si ocurre algo grave, contacta inmediatamente con nuestro equipo de soporte y te guiaremos en el proceso.",
                },
                {
                  q: "¿Puedo cancelar o pausar mi membresía?",
                  a: "Sí. Puedes cancelar tu suscripción en cualquier momento sin penalizaciones ni letra pequeña. También puedes pausarla temporalmente si necesitas un descanso y reactivarla cuando quieras.",
                },
                {
                  q: "¿Cuántas veces puedo intercambiar el bolso?",
                  a: "Depende del plan: las membresías mensuales permiten un intercambio al mes, mientras que la membresía trimestral incluye intercambios cada 3 meses. El envío de ida y vuelta siempre está incluido.",
                },
                {
                  q: "¿Hacéis envíos fuera de España?",
                  a: "Actualmente operamos en territorio español peninsular. Estamos trabajando para ampliar nuestro servicio a Baleares, Canarias y resto de Europa próximamente.",
                },
                {
                  q: "¿Qué diferencia hay entre los planes?",
                  a: "Cada plan ofrece acceso a una categoría de bolsos distinta. Petite y L'Essentiel son perfectos para empezar, Signature da acceso a piezas premium, y Privé desbloquea las casas más exclusivas como Chanel y Hermès.",
                },
                {
                  q: "¿Necesito firmar un contrato largo?",
                  a: "No. Nuestras membresías son flexibles y sin compromisos a largo plazo. Pagas mes a mes o trimestralmente según el plan elegido, y puedes cancelar cuando quieras.",
                },
              ].map((faq, idx) => (
                <details
                  key={idx}
                  className="group bg-white border border-slate-200 rounded-lg overflow-hidden"
                >
                  <summary className="flex items-center justify-between p-6 cursor-pointer list-none hover:bg-slate-50 transition-colors">
                    <span className="font-serif text-lg font-light pr-4" style={{ color: "#1a1a4b" }}>
                      {faq.q}
                    </span>
                    <span
                      className="flex-shrink-0 w-6 h-6 flex items-center justify-center transition-transform group-open:rotate-45"
                      style={{ color: "#1a1a4b" }}
                      aria-hidden="true"
                    >
                      <svg
                        width="16"
                        height="16"
                        viewBox="0 0 16 16"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M8 1V15M1 8H15"
                          stroke="currentColor"
                          strokeWidth="1.2"
                          strokeLinecap="round"
                        />
                      </svg>
                    </span>
                  </summary>
                  <div className="px-6 pb-6 -mt-1">
                    <p className="text-slate-600 font-light leading-relaxed">{faq.a}</p>
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
