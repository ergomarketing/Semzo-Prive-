"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ChevronRight, Sparkles, Crown, Calendar, Shield } from "lucide-react"
import { getSupabaseBrowser } from "@/lib/supabase"

export default function OnboardingPage() {
  const [step, setStep] = useState(1)
  const [user, setUser] = useState<any>(null)
  const router = useRouter()
  const supabase = getSupabaseBrowser()

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (!user) {
        router.push("/auth/login")
        return
      }
      setUser(user)
    }
    checkUser()
  }, [router, supabase])

  const completeOnboarding = async () => {
    if (!user) return

    await supabase
      .from("profiles")
      .update({
        onboarding_completed: true,
      })
      .eq("id", user.id)

    router.push("/catalog")
  }

  const steps = [
    {
      title: "Bienvenida a Semzo Privé",
      description: "Acceso a bolsos de lujo por suscripción",
      icon: Crown,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="font-serif text-3xl text-[#1a1a4b] mb-4">Bienvenida a tu armario de lujo</h2>
            <p className="text-slate-600 text-lg">
              Descubre cómo funciona tu membresía y disfruta de bolsos de diseñador cada semana
            </p>
          </div>
          <div className="grid gap-4">
            <div className="flex items-start gap-4 p-4 bg-[#fff0f3] rounded-lg">
              <Crown className="h-6 w-6 text-[#1a1a4b] mt-1" />
              <div>
                <h3 className="font-serif text-lg text-[#1a1a4b] mb-2">Bolsos de lujo ilimitados</h3>
                <p className="text-slate-600">Accede a nuestra colección exclusiva de bolsos de diseñador</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-[#fff0f3] rounded-lg">
              <Calendar className="h-6 w-6 text-[#1a1a4b] mt-1" />
              <div>
                <h3 className="font-serif text-lg text-[#1a1a4b] mb-2">Reservas semanales</h3>
                <p className="text-slate-600">Elige un bolso nuevo cada semana según tu nivel de membresía</p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-[#fff0f3] rounded-lg">
              <Shield className="h-6 w-6 text-[#1a1a4b] mt-1" />
              <div>
                <h3 className="font-serif text-lg text-[#1a1a4b] mb-2">Protección y limpieza</h3>
                <p className="text-slate-600">Todos nuestros bolsos están asegurados y limpiados profesionalmente</p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Tu Membresía",
      description: "Conoce los beneficios de tu plan",
      icon: Sparkles,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="font-serif text-3xl text-[#1a1a4b] mb-4">Niveles de membresía</h2>
            <p className="text-slate-600 text-lg">Cada nivel te da acceso a diferentes categorías de bolsos</p>
          </div>
          <div className="grid gap-4">
            <Card className="border-2 border-[#f4c4cc]">
              <CardContent className="p-6">
                <h3 className="font-serif text-xl text-[#1a1a4b] mb-2">Petite</h3>
                <p className="text-slate-600 mb-4">Bolsos clásicos y elegantes para el día a día</p>
                <p className="font-serif text-2xl text-[#1a1a4b]">52€/mes</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-[#f4c4cc]">
              <CardContent className="p-6">
                <h3 className="font-serif text-xl text-[#1a1a4b] mb-2">L'Essentiel</h3>
                <p className="text-slate-600 mb-4">Acceso a bolsos premium y colecciones especiales</p>
                <p className="font-serif text-2xl text-[#1a1a4b]">99€/mes</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-[#f4c4cc]">
              <CardContent className="p-6">
                <h3 className="font-serif text-xl text-[#1a1a4b] mb-2">Signature</h3>
                <p className="text-slate-600 mb-4">Bolsos icónicos de las mejores marcas</p>
                <p className="font-serif text-2xl text-[#1a1a4b]">137€/mes</p>
              </CardContent>
            </Card>
            <Card className="border-2 border-[#f4c4cc]">
              <CardContent className="p-6">
                <h3 className="font-serif text-xl text-[#1a1a4b] mb-2">Privé</h3>
                <p className="text-slate-600 mb-4">Acceso ilimitado a toda la colección exclusiva</p>
                <p className="font-serif text-2xl text-[#1a1a4b]">189€/mes</p>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    {
      title: "Cómo funciona",
      description: "Pasos para reservar tu primer bolso",
      icon: Calendar,
      content: (
        <div className="space-y-6">
          <div className="text-center">
            <h2 className="font-serif text-3xl text-[#1a1a4b] mb-4">Así de fácil</h2>
            <p className="text-slate-600 text-lg">3 pasos para disfrutar de tu bolso de lujo</p>
          </div>
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#1a1a4b] text-white flex items-center justify-center font-serif text-xl">
                1
              </div>
              <div>
                <h3 className="font-serif text-xl text-[#1a1a4b] mb-2">Explora el catálogo</h3>
                <p className="text-slate-600">
                  Navega por nuestra colección de bolsos de lujo y añade tus favoritos a tu wishlist
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#1a1a4b] text-white flex items-center justify-center font-serif text-xl">
                2
              </div>
              <div>
                <h3 className="font-serif text-xl text-[#1a1a4b] mb-2">Reserva tu bolso</h3>
                <p className="text-slate-600">
                  Elige el bolso que quieres llevar y selecciona tus fechas (mínimo 7 días)
                </p>
              </div>
            </div>
            <div className="flex gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-[#1a1a4b] text-white flex items-center justify-center font-serif text-xl">
                3
              </div>
              <div>
                <h3 className="font-serif text-xl text-[#1a1a4b] mb-2">Recibe y disfruta</h3>
                <p className="text-slate-600">
                  Te lo enviamos a tu dirección y cuando termines, lo devuelves fácilmente
                </p>
              </div>
            </div>
          </div>
        </div>
      ),
    },
  ]

  const currentStep = steps[step - 1]
  const Icon = currentStep.icon

  if (!user) return null

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#fff0f3] to-white">
      <div className="container max-w-4xl mx-auto px-4 py-12">
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`flex-1 h-2 rounded-full mx-1 transition-colors ${
                  idx < step ? "bg-[#1a1a4b]" : "bg-slate-200"
                }`}
              />
            ))}
          </div>
          <p className="text-center text-slate-600">
            Paso {step} de {steps.length}
          </p>
        </div>

        <Card className="border-2 border-[#f4c4cc] shadow-lg">
          <CardContent className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="p-3 bg-[#1a1a4b] rounded-full">
                <Icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="font-serif text-2xl text-[#1a1a4b]">{currentStep.title}</h1>
                <p className="text-slate-600">{currentStep.description}</p>
              </div>
            </div>

            {currentStep.content}

            <div className="flex justify-between mt-8">
              {step > 1 && (
                <Button variant="outline" onClick={() => setStep(step - 1)} className="border-[#1a1a4b] text-[#1a1a4b]">
                  Anterior
                </Button>
              )}
              <Button
                onClick={() => {
                  if (step < steps.length) {
                    setStep(step + 1)
                  } else {
                    completeOnboarding()
                  }
                }}
                className="ml-auto bg-[#1a1a4b] hover:bg-[#1a1a4b]/90"
              >
                {step < steps.length ? (
                  <>
                    Siguiente <ChevronRight className="ml-2 h-4 w-4" />
                  </>
                ) : (
                  "Comenzar a explorar"
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
