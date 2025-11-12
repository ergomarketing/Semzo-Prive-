"use client"

import { useAuth } from "../hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import { Loader2 } from "lucide-react"

export default function ReservationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading) {
      if (!user) {
        // Si no está autenticado, redirigir a login
        router.push("/auth/login?redirect=/dashboard/reservas")
      } else {
        // Si está autenticado, redirigir al dashboard de reservas
        router.push("/dashboard/reservas")
      }
    }
  }, [user, loading, router])

  // Mostrar loader mientras redirige
  return (
    <div className="min-h-screen flex items-center justify-center bg-rose-50/20">
      <div className="text-center">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600 mx-auto mb-4" />
        <p className="text-slate-600">Redirigiendo a tus reservas...</p>
      </div>
    </div>
  )
}
