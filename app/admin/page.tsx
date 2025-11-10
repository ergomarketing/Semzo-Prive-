"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Calendar, Users, DollarSign, Clock } from "lucide-react"
import { useRouter } from "next/navigation"

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
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    loadDashboardStats()
  }, [])

  async function loadDashboardStats() {
    try {
      const response = await fetch("/api/admin/dashboard-stats")
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error("[v0] ❌ Error loading stats:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-lg">Cargando...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-serif mb-2">Dashboard</h1>
          <p className="text-gray-600">Panel de control de Semzo Privé</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-12">
          <Card
            className="cursor-pointer hover:shadow-lg transition-all bg-white border-gray-200"
            onClick={() => router.push("/admin/inventory")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <Package className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-right ml-auto">
                  <p className="text-sm text-gray-600">8/21</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{stats?.availableBags || 0}</div>
              <p className="text-sm text-gray-600">Bolsos Disponibles</p>
              <p className="text-xs text-gray-500 mt-1">{stats?.rentedBags || 0} rentados</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all bg-white border-gray-200"
            onClick={() => router.push("/admin/reservations")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <Calendar className="h-5 w-5 text-blue-600" />
                </div>
                <div className="text-right ml-auto">
                  <p className="text-sm text-gray-600">{stats?.activeReservations || 0}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{stats?.activeReservations || 0}</div>
              <p className="text-sm text-gray-600">Reservas Activas</p>
              <p className="text-xs text-gray-500 mt-1">En curso</p>
            </CardContent>
          </Card>

          <Card
            className="cursor-pointer hover:shadow-lg transition-all bg-white border-gray-200"
            onClick={() => router.push("/admin/members")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-50 rounded-lg">
                  <Users className="h-5 w-5 text-purple-600" />
                </div>
                <div className="text-right ml-auto">
                  <p className="text-sm text-gray-600">{stats?.totalMembers || 0}</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">{stats?.totalMembers || 0}</div>
              <p className="text-sm text-gray-600">Miembros Totales</p>
              <p className="text-xs text-gray-500 mt-1">Usuarios registrados</p>
            </CardContent>
          </Card>

          <Card
            className="bg-white border-gray-200 cursor-pointer hover:shadow-lg transition-all"
            onClick={() => router.push("/admin/payments")}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-50 rounded-lg">
                  <DollarSign className="h-5 w-5 text-green-600" />
                </div>
                <div className="text-right ml-auto">
                  <p className="text-sm text-gray-600">${stats?.monthlyRevenue || 0}.00</p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-1">${stats?.monthlyRevenue || 0}.00</div>
              <p className="text-sm text-gray-600">Ingresos del Mes</p>
              <p className="text-xs text-gray-500 mt-1">Total facturado</p>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Actividad Reciente
            </CardTitle>
            <p className="text-sm text-gray-600">Últimas acciones en el sistema</p>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-16 w-16 text-gray-300 mb-4" />
              <p className="text-gray-600 mb-2">Las actividades recientes se mostrarán aquí</p>
              <p className="text-sm text-gray-500">Próximamente: logs de reservas, cambios de estado, etc.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
