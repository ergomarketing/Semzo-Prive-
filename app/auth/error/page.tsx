"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { XCircle, Mail, ArrowLeft } from "lucide-react"

export default function AuthError() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const error = searchParams.get("error") || "unknown_error"
  const description = searchParams.get("description") || "Ha ocurrido un error desconocido"

  const getErrorMessage = (error: string) => {
    switch (error) {
      case "missing_params":
        return "Enlace de confirmación inválido"
      case "verification_failed":
        return "Error al verificar el email"
      case "no_user":
        return "No se pudo obtener información del usuario"
      case "config_error":
        return "Error de configuración"
      case "unexpected":
        return "Error inesperado"
      default:
        return "Error de autenticación"
    }
  }

  const handleRetry = () => {
    router.push("/signup")
  }

  const handleGoHome = () => {
    router.push("/")
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            <XCircle className="h-12 w-12 text-[#1a1a4b]" />
          </div>

          <CardTitle className="text-2xl text-[#1a1a4b]">{getErrorMessage(error)}</CardTitle>

          <CardDescription>Hubo un problema procesando tu solicitud</CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Mensaje de error con colores SEMZO PRIVÉ */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">Detalles del error:</p>
            <p className="text-xs text-[#1a1a4b] bg-[#fff0f3] p-3 rounded-lg border border-[#f4c4cc]">{description}</p>
          </div>

          {/* Acciones */}
          <div className="space-y-3">
            <Button onClick={handleRetry} className="w-full bg-[#1a1a4b] hover:bg-[#1a1a4b]/90 text-white" size="lg">
              <Mail className="mr-2 h-4 w-4" />
              Intentar registro nuevamente
            </Button>

            <Button
              onClick={handleGoHome}
              variant="outline"
              className="w-full bg-transparent border-[#1a1a4b] text-[#1a1a4b] hover:bg-[#1a1a4b] hover:text-white"
              size="lg"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al inicio
            </Button>
          </div>

          {/* Información de soporte */}
          <div className="border-t pt-4 mt-6">
            <div className="text-xs text-gray-500 space-y-1">
              <p>
                <strong>Tip:</strong> Revisa tu carpeta de spam si no recibes emails
              </p>
              <p>
                <strong>Soporte:</strong> contacto@semzoprive.com
              </p>
              <p>
                <strong>Error Code:</strong> {error}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
