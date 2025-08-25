"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar, Clock, ArrowRight } from "lucide-react"

const featuredArticles = [
  {
    id: 1,
    title: "La Historia Secreta del Birkin de Hermès",
    excerpt:
      "Descubre los orígenes de uno de los bolsos más codiciados del mundo y por qué su lista de espera puede durar años.",
    category: "Historia",
    readTime: "8 min",
    date: "15 Mar 2024",
    image: "bg-rose-nude",
    featured: true,
  },
  {
    id: 2,
    title: "Cómo Elegir el Bolso Perfecto para Cada Ocasión",
    excerpt:
      "Nuestra guía definitiva para seleccionar el complemento ideal según el evento, la temporada y tu estilo personal.",
    category: "Guía de Estilo",
    readTime: "6 min",
    date: "12 Mar 2024",
    image: "bg-rose-pastel/20",
  },
  {
    id: 3,
    title: "Entrevista: Gabrielle Chanel y su Legado Atemporal",
    excerpt:
      "Un viaje por la vida de la mujer que revolucionó la moda femenina y creó algunos de los diseños más icónicos.",
    category: "Entrevista",
    readTime: "12 min",
    date: "10 Mar 2024",
    image: "bg-indigo-dark/10",
  },
  {
    id: 4,
    title: "Tendencias Primavera 2024: Colores y Texturas",
    excerpt: "Los tonos y materiales que dominarán la próxima temporada según las pasarelas de París y Milán.",
    category: "Tendencias",
    readTime: "5 min",
    date: "8 Mar 2024",
    image: "bg-rose-nude/60",
  },
]

