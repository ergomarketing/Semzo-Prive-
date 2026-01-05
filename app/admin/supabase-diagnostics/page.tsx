"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle2, XCircle, AlertCircle, RefreshCw } from "lucide-react"
import { isSupabaseConfigured, supabase } from "../../lib/supabase"

export default function SupabaseDiagnostics() {
  const [diagnostics, setDiagnostics] = useState({
    loading: true,
    envVars: {
      url: false,
      key: false,
    },
    connection: false,
    error: null as string | null,
  })

  const runDiagnostics = async () => {
    setDiagnostics((prev) => ({ ...prev, loading: true, error: null }))

    try {
      // Verificar variables de entorno
      const hasUrl = !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_URL.length > 0)
      const hasKey = !!(
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.length > 0
      )

      // Verificar conexión
      let connectionTest = false
      try {
        if (isSupabaseConfigured()) {
          const { data, error } = await supabase.from("users").select("count").limit(1)
          connectionTest = !error
        }
      } catch (error) {
        console.log("Connection test failed:", error)
      }

      setDiagnostics({
        loading: false,
        envVars: {
          url: hasUrl,
          key: hasKey,
        },
        connection: connectionTest,
        error: null,
      })
    } catch (error) {
      setDiagnostics((prev) => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : "Error desconocido",
      }))
    }
  }

  useEffect(() => {
    runDiagnostics()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-nude/10 to-rose-pastel/5 py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-8">
            <CardTitle className="font-serif text-3xl text-slate-900">Diagnóstico de Supabase</CardTitle>
            <p className="text-slate-600">Verificación del estado de la configuración</p>
          </CardHeader>

          <CardContent className="px-8 pb-8">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-semibold">Estado de la configuración</h3>
              <Button onClick={runDiagnostics} disabled={diagnostics.loading} variant="outline">
                <RefreshCw className={`h-4 w-4 mr-2 ${diagnostics.loading ? "animate-spin" : ""}`} />
                Actualizar
              </Button>
            </div>

            <div className="space-y-4">
              {/* Variables de entorno */}
              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">NEXT_PUBLIC_SUPABASE_URL</h4>
                  {diagnostics.envVars.url ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {diagnostics.envVars.url ? "✅ Configurada correctamente" : "❌ No configurada o vacía"}
                </p>
                {process.env.NEXT_PUBLIC_SUPABASE_URL && (
                  <p className="text-xs text-gray-500 mt-1">
                    Valor: {process.env.NEXT_PUBLIC_SUPABASE_URL.substring(0, 30)}...
                  </p>
                )}
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">NEXT_PUBLIC_SUPABASE_ANON_KEY</h4>
                  {diagnostics.envVars.key ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {diagnostics.envVars.key ? "✅ Configurada correctamente" : "❌ No configurada o vacía"}
                </p>
                {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && (
                  <p className="text-xs text-gray-500 mt-1">
                    Valor: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.substring(0, 30)}...
                  </p>
                )}
              </div>

              <div className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Conexión a Supabase</h4>
                  {diagnostics.connection ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-500" />
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {diagnostics.connection
                    ? "✅ Conexión exitosa"
                    : "❌ No se pudo conectar (puede ser normal si no has creado las tablas)"}
                </p>
              </div>

              {/* Estado general */}
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium">Estado General</h4>
                  {isSupabaseConfigured() ? (
                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                  ) : (
                    <AlertCircle className="h-5 w-5 text-orange-500" />
                  )}
                </div>
                <p className="text-sm text-gray-600">
                  {isSupabaseConfigured()
                    ? "✅ Supabase está configurado correctamente"
                    : "⚠️ Supabase necesita configuración"}
                </p>
              </div>

              {diagnostics.error && (
                <div className="p-4 border border-red-200 rounded-lg bg-red-50">
                  <div className="flex items-center mb-2">
                    <XCircle className="h-5 w-5 text-red-500 mr-2" />
                    <h4 className="font-medium text-red-800">Error</h4>
                  </div>
                  <p className="text-sm text-red-700">{diagnostics.error}</p>
                </div>
              )}
            </div>

            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-medium text-blue-800 mb-2">Instrucciones</h4>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Ve a tu proyecto en Supabase</li>
                <li>2. En Settings → API, copia la URL del proyecto y la clave anon</li>
                <li>3. Configúralas en Vercel como variables de entorno</li>
                <li>4. Haz redeploy de la aplicación</li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
