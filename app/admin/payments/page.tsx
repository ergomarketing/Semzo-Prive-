"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { ArrowLeft, DollarSign, TrendingUp, CreditCard, Clock, Search } from "lucide-react"
import { useRouter } from "next/navigation"

interface Payment {
  id: string
  date: string
  customer_name: string
  customer_email: string
  bag_name: string
  amount: number
  payment_method: string
  stripe_payment_id: string
  status: "completed" | "pending" | "failed"
}

interface PaymentStats {
  totalRevenue: number
  monthlyRevenue: number
  successfulPayments: number
  pendingPayments: number
}

export default function PaymentsManagement() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [stats, setStats] = useState<PaymentStats>({
    totalRevenue: 0,
    monthlyRevenue: 0,
    successfulPayments: 0,
    pendingPayments: 0,
  })
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const router = useRouter()

  useEffect(() => {
    loadPayments()
  }, [])

  async function loadPayments() {
    try {
      const response = await fetch("/api/admin/payments")
      const data = await response.json()
      setPayments(data.payments || [])
      setStats(data.stats || stats)
    } catch (error) {
      console.error("[v0] Error loading payments:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredPayments = payments.filter(
    (payment) =>
      payment.customer_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.customer_email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      payment.stripe_payment_id.toLowerCase().includes(searchQuery.toLowerCase()),
  )

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "failed":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "completed":
        return "Completado"
      case "pending":
        return "Pendiente"
      case "failed":
        return "Fallido"
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        <button
          onClick={() => router.push("/admin")}
          className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          Volver al Dashboard
        </button>

        <div className="mb-8">
          <h1 className="text-4xl font-serif mb-2">Gestión de Pagos</h1>
          <p className="text-gray-600">Administra todos los pagos y transacciones</p>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="p-2 bg-blue-50 rounded-lg">
                <DollarSign className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-sm font-medium text-gray-600 mb-1">Ingresos Totales</CardTitle>
              <div className="text-3xl font-bold">€{stats.totalRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="p-2 bg-green-50 rounded-lg">
                <TrendingUp className="h-5 w-5 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-sm font-medium text-gray-600 mb-1">Este Mes</CardTitle>
              <div className="text-3xl font-bold">€{stats.monthlyRevenue.toFixed(2)}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="p-2 bg-purple-50 rounded-lg">
                <CreditCard className="h-5 w-5 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-sm font-medium text-gray-600 mb-1">Pagos Exitosos</CardTitle>
              <div className="text-3xl font-bold">{stats.successfulPayments}</div>
            </CardContent>
          </Card>

          <Card className="bg-white border-gray-200">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div className="p-2 bg-yellow-50 rounded-lg">
                <Clock className="h-5 w-5 text-yellow-600" />
              </div>
            </CardHeader>
            <CardContent>
              <CardTitle className="text-sm font-medium text-gray-600 mb-1">Pendientes</CardTitle>
              <div className="text-3xl font-bold">{stats.pendingPayments}</div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white border-gray-200 mb-8">
          <CardHeader>
            <CardTitle>Buscar Pagos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar por nombre, email o ID de pago..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white border-gray-200">
          <CardHeader>
            <CardTitle>Historial de Pagos</CardTitle>
            <p className="text-sm text-gray-600">{filteredPayments.length} pago(s) encontrado(s)</p>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-12">Cargando...</div>
            ) : filteredPayments.length === 0 ? (
              <div className="text-center py-12 text-gray-500">No se encontraron pagos</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Fecha</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Cliente</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Bolso</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Monto</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Método</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">ID Stripe</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-600">Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPayments.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-4 text-sm">{new Date(payment.date).toLocaleDateString("es-ES")}</td>
                        <td className="py-4 px-4">
                          <div className="text-sm font-medium">{payment.customer_name}</div>
                          <div className="text-xs text-gray-500">{payment.customer_email}</div>
                        </td>
                        <td className="py-4 px-4 text-sm">{payment.bag_name}</td>
                        <td className="py-4 px-4 text-sm font-medium">€{payment.amount.toFixed(2)}</td>
                        <td className="py-4 px-4 text-sm">{payment.payment_method}</td>
                        <td className="py-4 px-4 text-xs text-gray-500 font-mono">{payment.stripe_payment_id}</td>
                        <td className="py-4 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payment.status)}`}
                          >
                            {getStatusText(payment.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
