"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Calendar, Package, User, Clock, CheckCircle, XCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface Reservation {
  id: string
  bagName: string
  memberName: string
  startDate: string
  endDate: string
  status: "pending" | "active" | "completed" | "cancelled"
  totalPrice: number
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadReservations()
  }, [])

  async function loadReservations() {
    try {
      console.log("[v0] Fetching reservations from API...")
      const response = await fetch("/api/admin/reservations")

      if (!response.ok) {
        throw new Error("Failed to fetch reservations")
      }

      const data = await response.json()
      console.log("[v0] Loaded reservations:", data)
      setReservations(data)
    } catch (error) {
      console.error("[v0] Error loading reservations:", error)
      toast({
        title: "Error",
        description: "No se pudieron cargar las reservas",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function updateReservationStatus(reservationId: string, status: string) {
    try {
      console.log("[v0] Updating reservation status:", reservationId, status)
      const response = await fetch("/api/admin/reservations", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ reservationId, status }),
      })

      if (!response.ok) {
        throw new Error("Failed to update reservation")
      }

      toast({
        title: "Éxito",
        description: `Reserva ${status === "active" ? "aprobada" : "cancelada"} correctamente`,
      })

      // Reload reservations
      loadReservations()
    } catch (error) {
      console.error("[v0] Error updating reservation:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar la reserva",
        variant: "destructive",
      })
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-blue-100 text-blue-800"
      case "completed":
        return "bg-green-100 text-green-800"
      case "cancelled":
        return "bg-red-100 text-red-800"
      default:
        return "bg-yellow-100 text-yellow-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Activa"
      case "completed":
        return "Completada"
      case "cancelled":
        return "Cancelada"
      default:
        return "Pendiente"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando reservas...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-serif mb-2">Reservas</h1>
          <p className="text-gray-600">Gestiona las reservas de bolsos</p>
        </div>

        {reservations.length === 0 ? (
          <Card className="bg-white">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Calendar className="h-16 w-16 text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold mb-2">No hay reservas</h3>
              <p className="text-gray-600 text-center max-w-md">
                Cuando los miembros realicen reservas, aparecerán aquí para que puedas gestionarlas.
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {reservations.map((reservation) => (
              <Card key={reservation.id} className="bg-white">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-4">
                      <div className="p-3 bg-blue-50 rounded-lg">
                        <Package className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <CardTitle className="text-xl mb-1">{reservation.bagName}</CardTitle>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <User className="h-4 w-4" />
                          <span>{reservation.memberName}</span>
                        </div>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(reservation.status)}`}
                    >
                      {getStatusText(reservation.status)}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="flex items-center gap-2 text-sm">
                        <Clock className="h-4 w-4 text-gray-500" />
                        <span className="text-gray-600">
                          {new Date(reservation.startDate).toLocaleDateString()} -{" "}
                          {new Date(reservation.endDate).toLocaleDateString()}
                        </span>
                      </div>
                      <div className="text-sm font-semibold">${reservation.totalPrice.toFixed(2)}</div>
                    </div>
                    <div className="flex gap-2">
                      {reservation.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            className="bg-green-600 hover:bg-green-700"
                            onClick={() => updateReservationStatus(reservation.id, "active")}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Aprobar
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => updateReservationStatus(reservation.id, "cancelled")}
                          >
                            <XCircle className="h-4 w-4 mr-1" />
                            Rechazar
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
