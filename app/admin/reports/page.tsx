"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, CreditCard, Gift, RefreshCw, Ticket } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StripeMetrics {
  totalRevenue: number
  totalPayments: number
  mrr: number
}

interface MemberMetrics {
  activeMembers: number
  membersByType: Record<string, number>
  mrrCents: number
  passes: { available: number; used: number; total: number }
}

export default function AdminReportsPage() {
  const [stripeMetrics, setStripeMetrics] = useState<StripeMetrics | null>(null)
  const [memberMetrics, setMemberMetrics] = useState<MemberMetrics | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    setLoading(true)
    setError(null)
    try {
      const [stripeRes, distRes] = await Promise.all([
        fetch("/api/admin/reports/stripe-metrics"),
        fetch("/api/admin/reports/members-distribution"),
      ])

      if (stripeRes.ok) {
        const data = await stripeRes.json()
        setStripeMetrics(data)
      } else {
        setStripeMetrics({ totalRevenue: 0, totalPayments: 0, mrr: 0 })
      }

      if (distRes.ok) {
        const data = (await distRes.json()) as MemberMetrics
        setMemberMetrics(data)
        // Si Stripe no devolvio MRR, usar el calculado desde Supabase (Categoria A)
        setStripeMetrics((prev) =>
          prev && prev.mrr ? prev : { ...(prev || { totalRevenue: 0, totalPayments: 0, mrr: 0 }), mrr: data.mrrCents },
        )
      }
    } catch (err) {
      console.error("[v0] Error fetching metrics:", err)
      setError("Error al cargar las metricas")
    } finally {
      setLoading(false)
    }
  }

  const formatEuros = (cents: number) =>
    (cents / 100).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "€"

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Cargando metricas...
      </div>
    )
  }

  const typeLabels: Record<string, string> = {
    petite: "Petite",
    essentiel: "L'Essentiel",
    signature: "Signature",
    prive: "Privé",
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes Financieros</h1>
          <p className="text-muted-foreground">Stripe (financiero) + Supabase (membresia presente)</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchMetrics}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">{error}</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Este Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatEuros(stripeMetrics?.totalRevenue || 0)}</div>
            <p className="text-xs text-muted-foreground">{stripeMetrics?.totalPayments || 0} pagos procesados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatEuros(stripeMetrics?.mrr || 0)}</div>
            <p className="text-xs text-muted-foreground">Ingresos recurrentes mensuales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Miembros Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberMetrics?.activeMembers || 0}</div>
            <p className="text-xs text-muted-foreground">Categoria comercial (active / cancelled_active / past_due)</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pases Disponibles</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{memberMetrics?.passes.available || 0}</div>
            <p className="text-xs text-muted-foreground">
              {memberMetrics?.passes.used || 0} usados · {memberMetrics?.passes.total || 0} totales
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Distribucion por membresia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Object.entries(memberMetrics?.membersByType || {}).map(([type, count]) => (
              <div key={type} className="flex flex-col items-center p-4 rounded-lg border">
                <span className="text-xs text-muted-foreground uppercase tracking-wide">
                  {typeLabels[type] || type}
                </span>
                <span className="text-3xl font-bold mt-2">{count}</span>
                <Badge variant="secondary" className="mt-2">
                  socias
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
