"use client"

import { useEffect, useState } from "react"
import { useAuth } from "../../hooks/useAuth"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingBag, Loader2, Package, Calendar } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"

interface Reservation {
  id: string
  bag_id: string
  status: string
  start_date: string
  end_date: string
  created_at: string
  bags: {
    name: string
    brand: string
    image_url: string
  } | null
}

export default function ReservasPage() {
  const { user } = useAuth()
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchReservations = async () => {
      if (!user) {
        setLoading(false)
        return
      }

      try {
        console.log("[v0] Fetching reservations for user:", user.id)
        const { data, error } = await supabase
          .from("reservations")
          .select(`
            id,
            bag_id,
            status,
            start_date,
            end_date,
            created_at,
            bags (
              name,
              brand,
              image_url
            )
          `)
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })

        if (error) {
          console.error("[v0] Error fetching reservations:", error)
          setError(error.message)
          throw error
        }

        console.log("[v0] Reservations fetched:", data)
        setReservations(data || [])
      } catch (error) {
        console.error("[v0] Error in fetchReservations:", error)
        setError(error instanceof Error ? error.message : "Error desconocido")
      } finally {
        setLoading(false)
      }
    }

    fetchReservations()
  }, [user])

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      active: { label: "Activa", className: "bg-green-100 text-green-800 border-green-200" },
      pending: { label: "Pendiente", className: "bg-yellow-100 text-yellow-800 border-yellow-200" },
      completed: { label: "Completada", className: "bg-slate-100 text-slate-800 border-slate-200" },
      cancelled: { label: "Cancelada", className: "bg-red-100 text-red-800 border-red-200" },
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.pending

    return (
      <Badge variant="secondary" className={config.className}>
        {config.label}
      </Badge>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <h3 className="text-red-900 font-serif text-lg mb-2">Error al cargar reservas</h3>
            <p className="text-red-700 text-sm">{error}</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-serif text-slate-900 mb-2">Mis Reservas</h2>
        <p className="text-slate-600">Gestiona tus reservas activas y revisa tu historial</p>
      </div>

      {reservations.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <ShoppingBag className="h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-xl font-serif text-slate-900 mb-2">No tienes reservas</h3>
            <p className="text-slate-600 text-center mb-6">
              Explora nuestro catálogo y reserva tu primer bolso de lujo.
            </p>
            <Button
              onClick={() => (window.location.href = "/catalog")}
              className="bg-slate-900 hover:bg-slate-800 text-white font-serif"
            >
              <Package className="h-4 w-4 mr-2" />
              Explorar Catálogo
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {reservations.map((reservation) => (
            <Card key={reservation.id} className="hover:shadow-md transition-shadow">
              <CardContent className="flex items-center gap-4 p-6">
                <div className="w-24 h-24 bg-slate-100 rounded-lg flex items-center justify-center overflow-hidden">
                  {reservation.bags?.image_url ? (
                    <img
                      src={reservation.bags.image_url || "/placeholder.svg"}
                      alt={reservation.bags?.name || "Bolso"}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Package className="h-8 w-8 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-serif text-slate-900">{reservation.bags?.name || "Bolso sin nombre"}</h3>
                  <p className="text-sm text-slate-600">{reservation.bags?.brand || "Marca desconocida"}</p>
                  <div className="flex items-center gap-4 mt-2">
                    {getStatusBadge(reservation.status)}
                    <div className="flex items-center gap-1 text-xs text-slate-500">
                      <Calendar className="h-3 w-3" />
                      <span>
                        {new Date(reservation.start_date).toLocaleDateString("es-ES")} -{" "}
                        {new Date(reservation.end_date).toLocaleDateString("es-ES")}
                      </span>
                    </div>
                  </div>
                </div>
                <Button
                  variant="outline"
                  className="border-slate-300 text-slate-700 hover:bg-slate-100 font-serif bg-transparent"
                >
                  Ver Detalles
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
