"use client"

import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2, ArrowLeft, Check, Crown } from "lucide-react"

export default function PriveUpgradePage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  if (!user) return null

  return (
    <main className="min-h-screen bg-slate-50">
      <div className="container mx-auto px-4 py-12">
        <Button
          onClick={() => router.push("/membership/upgrade")}
          variant="ghost"
          className="mb-8 text-slate-600 hover:text-slate-900"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Membresías
        </Button>

        <div className="max-w-2xl mx-auto">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8">
              <div className="text-center mb-8">
                <Crown className="w-8 h-8 text-slate-900 mx-auto mb-4" />
                <h1 className="font-serif text-4xl text-slate-900 mb-4">Privé</h1>
                <div className="mb-4">
                  <span className="font-serif text-5xl font-light text-slate-900">189€</span>
                  <span className="text-lg text-slate-600 font-light">/mes</span>
                </div>
                <p className="text-slate-700 font-light">La experiencia definitiva para verdaderas conocedoras.</p>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3" />
                  <span>1 bolso por mes</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3" />
                  <span>Envío express gratuito</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3" />
                  <span>Seguro premium incluido</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3" />
                  <span>Acceso VIP a nuevas colecciones</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3" />
                  <span>Personal shopper dedicado</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3" />
                  <span>Eventos exclusivos</span>
                </div>
                <div className="flex items-center">
                  <Check className="w-5 h-5 text-green-600 mr-3" />
                  <span>Servicio de conserjería</span>
                </div>
              </div>

              <Button
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3"
                onClick={() => {
                  // Aquí iría la lógica de pago/upgrade
                  alert("Funcionalidad de pago próximamente")
                }}
              >
                Confirmar Upgrade a Privé
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  )
}
