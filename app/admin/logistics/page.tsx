"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Truck,
  Package,
  RotateCcw,
  Settings,
  Search,
  Plus,
  AlertCircle,
  CheckCircle,
  Clock,
  TrendingUp,
} from "lucide-react"

interface Shipment {
  id: string
  reservation_id: string
  status: string
  carrier: string | null
  tracking_number: string | null
  estimated_delivery: string | null
  actual_delivery: string | null
  cost: number | null
  created_at: string
  reservations: {
    profiles: {
      full_name: string
      email: string
    }
    bags: {
      name: string
      brand: string
    }
  }
}

interface Return {
  id: string
  shipment_id: string
  reason: string
  status: string
  refund_amount: number | null
  created_at: string
}

interface LogisticsSettings {
  id: string
  carrier_name: string
  is_enabled: boolean
  default_service: string | null
  created_at: string
}

export default function LogisticsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [returns, setReturns] = useState<Return[]>([])
  const [settings, setSettings] = useState<LogisticsSettings[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    loadLogisticsData()
  }, [])

  const loadLogisticsData = async () => {
    try {
      setLoading(true)

      // Cargar envíos
      const shipmentsRes = await fetch("/api/admin/logistics/shipments?limit=50")
      const shipmentsData = await shipmentsRes.json()
      setShipments(shipmentsData.data || [])

      // Cargar devoluciones
      const returnsRes = await fetch("/api/admin/logistics/returns?limit=50")
      const returnsData = await returnsRes.json()
      setReturns(returnsData.data || [])

      // Cargar configuración
      const settingsRes = await fetch("/api/admin/logistics/settings")
      const settingsData = await settingsRes.json()
      setSettings(settingsData || [])
    } catch (error) {
      console.error("Error loading logistics data:", error)
    } finally {
      setLoading(false)
    }
  }

  const getStatusBadge = (status: string) => {
    const variants: Record<string, string> = {
      pending: "bg-yellow-100 text-yellow-800",
      picked_up: "bg-blue-100 text-blue-800",
      in_transit: "bg-blue-100 text-blue-800",
      out_for_delivery: "bg-purple-100 text-purple-800",
      delivered: "bg-green-100 text-green-800",
      failed_delivery: "bg-red-100 text-red-800",
      returned: "bg-orange-100 text-orange-800",
      cancelled: "bg-gray-100 text-gray-800",
    }
    return (
      <Badge className={variants[status] || "bg-gray-100 text-gray-800"}>
        {status.replace(/_/g, " ").toUpperCase()}
      </Badge>
    )
  }

  const stats = {
    totalShipments: shipments.length,
    pendingShipments: shipments.filter((s) => s.status === "pending").length,
    deliveredShipments: shipments.filter((s) => s.status === "delivered").length,
    totalReturns: returns.length,
    enabledCarriers: settings.filter((s) => s.is_enabled).length,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando logística...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <Truck className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-4xl font-bold">Logística</h1>
            <p className="text-gray-600 text-lg">Gestión de envíos y devoluciones</p>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Envíos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalShipments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pendientes</CardTitle>
            <Clock className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pendingShipments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Entregados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.deliveredShipments}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devoluciones</CardTitle>
            <RotateCcw className="h-4 w-4 text-orange-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalReturns}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transportistas</CardTitle>
            <Truck className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.enabledCarriers}</div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Resumen</TabsTrigger>
          <TabsTrigger value="shipments">Envíos</TabsTrigger>
          <TabsTrigger value="returns">Devoluciones</TabsTrigger>
          <TabsTrigger value="settings">Configuración</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Información General</CardTitle>
              <CardDescription>Estado actual del módulo de logística</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex gap-3">
                <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-semibold text-blue-900">Módulo en Desarrollo</h4>
                  <p className="text-sm text-blue-800 mt-1">
                    El módulo de logística está configurado pero sin integraciones de transportistas activas.
                    Puedes configurar las credenciales de DHL, FedEx, UPS, Correos y Glovo en la sección de
                    Configuración cuando estés listo.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Próximas Características</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>✓ Integración con DHL</li>
                    <li>✓ Integración con FedEx</li>
                    <li>✓ Integración con UPS</li>
                    <li>✓ Integración con Correos</li>
                    <li>✓ Integración con Glovo</li>
                  </ul>
                </div>

                <div className="p-4 border rounded-lg">
                  <h4 className="font-semibold mb-2">Funcionalidades Disponibles</h4>
                  <ul className="text-sm space-y-1 text-gray-600">
                    <li>✓ Crear envíos manualmente</li>
                    <li>✓ Rastrear envíos</li>
                    <li>✓ Gestionar devoluciones</li>
                    <li>✓ Auditoría de cambios</li>
                    <li>✓ Notificaciones a clientes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Shipments Tab */}
        <TabsContent value="shipments" className="space-y-4">
          <div className="flex gap-4 mb-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar por tracking, cliente..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Envío
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Envíos Recientes</CardTitle>
              <CardDescription>Últimos {shipments.length} envíos</CardDescription>
            </CardHeader>
            <CardContent>
              {shipments.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay envíos registrados</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {shipments.slice(0, 10).map((shipment) => (
                    <div key={shipment.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">{shipment.reservations.profiles.full_name}</p>
                          <p className="text-sm text-gray-600">
                            {shipment.reservations.bags.brand} - {shipment.reservations.bags.name}
                          </p>
                          {shipment.tracking_number && (
                            <p className="text-xs text-gray-500 mt-1">
                              Tracking: {shipment.tracking_number}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          {getStatusBadge(shipment.status)}
                          {shipment.carrier && (
                            <p className="text-xs text-gray-500 mt-2">{shipment.carrier}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Returns Tab */}
        <TabsContent value="returns" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Devoluciones</CardTitle>
              <CardDescription>Gestión de devoluciones de bolsos</CardDescription>
            </CardHeader>
            <CardContent>
              {returns.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <RotateCcw className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay devoluciones registradas</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {returns.slice(0, 10).map((return_item) => (
                    <div key={return_item.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">Razón: {return_item.reason}</p>
                          <p className="text-sm text-gray-600">
                            Reembolso: ${return_item.refund_amount || "N/A"}
                          </p>
                        </div>
                        <div className="text-right">
                          {getStatusBadge(return_item.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Settings Tab */}
        <TabsContent value="settings" className="space-y-4">
          <div className="flex justify-end mb-4">
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Plus className="h-4 w-4 mr-2" />
              Configurar Transportista
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Transportistas Configurados</CardTitle>
              <CardDescription>Gestiona las integraciones con proveedores de logística</CardDescription>
            </CardHeader>
            <CardContent>
              {settings.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No hay transportistas configurados</p>
                  <p className="text-sm mt-2">Configura un transportista para comenzar</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {settings.map((setting) => (
                    <div key={setting.id} className="border rounded-lg p-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold">{setting.carrier_name}</p>
                          <p className="text-sm text-gray-600">
                            Servicio: {setting.default_service || "No configurado"}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {setting.is_enabled ? (
                            <Badge className="bg-green-100 text-green-800">Activo</Badge>
                          ) : (
                            <Badge className="bg-gray-100 text-gray-800">Inactivo</Badge>
                          )}
                          <Button variant="outline" size="sm">
                            Editar
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
