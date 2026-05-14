"use client"

import { useState, useEffect, useMemo } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Gift,
  TrendingUp,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Search,
  Loader2,
  Trophy,
  Wallet,
} from "lucide-react"

const colors = {
  primary: "#1a2c4e",
  accent: "#d4a5a5",
  bg: "#faf8f7",
}

type ReferralStatus = "pending" | "paid" | "qualified" | "rewarded" | "rejected"

interface ReferralRow {
  id: string
  referrer_user_id: string
  referred_user_id: string
  referral_code: string
  status: ReferralStatus
  qualified_at: string | null
  reward_applied_at: string | null
  stripe_customer_id: string | null
  created_at: string
  referrer_name: string
  referrer_email: string | null
  referred_name: string
  referred_email: string | null
}

interface RankingRow {
  user_id: string
  name: string
  email: string | null
  count: number
  rewarded: number
}

interface BalanceRow {
  user_id: string
  name: string
  email: string | null
  referral_code: string | null
  balance_euros: number
}

interface AdminStats {
  total: number
  pending: number
  paid: number
  qualified: number
  rewarded: number
  rejected: number
  eurosRewarded: number
  eurosPendingPayout: number
}

const STATUS_LABELS: Record<ReferralStatus, { label: string; bg: string; fg: string }> = {
  pending: { label: "Pendiente", bg: "#fef3c7", fg: "#92400e" },
  paid: { label: "Pagado 1er mes", bg: "#dbeafe", fg: "#1e3a8a" },
  qualified: { label: "Cualificado", bg: "#d1fae5", fg: "#065f46" },
  rewarded: { label: "Recompensado", bg: "#e0e7ff", fg: "#3730a3" },
  rejected: { label: "Rechazado", bg: "#fee2e2", fg: "#991b1b" },
}

