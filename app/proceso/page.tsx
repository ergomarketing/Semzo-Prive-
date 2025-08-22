"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Package, Shield, Truck, RefreshCw } from "lucide-react"
import Link from "next/link"
import NavbarImproved from "../components/navbar-improved"
import Footer from "../components/footer"

export default function ProcesoPage() {
  const steps = [
    {
      icon: Package,
      title: "Elige tu bolso",
      description: "Explora nuestra colección exclusiva y selecciona el bolso perfecto para tu estilo y ocasión.",
      details: [
        "Catálogo actualizado mensualmente",
        "Filtros por marca, color y ocasión",
        "Disponibilidad en tiempo real",
      ],
    },
    {
      icon: Truck,
      title: "Recibe en casa",
      description: "Tu bolso llegará cuidadosamente empaquetado en 24-48 horas con envío gratuito.",
      details: ["Envío express gratuito", "Empaquetado premium", "Seguimiento en tiempo real"],
    },
    {
      icon: Shield,
      title: "Disfruta con confianza",
      description:
        "Usa tu bolso con total tranquilidad. Está completamente asegurado durante todo el período de alquiler.",
      details: ["Seguro completo incluido", "Protección contra daños", "Soporte 24/7"],
    },
    {
      icon: RefreshCw,
      title: "Intercambia cuando quieras",
      description: "¿Listo para algo nuevo? Intercambia tu bolso por otro de la colección cuando desees.",
      details: ["Intercambios ilimitados", "Sin costos adicionales", "Proceso simple y rápido"],
    },
  ]

  return (
    <div className="min-h-screen bg-white">
      <NavbarImproved />

      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 bg-gradient-to-b from-slate-50 to-white">
          <div className="container mx-auto px-4 text-center">
            <h1 className="font-serif text-4xl md:text-5xl text-slate-900 mb-6">Cómo Funciona Semzo Privé</h1>
            <p className="text-xl text-slate-600 max-w-3xl mx-auto mb-8">
              Descubre lo fácil que es acceder a bolsos de lujo de las mejores marcas del mundo. Un proceso simple,
              seguro y diseñado para tu comodidad.
            </p>
            <Link href="/membership-signup">
              <Button className="bg-slate-900 text-white hover:bg-slate-800 px-8 py-3">
                Comenzar Ahora
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>

        {/* Process Steps */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
              {steps.map((step, index) => (
                <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="p-8 text-center">
                    <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-slate-100 flex items-center justify-center">
                      <step.icon className="h-8 w-8 text-slate-900" />
                    </div>
                    <div className="text-sm text-slate-500 mb-2">Paso {index + 1}</div>
                    <h3 className="font-serif text-xl text-slate-900 mb-4">{step.title}</h3>
                    <p className="text-slate-600 mb-6">{step.description}</p>
                    <ul className="text-sm text-slate-500 space-y-2">
                      {step.details.map((detail, detailIndex) => (
                        <li key={detailIndex} className="flex items-center justify-center">
                          <div className="w-1 h-1 bg-slate-400 rounded-full mr-2"></div>
                          {detail}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-slate-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="font-serif text-3xl text-slate-900 mb-4">¿Por qué elegir Semzo Privé?</h2>
              <p className="text-xl text-slate-600 max-w-2xl mx-auto">
                Más que un servicio de alquiler, es tu acceso a un mundo de lujo y elegancia.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-900 flex items-center justify-center">
                  <Shield className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-serif text-xl text-slate-900 mb-3">100% Seguro</h3>
                <p className="text-slate-600">
                  Todos nuestros bolsos están completamente asegurados. Disfruta sin preocupaciones.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-900 flex items-center justify-center">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-serif text-xl text-slate-900 mb-3">Marcas Exclusivas</h3>
                <p className="text-slate-600">
                  Accede a bolsos de Chanel, Hermès, Louis Vuitton, Dior y muchas más marcas de lujo.
                </p>
              </div>

              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-slate-900 flex items-center justify-center">
                  <RefreshCw className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-serif text-xl text-slate-900 mb-3">Flexibilidad Total</h3>
                <p className="text-slate-600">Cambia de bolso cuando quieras. Sin compromisos a largo plazo.</p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20">
          <div className="container mx-auto px-4 text-center">
            <h2 className="font-serif text-3xl text-slate-900 mb-4">¿Lista para comenzar tu experiencia de lujo?</h2>
            <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
              Únete a miles de mujeres que ya disfrutan de la libertad de cambiar de estilo cuando quieren.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/catalog">
                <Button variant="outline" className="border-slate-300 text-slate-700 hover:bg-slate-50 bg-transparent">
                  Ver Colección
                </Button>
              </Link>
              <Link href="/membership-signup">
                <Button className="bg-slate-900 text-white hover:bg-slate-800">Elegir Membresía</Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  )
}
