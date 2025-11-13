"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Mail, Crown, Sparkles, Gift } from "lucide-react"

interface NewsletterPreferences {
  newArrivals: boolean
  exclusiveOffers: boolean
  styleGuides: boolean
  events: boolean
  membershipUpdates: boolean
}

export default function NewsletterSystem() {
  const [email, setEmail] = useState("")
  const [isSubscribed, setIsSubscribed] = useState(false)
  const [preferences, setPreferences] = useState<NewsletterPreferences>({
    newArrivals: true,
    exclusiveOffers: true,
    styleGuides: false,
    events: false,
    membershipUpdates: true,
  })
  const [isLoading, setIsLoading] = useState(false)

  const handleSubscribe = async () => {
    if (!email) return

    setIsLoading(true)

    // Simular suscripción
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsSubscribed(true)
    setIsLoading(false)

    // Aquí se integraría con el servicio de email
    console.log("Newsletter subscription:", { email, preferences })
  }

  const updatePreference = (key: keyof NewsletterPreferences, value: boolean) => {
    setPreferences((prev) => ({ ...prev, [key]: value }))
  }

  if (isSubscribed) {
    return (
      <Card className="border-0 shadow-lg bg-gradient-to-r from-rose-nude to-rose-pastel/30">
        <CardContent className="p-8 text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Mail className="h-8 w-8 text-green-600" />
          </div>
          <h3 className="text-2xl font-serif text-indigo-dark mb-2">¡Bienvenida a la familia Semzo!</h3>
          <p className="text-slate-700 mb-4">
            Te has suscrito exitosamente a nuestro newsletter. Recibirás contenido exclusivo y las últimas novedades.
          </p>
          <div className="bg-white/50 rounded-lg p-4 mb-4">
            <p className="text-sm text-slate-600">
              <strong>🎁 Regalo de bienvenida:</strong> Recibirás un código de descuento del 10% en tu primer mes.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => setIsSubscribed(false)}
            className="border-indigo-dark text-indigo-dark hover:bg-indigo-dark hover:text-white"
          >
            Modificar preferencias
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-indigo-dark to-indigo-dark/80 text-white">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl font-serif">
            <Mail className="h-6 w-6" />
            Newsletter Exclusivo
          </CardTitle>
          <p className="opacity-90 mt-2">
            Sé la primera en conocer las nuevas colecciones, ofertas exclusivas y consejos de estilo.
          </p>
        </CardHeader>
      </Card>

      {/* Subscription Form */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-serif text-indigo-dark">Suscríbete ahora</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
            />
            <Button
              onClick={handleSubscribe}
              disabled={!email || isLoading}
              className="bg-indigo-dark text-white hover:bg-indigo-dark/90"
            >
              {isLoading ? "Suscribiendo..." : "Suscribirse"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Preferences */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-serif text-indigo-dark">Personaliza tu experiencia</CardTitle>
          <p className="text-sm text-slate-600">Elige qué tipo de contenido quieres recibir:</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <Checkbox
                id="newArrivals"
                checked={preferences.newArrivals}
                onCheckedChange={(checked) => updatePreference("newArrivals", checked as boolean)}
              />
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-rose-500" />
                <label htmlFor="newArrivals" className="text-sm font-medium">
                  Nuevas llegadas y colecciones
                </label>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="exclusiveOffers"
                checked={preferences.exclusiveOffers}
                onCheckedChange={(checked) => updatePreference("exclusiveOffers", checked as boolean)}
              />
              <div className="flex items-center gap-2">
                <Gift className="h-4 w-4 text-amber-500" />
                <label htmlFor="exclusiveOffers" className="text-sm font-medium">
                  Ofertas exclusivas y descuentos
                </label>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="styleGuides"
                checked={preferences.styleGuides}
                onCheckedChange={(checked) => updatePreference("styleGuides", checked as boolean)}
              />
              <div className="flex items-center gap-2">
                <span className="h-4 w-4 text-indigo-500">✨</span>
                <label htmlFor="styleGuides" className="text-sm font-medium">
                  Guías de estilo y tendencias
                </label>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="events"
                checked={preferences.events}
                onCheckedChange={(checked) => updatePreference("events", checked as boolean)}
              />
              <div className="flex items-center gap-2">
                <Crown className="h-4 w-4 text-purple-500" />
                <label htmlFor="events" className="text-sm font-medium">
                  Eventos VIP y experiencias exclusivas
                </label>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Checkbox
                id="membershipUpdates"
                checked={preferences.membershipUpdates}
                onCheckedChange={(checked) => updatePreference("membershipUpdates", checked as boolean)}
              />
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-500" />
                <label htmlFor="membershipUpdates" className="text-sm font-medium">
                  Actualizaciones de membresía
                </label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Benefits */}
      <Card className="border-0 shadow-md bg-slate-50">
        <CardHeader>
          <CardTitle className="text-lg font-serif text-indigo-dark">Beneficios exclusivos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-rose-nude rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-dark font-bold text-sm">1</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Acceso anticipado</h4>
                <p className="text-sm text-slate-600">Sé la primera en ver y reservar nuevos bolsos antes que nadie.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-rose-pastel/50 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-indigo-dark font-bold text-sm">2</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Descuentos exclusivos</h4>
                <p className="text-sm text-slate-600">Ofertas especiales solo para suscriptoras del newsletter.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-indigo-dark rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">3</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Contenido premium</h4>
                <p className="text-sm text-slate-600">Guías de estilo, consejos de cuidado y tendencias de moda.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-amber-600 font-bold text-sm">4</span>
              </div>
              <div>
                <h4 className="font-semibold text-slate-900">Eventos VIP</h4>
                <p className="text-sm text-slate-600">Invitaciones a eventos exclusivos y experiencias únicas.</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Privacy */}
      <Card className="border-0 shadow-md">
        <CardContent className="p-4">
          <p className="text-xs text-slate-500 text-center">
            Al suscribirte, aceptas recibir emails de Semzo Privé. Puedes darte de baja en cualquier momento. Respetamos
            tu privacidad y nunca compartiremos tu información con terceros.
            <br />
            <a href="/legal/privacy" className="text-indigo-dark hover:underline">
              Ver política de privacidad
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
