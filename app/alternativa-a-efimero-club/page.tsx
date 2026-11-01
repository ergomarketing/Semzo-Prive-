import type { Metadata } from "next"
import Link from "next/link"

// Pagina estatica de captacion: gente que busca "efimero club" y no encuentra un servicio activo.
// No afirma que otra empresa haya cerrado ni insinua relacion con ella: solo presenta SEMZO PRIVE.
export const revalidate = 3600

const URL = "https://semzoprive.com/alternativa-a-efimero-club"
const TITLE = "Alternativa a Efímero Club: alquiler de bolsos de lujo | SEMZO PRIVÉ"
const DESCRIPTION =
  "¿Buscabas Efímero Club? SEMZO PRIVÉ es un club privado de alquiler de bolsos de lujo en España: desde 59 € al mes, envío en 24-48 h y sin permanencia en la membresía mensual."

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESCRIPTION,
  alternates: { canonical: URL },
  openGraph: {
    type: "website",
    locale: "es_ES",
    title: TITLE,
    description: DESCRIPTION,
    url: URL,
    siteName: "Semzo Privé",
    images: [
      { url: "https://semzoprive.com/images/hero-luxury-bags.jpeg", width: 1200, height: 630, alt: "Bolsos de lujo en alquiler, SEMZO PRIVÉ" },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["https://semzoprive.com/images/hero-luxury-bags.jpeg"],
  },
}

const STEPS = [
  { title: "Elige tu membresía", desc: "L'Essentiel, Signature o Privé, según la colección que quieras. Mensual o trimestral." },
  { title: "Elige tu bolso", desc: "Todos son auténticos y están revisados por expertos entre alquiler y alquiler." },
  { title: "Recíbelo en 24-48 h", desc: "Envío incluido en península. Lo conservas mientras tu membresía esté activa." },
  { title: "Cámbialo cuando quieras", desc: "Pides el intercambio desde tu área privada y recogemos el anterior al entregarte el nuevo." },
]

const PLANS = [
  { name: "L'Essentiel", price: "59 €", period: "al mes", desc: "Un bolso al mes de la colección L'Essentiel." },
  { name: "Signature", price: "149 €", period: "al mes", desc: "Un bolso al mes de la colección Signature." },
  { name: "Privé", price: "279 €", period: "al mes", desc: "Un bolso al mes de la colección Privé." },
]

const FAQS = [
  {
    q: "¿Es SEMZO PRIVÉ lo mismo que Efímero Club?",
    a: "No. SEMZO PRIVÉ es una empresa distinta, sin relación con Efímero Club. Somos un club privado de alquiler de bolsos de lujo por suscripción con sede en España.",
  },
  {
    q: "¿Cómo funciona la suscripción?",
    a: "Pagas una cuota fija mensual o trimestral según tu colección y recibes un bolso al mes con envío y seguro incluidos. Puedes cambiarlo cuando quieras desde tu área privada.",
  },
  {
    q: "¿Hay permanencia?",
    a: "Las membresías mensuales se renuevan cada mes y puedes cancelar en cualquier momento antes del siguiente cobro. La trimestral tiene un compromiso inicial de 3 meses.",
  },
  {
    q: "¿Qué pasa si me enamoro de un bolso?",
    a: "Con Colecciona, las cuotas de membresía que has pagado se acumulan como crédito personal para comprar un bolso elegible, con un descuento máximo del 20 % sobre su precio de venta.",
  },
  {
    q: "¿Los bolsos son auténticos?",
    a: "Sí. Cada pieza es revisada y autenticada por expertos antes de entrar en la colección y se inspecciona de nuevo entre alquileres.",
  },
]

const faqSchema = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({
    "@type": "Question",
    name: f.q,
    acceptedAnswer: { "@type": "Answer", text: f.a },
  })),
}

