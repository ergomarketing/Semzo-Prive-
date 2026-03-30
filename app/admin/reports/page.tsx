"use client"

import { useEffect, useState } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, CreditCard, Gift, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StripeMetrics {
  totalRevenue: number
  totalPayments: number
  mrr: number
}

interface MemberMetrics {
  activeMembers: number
  membersByType: Record<string, number>
}

export default function AdminReportsPage() {
  const supabase = createSupabaseBrowserClient()
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
      // Fetch Stripe metrics and member metrics in parallel
      const [stripeRes, membersData] = await Promise.all([
        fetch("/api/admin/reports/stripe-metrics"),
        supabase
          .from("user_memberships")
          .select("membership_type, status")
          .eq("status", "active"),
      ])

      // Stripe metrics
      if (stripeRes.ok) {
        const data = await stripeRes.json()
        setStripeMetrics(data)
      } else {
        // Fallback: calcular MRR desde Supabase si Stripe falla
        setStripeMetrics({ totalRevenue: 0, totalPayments: 0, mrr: 0 })
      }

      // Member metrics desde Supabase
      const activeMembers = membersData.data || []
      const membersByType: Record<string, number> = {
        Petite: 0,
        Essentiel: 0,
        Signature: 0,
        Prive: 0,
      }

      activeMembers.forEach((m) => {
        const type = m.membership_type
          ? m.membership_type.charAt(0).toUpperCase() + m.membership_type.slice(1).toLowerCase()
          : ""
        if (membersByType.hasOwnProperty(type)) {
          membersByType[type]++
        }
      })

      // Calcular MRR desde Supabase como respaldo
      const membershipPrices: Record<string, number> = {
        petite: 1999,
        essentiel: 4999,
        signature: 12999,
        prive: 29999,
      }

      const mrrFromSupabase = activeMembers.reduce((sum, m) => {
        const price = membershipPrices[m.membership_type?.toLowerCase() || ""] || 0
        return sum + price
      }, 0)

      setMemberMetrics({
        activeMembers: activeMembers.length,
        membersByType,
      })

      // Si Stripe no devolvio MRR, usar el calculado desde Supabase
      setStripeMetrics((prev) =>
        prev
          ? {
              ...prev,
              mrr: prev.mrr || mrrFromSupabase,
            }
          : { totalRevenue: 0, totalPayments: 0, mrr: mrrFromSupabase }
      )
    } catch (err) {
      console.error("Error fetching metrics:", err)
      setError("Error al cargar las métricas")
    } finally {
      setLoading(false)
    }
  }

  const formatEuros = (cents: number) => {
    return (cents / 100).toLocaleString("es-ES", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "€"
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center gap-2 text-muted-foreground">
        <RefreshCw className="h-4 w-4 animate-spin" />
        Cargando métricas desde Stripe...
      </div>
    )
  }

  return (
    <div className="space-y-8 p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Reportes Financieros</h1>
          <p className="text-muted-foreground">Datos en tiempo real desde Stripe y Supabase</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchMetrics}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
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
            <p className="text-xs text-muted-foreground">Membresías activas en Supabase</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distribución</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(memberMetrics?.membersByType || {}).map(([type, count]) => (
                <div key={type} className="flex justify-between text-sm">
                  <span>{type}</span>
                  <Badge variant="secondary">{count as number}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
