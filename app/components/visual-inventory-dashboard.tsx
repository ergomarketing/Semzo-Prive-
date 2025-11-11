"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import {
  Clock,
  Users,
  CheckCircle2,
  Package,
  Search,
  Eye,
  Edit,
  TrendingUp,
  MapPin,
  Truck,
  Home,
  Settings,
} from "lucide-react"
import Image from "next/image"

interface BagInventoryItem {
  id: string
  name: string
  brand: string
  images: string[]
  status: "available" | "rented" | "maintenance" | "reserved" | "in-transit" | "cleaning"
  currentLocation: "warehouse" | "customer" | "maintenance-center" | "in-transit"
  currentRenter?: {
    name: string
    email: string
    membershipType: "essentiel" | "signature" | "prive"
  }
  rentedUntil?: Date
  nextAvailable?: Date
  waitingList: WaitingListEntry[]
  totalRentals: number
  condition: "excellent" | "very-good" | "good" | "needs-attention"
  lastMaintenance?: Date
  nextMaintenanceDate?: Date
  value: number
  monthlyPrice: number
  utilizationRate: number // Porcentaje de tiempo alquilado
  revenue: number // Ingresos generados
  membership: "essentiel" | "signature" | "prive"
}

interface WaitingListEntry {
  id: string
  customerName: string
  customerEmail: string
  addedDate: Date
  membershipType: "essentiel" | "signature" | "prive"
  notified: boolean
}

