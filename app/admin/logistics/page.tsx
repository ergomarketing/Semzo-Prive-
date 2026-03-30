"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
  Download,
  ExternalLink,
  MapPin,
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

function CorreosConfigCard({ onSaved }: { onSaved: () => void }) {
  const [clientId, setClientId] = useState("")
  const [clientSecret, setClientSecret] = useState("")
  const [isConfigured, setIsConfigured] = useState(false)
  const [isEnabled, setIsEnabled] = useState(false)
  const [maskedSecret, setMaskedSecret] = useState("")
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null)

  useEffect(() => {
    loadCorreosConfig()
  }, [])

  const loadCorreosConfig = async () => {
    try {
      const res = await fetch("/api/admin/logistics/correos/credentials")
      if (!res.ok) {
        // Si la API falla (columna no existe, etc.), mostrar formulario vacío
        setLoading(false)
        return
      }
      const data = await res.json()
      if (data.configured) {
        setIsConfigured(true)
        setIsEnabled(data.isEnabled)
        setClientId(data.clientId || "")
        setMaskedSecret(data.clientSecretMasked || "")
      }
    } catch (error) {
      console.error("Error loading Correos config:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleTestConnection = async () => {
    if (!clientId || !clientSecret) {
      setTestResult({ success: false, message: "Ingresa Client ID y Client Secret" })
      return
    }

    setTesting(true)
    setTestResult(null)

    try {
      const res = await fetch("/api/admin/logistics/correos/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret }),
      })
      const data = await res.json()
      setTestResult(data)
    } catch {
      setTestResult({ success: false, message: "Error al probar conexión" })
    } finally {
      setTesting(false)
    }
  }

  const handleSave = async () => {
    if (!clientId || !clientSecret) return

    setSaving(true)
    try {
      const res = await fetch("/api/admin/logistics/correos/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret }),
      })
      const data = await res.json()
      if (data.success) {
        setIsConfigured(true)
        setIsEnabled(true)
        setMaskedSecret(`****${clientSecret.slice(-4)}`)
        setClientSecret("")
        onSaved()
      }
    } catch (error) {
      console.error("Error saving credentials:", error)
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Truck className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <CardTitle>Correos de Espana</CardTitle>
              <CardDescription>Integración con la API de Correos para envíos nacionales</CardDescription>
            </div>
          </div>
          {isConfigured && (
            <Badge className={isEnabled ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
              {isEnabled ? "Activo" : "Inactivo"}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {isConfigured && !clientSecret ? (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 flex gap-3">
              <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-900">Credenciales configuradas</p>
                <p className="text-sm text-green-700 mt-1">
                  Client ID: {clientId}<br />
                  Client Secret: {maskedSecret}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setClientSecret("")
                setIsConfigured(false)
              }}
            >
              Actualizar credenciales
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Client ID</label>
              <Input
                value={clientId}
                onChange={(e) => setClientId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Client Secret</label>
              <Input
                type="password"
                value={clientSecret}
                onChange={(e) => setClientSecret(e.target.value)}
                placeholder="Ingresa el Client Secret"
              />
            </div>

            {testResult && (
              <div
                className={`p-3 rounded-lg flex gap-2 ${
                  testResult.success
                    ? "bg-green-50 border border-green-200"
                    : "bg-red-50 border border-red-200"
                }`}
              >
                {testResult.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-600" />
                )}
                <p className={testResult.success ? "text-green-800" : "text-red-800"}>
                  {testResult.message}
                </p>
              </div>
            )}

            <div className="flex gap-2">
              <Button variant="outline" onClick={handleTestConnection} disabled={testing}>
                {testing ? "Probando..." : "Probar conexión"}
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700"
                onClick={handleSave}
                disabled={saving || !clientId || !clientSecret}
              >
                {saving ? "Guardando..." : "Guardar credenciales"}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default function LogisticsPage() {
  const [shipments, setShipments] = useState<Shipment[]>([])
  const [returns, setReturns] = useState<Return[]>([])
  const [settings, setSettings] = useState<LogisticsSettings[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [activeTab, setActiveTab] = useState("overview")
  const [showNewShipmentModal, setShowNewShipmentModal] = useState(false)
  const [creatingShipment, setCreatingShipment] = useState(false)
  const [newShipment, setNewShipment] = useState({
    recipient_name: "",
    recipient_address: "",
    recipient_city: "",
    recipient_postal_code: "",
    recipient_country: "ES",
    recipient_phone: "",
    recipient_email: "",
    weight: 2000,
    service_type: "PAQ_PREMIUM",
    notes: ""
  })

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

  const handleCreateShipment = async () => {
    if (!newShipment.recipient_name || !newShipment.recipient_address || 
        !newShipment.recipient_city || !newShipment.recipient_postal_code) {
      alert("Por favor completa todos los campos requeridos")
      return
    }

    setCreatingShipment(true)
    try {
      const res = await fetch("/api/admin/logistics/shipments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...newShipment,
          carrier: "Correos",
          use_correos_api: true
        })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Error al crear envío")
      }

      alert(data.correos_success 
        ? `Envío creado con tracking: ${data.tracking_number}` 
        : "Envío creado (sin tracking de Correos)")
      
      setShowNewShipmentModal(false)
      setNewShipment({
        recipient_name: "",
        recipient_address: "",
        recipient_city: "",
        recipient_postal_code: "",
        recipient_country: "ES",
        recipient_phone: "",
        recipient_email: "",
        weight: 2000,
        service_type: "PAQ_PREMIUM",
        notes: ""
      })
      loadLogisticsData()
    } catch (error) {
      alert(error instanceof Error ? error.message : "Error al crear envío")
    } finally {
      setCreatingShipment(false)
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
            <Button 
              className="bg-blue-600 hover:bg-blue-700"
              onClick={() => setShowNewShipmentModal(true)}
            >
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
                          <p className="font-semibold">
                            {shipment.reservations?.profiles?.full_name || "Sin nombre"}
                          </p>
                          <p className="text-sm text-gray-600">
                            {shipment.reservations?.bags?.brand} - {shipment.reservations?.bags?.name}
                          </p>
                          {shipment.tracking_number && (
                            <div className="flex items-center gap-2 mt-2">
                              <span className="text-xs text-gray-500">
                                Tracking: {shipment.tracking_number}
                              </span>
                              <a
                                href={`https://www.correos.es/es/es/herramientas/localizador/envios/${shipment.tracking_number}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </div>
                          )}
                        </div>
                        <div className="text-right flex flex-col items-end gap-2">
                          {getStatusBadge(shipment.status)}
                          {shipment.carrier && (
                            <p className="text-xs text-gray-500">{shipment.carrier}</p>
                          )}
                          {shipment.tracking_number && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => window.open(`/api/admin/logistics/shipments/label?tracking_number=${shipment.tracking_number}`, "_blank")}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Etiqueta
                            </Button>
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
          {/* Correos Configuration Card */}
          <CorreosConfigCard onSaved={loadLogisticsData} />

          <Card>
            <CardHeader>
              <CardTitle>Otros Transportistas</CardTitle>
              <CardDescription>Próximamente: DHL, FedEx, UPS, Glovo</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {["DHL", "FedEx", "UPS", "Glovo"].map((carrier) => (
                  <div key={carrier} className="border rounded-lg p-4 opacity-50">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold">{carrier}</p>
                      <Badge className="bg-gray-100 text-gray-800">Próximamente</Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Modal Nuevo Envío */}
      <Dialog open={showNewShipmentModal} onOpenChange={setShowNewShipmentModal}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5" />
              Crear Nuevo Envío con Correos
            </DialogTitle>
            <DialogDescription>
              Ingresa los datos del destinatario para generar la etiqueta de envío
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipient_name">Nombre completo *</Label>
                <Input
                  id="recipient_name"
                  value={newShipment.recipient_name}
                  onChange={(e) => setNewShipment({ ...newShipment, recipient_name: e.target.value })}
                  placeholder="María García López"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipient_phone">Teléfono</Label>
                <Input
                  id="recipient_phone"
                  value={newShipment.recipient_phone}
                  onChange={(e) => setNewShipment({ ...newShipment, recipient_phone: e.target.value })}
                  placeholder="+34 600 000 000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient_email">Email</Label>
              <Input
                id="recipient_email"
                type="email"
                value={newShipment.recipient_email}
                onChange={(e) => setNewShipment({ ...newShipment, recipient_email: e.target.value })}
                placeholder="cliente@email.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="recipient_address">Dirección completa *</Label>
              <Input
                id="recipient_address"
                value={newShipment.recipient_address}
                onChange={(e) => setNewShipment({ ...newShipment, recipient_address: e.target.value })}
                placeholder="Calle Mayor 123, Piso 2, Puerta A"
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="recipient_city">Ciudad *</Label>
                <Input
                  id="recipient_city"
                  value={newShipment.recipient_city}
                  onChange={(e) => setNewShipment({ ...newShipment, recipient_city: e.target.value })}
                  placeholder="Madrid"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipient_postal_code">Código Postal *</Label>
                <Input
                  id="recipient_postal_code"
                  value={newShipment.recipient_postal_code}
                  onChange={(e) => setNewShipment({ ...newShipment, recipient_postal_code: e.target.value })}
                  placeholder="28001"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="recipient_country">País</Label>
                <Select
                  value={newShipment.recipient_country}
                  onValueChange={(value) => setNewShipment({ ...newShipment, recipient_country: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ES">España</SelectItem>
                    <SelectItem value="PT">Portugal</SelectItem>
                    <SelectItem value="FR">Francia</SelectItem>
                    <SelectItem value="AD">Andorra</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="service_type">Tipo de servicio</Label>
                <Select
                  value={newShipment.service_type}
                  onValueChange={(value) => setNewShipment({ ...newShipment, service_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PAQ_PREMIUM">Paq Premium (1-2 días)</SelectItem>
                    <SelectItem value="PAQ_ESTANDAR">Paq Estándar (3-5 días)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="weight">Peso (gramos)</Label>
                <Input
                  id="weight"
                  type="number"
                  value={newShipment.weight}
                  onChange={(e) => setNewShipment({ ...newShipment, weight: parseInt(e.target.value) || 2000 })}
                  placeholder="2000"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                value={newShipment.notes}
                onChange={(e) => setNewShipment({ ...newShipment, notes: e.target.value })}
                placeholder="Instrucciones especiales de entrega..."
                rows={2}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNewShipmentModal(false)}>
              Cancelar
            </Button>
            <Button 
              onClick={handleCreateShipment} 
              disabled={creatingShipment}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {creatingShipment ? "Creando envío..." : "Crear Envío"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