export default function AlternativaEfimeroClubPage() {
  return (
    <div className="min-h-screen bg-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      <main className="pt-20">
        <section className="py-20 md:py-24" style={{ backgroundColor: "#fff0f3" }}>
          <div className="container mx-auto px-4">
            <div className="max-w-3xl">
              <p className="text-xs uppercase tracking-widest mb-6 font-medium" style={{ color: "#1a1a4b" }}>
                Alquiler de bolsos de lujo en España
              </p>
              <h1 className="font-serif text-4xl md:text-5xl font-light leading-tight mb-6" style={{ color: "#1a1a4b" }}>
                ¿Buscabas Efímero Club? Una alternativa para llevar bolsos de lujo sin comprarlos.
              </h1>
              <p className="text-slate-600 text-lg leading-relaxed font-light mb-10">
                SEMZO PRIVÉ es un club privado de alquiler de bolsos de lujo por suscripción. Una cuota fija, un bolso
                auténtico en tu casa en 24-48 horas y la libertad de cambiarlo cuando quieras.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  href="/membresias"
                  className="inline-block px-8 py-4 text-sm uppercase tracking-widest text-white"
                  style={{ backgroundColor: "#1a1a4b" }}
                >
                  Ver membresías
                </Link>
                <Link
                  href="/catalog"
                  className="inline-block px-8 py-4 text-sm uppercase tracking-widest border"
                  style={{ borderColor: "#1a1a4b", color: "#1a1a4b" }}
                >
                  Ver el catálogo
                </Link>
              </div>
            </div>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="container mx-auto px-4">
            <p className="text-xs uppercase tracking-widest mb-4 font-medium" style={{ color: "#1a1a4b" }}>
              Cómo funciona
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-light mb-12 max-w-2xl" style={{ color: "#1a1a4b" }}>
              Cuatro pasos y el bolso ya es tuyo mientras seas socia.
            </h2>
            <div className="grid md:grid-cols-2 gap-x-12 gap-y-10">
              {STEPS.map((step, idx) => (
                <div key={step.title} className="pt-6" style={{ borderTop: "1px solid rgba(244, 196, 204, 0.6)" }}>
                  <div className="text-xs uppercase tracking-widest mb-3 font-medium" style={{ color: "#1a1a4b" }}>
                    Paso {String(idx + 1).padStart(2, "0")}
                  </div>
                  <h3 className="font-serif text-2xl font-light mb-2" style={{ color: "#1a1a4b" }}>
                    {step.title}
                  </h3>
                  <p className="text-slate-600 font-light leading-relaxed">{step.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-20" style={{ backgroundColor: "#fff0f3" }}>
          <div className="container mx-auto px-4">
            <p className="text-xs uppercase tracking-widest mb-4 font-medium" style={{ color: "#1a1a4b" }}>
              Precios claros
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-light mb-4 max-w-2xl" style={{ color: "#1a1a4b" }}>
              Una cuota fija, sin letra pequeña.
            </h2>
            <p className="text-slate-600 font-light leading-relaxed max-w-2xl mb-12">
              Envío y seguro por desgaste habitual incluidos. Pausa o cancela cuando lo necesites desde tu área privada.
            </p>
            <div className="grid md:grid-cols-3 gap-6">
              {PLANS.map((plan) => (
                <div key={plan.name} className="bg-white p-8 border" style={{ borderColor: "rgba(244, 196, 204, 0.6)" }}>
                  <h3 className="font-serif text-2xl font-light mb-4" style={{ color: "#1a1a4b" }}>
                    {plan.name}
                  </h3>
                  <p className="mb-4">
                    <span className="font-serif text-4xl font-light" style={{ color: "#1a1a4b" }}>
                      {plan.price}
                    </span>
                    <span className="text-slate-500 text-sm"> {plan.period}</span>
                  </p>
                  <p className="text-slate-600 font-light leading-relaxed">{plan.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-slate-600 font-light leading-relaxed max-w-2xl mt-8">
              ¿Solo necesitas un bolso para una boda o un evento? Con Petite (19,99 € al mes) puedes pedir Pases de Bolso
              semanales desde 52 €.
            </p>
          </div>
        </section>

        <section className="py-20 bg-white">
          <div className="container mx-auto px-4 max-w-3xl">
            <p className="text-xs uppercase tracking-widest mb-4 font-medium" style={{ color: "#1a1a4b" }}>
              Preguntas frecuentes
            </p>
            <h2 className="font-serif text-3xl md:text-4xl font-light mb-10" style={{ color: "#1a1a4b" }}>
              Lo que suelen preguntarnos
            </h2>
            <div className="space-y-8">
              {FAQS.map((faq) => (
                <div key={faq.q} className="pt-6" style={{ borderTop: "1px solid rgba(244, 196, 204, 0.6)" }}>
                  <h3 className="font-serif text-xl font-light mb-2" style={{ color: "#1a1a4b" }}>
                    {faq.q}
                  </h3>
                  <p className="text-slate-600 font-light leading-relaxed">{faq.a}</p>
                </div>
              ))}
            </div>
            <div className="mt-14">
              <Link
                href="/membresias"
                className="inline-block px-8 py-4 text-sm uppercase tracking-widest text-white"
                style={{ backgroundColor: "#1a1a4b" }}
              >
                Elegir mi membresía
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
