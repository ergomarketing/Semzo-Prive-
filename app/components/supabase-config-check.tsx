"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertCircle, Settings, ExternalLink } from "lucide-react"

export default function SupabaseConfigCheck() {
  const [config, setConfig] = useState({
    hasUrl: false,
    hasKey: false,
    loading: true,
  })

  useEffect(() => {
    // Verificar variables de entorno del lado del cliente
    const checkConfig = () => {
      const hasUrl = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0)
      const hasKey = !!(
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0
      )

      setConfig({
        hasUrl,
        hasKey,
        loading: false,
      })
    }

    checkConfig()
  }, [])

  if (config.loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-nude/10 to-rose-pastel/5 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-dark"></div>
      </div>
    )
  }

  if (config.hasUrl && config.hasKey) {
    return null // No mostrar nada si está configurado
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-nude/10 to-rose-pastel/5 flex items-center justify-center py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-8">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-orange-100 flex items-center justify-center">
              <Settings className="h-8 w-8 text-orange-600" />
            </div>
            <CardTitle className="font-serif text-3xl text-slate-900">Configuración Requerida</CardTitle>
            <p className="text-slate-600 mt-2">
              Para usar el sistema de autenticación, necesitas configurar las variables de entorno de Supabase:
            </p>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <code className="text-sm">
                NEXT_PUBLIC_SUPABASE_URL
                <br />
                NEXT_PUBLIC_SUPABASE_ANON_KEY
              </code>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-indigo-dark text-white flex items-center justify-center text-sm font-medium">
                  1
                </div>
                <div>
                  <p className="font-medium">Crear proyecto en Supabase</p>
                  <p className="text-sm text-gray-600">Ve a supabase.com y crea un nuevo proyecto</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-indigo-dark text-white flex items-center justify-center text-sm font-medium">
                  2
                </div>
                <div>
                  <p className="font-medium">Obtener credenciales</p>
                  <p className="text-sm text-gray-600">En Settings → API, copia la URL y la clave anon</p>
                </div>
              </div>

              <div className="flex items-start space-x-3">
                <div className="w-6 h-6 rounded-full bg-indigo-dark text-white flex items-center justify-center text-sm font-medium">
                  3
                </div>
                <div>
                  <p className="font-medium">Configurar en Vercel</p>
                  <p className="text-sm text-gray-600">Agrega las variables en Settings → Environment Variables</p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Button
                onClick={() => window.open("https://supabase.com", "_blank")}
                className="flex-1 bg-green-600 hover:bg-green-700"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Ir a Supabase
              </Button>

              <Button
                onClick={() => (window.location.href = "/admin/supabase-diagnostics")}
                variant="outline"
                className="flex-1"
              >
                <Settings className="h-4 w-4 mr-2" />
                Diagnóstico
              </Button>
            </div>

            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-blue-600 mr-2" />
                <p className="text-blue-800 text-sm">
                  <strong>Nota:</strong> Después de configurar las variables, necesitas hacer redeploy en Vercel para
                  que los cambios tomen efecto.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