export default function VisualInventoryDashboard() {
  const [inventory, setInventory] = useState<BagInventoryItem[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [selectedBag, setSelectedBag] = useState<BagInventoryItem | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid")

  // Mock data - En producción vendría de la API
  useEffect(() => {
    const mockInventory: BagInventoryItem[] = [
      {
        id: "chanel-classic-flap",
        name: "Classic Flap Medium",
        brand: "Chanel",
        images: ["/images/chanel-signature.jpeg"],
        status: "rented",
        currentLocation: "customer",
        currentRenter: {
          name: "María García",
          email: "maria@ejemplo.com",
          membershipType: "signature",
        },
        rentedUntil: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        waitingList: [
          {
            id: "w1",
            customerName: "Ana López",
            customerEmail: "ana@ejemplo.com",
            addedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
            membershipType: "signature",
            notified: false,
          },
          {
            id: "w2",
            customerName: "Carmen Ruiz",
            customerEmail: "carmen@ejemplo.com",
            addedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
            membershipType: "prive",
            notified: false,
          },
        ],
        totalRentals: 24,
        condition: "excellent",
        lastMaintenance: new Date(Date.now() - 45 * 24 * 60 * 60 * 1000),
        nextMaintenanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        value: 4500,
        monthlyPrice: 129,
        utilizationRate: 85,
        revenue: 3096,
        membership: "signature",
      },
      {
        id: "lv-speedy-30",
        name: "Speedy 30",
        brand: "Louis Vuitton",
        images: ["/images/louis-vuitton-lessentiel.jpeg"],
        status: "available",
        currentLocation: "warehouse",
        waitingList: [],
        totalRentals: 18,
        condition: "very-good",
        lastMaintenance: new Date(Date.now() - 60 * 24 * 60 * 60 * 1000),
        nextMaintenanceDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
        value: 1200,
        monthlyPrice: 59,
        utilizationRate: 72,
        revenue: 1062,
        membership: "essentiel",
      },
      {
        id: "dior-lady-dior",
        name: "Lady Dior Medium",
        brand: "Dior",
        images: ["/images/dior-paris.jpeg"],
        status: "maintenance",
        currentLocation: "maintenance-center",
        nextAvailable: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        waitingList: [
          {
            id: "w3",
            customerName: "Lucía Martín",
            customerEmail: "lucia@ejemplo.com",
            addedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
            membershipType: "signature",
            notified: false,
          },
        ],
        totalRentals: 31,
        condition: "good",
        lastMaintenance: new Date(),
        value: 3800,
        monthlyPrice: 129,
        utilizationRate: 91,
        revenue: 3999,
        membership: "signature",
      },
      {
        id: "hermes-birkin",
        name: "Birkin 30",
        brand: "Hermès",
        images: ["/images/hermes-prive.jpeg"],
        status: "reserved",
        currentLocation: "warehouse",
        nextAvailable: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        waitingList: [
          {
            id: "w4",
            customerName: "Isabella Torres",
            customerEmail: "isabella@ejemplo.com",
            addedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            membershipType: "prive",
            notified: true,
          },
        ],
        totalRentals: 12,
        condition: "excellent",
        lastMaintenance: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        nextMaintenanceDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        value: 8500,
        monthlyPrice: 189,
        utilizationRate: 95,
        revenue: 2268,
        membership: "prive",
      },
      {
        id: "lv-pont-neuf",
        name: "Pont-Neuf PM",
        brand: "Louis Vuitton",
        images: ["/images/lv-pont-neuf-main.jpeg"],
        status: "in-transit",
        currentLocation: "in-transit",
        waitingList: [],
        totalRentals: 8,
        condition: "excellent",
        lastMaintenance: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
        nextMaintenanceDate: new Date(Date.now() + 40 * 24 * 60 * 60 * 1000),
        value: 2450,
        monthlyPrice: 129,
        utilizationRate: 68,
        revenue: 1032,
        membership: "signature",
      },
      {
        id: "marni-trunk",
        name: "Trunk Mini",
        brand: "Marni",
        images: ["/images/marni-front-view.jpeg"],
        status: "cleaning",
        currentLocation: "warehouse",
        nextAvailable: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
        waitingList: [],
        totalRentals: 15,
        condition: "very-good",
        lastMaintenance: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
        nextMaintenanceDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
        value: 890,
        monthlyPrice: 59,
        utilizationRate: 78,
        revenue: 885,
        membership: "essentiel",
      },
    ]

    setInventory(mockInventory)
  }, [])

  // Filtros y búsqueda
  const filteredInventory = inventory.filter((bag) => {
    const matchesSearch =
      bag.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      bag.brand.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || bag.status === statusFilter
    return matchesSearch && matchesStatus
  })

  // Estadísticas generales
  const stats = {
    total: inventory.length,
    available: inventory.filter((b) => b.status === "available").length,
    rented: inventory.filter((b) => b.status === "rented").length,
    maintenance: inventory.filter((b) => b.status === "maintenance").length,
    totalRevenue: inventory.reduce((sum, bag) => sum + bag.revenue, 0),
    avgUtilization: inventory.reduce((sum, bag) => sum + bag.utilizationRate, 0) / inventory.length,
    totalWaitingList: inventory.reduce((sum, bag) => sum + bag.waitingList.length, 0),
  }

  const getStatusConfig = (status: BagInventoryItem["status"]) => {
    const configs = {
      available: {
        label: "Disponible",
        color: "bg-slate-100 text-slate-700 border border-slate-200",
        icon: CheckCircle2,
        bgColor: "bg-slate-50",
      },
      rented: {
        label: "Alquilado",
        color: "bg-stone-100 text-stone-700 border border-stone-200",
        icon: Users,
        bgColor: "bg-stone-50",
      },
      maintenance: {
        label: "Mantenimiento",
        color: "bg-amber-50 text-amber-700 border border-amber-200",
        icon: Settings,
        bgColor: "bg-amber-25",
      },
      reserved: {
        label: "Reservado",
        color: "bg-rose-50 text-rose-700 border border-rose-200",
        icon: Clock,
        bgColor: "bg-rose-25",
      },
      "in-transit": {
        label: "En tránsito",
        color: "bg-indigo-50 text-indigo-700 border border-indigo-200",
        icon: Truck,
        bgColor: "bg-indigo-25",
      },
      cleaning: {
        label: "Limpieza",
        color: "bg-teal-50 text-teal-700 border border-teal-200",
        icon: Package,
        bgColor: "bg-teal-25",
      },
    }
    return configs[status]
  }

  const getLocationIcon = (location: BagInventoryItem["currentLocation"]) => {
    switch (location) {
      case "warehouse":
        return <Home className="h-4 w-4" />
      case "customer":
        return <Users className="h-4 w-4" />
      case "maintenance-center":
        return <Settings className="h-4 w-4" />
      case "in-transit":
        return <Truck className="h-4 w-4" />
      default:
        return <MapPin className="h-4 w-4" />
    }
  }

  const getLocationLabel = (location: BagInventoryItem["currentLocation"]) => {
    const labels = {
      warehouse: "Almacén",
      customer: "Con cliente",
      "maintenance-center": "Centro de mantenimiento",
      "in-transit": "En tránsito",
    }
    return labels[location]
  }

  const getConditionColor = (condition: BagInventoryItem["condition"]) => {
    const colors = {
      excellent: "text-green-600",
      "very-good": "text-blue-600",
      good: "text-yellow-600",
      "needs-attention": "text-red-600",
    }
    return colors[condition]
  }

  const getMembershipColor = (membership: BagInventoryItem["membership"]) => {
    const colors = {
      essentiel: "bg-rose-nude text-slate-900",
      signature: "bg-rose-pastel/50 text-slate-900",
      prive: "bg-indigo-dark text-white",
    }
    return colors[membership]
  }

  return (
    <div className="space-y-6">
      {/* Header con estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Bolsos</p>
                <p className="text-2xl font-bold text-slate-800">{stats.total}</p>
              </div>
              <Package className="h-8 w-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Disponibles</p>
                <p className="text-2xl font-bold text-slate-700">{stats.available}</p>
              </div>
              <CheckCircle2 className="h-8 w-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Utilización</p>
                <p className="text-2xl font-bold text-slate-700">{Math.round(stats.avgUtilization)}%</p>
              </div>
              <TrendingUp className="h-8 w-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Ingresos</p>
                <p className="text-2xl font-bold text-slate-800">{stats.totalRevenue.toLocaleString()}€</p>
              </div>
              <TrendingUp className="h-8 w-8 text-slate-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Controles de filtrado */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div className="flex items-center space-x-4 flex-1">
              <div className="relative flex-1 max-w-md">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nombre o marca..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              >
                <option value="all">Todos los estados</option>
                <option value="available">Disponible</option>
                <option value="rented">Alquilado</option>
                <option value="maintenance">Mantenimiento</option>
                <option value="reserved">Reservado</option>
                <option value="in-transit">En tránsito</option>
                <option value="cleaning">Limpieza</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("grid")}
              >
                Grid
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="sm"
                onClick={() => setViewMode("list")}
              >
                Lista
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Vista de inventario */}
      <div className={viewMode === "grid" ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" : "space-y-4"}>
        {filteredInventory.map((bag) => (
          <BagInventoryCard
            key={bag.id}
            bag={bag}
            viewMode={viewMode}
            onSelect={setSelectedBag}
            getStatusConfig={getStatusConfig}
            getLocationIcon={getLocationIcon}
            getLocationLabel={getLocationLabel}
            getConditionColor={getConditionColor}
            getMembershipColor={getMembershipColor}
          />
        ))}
      </div>

      {/* Modal de detalles */}
      {selectedBag && (
        <BagDetailModal
          bag={selectedBag}
          onClose={() => setSelectedBag(null)}
          getStatusConfig={getStatusConfig}
          getLocationIcon={getLocationIcon}
          getLocationLabel={getLocationLabel}
          getConditionColor={getConditionColor}
          getMembershipColor={getMembershipColor}
        />
      )}
    </div>
  )
}

function BagInventoryCard({
  bag,
  viewMode,
  onSelect,
  getStatusConfig,
  getLocationIcon,
  getLocationLabel,
  getConditionColor,
  getMembershipColor,
}: {
  bag: BagInventoryItem
  viewMode: "grid" | "list"
  onSelect: (bag: BagInventoryItem) => void
  getStatusConfig: (status: BagInventoryItem["status"]) => any
  getLocationIcon: (location: BagInventoryItem["currentLocation"]) => React.ReactNode
  getLocationLabel: (location: BagInventoryItem["currentLocation"]) => string
  getConditionColor: (condition: BagInventoryItem["condition"]) => string
  getMembershipColor: (membership: BagInventoryItem["membership"]) => string
}) {
  const statusConfig = getStatusConfig(bag.status)
  const StatusIcon = statusConfig.icon

  if (viewMode === "list") {
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-center space-x-4">
            <div className="relative w-16 h-16 bg-slate-50 rounded-lg overflow-hidden flex-shrink-0">
              <Image
                src={bag.images[0] || "/placeholder.svg"}
                alt={bag.name}
                width={64}
                height={64}
                className="object-contain w-full h-full p-1"
              />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2 mb-1">
                <h3 className="font-medium text-slate-900 truncate">
                  {bag.brand} {bag.name}
                </h3>
                <Badge className={getMembershipColor(bag.membership)} variant="secondary">
                  {bag.membership.charAt(0).toUpperCase() + bag.membership.slice(1)}
                </Badge>
              </div>

              <div className="flex items-center space-x-4 text-sm text-slate-600">
                <div className="flex items-center space-x-1">
                  {getLocationIcon(bag.currentLocation)}
                  <span>{getLocationLabel(bag.currentLocation)}</span>
                </div>
                <span className={getConditionColor(bag.condition)}>{bag.condition.replace("-", " ")}</span>
                <span>{bag.totalRentals} alquileres</span>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-slate-900">{bag.monthlyPrice}€/mes</p>
                <p className="text-xs text-slate-500">{bag.utilizationRate}% utilización</p>
              </div>

              <Badge className={statusConfig.color}>
                <StatusIcon className="h-3 w-3 mr-1" />
                {statusConfig.label}
              </Badge>

              <Button variant="outline" size="sm" onClick={() => onSelect(bag)}>
                <Eye className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-0">
        <div className="relative aspect-square bg-slate-50">
          <Image
            src={bag.images[0] || "/placeholder.svg"}
            alt={bag.name}
            width={300}
            height={300}
            className="object-contain w-full h-full p-4"
          />

          <div className="absolute top-3 left-3">
            <Badge className={getMembershipColor(bag.membership)} variant="secondary">
              {bag.membership.charAt(0).toUpperCase() + bag.membership.slice(1)}
            </Badge>
          </div>

          <div className="absolute top-3 right-3">
            <Badge className={statusConfig.color}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>
        </div>

        <div className="p-4 space-y-3">
          <div>
            <h3 className="font-serif text-lg text-slate-900">{bag.name}</h3>
            <p className="text-slate-600">{bag.brand}</p>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-1 text-slate-600">
              {getLocationIcon(bag.currentLocation)}
              <span>{getLocationLabel(bag.currentLocation)}</span>
            </div>
            <span className={`font-medium ${getConditionColor(bag.condition)}`}>{bag.condition.replace("-", " ")}</span>
          </div>

          {bag.status === "rented" && bag.currentRenter && (
            <div className="p-3 bg-blue-50 rounded-lg">
              <p className="text-sm font-medium text-blue-900">Alquilado por:</p>
              <p className="text-sm text-blue-700">{bag.currentRenter.name}</p>
              <p className="text-xs text-blue-600">Hasta: {bag.rentedUntil?.toLocaleDateString()}</p>
            </div>
          )}

          {bag.waitingList.length > 0 && (
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-sm font-medium text-slate-900">Lista de espera: {bag.waitingList.length}</p>
              <p className="text-xs text-slate-600">Próximo: {bag.waitingList[0].customerName}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-slate-500">Precio/mes</p>
              <p className="font-medium text-slate-900">{bag.monthlyPrice}€</p>
            </div>
            <div>
              <p className="text-slate-500">Utilización</p>
              <p className="font-medium text-slate-900">{bag.utilizationRate}%</p>
            </div>
          </div>

          <div className="flex space-x-2">
            <Button variant="outline" size="sm" onClick={() => onSelect(bag)} className="flex-1">
              <Eye className="h-4 w-4 mr-2" />
              Ver detalles
            </Button>
            <Button variant="outline" size="sm">
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function BagDetailModal({
  bag,
  onClose,
  getStatusConfig,
  getLocationIcon,
  getLocationLabel,
  getConditionColor,
  getMembershipColor,
}: {
  bag: BagInventoryItem
  onClose: () => void
  getStatusConfig: (status: BagInventoryItem["status"]) => any
  getLocationIcon: (location: BagInventoryItem["currentLocation"]) => React.ReactNode
  getLocationLabel: (location: BagInventoryItem["currentLocation"]) => string
  getConditionColor: (condition: BagInventoryItem["condition"]) => string
  getMembershipColor: (membership: BagInventoryItem["membership"]) => string
}) {
  const statusConfig = getStatusConfig(bag.status)
  const StatusIcon = statusConfig.icon

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-serif text-slate-900">
                {bag.brand} {bag.name}
              </h2>
              <div className="flex items-center space-x-2 mt-2">
                <Badge className={getMembershipColor(bag.membership)}>
                  {bag.membership.charAt(0).toUpperCase() + bag.membership.slice(1)}
                </Badge>
                <Badge className={statusConfig.color}>
                  <StatusIcon className="h-3 w-3 mr-1" />
                  {statusConfig.label}
                </Badge>
              </div>
            </div>
            <Button variant="outline" onClick={onClose}>
              ✕
            </Button>
          </div>
        </div>

        <div className="p-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Resumen</TabsTrigger>
              <TabsTrigger value="rental">Alquiler</TabsTrigger>
              <TabsTrigger value="maintenance">Mantenimiento</TabsTrigger>
              <TabsTrigger value="analytics">Análisis</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="aspect-square bg-slate-50 rounded-lg overflow-hidden">
                    <Image
                      src={bag.images[0] || "/placeholder.svg"}
                      alt={bag.name}
                      width={400}
                      height={400}
                      className="object-contain w-full h-full p-4"
                    />
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-slate-500">Ubicación actual</p>
                      <div className="flex items-center space-x-2 mt-1">
                        {getLocationIcon(bag.currentLocation)}
                        <span className="font-medium">{getLocationLabel(bag.currentLocation)}</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Estado</p>
                      <p className={`font-medium ${getConditionColor(bag.condition)}`}>
                        {bag.condition.replace("-", " ")}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Valor</p>
                      <p className="font-medium">{bag.value.toLocaleString()}€</p>
                    </div>
                    <div>
                      <p className="text-sm text-slate-500">Precio mensual</p>
                      <p className="font-medium">{bag.monthlyPrice}€</p>
                    </div>
                  </div>

                  {bag.currentRenter && (
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">Cliente actual</h4>
                      <p className="text-blue-800">{bag.currentRenter.name}</p>
                      <p className="text-sm text-blue-600">{bag.currentRenter.email}</p>
                      <p className="text-sm text-blue-600">Membresía: {bag.currentRenter.membershipType}</p>
                      {bag.rentedUntil && (
                        <p className="text-sm text-blue-600">Hasta: {bag.rentedUntil.toLocaleDateString()}</p>
                      )}
                    </div>
                  )}

                  {bag.waitingList.length > 0 && (
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <h4 className="font-medium text-slate-900 mb-3">Lista de espera ({bag.waitingList.length})</h4>
                      <div className="space-y-2">
                        {bag.waitingList.slice(0, 3).map((entry, index) => (
                          <div key={entry.id} className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-medium">
                                {index + 1}. {entry.customerName}
                              </p>
                              <p className="text-xs text-slate-500">{entry.customerEmail}</p>
                            </div>
                            <div className="text-right">
                              <Badge variant="outline" className="text-xs">
                                {entry.membershipType}
                              </Badge>
                              {entry.notified && <p className="text-xs text-green-600">Notificado</p>}
                            </div>
                          </div>
                        ))}
                        {bag.waitingList.length > 3 && (
                          <p className="text-xs text-slate-500">+{bag.waitingList.length - 3} más...</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="rental" className="mt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-slate-900">{bag.totalRentals}</p>
                      <p className="text-sm text-slate-600">Total alquileres</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-blue-600">{bag.utilizationRate}%</p>
                      <p className="text-sm text-slate-600">Utilización</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <p className="text-2xl font-bold text-green-600">{bag.revenue.toLocaleString()}€</p>
                      <p className="text-sm text-slate-600">Ingresos totales</p>
                    </CardContent>
                  </Card>
                </div>

                {/* Aquí podrías agregar un historial de alquileres */}
                <div className="p-4 bg-slate-50 rounded-lg">
                  <h4 className="font-medium text-slate-900 mb-2">Historial reciente</h4>
                  <p className="text-sm text-slate-600">Funcionalidad de historial de alquileres en desarrollo...</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="maintenance" className="mt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-500">Último mantenimiento</p>
                    <p className="font-medium">{bag.lastMaintenance?.toLocaleDateString() || "No registrado"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-slate-500">Próximo mantenimiento</p>
                    <p className="font-medium">{bag.nextMaintenanceDate?.toLocaleDateString() || "No programado"}</p>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 rounded-lg">
                  <h4 className="font-medium text-yellow-900 mb-2">Estado de mantenimiento</h4>
                  <p className="text-sm text-yellow-800">
                    {bag.status === "maintenance"
                      ? "Actualmente en mantenimiento"
                      : "No requiere mantenimiento inmediato"}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="mt-6">
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Rendimiento financiero</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600">ROI mensual</span>
                          <span className="font-medium">{((bag.monthlyPrice / bag.value) * 100).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Ingresos/Valor</span>
                          <span className="font-medium">{((bag.revenue / bag.value) * 100).toFixed(1)}%</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Métricas de uso</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between">
                          <span className="text-slate-600">Alquileres/mes</span>
                          <span className="font-medium">{(bag.totalRentals / 12).toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-600">Demanda</span>
                          <span className="font-medium">{bag.waitingList.length > 0 ? "Alta" : "Normal"}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  )
}
