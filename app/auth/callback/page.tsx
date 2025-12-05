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
  const [status, setStatus] = useState<"loading" | "success" | "error" | "needs_password">("loading")
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
        const isPasswordRecovery = type === "recovery"
        const isEmailChange = type === "email_change"
        const isSignup = type === "signup"

        if (isPasswordRecovery) {
          const fullHash = window.location.hash
          router.push(`/auth/reset${fullHash}`)
          return
        }

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user && (isEmailChange || isSignup)) {
          // Verificar si el usuario se registró con teléfono (no tiene contraseña)
          const hasPhoneOnly = user.phone && !user.app_metadata?.provider?.includes("email")
          const identities = user.identities || []
          const hasPasswordIdentity = identities.some((id: any) => id.provider === "email")

          // Si se registró con teléfono y no tiene identidad de email con contraseña
          if (hasPhoneOnly || !hasPasswordIdentity) {
            setStatus("needs_password")
            setMessage("Email confirmado. Ahora crea una contraseña para acceder con email.")
            return
          }
        }

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
            const identities = session.user.identities || []
            const hasPasswordIdentity = identities.some((id: any) => id.provider === "email")

            if (!hasPasswordIdentity && session.user.phone) {
              setStatus("needs_password")
              setMessage("Email confirmado. Ahora crea una contraseña para acceder con email.")
              return
            }

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
            const identities = data.user.identities || []
            const hasPasswordIdentity = identities.some((id: any) => id.provider === "email")

            if (!hasPasswordIdentity && data.user.phone) {
              setStatus("needs_password")
              setMessage("Email confirmado. Ahora crea una contraseña para acceder con email.")
              return
            }

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
            const identities = data.user.identities || []
            const hasPasswordIdentity = identities.some((id: any) => id.provider === "email")

            if (!hasPasswordIdentity && data.user.phone) {
              setStatus("needs_password")
              setMessage("Email confirmado. Ahora crea una contraseña para acceder con email.")
              return
            }

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
    } else if (status === "needs_password") {
      const hash = window.location.hash
      router.push(`/auth/set-password${hash}`)
    } else {
      router.push("/auth/login")
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-rose-50/30 to-white p-4">
      <Card className="w-full max-w-md border-0 shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4">
            {status === "loading" && <Loader2 className="h-12 w-12 text-[#1a2c4e] animate-spin" />}
            {status === "success" && <CheckCircle className="h-12 w-12 text-[#1a2c4e]" />}
            {status === "needs_password" && <CheckCircle className="h-12 w-12 text-[#1a2c4e]" />}
            {status === "error" && <XCircle className="h-12 w-12 text-slate-500" />}
          </div>

          <CardTitle className="text-2xl font-serif">
            {status === "loading" && "Confirmando email..."}
            {status === "success" && "¡Confirmación exitosa!"}
            {status === "needs_password" && "¡Email confirmado!"}
            {status === "error" && "Error de confirmación"}
          </CardTitle>

          <CardDescription className="text-slate-600">
            {status === "loading" && "Por favor espera mientras procesamos tu confirmación"}
            {message}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {status === "loading" && (
            <div className="flex items-center justify-center space-x-2 text-sm text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Procesando confirmación...</span>
            </div>
          )}

          {status === "needs_password" && (
            <div className="space-y-3">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-4">
                  Tu email ha sido verificado. Como te registraste con teléfono, necesitas crear una contraseña para
                  poder iniciar sesión con email.
                </p>
              </div>

              <Button onClick={handleContinue} className="w-full bg-[#1a2c4e] hover:bg-[#1a2c4e]/90" size="lg">
                Crear contraseña
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {(status === "success" || status === "error") && (
            <div className="space-y-3">
              <div className="text-center">
                {status === "success" && (
                  <p className="text-sm text-slate-600 mb-4">¡Bienvenido! Ya puedes iniciar sesión con tu cuenta.</p>
                )}
                {status === "error" && (
                  <p className="text-sm text-slate-600 mb-4">
                    Puedes intentar registrarte nuevamente o contactar soporte.
                  </p>
                )}
              </div>

              <Button onClick={handleContinue} className="w-full bg-[#1a2c4e] hover:bg-[#1a2c4e]/90" size="lg">
                {status === "success" ? "Ir al Login" : "Volver al Login"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              {status === "success" && (
                <p className="text-xs text-center text-slate-500">Serás redirigido automáticamente...</p>
              )}
            </div>
          )}

          <div className="border-t pt-4 mt-6">
            <div className="text-xs text-slate-500 space-y-1">
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
