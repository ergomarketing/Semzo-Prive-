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

        {/* CTA Section */}
        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 text-center">
            <p className="text-lg text-slate-600 mb-8 max-w-2xl mx-auto font-light">
              Descubre más sobre nuestras{" "}
              <Link href="/membresias" className="underline hover:no-underline" style={{ color: "#1a1a4b" }}>
                membresías disponibles
              </Link>{" "}
              o explora nuestra{" "}
              <Link href="/coleccion" className="underline hover:no-underline" style={{ color: "#1a1a4b" }}>
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
