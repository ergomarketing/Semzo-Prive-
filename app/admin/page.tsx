"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import { Package, Calendar, Users, Clock, DollarSign } from "lucide-react"

interface DashboardStats {
  totalBags: number
  availableBags: number
  rentedBags: number
  totalReservations: number
  activeReservations: number
  totalMembers: number
  monthlyRevenue: number
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalBags: 0,
    availableBags: 0,
    rentedBags: 0,
    totalReservations: 0,
    activeReservations: 0,
    totalMembers: 0,
    monthlyRevenue: 0,
  })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDashboardStats()
  }, [])

  async function loadDashboardStats() {
    try {
      console.log("[v0] 📊 Cargando estadísticas del dashboard...")

      const response = await fetch("/api/admin/dashboard-stats")

      if (!response.ok) {
        throw new Error(`Error loading stats: ${response.statusText}`)
      }

      const data = await response.json()
      console.log("[v0] ✅ Estadísticas recibidas:", data)

      setStats(data)
    } catch (error) {
      console.error("[v0] ❌ Error loading dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const kpiCards = [
    {
      title: "Bolsos Disponibles",
      value: stats.availableBags,
      total: stats.totalBags,
      icon: Package,
      color: "text-green-600",
      bgColor: "bg-green-50",
      description: `${stats.rentedBags} rentados`,
      href: "/admin/inventory",
    },
    {
      title: "Reservas Activas",
      value: stats.activeReservations,
      total: stats.totalReservations,
      icon: Calendar,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      description: "En curso",
      href: "/admin/reservations",
    },
    {
      title: "Miembros Totales",
      value: stats.totalMembers,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      description: "Usuarios registrados",
      href: "/admin/members",
    },
    {
      title: "Ingresos del Mes",
      value: `$${stats.monthlyRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      description: "Total facturado",
      href: "/admin/payments",
    },
  ]

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando datos...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Dashboard</h1>
        <p className="text-gray-600 text-lg">Panel de control de Semzo Privé</p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, index) => (
          <Link key={index} href={kpi.href}>
            <Card className="overflow-hidden h-full transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer border-2 hover:border-blue-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-lg ${kpi.bgColor}`}>
                    <kpi.icon className={`h-6 w-6 ${kpi.color}`} />
                  </div>
                  {kpi.total && (
                    <Badge variant="outline" className="text-xs">
                      {kpi.value}/{kpi.total}
                    </Badge>
                  )}
                </div>
                <h3 className="text-2xl font-bold mb-1">{typeof kpi.value === "number" ? kpi.value : kpi.value}</h3>
                <p className="text-sm text-gray-600 mb-1">{kpi.title}</p>
                <p className="text-xs text-gray-500">{kpi.description}</p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Actividad Reciente
          </CardTitle>
          <CardDescription>Últimas acciones en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Las actividades recientes se mostrarán aquí</p>
            <p className="text-sm mt-1">Próximamente: logs de reservas, cambios de estado, etc.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