export default function MagazineSection() {
  const [email, setEmail] = useState("")
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [subscribed, setSubscribed] = useState(false)

  const handleNewsletterSubscription = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return

    setIsSubscribing(true)

    try {
      const response = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name: email.split("@")[0], // Usar la parte antes del @ como nombre por defecto
          preferences: {
            newArrivals: true,
            exclusiveOffers: true,
            styleGuides: true,
            events: false,
            membershipUpdates: true,
          },
        }),
      })

      if (response.ok) {
        setSubscribed(true)
        setEmail("")
      } else {
        const errorData = await response.json()
        console.error("Error al suscribirse:", errorData)
        // Aquí podrías mostrar un mensaje de error al usuario
      }
    } catch (error) {
      console.error("Error al suscribirse:", error)
      // Aquí podrías mostrar un mensaje de error al usuario
    } finally {
      setIsSubscribing(false)
    }
  }

  return (
    <section
      id="magazine"
      className="py-16 md:py-24 bg-gradient-to-b from-rose-nude/3 via-rose-pastel/5 to-rose-nude/3"
    >
      <div className="container mx-auto px-4">
        {/* Encabezado editorial */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 mb-12 md:mb-20">
          <div className="lg:col-span-4 text-center lg:text-left">
            <p className="text-xs uppercase tracking-widest mb-4 md:mb-6 font-medium text-indigo-dark">
              Semzo Magazine
            </p>
            <h2 className="font-serif text-3xl md:text-4xl lg:text-5xl font-light leading-tight text-slate-900">
              Historias de elegancia y sofisticación
            </h2>
          </div>
          <div className="hidden lg:block lg:col-span-1"></div>
          <div className="lg:col-span-7">
            <p className="text-slate-600 text-base md:text-lg leading-relaxed font-light mb-6 md:mb-8 text-center lg:text-left">
              Sumérgete en el fascinante mundo de la moda de lujo. Desde la historia de las casas más prestigiosas hasta
              las últimas tendencias, nuestro magazine es tu ventana al universo de la elegancia atemporal.
            </p>
            <div className="flex justify-center lg:justify-start">
              <Button className="rounded-none px-6 md:px-8 py-3 md:py-4 text-sm uppercase tracking-widest font-medium bg-white/80 backdrop-blur-sm border border-slate-200 text-slate-900 hover:bg-white transition-all duration-300">
                Ver todos los artículos
              </Button>
            </div>
          </div>
        </div>

        {/* Layout tipo revista - stack en móvil */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Artículo destacado */}
          <div className="lg:col-span-8">
            <article className="group cursor-pointer">
              <div
                className={`relative aspect-[4/3] md:aspect-[16/10] w-full rounded-lg ${featuredArticles[0].image} flex items-center justify-center mb-6 md:mb-8 overflow-hidden`}
              >
                <div className="text-center p-6 md:p-8">
                  <div className="w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 mx-auto mb-4 md:mb-6 rounded-full bg-white/40 flex items-center justify-center">
                    <span className="text-2xl md:text-3xl lg:text-4xl text-indigo-dark">SM</span>
                  </div>
                  <h3 className="text-lg md:text-xl font-serif text-indigo-dark mb-2">Imagen Destacada</h3>
                  <p className="text-sm text-slate-600">Artículo principal del magazine</p>
                </div>

                {/* Overlay con categoría */}
                <div className="absolute top-4 md:top-6 left-4 md:left-6">
                  <span className="px-3 md:px-4 py-1 md:py-2 bg-white/95 backdrop-blur-sm rounded-lg text-xs uppercase tracking-widest font-medium text-indigo-dark">
                    {featuredArticles[0].category}
                  </span>
                </div>
              </div>

              <div className="space-y-3 md:space-y-4 text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start space-x-4 md:space-x-6 text-sm text-slate-500">
                  <div className="flex items-center space-x-2">
                    <Calendar className="h-4 w-4" />
                    <span>{featuredArticles[0].date}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Clock className="h-4 w-4" />
                    <span>{featuredArticles[0].readTime} lectura</span>
                  </div>
                </div>

                <h3 className="font-serif text-2xl md:text-3xl lg:text-4xl text-indigo-dark leading-tight group-hover:text-indigo-dark/80 transition-colors">
                  {featuredArticles[0].title}
                </h3>

                <p className="text-base md:text-lg text-slate-600 leading-relaxed font-light">
                  {featuredArticles[0].excerpt}
                </p>

                <div className="flex items-center justify-center lg:justify-start text-indigo-dark group-hover:translate-x-2 transition-transform">
                  <span className="text-sm uppercase tracking-widest font-medium mr-2">Leer artículo</span>
                  <ArrowRight className="h-4 w-4" />
                </div>
              </div>
            </article>
          </div>

          {/* Artículos secundarios - mejor spacing en móvil */}
          <div className="lg:col-span-4 space-y-8 md:space-y-12">
            {featuredArticles.slice(1).map((article) => (
              <article key={article.id} className="group cursor-pointer">
                <div
                  className={`relative aspect-[4/3] w-full rounded-lg ${article.image} flex items-center justify-center mb-4 md:mb-6 overflow-hidden`}
                >
                  <div className="text-center p-4 md:p-6">
                    <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 rounded-full bg-white/40 flex items-center justify-center">
                      <span className="text-xl md:text-2xl text-indigo-dark">SM</span>
                    </div>
                    <p className="text-xs text-slate-600">Imagen del artículo</p>
                  </div>

                  {/* Overlay con categoría */}
                  <div className="absolute top-3 md:top-4 left-3 md:left-4">
                    <span className="px-2 md:px-3 py-1 bg-white/95 backdrop-blur-sm rounded text-xs uppercase tracking-widest font-medium text-indigo-dark">
                      {article.category}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 md:space-y-3 text-center lg:text-left">
                  <div className="flex items-center justify-center lg:justify-start space-x-3 md:space-x-4 text-xs text-slate-500">
                    <span>{article.date}</span>
                    <span>•</span>
                    <span>{article.readTime}</span>
                  </div>

                  <h4 className="font-serif text-lg md:text-xl text-indigo-dark leading-tight group-hover:text-indigo-dark/80 transition-colors">
                    {article.title}
                  </h4>

                  <p className="text-sm text-slate-600 leading-relaxed font-light line-clamp-3">{article.excerpt}</p>

                  <div className="flex items-center justify-center lg:justify-start text-indigo-dark group-hover:translate-x-1 transition-transform">
                    <span className="text-xs uppercase tracking-widest font-medium mr-2">Leer más</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        {/* Newsletter del magazine - optimizada para móvil */}
        <div className="mt-16 md:mt-24 p-6 md:p-12 rounded-lg bg-white/60 backdrop-blur-sm border border-slate-200">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center text-center md:text-left">
            <div>
              <h3 className="font-serif text-2xl md:text-3xl text-indigo-dark mb-4">Suscríbete a Semzo Magazine</h3>
              <p className="text-slate-600 leading-relaxed font-light">
                Recibe nuestros artículos exclusivos, guías de estilo y las últimas tendencias directamente en tu
                bandeja de entrada. Una dosis semanal de elegancia y sofisticación.
              </p>
            </div>
            <div className="space-y-4">
              {subscribed ? (
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-green-800 font-medium">¡Gracias por suscribirte!</p>
                  <p className="text-green-600 text-sm">Recibirás nuestro próximo newsletter pronto.</p>
                </div>
              ) : (
                <form onSubmit={handleNewsletterSubscription} className="flex flex-col sm:flex-row">
                  <input
                    type="email"
                    placeholder="tu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="flex-1 px-4 md:px-6 py-3 md:py-4 border border-slate-200 rounded-t sm:rounded-l sm:rounded-t-none focus:outline-none focus:border-indigo-dark text-slate-900"
                  />
                  <Button
                    type="submit"
                    disabled={isSubscribing}
                    className="rounded-b sm:rounded-l-none sm:rounded-r px-6 md:px-8 py-3 md:py-4 bg-indigo-dark text-white hover:bg-indigo-dark/90 transition-all duration-300 disabled:opacity-50"
                  >
                    {isSubscribing ? "Suscribiendo..." : "Suscribirse"}
                  </Button>
                </form>
              )}
              <p className="text-xs text-slate-500 text-center">
                Sin spam. Solo contenido de calidad. Cancela cuando quieras.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
