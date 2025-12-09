"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, Loader2, ArrowRight, XCircle } from "lucide-react"
import { getSupabaseBrowser } from "@/app/lib/supabaseClient"

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = getSupabaseBrowser()
        if (!supabase) {
          setStatus("error")
          setMessage("Error de configuración de Supabase")
          return
        }

        const allParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))

        const type = allParams.get("type") || hashParams.get("type")
        const fullHash = window.location.hash

        if (type === "recovery") {
          router.replace(`/auth/reset${fullHash}`)
          return
        }

        if (type === "email_change") {
          router.replace(`/auth/reset${fullHash}`)
          return
        }

        const accessToken = hashParams.get("access_token")
        const refreshToken = hashParams.get("refresh_token")

        if (accessToken && refreshToken && !type) {
          // Could be a recovery link, redirect to reset page
          router.replace(`/auth/reset${fullHash}`)
          return
        }

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user && user.email_confirmed_at) {
          setStatus("success")
          setMessage("Tu email ha sido confirmado correctamente")

          setTimeout(() => {
            router.push("/auth/login?message=email_confirmed")
          }, 2000)
          return
        }

        const code = searchParams.get("code")
        const error_code = searchParams.get("error_code")
        const error_description = searchParams.get("error_description")

        const hashCode = hashParams.get("code")
        const token = searchParams.get("token")

        if (error_code || error_description) {
          setStatus("error")
          setMessage(`Error: ${error_description || error_code}`)
          return
        }

        const finalCode = code || hashCode

        if (!finalCode && !token) {
          const {
            data: { session },
          } = await supabase.auth.getSession()

          if (session?.user) {
            setStatus("success")
            setMessage("Tu email ha sido confirmado correctamente")

            setTimeout(() => {
              router.push("/auth/login?message=email_confirmed")
            }, 2000)
            return
          }

          setStatus("error")
          setMessage("Enlace procesado. Si no puedes iniciar sesión, intenta registrarte nuevamente.")
          return
        }

        if (finalCode) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(finalCode)

          if (error) {
            setStatus("error")
            setMessage("Error al confirmar el email")
            return
          }

          if (data.user) {
            setStatus("success")
            setMessage("Tu email ha sido confirmado correctamente")

            setTimeout(() => {
              router.push("/auth/login?message=email_confirmed")
            }, 2000)
            return
          }
        }

        if (token && type) {
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: type as any,
          })

          if (error) {
            setStatus("error")
            setMessage("Error al confirmar el email")
            return
          }

          if (data.user) {
            setStatus("success")
            setMessage("Tu email ha sido confirmado correctamente")

            setTimeout(() => {
              router.push("/auth/login?message=email_confirmed")
            }, 2000)
            return
          }
        }

        const {
          data: { session: finalSession },
        } = await supabase.auth.getSession()

        if (finalSession?.user) {
          setStatus("success")
          setMessage("Tu email ha sido confirmado correctamente")

          setTimeout(() => {
            router.push("/auth/login?message=email_confirmed")
          }, 2000)
          return
        }

        setStatus("error")
        setMessage("Confirmación procesada. Intenta iniciar sesión - si funciona, la confirmación fue exitosa.")
      } catch (error) {
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
            {status === "loading" && <Loader2 className="h-12 w-12 text-indigo-dark animate-spin" />}
            {status === "success" && <CheckCircle className="h-12 w-12 text-green-600" />}
            {status === "error" && <XCircle className="h-12 w-12 text-red-600" />}
          </div>

          <CardTitle className="text-2xl">
            {status === "loading" && "Procesando..."}
            {status === "success" && "¡Confirmación exitosa!"}
            {status === "error" && "Error de confirmación"}
          </CardTitle>

          <CardDescription>
            {status === "loading" && "Por favor espera mientras procesamos tu solicitud"}
            {message}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Procesando...</span>
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

              <Button
                onClick={handleContinue}
                className="w-full bg-indigo-dark text-white hover:bg-indigo-dark/90"
                size="lg"
              >
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
