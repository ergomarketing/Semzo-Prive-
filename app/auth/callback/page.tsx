"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export default function AuthCallback() {
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const router = useRouter()

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Obtener parámetros de la URL
        const urlParams = new URLSearchParams(window.location.search)
        const code = urlParams.get("code")
        const error = urlParams.get("error")
        const errorDescription = urlParams.get("error_description")

        if (error) {
          console.error("[Callback] Error en callback:", error, errorDescription)
          setStatus("error")
          setMessage(errorDescription || "Error en la confirmación")
          return
        }

        if (!code) {
          console.error("[Callback] No se encontró código de confirmación")
          setStatus("error")
          setMessage("Código de confirmación no encontrado")
          return
        }

        console.log("[Callback] Procesando confirmación...")
        setMessage("Confirmando tu cuenta...")

        // Esperar un momento para mostrar el mensaje
        await new Promise((resolve) => setTimeout(resolve, 1000))

        setStatus("success")
        setMessage("¡Cuenta confirmada exitosamente! Redirigiendo...")

        // Redirigir al dashboard después de 2 segundos
        setTimeout(() => {
          window.location.href = "/dashboard"
        }, 2000)
      } catch (error) {
        console.error("[Callback] Error procesando callback:", error)
        setStatus("error")
        setMessage("Error procesando la confirmación")
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">
            {status === "loading" && "Confirmando cuenta..."}
            {status === "success" && "¡Cuenta confirmada!"}
            {status === "error" && "Error de confirmación"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            {status === "loading" && (
              <div className="space-y-4">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-gray-600">{message}</p>
              </div>
            )}

            {status === "success" && (
              <div className="space-y-4">
                <div className="text-green-600">
                  <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-green-600 font-medium">{message}</p>
              </div>
            )}

            {status === "error" && (
              <div className="space-y-4">
                <div className="text-red-600">
                  <svg className="w-16 h-16 mx-auto" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <p className="text-red-600 font-medium">{message}</p>
                <button onClick={() => (window.location.href = "/signup")} className="text-blue-600 hover:underline">
                  Volver al registro
                </button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
