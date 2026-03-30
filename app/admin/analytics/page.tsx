"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ExternalLink, Users, TrendingUp, ShoppingBag, Activity } from "lucide-react"

interface AnalyticsData {
  totalMembers: number
  activeMembers: number
  thisMonthRegistrations: number
  totalReservations: number
  activeReservations: number
  membershipDistribution: {
    petite: number
    essentiel: number
    signature: number
    prive: number
  }
}

const EVENTS = [
  { name: "Registro", facebook: "CompleteRegistration", google: "sign_up", description: "Usuario completa registro" },
  { name: "Inicio Checkout", facebook: "InitiateCheckout", google: "begin_checkout", description: "Usuario inicia pago" },
  { name: "Compra", facebook: "Purchase", google: "purchase", description: "Suscripcion completada" },
  { name: "Ver Bolso", facebook: "ViewContent", google: "view_item", description: "Usuario ve detalle de bolso" },
  { name: "Wishlist", facebook: "AddToWishlist", google: "add_to_wishlist", description: "Bolso anadido a wishlist" },
  { name: "Compartir", facebook: "Share", google: "share", description: "Usuario comparte codigo referido" },
]

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/admin/members")
      const membersData = await res.json()

      const stats = membersData.stats || {}
      const members = membersData.members || []

      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const thisMonthRegistrations = members.filter(
        (m: { joinDate: string }) => new Date(m.joinDate) >= startOfMonth
      ).length

      const reservationsRes = await fetch("/api/admin/reservations")
      const reservationsData = await reservationsRes.json()
      const reservations = Array.isArray(reservationsData) ? reservationsData : (reservationsData.reservations || [])

      setData({
        totalMembers: stats.total || 0,
        activeMembers: stats.active || 0,
        thisMonthRegistrations,
        totalReservations: reservations.length,
        activeReservations: reservations.filter((r: { status: string }) =>
          ["active", "approved", "shipped"].includes(r.status)
        ).length,
        membershipDistribution: {
          petite: 0,
          essentiel: stats.essentiel || 0,
          signature: stats.signature || 0,
          prive: stats.prive || 0,
        },
      })
    } catch (error) {
      console.error("Error fetching analytics:", error)
    } finally {
      setLoading(false)
    }
  }

  const hasFbPixel = !!process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID
  const hasGtm = !!process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Analytics</h1>
        <p className="text-gray-600 mt-1">Metricas del negocio y configuracion de tracking</p>
      </div>

      {/* KPIs Reales */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Miembros</CardTitle>
            <Users className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "-" : data?.totalMembers ?? 0}</div>
            <p className="text-xs text-gray-500">{loading ? "" : `${data?.thisMonthRegistrations ?? 0} este mes`}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Miembros Activos</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{loading ? "-" : data?.activeMembers ?? 0}</div>
            <p className="text-xs text-gray-500">Con suscripcion activa</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reservas Totales</CardTitle>
            <ShoppingBag className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{loading ? "-" : data?.totalReservations ?? 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Reservas Activas</CardTitle>
            <TrendingUp className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{loading ? "-" : data?.activeReservations ?? 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Distribucion */}
      {data && (
        <Card>
          <CardHeader>
            <CardTitle>Distribucion de Membresias</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: "L'Essentiel", value: data.membershipDistribution.essentiel, color: "bg-slate-600" },
                { label: "Signature", value: data.membershipDistribution.signature, color: "bg-rose-500" },
                { label: "Prive", value: data.membershipDistribution.prive, color: "bg-slate-900" },
              ].map(({ label, value, color }) => (
                <div key={label} className="text-center p-4 border rounded-lg">
                  <div className={`inline-block w-3 h-3 rounded-full ${color} mb-2`} />
                  <div className="text-2xl font-bold">{value}</div>
                  <div className="text-sm text-gray-600">{label}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Estado Pixels */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Pixels de Tracking</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="font-medium">Facebook Pixel</div>
              <Badge className={hasFbPixel ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                {hasFbPixel ? "Configurado" : "Sin configurar"}
              </Badge>
            </div>
            <a
              href="https://business.facebook.com/events_manager"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              Abrir Events Manager <ExternalLink className="h-3 w-3" />
            </a>
          </div>
          <div className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex items-center gap-3">
              <div className="font-medium">Google Analytics</div>
              <Badge className={hasGtm ? "bg-green-100 text-green-800" : "bg-yellow-100 text-yellow-800"}>
                {hasGtm ? "Configurado" : "Sin configurar"}
              </Badge>
            </div>
            <a
              href="https://analytics.google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 text-sm text-blue-600 hover:underline"
            >
              Abrir Analytics <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        </CardContent>
      </Card>

      {/* Eventos configurados */}
      <Card>
        <CardHeader>
          <CardTitle>Eventos de Tracking Configurados</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Evento</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Facebook</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Google</th>
                  <th className="text-left py-2 px-3 font-medium text-gray-600">Descripcion</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {EVENTS.map((event) => (
                  <tr key={event.name} className="hover:bg-gray-50">
                    <td className="py-2 px-3 font-medium">{event.name}</td>
                    <td className="py-2 px-3 text-gray-600 font-mono text-xs">{event.facebook}</td>
                    <td className="py-2 px-3 text-gray-600 font-mono text-xs">{event.google}</td>
                    <td className="py-2 px-3 text-gray-500">{event.description}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
