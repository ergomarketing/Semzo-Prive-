"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2, ArrowRight } from "lucide-react"

export default function AuthCallback() {
  const router = useRouter()
  const [status, setStatus] = useState<"loading" | "success">("loading")

  useEffect(() => {
    // Mostrar loading por 2 segundos y luego redirigir
    const timer = setTimeout(() => {
      setStatus("success")
      // Redirigir al dashboard después de mostrar éxito
      setTimeout(() => {
        router.push("/dashboard")
      }, 2000)
    }, 2000)

    return () => clearTimeout(timer)
  }, [router])

  const handleContinue = () => {
    router.push("/dashboard")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === "loading" && <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />}
            {status === "success" && <CheckCircle className="h-12 w-12 text-green-600" />}
          </div>

          <CardTitle className="text-2xl">
            {status === "loading" && "Confirmando email..."}
            {status === "success" && "¡Confirmación exitosa!"}
          </CardTitle>

          <CardDescription>
            {status === "loading" && "Por favor espera mientras procesamos tu confirmación"}
            {status === "success" && "Tu email ha sido confirmado correctamente"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Procesando...</span>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-sm text-gray-600 mb-4">¡Bienvenido! Tu cuenta ha sido activada exitosamente.</p>
              </div>

              <Button onClick={handleContinue} className="w-full" size="lg">
                Continuar al Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <p className="text-xs text-center text-gray-500">Serás redirigido automáticamente...</p>
            </div>
          )}

          {/* Información adicional */}
          <div className="border-t pt-4 mt-6">
            <div className="text-xs text-gray-500 space-y-1">
              <p>
                <strong>Soporte:</strong> contacto@semzoprive.com
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
