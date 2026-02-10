"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import Link from "next/link"
import { Package, Calendar, Users, DollarSign, Mail, TrendingUp, TrendingDown, ArrowRight, QrCode } from "lucide-react"
import { Button } from "@/components/ui/button"

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
    const controller = new AbortController()

    async function loadDashboardStats() {
      try {
        const response = await fetch("/api/admin/dashboard-stats", {
          signal: controller.signal,
        })
        if (!response.ok) throw new Error(`Error loading stats: ${response.statusText}`)
        const data = await response.json()
        setStats(data)
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return
        }
        console.error("Error loading dashboard stats:", error)
      } finally {
        setLoading(false)
      }
    }

    loadDashboardStats()

    return () => {
      controller.abort()
    }
  }, [])

  const kpiCards = [
    {
      title: "Bolsos Disponibles",
      value: stats.availableBags,
      subtitle: `${stats.rentedBags} rentados de ${stats.totalBags}`,
      icon: Package,
      href: "/admin/inventory",
      trend: "+12%",
      trendUp: true,
    },
    {
      title: "Reservas Activas",
      value: stats.activeReservations,
      subtitle: `${stats.totalReservations} totales`,
      icon: Calendar,
      href: "/admin/reservations",
      trend: "+8%",
      trendUp: true,
    },
    {
      title: "Miembros",
      value: stats.totalMembers,
      subtitle: "Usuarios registrados",
      icon: Users,
      href: "/admin/members",
      trend: "+24%",
      trendUp: true,
    },
    {
      title: "Ingresos del Mes",
      value: `€${stats.monthlyRevenue.toFixed(0)}`,
      subtitle: "Total facturado",
      icon: DollarSign,
      href: "/admin/payments",
      trend: "+18%",
      trendUp: true,
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Cargando datos...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div>
        <h1 className="text-4xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Visión general del negocio</p>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {kpiCards.map((kpi, index) => (
          <Card key={index} className="group hover:shadow-lg transition-all duration-200 border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
              <CardTitle className="text-sm font-medium text-muted-foreground">{kpi.title}</CardTitle>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                <kpi.icon className="h-5 w-5 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-baseline justify-between">
                <div className="text-3xl font-bold text-foreground">{kpi.value}</div>
                <div
                  className={`flex items-center text-xs font-medium ${kpi.trendUp ? "text-green-600" : "text-red-600"}`}
                >
                  {kpi.trendUp ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                  {kpi.trend}
                </div>
              </div>
              <p className="text-xs text-muted-foreground mt-2 mb-3">{kpi.subtitle}</p>
              <Link href={kpi.href}>
                <Button variant="ghost" size="sm" className="w-full justify-between group/btn">
                  Ver detalles
                  <ArrowRight className="h-3 w-3 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-foreground">Acciones Rápidas</CardTitle>
          <CardDescription className="text-muted-foreground">
            Accesos directos a las funciones más utilizadas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <Link href="/admin/invitaciones">
              <Button variant="outline" className="w-full justify-start h-auto py-4 hover:bg-accent bg-transparent">
                <QrCode className="h-5 w-5 mr-3 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Generar Invitaciones</div>
                  <div className="text-xs text-muted-foreground">QR con código PRIVE50</div>
                </div>
              </Button>
            </Link>
            <Link href="/admin/newsletter">
              <Button variant="outline" className="w-full justify-start h-auto py-4 hover:bg-accent bg-transparent">
                <Mail className="h-5 w-5 mr-3 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Enviar Newsletter</div>
                  <div className="text-xs text-muted-foreground">Comunicar con miembros</div>
                </div>
              </Button>
            </Link>
            <Link href="/admin/inventory">
              <Button variant="outline" className="w-full justify-start h-auto py-4 hover:bg-accent bg-transparent">
                <Package className="h-5 w-5 mr-3 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Gestionar Inventario</div>
                  <div className="text-xs text-muted-foreground">Actualizar catálogo</div>
                </div>
              </Button>
            </Link>
            <Link href="/admin/blog">
              <Button variant="outline" className="w-full justify-start h-auto py-4 hover:bg-accent bg-transparent">
                <Mail className="h-5 w-5 mr-3 text-primary" />
                <div className="text-left">
                  <div className="font-medium">Publicar Artículo</div>
                  <div className="text-xs text-muted-foreground">Crear contenido</div>
                </div>
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
