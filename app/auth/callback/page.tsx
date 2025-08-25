"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"

export default function AuthCallback() {
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()

        if (error) {
          console.error("Error en callback:", error)
          router.push("/auth/error")
          return
        }

        if (data.session) {
          // Usuario confirmado exitosamente
          router.push("/dashboard")
        } else {
          // No hay sesión, redirigir al login
          router.push("/auth/login")
        }
      } catch (error) {
        console.error("Error inesperado:", error)
        router.push("/auth/error")
      }
    }

    handleAuthCallback()
  }, [router, supabase])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
        <p className="text-gray-600">Confirmando tu cuenta...</p>
      </div>
    </div>
  )
}
