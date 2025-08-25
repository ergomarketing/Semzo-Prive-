"use client"

import { useAuth } from "@/hooks/useAuth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"
import Navbar from "../components/navbar"
import Footer from "../components/footer"
import { Button } from "@/components/ui/button"
import { Calendar, ShoppingBag, Loader2 } from "lucide-react"

export default function ReservationsPage() {
  const { user, loading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push("/auth/login")
    }
  }, [user, loading, router])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  if (!user) return null

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-rose-50/20">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className="font-serif text-4xl md:text-5xl text-slate-900 mb-6 flex items-center justify-center gap-3">
              <Calendar className="w-8 h-8 text-slate-700" />
              Mis Reservas
            </h1>
            <p className="text-lg text-slate-600 max-w-3xl mx-auto">
              Gestiona todas tus reservas actuales y revisa tu historial de alquileres.
            </p>
          </div>

          <div className="text-center py-16">
            <div className="max-w-md mx-auto">
              <Calendar className="w-16 h-16 text-slate-300 mx-auto mb-6" />
              <h3 className="text-2xl font-serif text-slate-800 mb-4">No tienes reservas activas</h3>
              <p className="text-slate-600 mb-6">
                Explora nuestro catálogo y realiza tu primera reserva para disfrutar de nuestros bolsos de lujo.
              </p>
              <Button onClick={() => router.push("/catalog")} className="bg-slate-800 hover:bg-slate-700">
                <ShoppingBag className="w-4 h-4 mr-2" />
                Ver Catálogo
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
