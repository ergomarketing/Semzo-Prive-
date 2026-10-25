"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Cookie, Settings, X } from "lucide-react"
import { useLocale } from "@/providers/IntlProvider"

// Textos del aviso en los dos idiomas de la web (el idioma lo marca el proveedor de idioma).
const TEXTS = {
  es: {
    title: "Utilizamos cookies",
    body: "Utilizamos cookies para mejorar tu experiencia, personalizar contenido y analizar nuestro tráfico. Puedes gestionar tus preferencias en cualquier momento.",
    configure: "Configurar",
    rejectAll: "Rechazar todo",
    acceptAll: "Aceptar todo",
    settingsTitle: "Configuración de cookies",
    necessary: "Cookies necesarias",
    necessaryDesc: "Esenciales para el funcionamiento del sitio",
    analytics: "Cookies analíticas",
    analyticsDesc: "Nos ayudan a entender cómo usas el sitio",
    marketing: "Cookies de marketing",
    marketingDesc: "Para mostrarte contenido relevante",
    functional: "Cookies funcionales",
    functionalDesc: "Mejoran la funcionalidad del sitio",
    save: "Guardar preferencias",
  },
  en: {
    title: "We use cookies",
    body: "We use cookies to improve your experience, personalise content and analyse our traffic. You can manage your preferences at any time.",
    configure: "Settings",
    rejectAll: "Reject all",
    acceptAll: "Accept all",
    settingsTitle: "Cookie settings",
    necessary: "Necessary cookies",
    necessaryDesc: "Essential for the site to work",
    analytics: "Analytics cookies",
    analyticsDesc: "Help us understand how you use the site",
    marketing: "Marketing cookies",
    marketingDesc: "To show you relevant content",
    functional: "Functional cookies",
    functionalDesc: "Improve the site's functionality",
    save: "Save preferences",
  },
} as const

/** Avisa a lib/tracking-loader.ts (Klaviyo, estado para GTM) de que cambio el consentimiento. */
function announceConsent() {
  try {
    window.dispatchEvent(new CustomEvent("semzo:cookie-consent"))
  } catch {
    // navegadores sin CustomEvent: el cargador lo leera en la proxima pagina
  }
}

export default function CookieConsent() {
  const { locale } = useLocale()
  const t = TEXTS[locale === "en" ? "en" : "es"]
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
      announceConsent()
      setShowBanner(false)
    }
  }

  const acceptSelected = () => {
    if (typeof window !== "undefined") {
      localStorage.setItem("cookie-consent", JSON.stringify(preferences))
      announceConsent()
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
      announceConsent()
      setShowBanner(false)
    }
  }

  if (!showBanner) return null

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 p-2 sm:p-4">
      <Card className="border-0 shadow-2xl max-w-4xl mx-auto">
        <CardContent className="p-4 sm:p-6">
          {!showSettings ? (
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 md:gap-6">
              <div className="flex items-start space-x-4 flex-1">
                <Cookie className="hidden sm:block h-6 w-6 text-indigo-dark mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-slate-900 mb-1 text-sm sm:text-base sm:mb-2">{t.title}</h3>
                  <p className="text-slate-600 text-xs sm:text-sm leading-snug">{t.body}</p>
                </div>
              </div>
              {/* En movil los tres botones van en una sola fila para que el aviso ocupe poco alto */}
              <div className="grid grid-cols-3 gap-2 w-full md:flex md:w-auto md:gap-3">
                <Button
                  variant="outline"
                  onClick={() => setShowSettings(true)}
                  className="h-9 px-2 text-xs sm:h-10 sm:px-4 sm:text-sm"
                >
                  <Settings className="hidden sm:inline h-4 w-4 mr-2" />
                  {t.configure}
                </Button>
                <Button
                  variant="outline"
                  onClick={rejectAll}
                  className="h-9 px-2 text-xs sm:h-10 sm:px-4 sm:text-sm"
                >
                  {t.rejectAll}
                </Button>
                <Button
                  onClick={acceptAll}
                  className="h-9 px-2 text-xs sm:h-10 sm:px-4 sm:text-sm bg-indigo-dark text-white hover:bg-indigo-dark/90"
                >
                  {t.acceptAll}
                </Button>
              </div>
            </div>
          ) : (
            <div>
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-slate-900">{t.settingsTitle}</h3>
                <Button variant="ghost" size="sm" onClick={() => setShowSettings(false)}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <div className="space-y-2 sm:space-y-4 mb-4 sm:mb-6 max-h-[55svh] overflow-y-auto">
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-slate-900">{t.necessary}</h4>
                    <p className="text-sm text-slate-600">{t.necessaryDesc}</p>
                  </div>
                  <input type="checkbox" checked={preferences.necessary} disabled className="h-4 w-4" />
                </div>

                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
                  <div>
                    <h4 className="font-medium text-slate-900">{t.analytics}</h4>
                    <p className="text-sm text-slate-600">{t.analyticsDesc}</p>
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
                    <h4 className="font-medium text-slate-900">{t.marketing}</h4>
                    <p className="text-sm text-slate-600">{t.marketingDesc}</p>
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
                    <h4 className="font-medium text-slate-900">{t.functional}</h4>
                    <p className="text-sm text-slate-600">{t.functionalDesc}</p>
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
                  {t.rejectAll}
                </Button>
                <Button onClick={acceptSelected} className="bg-indigo-dark text-white hover:bg-indigo-dark/90 flex-1">
                  {t.save}
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
