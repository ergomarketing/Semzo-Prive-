"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Cookie, Settings, X } from "lucide-react"

export default function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  const [preferences, setPreferences] = useState({
    necessary: true,
    analytics: false,
    marketing: false,
    functional: false,
  })

  useEffect(() => {
    // Solo ejecutar en el cliente
    if (typeof window !== "undefined") {
      const consent = localStorage.getItem("cookie-consent")
      if (!consent) {
        setShowBanner(true)
      }
    }
  }, [])

  const acceptAll = () => {
    if (typeof window !== "undefined") {
      const allAccepted = {
        necessary: true,
        analytics: true,
        marketing: true,
        functional: true,
      }
      setPreferences(allAccepted)
      localStorage.setItem("cookie-consent", JSON.stringify(allAccepted))
      setShowBanner(false)
    }
  }

  const acceptSelected = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cookie-consent", JSON.stringify(preferences))
      setShowBanner(false)
      setShowSettings(false)
    }
  }

  const rejectAll = () => {
    if (typeof window !== "undefined") {
      const minimal = {
        necessary: true,
        analytics: false,
        marketing: false,
        functional: false,
      }
      setPreferences(minimal)
      localStorage.setItem("cookie-consent", JSON.stringify(minimal))
      setShowBanner(false)
    }
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-4">
      <Card className="border-0 shadow-2xl max-w-4xl mx-auto">
        <CardContent className="p-6">
          {!showSettings ? (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between space-y-4 md:space-y-0 md:space-x-6">
              <div className="flex items-start space-x-4 flex-1">
                <Cookie className="h-6 w-6 text-indigo-dark mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-2">Utilizamos cookies</h3>
                  <p className="text-slate-600 text-sm">
                    Utilizamos cookies para mejorar tu experiencia, personalizar contenido y analizar nuestro tráfico.
                    Puedes gestionar tus preferencias en cualquier momento.
                  </p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 w-full md:w-auto">
                <Button variant="outline" onClick={() => setShowSettings(true)} className="w-full sm:w-auto">
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </Button>
                <Button variant="outline" onClick={rejectAll} className="w-full sm:w-auto">
                  Rechazar todo
                </Button>
                <Button
                  onClick={acceptAll}
                  className="bg-indigo-dark text-white hover:bg-indigo-dark/90 w-full sm:w-auto"
                >
                  Aceptar todo
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-slate-900">Configuración de cookies</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-slate-900">Cookies necesarias</h4>
                    <p className="text-sm text-slate-600">Esenciales para el funcionamiento del sitio</p>
                  </div>
                  <input type="checkbox" checked={preferences.necessary} disabled className="h-4 w-4" />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-slate-900">Cookies analíticas</h4>
                    <p className="text-sm text-slate-600">Nos ayudan a entender cómo usas el sitio</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.analytics}
                    onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                    className="h-4 w-4"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-slate-900">Cookies de marketing</h4>
                    <p className="text-sm text-slate-600">Para mostrarte contenido relevante</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.marketing}
                    onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                    className="h-4 w-4"
                  />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-slate-900">Cookies funcionales</h4>
                    <p className="text-sm text-slate-600">Mejoran la funcionalidad del sitio</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={preferences.functional}
                    onChange={(e) => setPreferences({ ...preferences, functional: e.target.checked })}
                    className="h-4 w-4"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <Button variant="outline" onClick={rejectAll} className="flex-1">
                  Rechazar todo
                </Button>
                <Button onClick={acceptSelected} className="bg-indigo-dark text-white hover:bg-indigo-dark/90 flex-1">
                  Guardar preferencias
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
