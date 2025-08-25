"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading")
  const [message, setMessage] = useState("")
  const supabase = createClientComponentClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const code = searchParams.get("code")

        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            console.error("Error en callback:", error)
            setStatus("error")
            setMessage(error.message)
            return
          }

          if (data.user) {
            console.log("Usuario confirmado exitosamente:", data.user.email)
            setStatus("success")
            setMessage("Email confirmado exitosamente. Redirigiendo...")

            // Redirigir al dashboard
            setTimeout(() => {
              window.location.href = "/dashboard"
            }, 2000)
          }
        } else {
          setStatus("error")
          setMessage("Código de confirmación no encontrado")
        }
      } catch (error) {
        console.error("Error procesando callback:", error)
        setStatus("error")
        setMessage("Error procesando la confirmación")
      }
    }

    handleAuthCallback()
  }, [searchParams, supabase.auth, router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">
            {status === "loading" && "Confirmando cuenta..."}
            {status === "success" && "¡Cuenta confirmada!"}
            {status === "error" && "Error de confirmación"}
          </CardTitle>
          <CardDescription>
            {status === "loading" && "Por favor espera mientras confirmamos tu cuenta"}
            {status === "success" && "Tu cuenta ha sido confirmada exitosamente"}
            {status === "error" && "Hubo un problema confirmando tu cuenta"}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          {status === "loading" && (
            <div className="flex items-center justify-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          )}
          {status === "success" && <div className="text-green-600 font-medium">Redirigiendo al dashboard...</div>}
          {status === "error" && (
            <div className="text-red-600">
              <p className="mb-4">{message}</p>
              <a href="/login" className="text-blue-600 hover:text-blue-700 underline">
                Volver al login
              </a>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
