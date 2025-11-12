"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Package, User, CreditCard, ArrowLeft } from "lucide-react"
import Link from "next/link"

interface Reservation {
  id: string
  created_at: string
  start_date: string
  end_date: string
  status: string
  total_price: number
  profiles: {
    full_name: string
    email: string
    member_type: string
  }
  bags: {
    name: string
    brand: string
  }
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    fetchReservations()
  }, [])

  const fetchReservations = async () => {
    try {
      const response = await fetch("/api/admin/reservations")
      const data = await response.json()
      setReservations(data)
    } catch (error) {
      console.error("Error fetching reservations:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateReservationStatus = async (id: string, newStatus: string) => {
    try {
      const response = await fetch("/api/admin/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      })

      if (response.ok) {
        fetchReservations()
      }
    } catch (error) {
      console.error("Error updating reservation:", error)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "secondary",
      confirmed: "default",
      active: "default",
      completed: "outline",
      cancelled: "destructive",
    }
    return <Badge variant={variants[status] || "default"}>{status}</Badge>
  }

  const getMembershipBadge = (type: string) => {
    const colors: Record<string, string> = {
      free: "bg-gray-100 text-gray-800",
      essentiel: "bg-blue-100 text-blue-800",
      signature: "bg-purple-100 text-purple-800",
      prive: "bg-amber-100 text-amber-800",
    }
    return <span className={`px-2 py-1 rounded-full text-xs font-medium ${colors[type] || colors.free}`}>{type}</span>
  }

  const filteredReservations = reservations.filter((r) => {
    if (filter === "all") return true
    return r.status === filter
  })

  const stats = {
    total: reservations.length,
    pending: reservations.filter((r) => r.status === "pending").length,
    active: reservations.filter((r) => r.status === "active").length,
    completed: reservations.filter((r) => r.status === "completed").length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando reservas...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
          </Link>
          <h1 className="text-3xl font-bold text-gray-900">Gestión de Reservas</h1>
          <p className="text-gray-600 mt-2">Administra todas las reservas de bolsos</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Reservas</CardTitle>
              <Package className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
              <Calendar className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.pending}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activas</CardTitle>
              <CreditCard className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completadas</CardTitle>
              <User className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.completed}</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filtros</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                <SelectItem value="pending">Pendientes</SelectItem>
                <SelectItem value="confirmed">Confirmadas</SelectItem>
                <SelectItem value="active">Activas</SelectItem>
                <SelectItem value="completed">Completadas</SelectItem>
                <SelectItem value="cancelled">Canceladas</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {/* Reservations Table */}
        <Card>
          <CardHeader>
            <CardTitle>Lista de Reservas</CardTitle>
            <CardDescription>{filteredReservations.length} reserva(s) encontrada(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Bolso</TableHead>
                  <TableHead>Membresía</TableHead>
                  <TableHead>Fechas</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((reservation) => (
                  <TableRow key={reservation.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{reservation.profiles.full_name}</div>
                        <div className="text-sm text-gray-500">{reservation.profiles.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{reservation.bags.name}</div>
                        <div className="text-sm text-gray-500">{reservation.bags.brand}</div>
                      </div>
                    </TableCell>
                    <TableCell>{getMembershipBadge(reservation.profiles.member_type)}</TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{new Date(reservation.start_date).toLocaleDateString("es-ES")}</div>
                        <div className="text-gray-500">
                          {new Date(reservation.end_date).toLocaleDateString("es-ES")}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">€{reservation.total_price}</TableCell>
                    <TableCell>{getStatusBadge(reservation.status)}</TableCell>
                    <TableCell>
                      <Select
                        value={reservation.status}
                        onValueChange={(value) => updateReservationStatus(reservation.id, value)}
                      >
                        <SelectTrigger className="w-[130px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="confirmed">Confirmada</SelectItem>
                          <SelectItem value="active">Activa</SelectItem>
                          <SelectItem value="completed">Completada</SelectItem>
                          <SelectItem value="cancelled">Cancelada</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