export default function AdminReferralsPage() {
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [referrals, setReferrals] = useState<ReferralRow[]>([])
  const [ranking, setRanking] = useState<RankingRow[]>([])
  const [balances, setBalances] = useState<BalanceRow[]>([])
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<"all" | ReferralStatus>("all")
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null)
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null)

  useEffect(() => {
    fetchAll()
  }, [])

  useEffect(() => {
    if (!notification) return
    const t = setTimeout(() => setNotification(null), 3500)
    return () => clearTimeout(t)
  }, [notification])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/referrals")
      if (!res.ok) throw new Error("fetch failed")
      const data = await res.json()
      setStats(data.stats)
      setReferrals(data.referrals || [])
      setRanking(data.ranking || [])
      setBalances(data.balances || [])
    } catch (err) {
      console.error("[v0] admin referrals fetch failed", err)
      setNotification({ type: "error", message: "Error cargando datos" })
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (
    id: string,
    action: "force_qualify" | "force_reject" | "manual_reward",
    confirmMsg: string,
  ) => {
    if (!confirm(confirmMsg)) return
    setActionLoadingId(id)
    try {
      const res = await fetch(`/api/admin/referrals/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || "action_failed")
      setNotification({ type: "success", message: "Accion ejecutada correctamente" })
      await fetchAll()
    } catch (err) {
      setNotification({
        type: "error",
        message: err instanceof Error ? err.message : "Error en la accion",
      })
    } finally {
      setActionLoadingId(null)
    }
  }

  const filtered = useMemo(() => {
    return referrals.filter((r) => {
      if (statusFilter !== "all" && r.status !== statusFilter) return false
      if (!search) return true
      const q = search.toLowerCase()
      return (
        r.referral_code.toLowerCase().includes(q) ||
        r.referrer_name.toLowerCase().includes(q) ||
        r.referred_name.toLowerCase().includes(q) ||
        (r.referrer_email || "").toLowerCase().includes(q) ||
        (r.referred_email || "").toLowerCase().includes(q)
      )
    })
  }, [referrals, search, statusFilter])

  const statCards = stats
    ? [
        { label: "Total", value: stats.total, icon: Users, color: colors.primary },
        { label: "Pendientes", value: stats.pending, icon: Clock, color: "#92400e" },
        { label: "Pagados", value: stats.paid, icon: TrendingUp, color: "#1e3a8a" },
        { label: "Cualificados", value: stats.qualified, icon: CheckCircle2, color: "#065f46" },
        { label: "Recompensados", value: stats.rewarded, icon: Gift, color: "#3730a3" },
        { label: "Rechazados", value: stats.rejected, icon: XCircle, color: "#991b1b" },
      ]
    : []

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {notification && (
        <div
          className="fixed top-4 right-4 px-6 py-3 rounded-lg shadow-lg z-50 text-white"
          style={{ backgroundColor: notification.type === "success" ? colors.primary : "#991b1b" }}
        >
          {notification.message}
        </div>
      )}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold" style={{ color: colors.primary }}>
            Programa de Referidos
          </h1>
          <p style={{ color: "#888" }} className="mt-1">
            Gestion del programa "Recomienda a una amiga" - 50 EUR por cada amiga cualificada
          </p>
        </div>
        <Button onClick={fetchAll} variant="outline" disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
        {statCards.map((s) => {
          const Icon = s.icon
          return (
            <Card key={s.label} className="border-0 shadow-sm">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <Icon className="h-4 w-4" style={{ color: s.color }} />
                </div>
                <p className="text-2xl font-bold" style={{ color: colors.primary }}>
                  {s.value}
                </p>
                <p className="text-xs text-muted-foreground">{s.label}</p>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Euros */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total EUR repartidos</p>
                <p className="text-3xl font-bold mt-1" style={{ color: colors.primary }}>
                  {stats.eurosRewarded} EUR
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  En {stats.rewarded} referidos (50 EUR referrer + 50 EUR referida)
                </p>
              </div>
              <Wallet className="h-10 w-10" style={{ color: colors.primary, opacity: 0.3 }} />
            </CardContent>
          </Card>
          <Card className="border-0 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Pendiente de payout</p>
                <p className="text-3xl font-bold mt-1" style={{ color: "#92400e" }}>
                  {stats.eurosPendingPayout} EUR
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {stats.qualified} cualificados esperando aplicacion (cron diario 04:00 UTC)
                </p>
              </div>
              <Clock className="h-10 w-10" style={{ color: "#92400e", opacity: 0.3 }} />
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs defaultValue="list" className="space-y-4">
        <TabsList>
          <TabsTrigger value="list">Lista de Referidos</TabsTrigger>
          <TabsTrigger value="ranking">Top Referidoras</TabsTrigger>
          <TabsTrigger value="balances">Saldos</TabsTrigger>
        </TabsList>

        {/* TAB: Lista */}
        <TabsContent value="list" className="space-y-4">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle style={{ color: colors.primary }}>Todos los referidos</CardTitle>
              <CardDescription>Historico completo del programa</CardDescription>
              <div className="flex flex-col md:flex-row gap-3 mt-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar por nombre, email o codigo..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <div className="flex gap-1 flex-wrap">
                  {(["all", "pending", "paid", "qualified", "rewarded", "rejected"] as const).map((s) => (
                    <Button
                      key={s}
                      size="sm"
                      variant={statusFilter === s ? "default" : "outline"}
                      onClick={() => setStatusFilter(s)}
                      style={
                        statusFilter === s ? { backgroundColor: colors.primary, color: "white" } : undefined
                      }
                    >
                      {s === "all" ? "Todos" : STATUS_LABELS[s as ReferralStatus]?.label || s}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin" style={{ color: colors.primary }} />
                </div>
              ) : filtered.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Gift className="h-12 w-12 mx-auto mb-3 opacity-40" />
                  <p>No hay referidos {statusFilter !== "all" ? `en estado "${statusFilter}"` : ""}</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Fecha</TableHead>
                        <TableHead>Referidora</TableHead>
                        <TableHead>Amiga referida</TableHead>
                        <TableHead>Codigo</TableHead>
                        <TableHead>Estado</TableHead>
                        <TableHead>Cualificada</TableHead>
                        <TableHead>Acciones</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filtered.map((r) => {
                        const cfg = STATUS_LABELS[r.status] || { label: r.status, bg: "#e5e7eb", fg: "#374151" }
                        const isLoading = actionLoadingId === r.id
                        return (
                          <TableRow key={r.id}>
                            <TableCell className="text-sm whitespace-nowrap">
                              {new Date(r.created_at).toLocaleDateString("es-ES", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{r.referrer_name}</div>
                              <div className="text-xs text-muted-foreground">{r.referrer_email || "-"}</div>
                            </TableCell>
                            <TableCell>
                              <div className="font-medium">{r.referred_name}</div>
                              <div className="text-xs text-muted-foreground">{r.referred_email || "-"}</div>
                            </TableCell>
                            <TableCell>
                              <code className="text-xs bg-muted px-2 py-1 rounded">{r.referral_code}</code>
                            </TableCell>
                            <TableCell>
                              <Badge style={{ backgroundColor: cfg.bg, color: cfg.fg }}>{cfg.label}</Badge>
                            </TableCell>
                            <TableCell className="text-xs">
                              {r.qualified_at
                                ? new Date(r.qualified_at).toLocaleDateString("es-ES")
                                : "-"}
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-1 flex-wrap">
                                {(r.status === "pending" || r.status === "paid") && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={isLoading}
                                    onClick={() =>
                                      handleAction(
                                        r.id,
                                        "force_qualify",
                                        `Marcar como CUALIFICADO el referido de ${r.referrer_name} -> ${r.referred_name}? (NO aplica credito todavia)`,
                                      )
                                    }
                                  >
                                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Cualificar"}
                                  </Button>
                                )}
                                {r.status === "qualified" && (
                                  <Button
                                    size="sm"
                                    disabled={isLoading}
                                    onClick={() =>
                                      handleAction(
                                        r.id,
                                        "manual_reward",
                                        `Aplicar 50 EUR a ${r.referrer_name} y 50 EUR a ${r.referred_name} AHORA?`,
                                      )
                                    }
                                    style={{ backgroundColor: colors.primary, color: "white" }}
                                  >
                                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Aplicar credito"}
                                  </Button>
                                )}
                                {r.status !== "rewarded" && r.status !== "rejected" && (
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={isLoading}
                                    onClick={() =>
                                      handleAction(
                                        r.id,
                                        "force_reject",
                                        `Rechazar este referido? Esta accion lo invalida.`,
                                      )
                                    }
                                    style={{ borderColor: "#991b1b", color: "#991b1b" }}
                                  >
                                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : "Rechazar"}
                                  </Button>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Ranking */}
        <TabsContent value="ranking">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle style={{ color: colors.primary }}>
                <Trophy className="inline h-5 w-5 mr-2" />
                Top 10 referidoras
              </CardTitle>
              <CardDescription>Socias con mas amigas cualificadas + recompensadas</CardDescription>
            </CardHeader>
            <CardContent>
              {ranking.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">
                  Todavia no hay referidoras con amigas cualificadas
                </p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>#</TableHead>
                      <TableHead>Socia</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead className="text-right">Cualificadas</TableHead>
                      <TableHead className="text-right">Recompensadas</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ranking.map((r, idx) => (
                      <TableRow key={r.user_id}>
                        <TableCell className="font-bold">{idx + 1}</TableCell>
                        <TableCell className="font-medium">{r.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{r.email || "-"}</TableCell>
                        <TableCell className="text-right font-bold">{r.count}</TableCell>
                        <TableCell className="text-right">{r.rewarded}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* TAB: Saldos */}
        <TabsContent value="balances">
          <Card className="border-0 shadow-sm">
            <CardHeader>
              <CardTitle style={{ color: colors.primary }}>
                <Wallet className="inline h-5 w-5 mr-2" />
                Saldos disponibles
              </CardTitle>
              <CardDescription>Socias con credito de referidos sin canjear</CardDescription>
            </CardHeader>
            <CardContent>
              {balances.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">No hay saldos pendientes de canje</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Socia</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Codigo</TableHead>
                      <TableHead className="text-right">Saldo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {balances.map((b) => (
                      <TableRow key={b.user_id}>
                        <TableCell className="font-medium">{b.name}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{b.email || "-"}</TableCell>
                        <TableCell>
                          <code className="text-xs bg-muted px-2 py-1 rounded">
                            {b.referral_code || "-"}
                          </code>
                        </TableCell>
                        <TableCell className="text-right font-bold" style={{ color: colors.primary }}>
                          {b.balance_euros} EUR
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
