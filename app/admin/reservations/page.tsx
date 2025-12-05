"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar, Package, User, CreditCard, Loader2, RefreshCw } from "lucide-react"

interface Reservation {
  id: string
  bag_name: string
  bag_brand: string
  customer_name: string
  customer_email: string
  start_date: string
  end_date: string
  status: string
  total_amount: number
}

interface Stats {
  total: number
  pending: number
  active: number
  completed: number
  cancelled: number
}

const colors = {
  primary: "#1a2c4e",
  accent: "#fff1f2",
  bg: "#faf8f7",
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [stats, setStats] = useState<Stats>({ total: 0, pending: 0, active: 0, completed: 0, cancelled: 0 })
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState("all")
  const [updating, setUpdating] = useState<string | null>(null)

  useEffect(() => {
    fetchReservations()
  }, [])

  const fetchReservations = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/reservations")
      const data = await response.json()
      setReservations(data.reservations || [])
      setStats(data.stats || { total: 0, pending: 0, active: 0, completed: 0, cancelled: 0 })
    } catch (error) {
      console.error("Error fetching reservations:", error)
    } finally {
      setLoading(false)
    }
  }

  const updateReservationStatus = async (id: string, newStatus: string) => {
    console.log("[v0] Updating reservation", id, "to status", newStatus)
    setUpdating(id)
    try {
      const response = await fetch("/api/admin/reservations", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error("[v0] Error response:", errorData)
        alert("Error al actualizar: " + (errorData.error || "Error desconocido"))
        return
      }

      const data = await response.json()
      console.log("[v0] Update successful:", data)

      // Actualizar localmente sin necesidad de refetch
      setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)))

      // Actualizar stats
      setStats((prev) => {
        const oldStatus = reservations.find((r) => r.id === id)?.status
        if (!oldStatus) return prev
        return {
          ...prev,
          [oldStatus]: Math.max(0, (prev[oldStatus as keyof Stats] as number) - 1),
          [newStatus]: ((prev[newStatus as keyof Stats] as number) || 0) + 1,
        }
      })
    } catch (error) {
      console.error("[v0] Error updating reservation:", error)
      alert("Error de conexión al actualizar la reserva")
    } finally {
      setUpdating(null)
    }
  }

  const getStatusBadge = (status: string) => {
    const labels: Record<string, string> = {
      pending: "Pendiente",
      confirmed: "Confirmada",
      active: "Activa",
      completed: "Completada",
      cancelled: "Cancelada",
    }
    return (
      <Badge
        className="text-xs"
        style={{
          backgroundColor: status === "cancelled" ? colors.accent : colors.primary,
          color: status === "cancelled" ? colors.primary : "white",
        }}
      >
        {labels[status] || status}
      </Badge>
    )
  }

  const filteredReservations = reservations.filter((r) => filter === "all" || r.status === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: colors.primary }} />
        <span className="ml-2" style={{ color: "#888" }}>
          Cargando reservas...
        </span>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold" style={{ color: colors.primary }}>
          Gestión de Reservas
        </h1>
        <p style={{ color: "#888" }}>Administra todas las reservas de bolsos</p>
      </div>

      {/* Stats Cards - colores minimalistas */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        {[
          { label: "Total", value: stats.total, icon: Package },
          { label: "Pendientes", value: stats.pending, icon: Calendar },
          { label: "Activas", value: stats.active, icon: CreditCard },
          { label: "Completadas", value: stats.completed, icon: User },
          { label: "Canceladas", value: stats.cancelled, icon: Package },
        ].map((stat, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center"
                  style={{ backgroundColor: colors.accent }}
                >
                  <stat.icon className="h-5 w-5" style={{ color: colors.primary }} />
                </div>
                <div>
                  <p className="text-2xl font-bold" style={{ color: colors.primary }}>
                    {stat.value}
                  </p>
                  <p className="text-xs" style={{ color: "#888" }}>
                    {stat.label}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <Card className="border-0 shadow-sm">
        <CardContent className="p-4">
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
      <Card className="border-0 shadow-sm">
        <CardHeader>
          <CardTitle style={{ color: colors.primary }}>Lista de Reservas</CardTitle>
          <CardDescription style={{ color: "#888" }}>{filteredReservations.length} reserva(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {filteredReservations.length === 0 ? (
            <div className="text-center py-8">
              <Package className="h-12 w-12 mx-auto mb-4" style={{ color: colors.primary, opacity: 0.3 }} />
              <p style={{ color: "#888" }}>No hay reservas</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead style={{ color: colors.primary }}>Cliente</TableHead>
                  <TableHead style={{ color: colors.primary }}>Bolso</TableHead>
                  <TableHead style={{ color: colors.primary }}>Fechas</TableHead>
                  <TableHead style={{ color: colors.primary }}>Precio</TableHead>
                  <TableHead style={{ color: colors.primary }}>Estado</TableHead>
                  <TableHead style={{ color: colors.primary }}>Cambiar Estado</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReservations.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium" style={{ color: colors.primary }}>
                        {r.customer_name}
                      </div>
                      <div className="text-sm" style={{ color: "#888" }}>
                        {r.customer_email}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium" style={{ color: colors.primary }}>
                        {r.bag_name}
                      </div>
                      <div className="text-sm" style={{ color: "#888" }}>
                        {r.bag_brand}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm" style={{ color: colors.primary }}>
                        {new Date(r.start_date).toLocaleDateString("es-ES")}
                      </div>
                      <div className="text-sm" style={{ color: "#888" }}>
                        {new Date(r.end_date).toLocaleDateString("es-ES")}
                      </div>
                    </TableCell>
                    <TableCell style={{ color: colors.primary, fontWeight: 500 }}>
                      {r.total_amount ? `€${r.total_amount}` : "-"}
                    </TableCell>
                    <TableCell>{getStatusBadge(r.status)}</TableCell>
                    <TableCell>
                      <Select
                        defaultValue={r.status}
                        onValueChange={(v) => updateReservationStatus(r.id, v)}
                        disabled={updating === r.id}
                      >
                        <SelectTrigger className="w-[140px]" style={{ borderColor: colors.primary }}>
                          {updating === r.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <SelectValue />}
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
          )}
        </CardContent>
      </Card>

      <div className="text-center">
        <Button
          onClick={fetchReservations}
          variant="outline"
          style={{ borderColor: colors.primary, color: colors.primary }}
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>
    </div>
  )
}
