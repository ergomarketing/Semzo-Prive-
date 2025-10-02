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
        console.log("[v0] === CALLBACK INICIADO ===")
        console.log("[v0] URL completa:", window.location.href)

        const supabase = getSupabaseBrowser()
        if (!supabase) {
          setStatus("error")
          setMessage("Error de configuración de Supabase")
          return
        }

        const allParams = new URLSearchParams(window.location.search)
        const hashParams = new URLSearchParams(window.location.hash.substring(1))

        const {
          data: { user },
        } = await supabase.auth.getUser()

        if (user && user.email_confirmed_at) {
          console.log("[v0] ✅ Usuario ya confirmado y autenticado:", {
            userId: user.id,
            email: user.email,
            confirmed: !!user.email_confirmed_at,
          })

          setStatus("success")
          setMessage("Tu email ha sido confirmado correctamente")

          setTimeout(() => {
            router.push("/auth/login?message=email_confirmed")
          }, 2000)
          return
        }

        console.log("[v0] === DIAGNÓSTICO COMPLETO ===")
        console.log("[v0] Search params:", Object.fromEntries(allParams.entries()))
        console.log("[v0] Hash params:", Object.fromEntries(hashParams.entries()))

        // Verificar todos los parámetros posibles que Supabase puede enviar
        const possibleParams = [
          "code",
          "access_token",
          "refresh_token",
          "token_hash",
          "type",
          "token",
          "confirmation_token",
          "email",
          "redirect_to",
        ]

        const foundParams: Record<string, string> = {}
        possibleParams.forEach((param) => {
          const searchValue = allParams.get(param) || hashParams.get(param)
          if (searchValue) {
            foundParams[param] = searchValue
            console.log(`[v0] ✓ Encontrado ${param}:`, searchValue.substring(0, 20) + "...")
          }
        })

        console.log("[v0] Parámetros encontrados:", Object.keys(foundParams))

        const code = searchParams.get("code")
        const error_code = searchParams.get("error_code")
        const error_description = searchParams.get("error_description")

        const hashCode = hashParams.get("code")
        const hashAccessToken = hashParams.get("access_token")
        const hashTokenHash = hashParams.get("token_hash")
        const hashType = hashParams.get("type")
        const token = searchParams.get("token")
        const type = searchParams.get("type")

        console.log("[v0] Parámetros específicos:", {
          searchCode: code ? "✓" : "✗",
          hashCode: hashCode ? "✓" : "✗",
          hashAccessToken: hashAccessToken ? "✓" : "✗",
          hashTokenHash: hashTokenHash ? "✓" : "✗",
          hashType: hashType,
          token: token ? "✓" : "✗",
          type: type,
          error_code,
          error_description,
        })

        if (error_code || error_description) {
          console.log("[v0] Error en URL:", { error_code, error_description })
          setStatus("error")
          setMessage(`Error: ${error_description || error_code}`)
          return
        }

        const finalCode = code || hashCode

        if (!finalCode && !hashAccessToken && !hashTokenHash && !token) {
          console.log("[v0] No hay código ni tokens de confirmación")

          const {
            data: { session },
          } = await supabase.auth.getSession()

          if (session?.user) {
            console.log("[v0] ✅ Sesión activa encontrada - confirmación exitosa")
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

        // Método 1: exchangeCodeForSession si hay código
        if (finalCode) {
          console.log("[v0] Método 1: Confirmando con exchangeCodeForSession...")
          const { data, error } = await supabase.auth.exchangeCodeForSession(finalCode)

          if (error) {
            console.log("[v0] Error método 1:", error.message)
            // Continuar con otros métodos
          } else if (data.user) {
            console.log("[v0] ✅ Método 1 exitoso - Email confirmado:", {
              userId: data.user.id,
              email: data.user.email,
              confirmed: !!data.user.email_confirmed_at,
            })

            setStatus("success")
            setMessage("Tu email ha sido confirmado correctamente")

            setTimeout(() => {
              router.push("/auth/login?message=email_confirmed")
            }, 2000)
            return
          }
        }

        // Método 2: verifyOtp si hay token (parámetro directo de Supabase)
        if (token && type) {
          console.log("[v0] Método 2: Confirmando con verifyOtp usando token...")
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: token,
            type: type as any,
          })

          if (error) {
            console.log("[v0] Error método 2:", error.message)
            console.log("[v0] Error completo método 2:", error)
          } else if (data.user) {
            console.log("[v0] ✅ Método 2 exitoso - Email confirmado:", {
              userId: data.user.id,
              email: data.user.email,
              confirmed: !!data.user.email_confirmed_at,
            })

            setStatus("success")
            setMessage("Tu email ha sido confirmado correctamente")

            setTimeout(() => {
              router.push("/auth/login?message=email_confirmed")
            }, 2000)
            return
          }
        }

        // Método 3: verifyOtp si hay token_hash
        if (hashTokenHash && hashType) {
          console.log("[v0] Método 3: Confirmando con verifyOtp usando token_hash...")
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: hashTokenHash,
            type: "signup" as const,
          })

          if (error) {
            console.log("[v0] Error método 3:", error.message)
            console.log("[v0] Error completo método 3:", error)
          } else if (data.user) {
            console.log("[v0] ✅ Método 3 exitoso - Email confirmado:", {
              userId: data.user.id,
              email: data.user.email,
              confirmed: !!data.user.email_confirmed_at,
            })

            setStatus("success")
            setMessage("Tu email ha sido confirmado correctamente")

            setTimeout(() => {
              router.push("/auth/login?message=email_confirmed")
            }, 2000)
            return
          }
        }

        // Si llegamos aquí, ningún método funcionó
        console.log("[v0] ❌ Todos los métodos fallaron")

        const {
          data: { session: finalSession },
        } = await supabase.auth.getSession()

        if (finalSession?.user) {
          console.log("[v0] ✅ Confirmación exitosa detectada en verificación final")
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
