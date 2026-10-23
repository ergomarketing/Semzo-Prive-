"use client"

import { PageHeader } from "@/components/panel/page-header"
import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/panel/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { DollarSign, TrendingUp, CreditCard, Calendar, Search, ExternalLink, RefreshCw } from "lucide-react"

interface StripeCharge {
  id: string
  amount: number
  currency: string
  status: string
  created: number
  description: string | null
  customer_email: string | null
  customer_name: string | null
  payment_method_type: string
  receipt_url: string | null
}

interface PaymentStats {
  totalRevenue: number
  thisMonthRevenue: number
  totalCharges: number
  succeeded: number
  failed: number
  refunded: number
}

export default function PaymentsPage() {
  const [charges, setCharges] = useState<StripeCharge[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    thisMonthRevenue: 0,
    totalCharges: 0,
    succeeded: 0,
    failed: 0,
    refunded: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/payments")
      const data = await res.json()
      setCharges(data.charges || [])
      setStats(data.stats || {})
    } catch (error) {
      console.error("Error fetching payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const map: Record<string, { label: string; class: string }> = {
      succeeded: { label: "Exitoso", class: "bg-[#b08d57]/15 text-[#7a5f33]" },
      pending: { label: "Pendiente", class: "bg-slate-100 text-slate-700" },
      failed: { label: "Fallido", class: "bg-red-100 text-red-800" },
      refunded: { label: "Reembolsado", class: "bg-gray-100 text-gray-800" },
    }
    const config = map[status] || { label: status, class: "bg-gray-100 text-gray-800" }
    return <Badge className={config.class}>{config.label}</Badge>
  }

  const filtered = charges.filter(
    (c) =>
      c.customer_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.customer_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <PageHeader eyebrow="Miembros y pagos" title="Pagos" subtitle="Historial de cobros desde Stripe" />
        <div className="flex gap-2">
          <Button variant="outline" onClick={fetchPayments} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualizar
          </Button>
          <Button
            variant="outline"
            onClick={() => window.open("https://dashboard.stripe.com/payments", "_blank")}
          >
            <ExternalLink className="h-4 w-4 mr-2" />
            Abrir Stripe
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Ingresos Totales</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-normal text-indigo-dark">€{stats.totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-gray-500">{stats.totalCharges} transacciones</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Este Mes</CardTitle>
            <TrendingUp className="h-4 w-4 text-[#b08d57]" />
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-normal text-indigo-dark">€{stats.thisMonthRevenue.toFixed(2)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Exitosos</CardTitle>
            <CreditCard className="h-4 w-4 text-[#b08d57]" />
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-normal text-indigo-dark text-[#b08d57]">{stats.succeeded}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Fallidos</CardTitle>
            <Calendar className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="font-serif text-3xl font-normal text-indigo-dark text-red-600">{stats.failed}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Historial de Cobros</CardTitle>
          <CardDescription>Datos en tiempo real desde Stripe</CardDescription>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar por email, nombre o ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 mt-2"
            />
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="animate-spin h-6 w-6 text-gray-400" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <CreditCard className="h-12 w-12 mx-auto mb-3 opacity-40" />
              <p>No hay pagos registrados</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Descripcion</TableHead>
                  <TableHead>Metodo</TableHead>
                  <TableHead>Monto</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell className="text-sm">
                      {new Date(charge.created * 1000).toLocaleDateString("es-ES", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{charge.customer_name || "Sin nombre"}</div>
                      <div className="text-xs text-gray-500">{charge.customer_email || "-"}</div>
                    </TableCell>
                    <TableCell className="text-sm text-gray-600 max-w-[200px] truncate">
                      {charge.description || "-"}
                    </TableCell>
                    <TableCell className="text-sm capitalize">{charge.payment_method_type}</TableCell>
                    <TableCell className="font-bold">
                      €{(charge.amount / 100).toFixed(2)}
                    </TableCell>
                    <TableCell>{getStatusBadge(charge.status)}</TableCell>
                    <TableCell>
                      {charge.receipt_url && (
                        <a
                          href={charge.receipt_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[#b08d57] hover:text-blue-800"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
