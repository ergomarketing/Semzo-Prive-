"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CheckCircle, XCircle, Loader2 } from "lucide-react"

export default function SetupDatabasePage() {
  const [isLoading, setIsLoading] = useState(false)
  const [result, setResult] = useState<{
    success: boolean
    message: string
    details?: string[]
  } | null>(null)

  const executeScript = async () => {
    setIsLoading(true)
    setResult(null)

    try {
      const response = await fetch("/api/admin/setup-database", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      setResult(data)
    } catch (error) {
      setResult({
        success: false,
        message: "Error de conexión al ejecutar el script",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl font-bold text-center">Configuración de Base de Datos</CardTitle>
            <CardDescription className="text-center">
              Ejecuta este script para crear la tabla de usuarios y los triggers necesarios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <h3 className="font-semibold text-yellow-800 mb-2">⚠️ Importante</h3>
              <p className="text-yellow-700 text-sm">
                Este script creará la tabla <code>public.users</code> y los triggers necesarios para que el registro de
                usuarios funcione correctamente.
              </p>
            </div>

            <Button onClick={executeScript} disabled={isLoading} className="w-full" size="lg">
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Ejecutando Script...
                </>
              ) : (
                "Ejecutar Script SQL"
              )}
            </Button>

            {result && (
              <Alert className={result.success ? "border-green-200 bg-green-50" : "border-red-200 bg-red-50"}>
                <div className="flex items-start">
                  {result.success ? (
                    <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                  ) : (
                    <XCircle className="h-5 w-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" />
                  )}
                  <div className="flex-1">
                    <AlertDescription className={result.success ? "text-green-800" : "text-red-800"}>
                      <div className="font-semibold mb-2">{result.message}</div>
                      {result.details && result.details.length > 0 && (
                        <ul className="list-disc list-inside space-y-1 text-sm">
                          {result.details.map((detail, index) => (
                            <li key={index}>{detail}</li>
                          ))}
                        </ul>
                      )}
                    </AlertDescription>
                  </div>
                </div>
              </Alert>
            )}

            {result?.success && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <h3 className="font-semibold text-green-800 mb-2">✅ ¡Listo!</h3>
                <p className="text-green-700 text-sm mb-3">
                  La base de datos está configurada correctamente. Ahora puedes:
                </p>
                <div className="space-y-2">
                  <Button
                    onClick={() => window.open("/signup", "_blank")}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Probar Registro de Usuario
                  </Button>
                  <Button
                    onClick={() => window.open("https://supabase.com/dashboard", "_blank")}
                    variant="outline"
                    size="sm"
                    className="w-full"
                  >
                    Ver Tablas en Supabase
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
