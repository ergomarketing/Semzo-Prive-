"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Plus, Edit, Trash2, Users, Package, Eye } from "lucide-react"
import Image from "next/image"

interface RealBag {
  id: string
  name: string
  brand: string
  description: string
  monthlyPrice: number
  retailPrice: number
  images: string[]
  membership: "essentiel" | "signature" | "prive"
  color: string
  material: string
  dimensions: string
  condition: "excellent" | "very-good" | "good"
  status: "available" | "rented" | "maintenance" | "reserved"
  currentRenter?: string
  rentedUntil?: string
  waitingList: WaitingListEntry[]
  totalRentals: number
  createdAt: string
}

interface WaitingListEntry {
  id: string
  customerEmail: string
  customerName: string
  addedDate: string
  notified: boolean
}

export default function InventoryManagementPage() {
  const [bags, setBags] = useState<RealBag[]>([])
  const [isAddingBag, setIsAddingBag] = useState(false)
  const [editingBag, setEditingBag] = useState<RealBag | null>(null)
  const [selectedBag, setSelectedBag] = useState<RealBag | null>(null)

  // Cargar bolsos desde localStorage (simular base de datos)
  useEffect(() => {
    const savedBags = localStorage.getItem("admin-inventory")
    if (savedBags) {
      setBags(JSON.parse(savedBags))
    } else {
      // Datos iniciales de ejemplo
      const initialBags: RealBag[] = [
        {
          id: "bag-1",
          name: "Classic Flap Medium",
          brand: "Chanel",
          description: "Icónico bolso Chanel en cuero acolchado negro con cadena dorada",
          monthlyPrice: 189,
          retailPrice: 5500,
          images: ["/classic-flap-handbag.png"],
          membership: "prive",
          color: "Negro",
          material: "Cuero acolchado",
          dimensions: "25 x 15 x 6 cm",
          condition: "excellent",
          status: "available",
          waitingList: [],
          totalRentals: 0,
          createdAt: new Date().toISOString(),
        },
      ]
      setBags(initialBags)
      localStorage.setItem("admin-inventory", JSON.stringify(initialBags))
    }
  }, [])

  // Guardar cambios en localStorage
  const saveBags = (updatedBags: RealBag[]) => {
    setBags(updatedBags)
    localStorage.setItem("admin-inventory", JSON.stringify(updatedBags))
  }

  const addBag = (bagData: Omit<RealBag, "id" | "waitingList" | "totalRentals" | "createdAt">) => {
    const newBag: RealBag = {
      ...bagData,
      id: `bag-${Date.now()}`,
      waitingList: [],
      totalRentals: 0,
      createdAt: new Date().toISOString(),
    }
    const updatedBags = [...bags, newBag]
    saveBags(updatedBags)
    setIsAddingBag(false)
  }

  const updateBag = (bagId: string, updates: Partial<RealBag>) => {
    const updatedBags = bags.map((bag) => (bag.id === bagId ? { ...bag, ...updates } : bag))
    saveBags(updatedBags)
    setEditingBag(null)
  }

  const deleteBag = (bagId: string) => {
    if (confirm("¿Estás seguro de que quieres eliminar este bolso?")) {
      const updatedBags = bags.filter((bag) => bag.id !== bagId)
      saveBags(updatedBags)
    }
  }

  const removeFromWaitingList = (bagId: string, entryId: string) => {
    const updatedBags = bags.map((bag) =>
      bag.id === bagId ? { ...bag, waitingList: bag.waitingList.filter((entry) => entry.id !== entryId) } : bag,
    )
    saveBags(updatedBags)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Gestión de Inventario</h1>
        <p className="text-gray-600">Administra tu colección de bolsos de lujo</p>
      </div>

      <Tabs defaultValue="inventory" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="inventory">Inventario</TabsTrigger>
          <TabsTrigger value="waiting-lists">Listas de Espera</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="inventory" className="space-y-6">
          <div className="flex justify-between items-center">
            <div className="flex gap-4">
              <Badge variant="outline" className="bg-green-50">
                {bags.filter((b) => b.status === "available").length} Disponibles
              </Badge>
              <Badge variant="outline" className="bg-blue-50">
                {bags.filter((b) => b.status === "rented").length} Alquilados
              </Badge>
              <Badge variant="outline" className="bg-yellow-50">
                {bags.filter((b) => b.status === "maintenance").length} Mantenimiento
              </Badge>
            </div>
            <Button onClick={() => setIsAddingBag(true)} className="bg-indigo-600 hover:bg-indigo-700">
              <Plus className="h-4 w-4 mr-2" />
              Agregar Bolso
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {bags.map((bag) => (
              <BagInventoryCard
                key={bag.id}
                bag={bag}
                onEdit={() => setEditingBag(bag)}
                onDelete={() => deleteBag(bag.id)}
                onViewDetails={() => setSelectedBag(bag)}
                onUpdateStatus={(status) => updateBag(bag.id, { status })}
              />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="waiting-lists" className="space-y-6">
          <WaitingListsView bags={bags} onRemoveFromWaitingList={removeFromWaitingList} />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <InventoryAnalytics bags={bags} />
        </TabsContent>
      </Tabs>

      {/* Modal para agregar bolso */}
      {isAddingBag && <AddBagModal onAdd={addBag} onCancel={() => setIsAddingBag(false)} />}

      {/* Modal para editar bolso */}
      {editingBag && (
        <EditBagModal
          bag={editingBag}
          onUpdate={(updates) => updateBag(editingBag.id, updates)}
          onCancel={() => setEditingBag(null)}
        />
      )}

      {/* Modal para ver detalles */}
      {selectedBag && <BagDetailsModal bag={selectedBag} onClose={() => setSelectedBag(null)} />}
    </div>
  )
}

// Componente para cada tarjeta de bolso en el inventario
function BagInventoryCard({
  bag,
  onEdit,
  onDelete,
  onViewDetails,
  onUpdateStatus,
}: {
  bag: RealBag
  onEdit: () => void
  onDelete: () => void
  onViewDetails: () => void
  onUpdateStatus: (status: RealBag["status"]) => void
}) {
  const getStatusColor = (status: RealBag["status"]) => {
    switch (status) {
      case "available":
        return "bg-green-100 text-green-800"
      case "rented":
        return "bg-blue-100 text-blue-800"
      case "maintenance":
        return "bg-yellow-100 text-yellow-800"
      case "reserved":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card className="overflow-hidden">
      <div className="aspect-square bg-gray-50 relative">
        <Image
          src={bag.images[0] || "/placeholder.svg?height=300&width=300&query=luxury+bag"}
          alt={`${bag.brand} ${bag.name}`}
          fill
          className="object-contain p-4"
        />
        <Badge className={`absolute top-2 right-2 ${getStatusColor(bag.status)}`}>{bag.status}</Badge>
      </div>

      <CardContent className="p-4">
        <div className="mb-3">
          <p className="text-sm text-gray-500">{bag.brand}</p>
          <h3 className="font-semibold text-lg">{bag.name}</h3>
          <p className="text-sm text-gray-600">{bag.monthlyPrice}€/mes</p>
        </div>

        {bag.waitingList.length > 0 && (
          <div className="mb-3 p-2 bg-amber-50 rounded">
            <p className="text-sm text-amber-800">
              <Users className="h-4 w-4 inline mr-1" />
              {bag.waitingList.length} en lista de espera
            </p>
          </div>
        )}

        <div className="flex gap-2">
          <Button size="sm" variant="outline" onClick={onViewDetails}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="outline" onClick={onDelete} className="text-red-600 bg-transparent">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>

        <div className="mt-3">
          <select
            value={bag.status}
            onChange={(e) => onUpdateStatus(e.target.value as RealBag["status"])}
            className="w-full p-2 border rounded text-sm"
          >
            <option value="available">Disponible</option>
            <option value="rented">Alquilado</option>
            <option value="maintenance">Mantenimiento</option>
            <option value="reserved">Reservado</option>
          </select>
        </div>
      </CardContent>
    </Card>
  )
}

// Modal para agregar nuevo bolso
function AddBagModal({
  onAdd,
  onCancel,
}: {
  onAdd: (bag: Omit<RealBag, "id" | "waitingList" | "totalRentals" | "createdAt">) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    description: "",
    monthlyPrice: 0,
    retailPrice: 0,
    images: [""],
    membership: "signature" as const,
    color: "",
    material: "",
    dimensions: "",
    condition: "excellent" as const,
    status: "available" as const,
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onAdd(formData)
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle>Agregar Nuevo Bolso</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Marca</label>
                <Input
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Nombre</label>
                <Input
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-1">Descripción</label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Precio mensual (€)</label>
                <Input
                  type="number"
                  value={formData.monthlyPrice}
                  onChange={(e) => setFormData({ ...formData, monthlyPrice: Number(e.target.value) })}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Precio retail (€)</label>
                <Input
                  type="number"
                  value={formData.retailPrice}
                  onChange={(e) => setFormData({ ...formData, retailPrice: Number(e.target.value) })}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1">Membresía</label>
                <select
                  value={formData.membership}
                  onChange={(e) => setFormData({ ...formData, membership: e.target.value as any })}
                  className="w-full p-2 border rounded"
                >
                  <option value="essentiel">L'Essentiel</option>
                  <option value="signature">Signature</option>
                  <option value="prive">Privé</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Color</label>
                <Input value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Material</label>
                <Input
                  value={formData.material}
                  onChange={(e) => setFormData({ ...formData, material: e.target.value })}
                />
              </div>
            </div>

            <div className="flex gap-4 pt-4">
              <Button type="submit" className="flex-1">
                Agregar Bolso
              </Button>
              <Button type="button" variant="outline" onClick={onCancel}>
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

// Componente para ver listas de espera
function WaitingListsView({
  bags,
  onRemoveFromWaitingList,
}: {
  bags: RealBag[]
  onRemoveFromWaitingList: (bagId: string, entryId: string) => void
}) {
  const bagsWithWaitingList = bags.filter((bag) => bag.waitingList.length > 0)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Listas de Espera</h2>

      {bagsWithWaitingList.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <Users className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">No hay listas de espera activas</h3>
            <p className="text-gray-600">
              Cuando los clientes se interesen por bolsos no disponibles, aparecerán aquí.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {bagsWithWaitingList.map((bag) => (
            <Card key={bag.id}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>
                    {bag.brand} {bag.name}
                  </span>
                  <Badge>{bag.waitingList.length} personas esperando</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bag.waitingList.map((entry, index) => (
                    <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                      <div>
                        <p className="font-medium">
                          #{index + 1} - {entry.customerName}
                        </p>
                        <p className="text-sm text-gray-600">{entry.customerEmail}</p>
                        <p className="text-xs text-gray-500">
                          Añadido: {new Date(entry.addedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex gap-2">
                        {entry.notified && <Badge className="bg-green-100 text-green-800">Notificado</Badge>}
                        <Button size="sm" variant="outline" onClick={() => onRemoveFromWaitingList(bag.id, entry.id)}>
                          Remover
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

// Componente de analytics básico
function InventoryAnalytics({ bags }: { bags: RealBag[] }) {
  const totalValue = bags.reduce((sum, bag) => sum + bag.retailPrice, 0)
  const monthlyRevenue = bags.filter((b) => b.status === "rented").reduce((sum, bag) => sum + bag.monthlyPrice, 0)
  const totalWaitingList = bags.reduce((sum, bag) => sum + bag.waitingList.length, 0)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Analytics del Inventario</h2>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6 text-center">
            <Package className="h-8 w-8 text-blue-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{bags.length}</p>
            <p className="text-sm text-gray-600">Total Bolsos</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-green-600">{totalValue.toLocaleString()}€</div>
            <p className="text-sm text-gray-600">Valor Total Inventario</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <div className="text-2xl font-bold text-blue-600">{monthlyRevenue}€</div>
            <p className="text-sm text-gray-600">Ingresos Mensuales Actuales</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 text-amber-600 mx-auto mb-2" />
            <p className="text-2xl font-bold">{totalWaitingList}</p>
            <p className="text-sm text-gray-600">Total en Listas de Espera</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

// Modales adicionales (EditBagModal, BagDetailsModal) se pueden agregar según necesidad
function EditBagModal({
  bag,
  onUpdate,
  onCancel,
}: {
  bag: RealBag
  onUpdate: (updates: Partial<RealBag>) => void
  onCancel: () => void
}) {
  // Similar al AddBagModal pero con datos pre-cargados
  return <div>Modal de edición (implementar según necesidad)</div>
}

function BagDetailsModal({
  bag,
  onClose,
}: {
  bag: RealBag
  onClose: () => void
}) {
  // Modal para ver detalles completos del bolso
  return <div>Modal de detalles (implementar según necesidad)</div>
}
