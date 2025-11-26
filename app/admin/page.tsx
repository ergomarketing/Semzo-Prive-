"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Package, Calendar, Users, DollarSign, Mail, Clock } from "lucide-react"

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
      const response = await fetch("/api/admin/dashboard-stats")
      if (!response.ok) throw new Error(`Error loading stats: ${response.statusText}`)
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("Error loading dashboard stats:", error)
    } finally {
      setLoading(false)
    }
  }

  const kpiCards = [
    {
      title: "Bolsos Disponibles",
      value: stats.availableBags,
      subtitle: `${stats.rentedBags} rentados de ${stats.totalBags}`,
      icon: Package,
      href: "/admin/inventory",
    },
    {
      title: "Reservas Activas",
      value: stats.activeReservations,
      subtitle: `${stats.totalReservations} totales`,
      icon: Calendar,
      href: "/admin/reservations",
    },
    {
      title: "Miembros",
      value: stats.totalMembers,
      subtitle: "Usuarios registrados",
      icon: Users,
      href: "/admin/members",
    },
    {
      title: "Ingresos del Mes",
      value: `€${stats.monthlyRevenue.toFixed(0)}`,
      subtitle: "Total facturado",
      icon: DollarSign,
      href: "/admin/payments",
    },
    {
      title: "Newsletter",
      value: "Enviar",
      subtitle: "Gestionar suscriptores",
      icon: Mail,
      href: "/admin/newsletter",
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4"
            style={{ borderColor: "#1a2c4e" }}
          ></div>
          <p style={{ color: "#1a2c4e" }}>Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold" style={{ color: "#1a2c4e" }}>
          Dashboard
        </h1>
        <p style={{ color: "#888" }}>Panel de control de Semzo Privé</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5 mb-8">
        {kpiCards.map((kpi, index) => (
          <Link key={index} href={kpi.href}>
            <Card
              className="h-full transition-all duration-200 hover:shadow-md cursor-pointer border-0"
              style={{ backgroundColor: "white" }}
            >
              <CardContent className="p-5">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ backgroundColor: "#d4a5a5" }}
                >
                  <kpi.icon className="h-5 w-5" style={{ color: "#1a2c4e" }} />
                </div>
                <h3 className="text-2xl font-bold mb-1" style={{ color: "#1a2c4e" }}>
                  {kpi.value}
                </h3>
                <p className="text-sm font-medium" style={{ color: "#1a2c4e" }}>
                  {kpi.title}
                </p>
                <p className="text-xs" style={{ color: "#888" }}>
                  {kpi.subtitle}
                </p>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <Card className="border-0" style={{ backgroundColor: "white" }}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2" style={{ color: "#1a2c4e" }}>
            <Clock className="h-5 w-5" />
            Actividad Reciente
          </CardTitle>
          <CardDescription style={{ color: "#888" }}>Últimas acciones en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto mb-3" style={{ color: "#d4a5a5" }} />
            <p style={{ color: "#888" }}>Las actividades recientes se mostrarán aquí</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
