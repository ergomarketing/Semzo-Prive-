"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { supabase } from "@/app/lib/supabase-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CheckCircle, XCircle, Loader2, Mail, ArrowRight } from "lucide-react"

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const [details, setDetails] = useState("")

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        console.log("🔄 Procesando callback de autenticación...")

        // Obtener parámetros de la URL
        const token_hash = searchParams.get("token_hash")
        const type = searchParams.get("type")
        const next = searchParams.get("next") || "/dashboard"

        console.log("📋 Parámetros recibidos:", { token_hash: !!token_hash, type, next })

        if (!token_hash || !type) {
          console.error("❌ Parámetros faltantes en callback")
          setStatus("error")
          setMessage("Enlace de confirmación inválido")
          setDetails("Faltan parámetros requeridos en el enlace")
          return
        }

        // Verificar el token
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash,
          type: type as any,
        })

        if (error) {
          console.error("❌ Error verificando token:", error)
          setStatus("error")
          setMessage("Error confirmando email")
          setDetails(error.message)
          return
        }

        if (!data.user) {
          console.error("❌ No se obtuvo usuario después de verificación")
          setStatus("error")
          setMessage("Error en la verificación")
          setDetails("No se pudo obtener información del usuario")
          return
        }

        console.log("✅ Email confirmado exitosamente para:", data.user.email)

        // Actualizar perfil como verificado
        try {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              email_verified: true,
              updated_at: new Date().toISOString(),
            })
            .eq("id", data.user.id)

          if (updateError) {
            console.warn("⚠️ Error actualizando perfil:", updateError)
          } else {
            console.log("✅ Perfil actualizado como verificado")
          }
        } catch (updateError) {
          console.warn("⚠️ Error actualizando perfil:", updateError)
        }

        setStatus("success")
        setMessage("¡Email confirmado exitosamente!")
        setDetails(`Bienvenido ${data.user.email}. Tu cuenta ha sido activada.`)

        // Redirigir después de 3 segundos
        setTimeout(() => {
          router.push(next)
        }, 3000)
      } catch (error) {
        console.error("❌ Error en callback:", error)
        setStatus("error")
        setMessage("Error procesando confirmación")
        setDetails(error instanceof Error ? error.message : "Error desconocido")
      }
    }

    handleAuthCallback()
  }, [searchParams, router])

  const handleContinue = () => {
    const next = searchParams.get("next") || "/dashboard"
    router.push(next)
  }

  const handleResendEmail = async () => {
    try {
      // Aquí podrías implementar reenvío de email
      setMessage("Funcionalidad de reenvío no implementada aún")
    } catch (error) {
      console.error("Error reenviando email:", error)
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
            {status === "success" && "Tu email ha sido confirmado correctamente"}
            {status === "error" && "Hubo un problema confirmando tu email"}
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Mensaje principal */}
          <div className="text-center">
            <p className="text-sm text-gray-600 mb-2">{message}</p>
            {details && <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg">{details}</p>}
          </div>

          {/* Acciones según el estado */}
          {status === "loading" && (
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Procesando...</span>
            </div>
          )}

          {status === "success" && (
            <div className="space-y-3">
              <Button onClick={handleContinue} className="w-full" size="lg">
                Continuar al Dashboard
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>

              <p className="text-xs text-center text-gray-500">Serás redirigido automáticamente en unos segundos...</p>
            </div>
          )}

          {status === "error" && (
            <div className="space-y-3">
              <Button onClick={handleResendEmail} variant="outline" className="w-full bg-transparent" size="lg">
                <Mail className="mr-2 h-4 w-4" />
                Reenviar email de confirmación
              </Button>

              <Button onClick={() => router.push("/login")} className="w-full" size="lg">
                Volver al login
              </Button>

              <p className="text-xs text-center text-gray-500">Si el problema persiste, contacta soporte</p>
            </div>
          )}

          {/* Información adicional */}
          <div className="border-t pt-4 mt-6">
            <div className="text-xs text-gray-500 space-y-1">
              <p>
                <strong>Tip:</strong> Revisa tu carpeta de spam si no recibes emails
              </p>
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
