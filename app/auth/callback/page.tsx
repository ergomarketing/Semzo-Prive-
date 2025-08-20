"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2, ArrowRight, XCircle } from "lucide-react"
import { supabase } from "@/app/lib/supabase-unified"

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const handleCallback = async () => {
      try {
        console.log("[v0] === CALLBACK INICIADO ===")
        console.log("[v0] URL completa:", window.location.href)

        const code = searchParams.get("code")
        const error_code = searchParams.get("error_code")
        const error_description = searchParams.get("error_description")

        console.log("[v0] Parámetros:", {
          code: code ? "✓" : "✗",
          error_code,
          error_description,
        })

        if (error_code || error_description) {
          console.log("[v0] Error en URL:", { error_code, error_description })
          setStatus("error")
          setMessage(`Error: ${error_description || error_code}`)
          return
        }

        if (!code) {
          console.log("[v0] No hay código de confirmación")
          setStatus("error")
          setMessage("Enlace de confirmación inválido")
          return
        }

        console.log("[v0] Confirmando email con código...")
        const { data, error } = await supabase.auth.exchangeCodeForSession(code)

        if (error) {
          console.log("[v0] Error confirmando:", error.message)
          setStatus("error")
          setMessage(`Error al confirmar el email: ${error.message}`)
          return
        }

        if (!data.user) {
          console.log("[v0] No se obtuvo usuario después de confirmación")
          setStatus("error")
          setMessage("Error procesando confirmación")
          return
        }

        console.log("[v0] ✅ Email confirmado:", {
          userId: data.user.id,
          email: data.user.email,
          confirmed: !!data.user.email_confirmed_at,
        })

        setStatus("success")
        setMessage("Tu email ha sido confirmado correctamente")

        setTimeout(() => {
          router.push("/auth/login?message=email_confirmed")
        }, 2000)
      } catch (error) {
        console.log("[v0] Error inesperado:", error)
        setStatus("error")
        setMessage(`Error inesperado: ${error instanceof Error ? error.message : "Error desconocido"}`)
      }
    }

    handleCallback()
  }, [searchParams, router])

  const handleContinue = () => {
    if (status === "success") {
      router.push("/auth/login?message=email_confirmed")
    } else {
      router.push("/auth/login")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === "loading" && <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />}
            {status === "success" && <CheckCircle className="h-12 w-12 text-green-600" />}
            {status === "error" && <XCircle className="h-12 w-12 text-red-600" />}
          </div>

          <CardTitle className="text-2xl">
            {status === "loading" && "Confirmando email..."}
            {status === "success" && "¡Confirmación exitosa!"}
            {status === "error" && "Error de confirmación"}
          </CardTitle>

          <CardDescription>
            {status === "loading" && "Por favor espera mientras procesamos tu confirmación"}
            {message}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Procesando confirmación...</span>
            </div>
          )}

          {(status === "success" || status === "error") && (
            <div className="space-y-3">
              <div className="text-center">
                {status === "success" && (
                  <p className="text-sm text-gray-600 mb-4">¡Bienvenido! Ya puedes iniciar sesión con tu cuenta.</p>
                )}
                {status === "error" && (
                  <p className="text-sm text-gray-600 mb-4">
                    Puedes intentar registrarte nuevamente o contactar soporte.
                  </p>
                )}
              </div>

              <Button onClick={handleContinue} className="w-full" size="lg">
                {status === "success" ? "Ir al Login" : "Volver al Login"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              {status === "success" && (
                <p className="text-xs text-center text-gray-500">Serás redirigido automáticamente...</p>
              )}
            </div>
          )}

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
