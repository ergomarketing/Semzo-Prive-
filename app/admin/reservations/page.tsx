"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Calendar, Package, User, Clock, Filter } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Reservation {
  id: string
  bagName: string
  bagBrand: string
  customerName: string
  customerEmail: string
  startDate: string
  endDate: string
  status: string
  totalAmount: number
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState<string>("all")

  useEffect(() => {
    fetchReservations()
  }, [])

  const fetchReservations = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/reservations")
      const data = await response.json()

      const formattedReservations: Reservation[] =
        data.reservations?.map((r: any) => ({
          id: r.id,
          bagName: r.bag_name,
          bagBrand: r.bag_brand,
          customerName: r.customer_name,
          customerEmail: r.customer_email,
          startDate: r.start_date,
          endDate: r.end_date,
          status: r.status,
          totalAmount: r.total_amount,
        })) || []

      setReservations(formattedReservations)
    } catch (error) {
      console.error("Error fetching reservations:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredReservations = reservations.filter((r) => filterStatus === "all" || r.status === filterStatus)

  const getStatusColor = (status: string) => {
    const colors = {
      active: "bg-green-100 text-green-800",
      pending: "bg-yellow-100 text-yellow-800",
      completed: "bg-blue-100 text-blue-800",
      cancelled: "bg-red-100 text-red-800",
    }
    return colors[status as keyof typeof colors] || "bg-gray-100 text-gray-800"
  }

  const stats = {
    total: reservations.length,
    active: reservations.filter((r) => r.status === "active").length,
    pending: reservations.filter((r) => r.status === "pending").length,
    completed: reservations.filter((r) => r.status === "completed").length,
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Gestión de Reservas</h1>
          <p className="text-slate-600">Calendario y seguimiento de alquileres</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-slate-600">Total Reservas</p>
              <p className="text-3xl font-bold text-slate-900">{stats.total}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-slate-600">Activas</p>
              <p className="text-3xl font-bold text-green-600">{stats.active}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-slate-600">Pendientes</p>
              <p className="text-3xl font-bold text-yellow-600">{stats.pending}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-slate-600">Completadas</p>
              <p className="text-3xl font-bold text-blue-600">{stats.completed}</p>
            </CardContent>
          </Card>
        </div>

        {/* Filter */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <Filter className="h-5 w-5 text-slate-600" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 border rounded-lg bg-white"
              >
                <option value="all">Todas las reservas</option>
                <option value="active">Activas</option>
                <option value="pending">Pendientes</option>
                <option value="completed">Completadas</option>
                <option value="cancelled">Canceladas</option>
              </select>
            </div>
          </CardContent>
        </Card>

        {/* Reservations List */}
        <div className="grid gap-4">
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-600">Cargando reservas...</p>
              </CardContent>
            </Card>
          ) : filteredReservations.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Calendar className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No hay reservas</p>
              </CardContent>
            </Card>
          ) : (
            filteredReservations.map((reservation) => (
              <Card key={reservation.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-purple-100 rounded-full">
                        <Package className="h-6 w-6 text-purple-600" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">
                            {reservation.bagBrand} - {reservation.bagName}
                          </h3>
                          <Badge className={getStatusColor(reservation.status)}>
                            {reservation.status.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600 mb-3">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            {reservation.customerName}
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            {new Date(reservation.startDate).toLocaleDateString()} -{" "}
                            {new Date(reservation.endDate).toLocaleDateString()}
                          </div>
                        </div>

                        <p className="text-lg font-semibold text-indigo-600">€{reservation.totalAmount}</p>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        Ver Detalles
                      </Button>
                      <Button size="sm">Gestionar</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
