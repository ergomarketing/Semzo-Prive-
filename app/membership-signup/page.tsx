"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Crown, Gem, Star, ArrowLeft } from "lucide-react"
import Link from "next/link"

export default function MembershipSignupPage() {
  const handleSelectPlan = (planId: string) => {
    window.location.href = `/checkout?plan=${planId}`
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-nude/5 to-rose-pastel/3">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-8">
          <Link href="/" className="inline-flex items-center text-indigo-dark hover:underline mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver al inicio
          </Link>
          <div className="text-center">
            <h1 className="font-serif text-4xl text-slate-900 mb-4">Elige tu Membresía</h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Selecciona el plan perfecto para tu estilo y disfruta de bolsos de lujo cada mes
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Plan Essentiel */}
          <Card className="relative border-0 shadow-xl transition-all duration-300 hover:shadow-2xl">
            <CardHeader className="text-center pb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <Star className="h-8 w-8 text-indigo-dark" />
              </div>
              <CardTitle className="font-serif text-2xl text-slate-900">L'Essentiel</CardTitle>
              <p className="text-slate-600">Perfecto para comenzar tu experiencia de lujo</p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-slate-900">59€</span>
                <span className="text-slate-600">/mes</span>
              </div>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">1 bolso por mes</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Envío gratuito</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Seguro incluido</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Soporte por email</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Acceso al catálogo básico</span>
                </li>
              </ul>

              <Button
                onClick={() => handleSelectPlan("essentiel")}
                className="w-full h-12 bg-slate-900 text-white hover:bg-slate-800"
              >
                Seleccionar L'Essentiel
              </Button>
            </CardContent>
          </Card>

          {/* Plan Signature */}
          <Card className="relative border-0 shadow-xl transition-all duration-300 hover:shadow-2xl ring-2 ring-indigo-dark scale-105">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <span className="bg-indigo-dark text-white px-4 py-1 rounded-full text-sm font-medium">Más Popular</span>
            </div>

            <CardHeader className="text-center pb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <Crown className="h-8 w-8 text-indigo-dark" />
              </div>
              <CardTitle className="font-serif text-2xl text-slate-900">Signature</CardTitle>
              <p className="text-slate-600">La experiencia completa de Semzo Privé</p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-slate-900">129€</span>
                <span className="text-slate-600">/mes</span>
              </div>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">1 bolso premium por mes</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Envío express gratuito</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Seguro premium incluido</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Soporte prioritario</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Acceso completo al catálogo</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Intercambios ilimitados</span>
                </li>
              </ul>

              <Button
                onClick={() => handleSelectPlan("signature")}
                className="w-full h-12 bg-indigo-dark text-white hover:bg-indigo-dark/90"
              >
                Seleccionar Signature
              </Button>
            </CardContent>
          </Card>

          {/* Plan Privé */}
          <Card className="relative border-0 shadow-xl transition-all duration-300 hover:shadow-2xl">
            <CardHeader className="text-center pb-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-slate-100 flex items-center justify-center">
                <Gem className="h-8 w-8 text-indigo-dark" />
              </div>
              <CardTitle className="font-serif text-2xl text-slate-900">Privé</CardTitle>
              <p className="text-slate-600">Acceso exclusivo a piezas únicas</p>
              <div className="mt-4">
                <span className="text-4xl font-bold text-slate-900">189€</span>
                <span className="text-slate-600">/mes</span>
              </div>
            </CardHeader>

            <CardContent className="px-8 pb-8">
              <ul className="space-y-4 mb-8">
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">1 bolso de alta gama por mes</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Envío VIP gratuito</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Seguro completo incluido</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Concierge personal</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Acceso a colecciones exclusivas</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Intercambios ilimitados</span>
                </li>
                <li className="flex items-start">
                  <Check className="h-5 w-5 text-green-500 mr-3 mt-0.5 flex-shrink-0" />
                  <span className="text-slate-700">Eventos privados</span>
                </li>
              </ul>

              <Button
                onClick={() => handleSelectPlan("prive")}
                className="w-full h-12 bg-slate-900 text-white hover:bg-slate-800"
              >
                Seleccionar Privé
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mt-12 text-center">
          <p className="text-slate-600 mb-4">¿Tienes preguntas sobre nuestras membresías?</p>
          <Link href="/support" className="text-indigo-dark hover:underline font-medium">
            Contacta con nuestro equipo
          </Link>
        </div>
      </div>
    </div>
  )
}
