"use client"

import { useEffect, useState } from "react"
import { createSupabaseBrowserClient } from "@/lib/supabase"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, Users, CreditCard, Gift } from 'lucide-react'

export default function AdminReportsPage() {
  const supabase = createSupabaseBrowserClient()
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      const startOfMonth = new Date()
      startOfMonth.setDate(1)
      startOfMonth.setHours(0, 0, 0, 0)

      const { data: payments } = await supabase
        .from("payments")
        .select("amount, status, membership_type")
        .eq("status", "completed")
        .gte("created_at", startOfMonth.toISOString())

      const totalRevenue = payments?.reduce((sum, p) => sum + p.amount, 0) || 0

      const { data: activeMembers } = await supabase
        .from("user_memberships")
        .select("membership_type")
        .eq("status", "active")

      const membersByType = {
        petite: 0,
        essentiel: 0,
        signature: 0,
        prive: 0,
      }

      activeMembers?.forEach((m) => {
        if (membersByType.hasOwnProperty(m.membership_type)) {
          membersByType[m.membership_type as keyof typeof membersByType]++
        }
      })

      const membershipPrices: Record<string, number> = {
        petite: 1999,
        essentiel: 4999,
        signature: 12999,
        prive: 29999,
      }

      const mrr = Object.entries(membersByType).reduce((sum, [type, count]) => {
        return sum + membershipPrices[type] * count
      }, 0)

      setMetrics({
        totalRevenue,
        mrr,
        membersByType,
        activeMembers: activeMembers?.length || 0,
        totalPayments: payments?.length || 0,
      })
    } catch (error) {
      console.error("Error fetching metrics:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="p-8">Cargando métricas...</div>

  return (
    <div className="space-y-8 p-8">
      <div>
        <h1 className="text-3xl font-bold">Reportes Financieros</h1>
        <p className="text-muted-foreground">Vista general de ingresos y membresías activas</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Este Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics?.totalRevenue / 100).toFixed(2)}€</div>
            <p className="text-xs text-muted-foreground">{metrics?.totalPayments} pagos procesados</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">MRR</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{(metrics?.mrr / 100).toFixed(2)}€</div>
            <p className="text-xs text-muted-foreground">Ingresos recurrentes mensuales</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Miembros Activos</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.activeMembers}</div>
            <p className="text-xs text-muted-foreground">Membresías activas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Distribución</CardTitle>
            <Gift className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              {Object.entries(metrics?.membersByType || {}).map(([type, count]) => (
                <div key={type} className="flex justify-between text-sm">
                  <span className="capitalize">{type}</span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
