"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  ArrowLeft,
  Search,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Users,
  TrendingUp,
  Clock,
  Info,
} from "lucide-react"
import Link from "next/link"

interface Subscription {
  id: string
  user_id: string
  stripe_subscription_id: string
  stripe_customer_id: string
  membership_type: string
  status: string
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
  profiles: {
    id: string
    full_name: string
    email: string
  } | null
  stripe_verified_status: string | null
  status_match: boolean
  stripe_data: {
    status: string
    current_period_end: string
    cancel_at_period_end: boolean
  } | null
}

interface SubscriptionsResponse {
  subscriptions?: Subscription[]
  message?: string
}

export default function SubscriptionsPage() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchTerm, setSearchTerm] = useState("")
  const [tableMessage, setTableMessage] = useState<string | null>(null)

  const fetchSubscriptions = async () => {
    try {
      const response = await fetch("/api/admin/subscriptions")
      const data = await response.json()

      if (data && typeof data === "object" && "message" in data) {
        setTableMessage((data as SubscriptionsResponse).message || null)
        setSubscriptions((data as SubscriptionsResponse).subscriptions || [])
      } else if (Array.isArray(data)) {
        setTableMessage(null)
        setSubscriptions(data)
      } else {
        setSubscriptions([])
      }
    } catch (error) {
      console.error("Error fetching subscriptions:", error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchSubscriptions()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchSubscriptions()
  }

  const getStatusBadge = (status: string, verified: string | null, match: boolean) => {
    if (!match && verified) {
      return (
        <div className="flex items-center gap-2">
          <Badge variant="destructive" className="flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" />
            Discrepancia
          </Badge>
          <span className="text-xs text-gray-500">
            DB: {status} / Stripe: {verified}
          </span>
        </div>
      )
    }

    const config: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      active: { variant: "default", label: "Activa" },
      trialing: { variant: "secondary", label: "Prueba" },
      past_due: { variant: "destructive", label: "Pago pendiente" },
      canceled: { variant: "outline", label: "Cancelada" },
      unpaid: { variant: "destructive", label: "Impago" },
    }
    const c = config[status] || { variant: "outline", label: status }
    return <Badge variant={c.variant}>{c.label}</Badge>
  }

  const filteredSubscriptions = subscriptions.filter(
    (sub) =>
      sub.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.profiles?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.stripe_subscription_id?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  const stats = {
    total: subscriptions.length,
    active: subscriptions.filter((s) => s.status === "active").length,
    pastDue: subscriptions.filter((s) => s.status === "past_due").length,
    mismatched: subscriptions.filter((s) => !s.status_match && s.stripe_verified_status).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando suscripciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link href="/admin">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver al Dashboard
            </Button>
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Gestión de Suscripciones</h1>
              <p className="text-gray-600 mt-2">Verifica el estado real de pagos con Stripe</p>
            </div>
            <Button onClick={handleRefresh} disabled={refreshing}>
              <RefreshCw className={`mr-2 h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
              Verificar con Stripe
            </Button>
          </div>
        </div>

        {tableMessage && (
          <Alert className="mb-6">
            <Info className="h-4 w-4" />
            <AlertTitle>Configuración pendiente</AlertTitle>
            <AlertDescription>
              {tableMessage}
              <br />
              <span className="text-sm text-muted-foreground mt-2 block">
                Ejecuta el script SQL en la carpeta /scripts para crear las tablas necesarias.
              </span>
            </AlertDescription>
          </Alert>
        )}

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Suscripciones</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Activas</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pago Pendiente</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{stats.pastDue}</div>
            </CardContent>
          </Card>

          <Card className={stats.mismatched > 0 ? "border-red-300 bg-red-50" : ""}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Discrepancias</CardTitle>
              <AlertTriangle className={`h-4 w-4 ${stats.mismatched > 0 ? "text-red-600" : "text-muted-foreground"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${stats.mismatched > 0 ? "text-red-600" : ""}`}>
                {stats.mismatched}
              </div>
              {stats.mismatched > 0 && <p className="text-xs text-red-600 mt-1">¡Revisar urgente!</p>}
            </CardContent>
          </Card>
        </div>

        {/* Alerta de discrepancias */}
        {stats.mismatched > 0 && (
          <Card className="border-red-300 bg-red-50 mb-6">
            <CardContent className="flex items-center gap-3 py-4">
              <AlertTriangle className="h-6 w-6 text-red-600" />
              <div>
                <p className="font-bold text-red-800">
                  ¡Atención! Hay {stats.mismatched} suscripción(es) con discrepancias
                </p>
                <p className="text-sm text-red-600">
                  El estado en tu base de datos no coincide con Stripe. Esto puede indicar un pago cancelado o
                  reembolsado que no se procesó correctamente.
                </p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Search */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Buscar Suscripciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre, email o ID de suscripción..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        <Card>
          <CardHeader>
            <CardTitle>Todas las Suscripciones</CardTitle>
            <CardDescription>{filteredSubscriptions.length} suscripción(es) encontrada(s)</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Verificado Stripe</TableHead>
                  <TableHead>Próximo cobro</TableHead>
                  <TableHead>ID Stripe</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubscriptions.map((sub) => (
                  <TableRow key={sub.id} className={!sub.status_match && sub.stripe_verified_status ? "bg-red-50" : ""}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{sub.profiles?.full_name || "Sin nombre"}</div>
                        <div className="text-sm text-gray-500">{sub.profiles?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell className="capitalize font-medium">{sub.membership_type}</TableCell>
                    <TableCell>{getStatusBadge(sub.status, sub.stripe_verified_status, sub.status_match)}</TableCell>
                    <TableCell>
                      {sub.stripe_verified_status === sub.status ? (
                        <CheckCircle className="h-5 w-5 text-green-600" />
                      ) : sub.stripe_verified_status === "error" ? (
                        <XCircle className="h-5 w-5 text-gray-400" />
                      ) : sub.stripe_verified_status ? (
                        <AlertTriangle className="h-5 w-5 text-red-600" />
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {sub.cancel_at_period_end ? (
                        <span className="text-yellow-600">Se cancela</span>
                      ) : sub.current_period_end ? (
                        new Date(sub.current_period_end).toLocaleDateString("es-ES")
                      ) : (
                        "-"
                      )}
                    </TableCell>
                    <TableCell>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">
                        {sub.stripe_subscription_id?.substring(0, 15)}...
                      </code>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
