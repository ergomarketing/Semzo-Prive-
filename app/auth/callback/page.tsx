"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function AuthCallback() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [status, setStatus] = useState("Procesando...")

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const code = searchParams.get("code")

        if (code) {
          setStatus("Confirmando tu cuenta...")

          const { data, error } = await supabase.auth.exchangeCodeForSession(code)

          if (error) {
            console.error("[Callback] Error:", error)
            setStatus("Error en la confirmación")
            router.push("/auth/error")
            return
          }

          if (data.user) {
            console.log("[Callback] Usuario confirmado:", data.user.email)
            setStatus("¡Cuenta confirmada! Redirigiendo...")

            // Guardar datos en localStorage
            const userData = {
              id: data.user.id,
              email: data.user.email,
              firstName: data.user.user_metadata?.firstName || "",
              lastName: data.user.user_metadata?.lastName || "",
              phone: data.user.user_metadata?.phone || "",
              membershipStatus: "free",
            }

            localStorage.setItem("user", JSON.stringify(userData))
            localStorage.setItem("session", JSON.stringify(data.session))
            localStorage.setItem("isLoggedIn", "true")

            // Redirigir al dashboard
            setTimeout(() => {
              window.location.href = "/dashboard"
            }, 1000)
          }
        } else {
          setStatus("Código de confirmación no encontrado")
          router.push("/auth/error")
        }
      } catch (error) {
        console.error("[Callback] Error general:", error)
        setStatus("Error procesando la confirmación")
        router.push("/auth/error")
      }
    }

    handleAuthCallback()
  }, [router, searchParams])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">{status}</p>
      </div>
    </div>
  )
}
