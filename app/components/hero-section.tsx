"use client"

import { Button } from "../components/ui/button"
import { Shield, CheckCircle } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export default function HeroSection() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-gradient-to-b from-indigo-dark/20 via-rose-pastel/10 to-rose-nude/5">
      <div className="container mx-auto px-4 pt-32 md:pt-40 pb-12 md:pb-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-x-8 items-center">
          {/* Contenido principal - móvil primero */}
          <div className="lg:col-span-5 space-y-8 md:space-y-12 relative z-10 text-center lg:text-left">
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 mb-4 md:mb-6 font-medium">
                Membresía exclusiva
              </p>
              <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-light text-slate-900 leading-[1.1] tracking-tight">
                Tu puerta de acceso al
                <br />
                <span className="text-indigo-dark">armario de</span>
                <br />
                tus sueños
              </h1>
            </div>

            <p className="text-slate-600 text-lg md:text-xl leading-relaxed font-light max-w-md mx-auto lg:mx-0">
              Accede a bolsos de lujo de diseñador mediante nuestra exclusiva membresía. Elegancia sin límites,
              sostenibilidad sin compromisos.
            </p>

            {/* Sello de autenticidad - optimizado para móvil */}
            <div className="flex items-center justify-center lg:justify-start">
              <div className="flex items-center space-x-3 p-4 bg-white/80 backdrop-blur-sm rounded-lg border border-slate-200 w-fit">
                <div className="relative">
                  <Shield className="h-6 w-6 md:h-8 md:w-8 text-indigo-dark" />
                  <CheckCircle className="h-3 w-3 md:h-4 md:w-4 text-green-600 absolute -top-1 -right-1" />
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-900">100% Autenticidad</p>
                  <p className="text-xs text-slate-600">Garantizada</p>
                </div>
              </div>
            </div>

            {/* Botones - stack en móvil, inline en desktop */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-6">
              <Button
                onClick={() => {
                  const membresiaSection = document.getElementById("membresias")
                  if (membresiaSection) {
                    membresiaSection.scrollIntoView({ behavior: "smooth" })
                  }
                }}
                className="w-full sm:w-auto rounded-none px-6 md:px-8 py-4 md:py-6 text-sm uppercase tracking-widest font-medium transition-all duration-300 bg-indigo-dark text-white hover:bg-indigo-dark/90 hover:scale-105 transform"
              >
                Comenzar suscripción
              </Button>
              <Link href="/catalog">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto rounded-none px-6 md:px-8 py-4 md:py-6 text-sm uppercase tracking-widest font-medium transition-all duration-300 border-2 border-indigo-dark text-indigo-dark hover:bg-indigo-dark hover:text-white hover:scale-105 transform bg-transparent"
                >
                  Ver colección
                </Button>
              </Link>
            </div>
          </div>

          {/* Espacio vacío solo en desktop */}
          <div className="hidden lg:block lg:col-span-1"></div>

          {/* Imagen principal */}
          <div className="lg:col-span-6 relative order-first lg:order-last">
            <div className="relative aspect-[16/10] w-full rounded-2xl overflow-hidden shadow-lg">
              <Image
                src="/images/hermes-prive.jpeg"
                alt="Bolso de lujo Hermès"
                fill
                className="object-cover"
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
