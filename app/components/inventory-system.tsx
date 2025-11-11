"use client"
import { useState, useEffect } from "react"
import type React from "react"
import { useToast } from "@/hooks/use-toast"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Clock, Users, AlertCircle, CheckCircle2, Package, Mail, Trash2, Plus, Edit, Eye } from "lucide-react"

interface BagInventory {
  id: string
  name: string
  brand: string
  status: "available" | "rented" | "maintenance" | "reserved"
  currentRenter?: string
  rentedUntil?: Date
  nextAvailable?: Date
  waitingList: WaitingListEntry[]
  totalRentals: number
  condition: "excellent" | "very-good" | "good"
  lastMaintenance?: Date
  description?: string
  price?: string
  retail_price?: string
  image_url?: string
  category?: string
}

interface WaitingListEntry {
  id: string
  customerEmail: string
  customerName: string
  addedDate: Date
  notified: boolean
}

interface Reservation {
  id: string
  bagId: string
  customerEmail: string
  customerName: string
  startDate: Date
  endDate: Date
  status: "pending" | "confirmed" | "active" | "completed" | "cancelled"
  membershipType: "essentiel" | "signature" | "prive"
}

export default function InventorySystem() {
  const [inventory, setInventory] = useState<BagInventory[]>([])
  const [reservations, setReservations] = useState<Reservation[]>([])
  const [selectedBag, setSelectedBag] = useState<BagInventory | null>(null)
  const [editingBag, setEditingBag] = useState<BagInventory | null>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    const fetchRealData = async () => {
      try {
        setLoading(true)
        console.log("[v0] Fetching real inventory data...")

        // Obtener token de autenticación
        const token = localStorage.getItem("supabase.auth.token")
        const headers = {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        }

        // Obtener inventario real
        const inventoryResponse = await fetch("/api/admin/inventory", { headers })
        const inventoryData = await inventoryResponse.json()

        // Obtener reservas reales
        const reservationsResponse = await fetch("/api/admin/reservations", { headers })
        const reservationsData = await reservationsResponse.json()

        if (inventoryData.inventory) {
          const processedInventory: BagInventory[] = inventoryData.inventory.map((bag: any) => ({
            id: bag.id,
            name: bag.name,
            brand: bag.brand,
            status: bag.status,
            currentRenter: bag.current_renter,
            rentedUntil: bag.rented_until ? new Date(bag.rented_until) : undefined,
            nextAvailable: bag.next_available ? new Date(bag.next_available) : undefined,
            waitingList: bag.waiting_list || [],
            totalRentals: bag.total_rentals || 0,
            condition: bag.condition,
            lastMaintenance: bag.last_maintenance ? new Date(bag.last_maintenance) : undefined,
            description: bag.description,
            price: bag.price,
            retail_price: bag.retail_price,
            image_url: bag.image_url,
            category: bag.category,
          }))

          setInventory(processedInventory)
          console.log("[v0] Real inventory loaded:", processedInventory.length, "bags")
        }

        if (reservationsData.reservations) {
          const processedReservations: Reservation[] = reservationsData.reservations.map((res: any) => ({
            id: res.id,
            bagId: res.bag_id,
            customerEmail: res.customer_email,
            customerName: res.customer_name,
            startDate: new Date(res.start_date),
            endDate: new Date(res.end_date),
            status: res.status,
            membershipType: res.membership_type,
          }))

          setReservations(processedReservations)
          console.log("[v0] Real reservations loaded:", processedReservations.length, "reservations")
        }
      } catch (error) {
        console.error("[v0] Error loading real data:", error)
        setInventory([
          {
            id: "sample-bag-1",
            name: "Bolso de Ejemplo",
            brand: "Marca Ejemplo",
            status: "available",
            waitingList: [],
            totalRentals: 0,
            condition: "excellent",
          },
        ])
      } finally {
        setLoading(false)
      }
    }

    fetchRealData()
  }, [])

  const getStatusColor = (status: BagInventory["status"]) => {
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

  const getStatusIcon = (status: BagInventory["status"]) => {
    switch (status) {
      case "available":
        return <CheckCircle2 className="h-4 w-4" />
      case "rented":
        return <Users className="h-4 w-4" />
      case "maintenance":
        return <AlertCircle className="h-4 w-4" />
      case "reserved":
        return <Clock className="h-4 w-4" />
      default:
        return <Package className="h-4 w-4" />
    }
  }

  const addToWaitingList = async (bagId: string, customerEmail: string, customerName: string) => {
    const newEntry: WaitingListEntry = {
      id: `w${Date.now()}`,
      customerEmail,
      customerName,
      addedDate: new Date(),
      notified: false,
    }

    setInventory((prev) =>
      prev.map((bag) => (bag.id === bagId ? { ...bag, waitingList: [...bag.waitingList, newEntry] } : bag)),
    )

    console.log(`[v0] Added to waiting list: ${customerEmail} for ${bagId}`)
  }

  const notifyWaitingList = async (bagId: string) => {
    const bag = inventory.find((b) => b.id === bagId)
    if (!bag || bag.waitingList.length === 0) return

    const firstInLine = bag.waitingList[0]

    setInventory((prev) =>
      prev.map((b) =>
        b.id === bagId
          ? {
              ...b,
              waitingList: b.waitingList.map((entry, index) => (index === 0 ? { ...entry, notified: true } : entry)),
            }
          : b,
      ),
    )

    console.log(`[v0] Notified waiting list: ${firstInLine.customerEmail} for ${bag.name}`)
  }

  const markAsAvailable = (bagId: string) => {
    setInventory((prev) =>
      prev.map((bag) =>
        bag.id === bagId
          ? {
              ...bag,
              status: "available",
              currentRenter: undefined,
              rentedUntil: undefined,
              nextAvailable: undefined,
            }
          : bag,
      ),
    )

    notifyWaitingList(bagId)
  }

  const toggleBagStatus = async (bagId: string, newStatus: "available" | "rented" | "maintenance") => {
    try {
      const response = await fetch("/api/admin/inventory", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bagId,
          status: newStatus,
        }),
      })

      if (response.ok) {
        setInventory((prev) =>
          prev.map((bag) =>
            bag.id === bagId
              ? {
                  ...bag,
                  status: newStatus,
                  currentRenter: newStatus === "available" ? undefined : bag.currentRenter,
                  rentedUntil: newStatus === "available" ? undefined : bag.rentedUntil,
                }
              : bag,
          ),
        )

        if (newStatus === "available") {
          notifyWaitingList(bagId)
        }

        toast({
          title: "Estado actualizado",
          description: `El bolso ahora está marcado como ${newStatus === "available" ? "disponible" : newStatus === "rented" ? "rentado" : "en mantenimiento"}.`,
        })

        console.log(`[v0] Bag ${bagId} status changed to ${newStatus}`)
      }
    } catch (error) {
      console.error("[v0] Error updating bag status:", error)
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del bolso.",
        variant: "destructive",
      })
    }
  }

  const deleteBag = async (bagId: string) => {
    if (!confirm("¿Estás seguro de eliminar este bolso? Esta acción no se puede deshacer.")) return

    try {
      const response = await fetch(`/api/admin/inventory/${bagId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        setInventory((prev) => prev.filter((bag) => bag.id !== bagId))
        toast({
          title: "Bolso eliminado",
          description: "El bolso ha sido eliminado del inventario correctamente.",
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo eliminar el bolso.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error deleting bag:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar el bolso.",
        variant: "destructive",
      })
    }
  }

  const saveBag = async (bagData: any) => {
    try {
      const isEditing = !!editingBag?.id
      const url = isEditing ? `/api/admin/inventory/${editingBag.id}` : "/api/admin/inventory"
      const method = isEditing ? "PUT" : "POST"

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(bagData),
      })

      if (response.ok) {
        const result = await response.json()
        if (isEditing) {
          setInventory((prev) => prev.map((bag) => (bag.id === editingBag.id ? { ...bag, ...result.bag } : bag)))
        } else {
          setInventory((prev) => [...prev, result.bag])
        }
        setShowEditModal(false)
        setEditingBag(null)
        toast({
          title: isEditing ? "Bolso actualizado" : "Bolso agregado",
          description: isEditing
            ? "El bolso ha sido actualizado correctamente."
            : "El bolso ha sido agregado al inventario.",
        })
      } else {
        toast({
          title: "Error",
          description: "No se pudo guardar el bolso.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[v0] Error saving bag:", error)
      toast({
        title: "Error",
        description: "No se pudo guardar el bolso.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando inventario real...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-serif text-slate-900">Sistema de Inventario Real</h2>
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => {
              setEditingBag(null)
              setShowEditModal(true)
            }}
            className="bg-indigo-600 hover:bg-indigo-700"
          >
            <Plus className="h-4 w-4 mr-2" />
            Agregar Bolso
          </Button>
          <Badge variant="outline" className="bg-green-50">
            {inventory.filter((b) => b.status === "available").length} Disponibles
          </Badge>
          <Badge variant="outline" className="bg-blue-50">
            {inventory.filter((b) => b.status === "rented").length} Alquilados
          </Badge>
          <Badge variant="outline" className="bg-yellow-50">
            {inventory.filter((b) => b.status === "maintenance").length} Mantenimiento
          </Badge>
        </div>
      </div>

      {inventory.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <Package className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">No hay bolsos en el inventario</h3>
            <p className="text-slate-600">Agrega bolsos al inventario para comenzar a gestionar reservas.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-4">
          {inventory.map((bag) => (
            <Card key={bag.id} className="border-0 shadow-md hover:shadow-lg transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-base font-serif truncate">{bag.name}</CardTitle>
                    <p className="text-xs text-slate-600 truncate">{bag.brand}</p>
                  </div>
                  <Badge className={`${getStatusColor(bag.status)} text-xs ml-2 flex-shrink-0`}>
                    {getStatusIcon(bag.status)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <p className="text-slate-500">Alquileres</p>
                    <p className="font-medium">{bag.totalRentals}</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Condición</p>
                    <p className="font-medium capitalize">{bag.condition}</p>
                  </div>
                </div>

                {bag.waitingList.length > 0 && (
                  <div className="p-2 bg-slate-50 rounded text-xs">
                    <p className="font-medium text-slate-900">
                      <Users className="h-3 w-3 inline mr-1" />
                      {bag.waitingList.length} en espera
                    </p>
                  </div>
                )}

                <div className="flex flex-col space-y-1.5">
                  <div className="flex space-x-1.5">
                    {bag.status === "available" ? (
                      <>
                        <Button
                          size="sm"
                          onClick={() => toggleBagStatus(bag.id, "rented")}
                          className="flex-1 h-8 text-xs bg-blue-600 hover:bg-blue-700"
                        >
                          Rentado
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => toggleBagStatus(bag.id, "maintenance")}
                          className="flex-1 h-8 text-xs"
                        >
                          Manten.
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => toggleBagStatus(bag.id, "available")}
                        className="flex-1 h-8 text-xs bg-green-600 hover:bg-green-700"
                      >
                        Disponible
                      </Button>
                    )}
                  </div>

                  <div className="flex space-x-1.5">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedBag(bag)
                        setShowDetailsModal(true)
                      }}
                      className="flex-1 h-8 text-xs"
                    >
                      <Eye className="h-3 w-3 mr-1" />
                      Ver
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setEditingBag(bag)
                        setShowEditModal(true)
                      }}
                      className="flex-1 h-8 text-xs"
                    >
                      <Edit className="h-3 w-3 mr-1" />
                      Editar
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => deleteBag(bag.id)}
                      className="h-8 text-xs text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-serif">
              {selectedBag?.name} - {selectedBag?.brand}
            </DialogTitle>
          </DialogHeader>
          {selectedBag && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-600">Estado</Label>
                  <Badge className={getStatusColor(selectedBag.status)}>
                    {getStatusIcon(selectedBag.status)}
                    <span className="ml-1 capitalize">{selectedBag.status}</span>
                  </Badge>
                </div>
                <div>
                  <Label className="text-slate-600">Condición</Label>
                  <p className="font-medium capitalize">{selectedBag.condition}</p>
                </div>
                <div>
                  <Label className="text-slate-600">Total Alquileres</Label>
                  <p className="font-medium">{selectedBag.totalRentals}</p>
                </div>
                <div>
                  <Label className="text-slate-600">En Lista de Espera</Label>
                  <p className="font-medium">{selectedBag.waitingList.length} personas</p>
                </div>
              </div>

              {selectedBag.currentRenter && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <Label className="text-blue-900">Alquilado actualmente</Label>
                  <p className="text-sm text-blue-700">Cliente: {selectedBag.currentRenter}</p>
                  {selectedBag.rentedUntil && (
                    <p className="text-sm text-blue-700">
                      Hasta: {new Date(selectedBag.rentedUntil).toLocaleDateString()}
                    </p>
                  )}
                </div>
              )}

              {selectedBag.waitingList.length > 0 && (
                <div>
                  <Label className="text-slate-900 mb-2 block">Lista de Espera</Label>
                  <div className="space-y-2">
                    {selectedBag.waitingList.map((entry, index) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 bg-slate-50 rounded">
                        <div>
                          <p className="font-medium text-sm">
                            {index + 1}. {entry.customerName}
                          </p>
                          <p className="text-xs text-slate-600">{entry.customerEmail}</p>
                        </div>
                        {entry.notified && <Badge className="bg-green-100 text-green-800 text-xs">Notificado</Badge>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedBag.lastMaintenance && (
                <div>
                  <Label className="text-slate-600">Último Mantenimiento</Label>
                  <p className="text-sm">{new Date(selectedBag.lastMaintenance).toLocaleDateString()}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBag ? "Editar Bolso" : "Agregar Nuevo Bolso"}</DialogTitle>
          </DialogHeader>
          <BagForm
            bag={editingBag}
            onSave={saveBag}
            onCancel={() => {
              setShowEditModal(false)
              setEditingBag(null)
            }}
          />
        </DialogContent>
      </Dialog>

      <AdminWaitlistView inventory={inventory} />
    </div>
  )
}

function BagForm({
  bag,
  onSave,
  onCancel,
}: {
  bag: BagInventory | null
  onSave: (data: any) => void
  onCancel: () => void
}) {
  const [formData, setFormData] = useState({
    name: bag?.name || "",
    brand: bag?.brand || "",
    description: "",
    price: "",
    retail_price: "",
    condition: bag?.condition || "excellent",
    status: bag?.status || "available",
    image_url: "",
    category: "",
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSave(formData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="name">Nombre del Bolso *</Label>
          <Input
            id="name"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            required
          />
        </div>
        <div>
          <Label htmlFor="brand">Marca *</Label>
          <Input
            id="brand"
            value={formData.brand}
            onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="description">Descripción</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="price">Precio Mensual (€)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="retail_price">Precio Retail (€)</Label>
          <Input
            id="retail_price"
            type="number"
            step="0.01"
            value={formData.retail_price}
            onChange={(e) => setFormData({ ...formData, retail_price: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="condition">Condición</Label>
          <Select value={formData.condition} onValueChange={(value) => setFormData({ ...formData, condition: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="excellent">Excelente</SelectItem>
              <SelectItem value="very-good">Muy Bueno</SelectItem>
              <SelectItem value="good">Bueno</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="status">Estado</Label>
          <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="available">Disponible</SelectItem>
              <SelectItem value="rented">Rentado</SelectItem>
              <SelectItem value="maintenance">Mantenimiento</SelectItem>
              <SelectItem value="reserved">Reservado</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div>
        <Label htmlFor="image_url">URL de Imagen</Label>
        <Input
          id="image_url"
          value={formData.image_url}
          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
          placeholder="/images/bags/..."
        />
      </div>

      <div>
        <Label htmlFor="category">Categoría</Label>
        <Input
          id="category"
          value={formData.category}
          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          placeholder="Shoulder Bags, Totes, etc."
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">
          {bag ? "Actualizar" : "Crear"} Bolso
        </Button>
      </DialogFooter>
    </form>
  )
}

function AdminWaitlistView({ inventory }: { inventory: BagInventory[] }) {
  const [waitlistEntries, setWaitlistEntries] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    fetchWaitlist()
  }, [])

  const fetchWaitlist = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/admin/waitlist")
      const data = await response.json()

      if (data.waitlist) {
        setWaitlistEntries(data.waitlist)
      }
    } catch (error) {
      console.error("[v0] Error loading waitlist:", error)
    } finally {
      setLoading(false)
    }
  }

  const notifyUser = async (entryId: string, email: string, bagName: string) => {
    try {
      const response = await fetch("/api/admin/waitlist/notify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entryId, email, bagName }),
      })

      if (response.ok) {
        toast({
          title: "Notificación enviada",
          description: `Se ha enviado un email a ${email}.`,
        })
        fetchWaitlist()
      }
    } catch (error) {
      console.error("[v0] Error notifying user:", error)
      toast({
        title: "Error",
        description: "No se pudo enviar la notificación.",
        variant: "destructive",
      })
    }
  }

  const removeFromWaitlist = async (entryId: string) => {
    if (!confirm("¿Eliminar esta entrada de la lista de espera?")) return

    try {
      const response = await fetch(`/api/admin/waitlist/${entryId}`, {
        method: "DELETE",
      })

      if (response.ok) {
        toast({
          title: "Entrada eliminada",
          description: "La entrada ha sido eliminada de la lista de espera.",
        })
        fetchWaitlist()
      }
    } catch (error) {
      console.error("[v0] Error removing from waitlist:", error)
      toast({
        title: "Error",
        description: "No se pudo eliminar la entrada.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="p-8 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando lista de espera...</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Users className="h-5 w-5 mr-2" />
            Lista de Espera - Suscriptores
          </div>
          <Badge variant="outline">{waitlistEntries.length} personas</Badge>
        </CardTitle>
        <p className="text-sm text-slate-600">Usuarios que esperan ser notificados cuando un bolso esté disponible</p>
      </CardHeader>
      <CardContent>
        {waitlistEntries.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600">No hay personas en la lista de espera</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Bolso</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Email</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Fecha</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-slate-700">Estado</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-slate-700">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {waitlistEntries.map((entry) => (
                  <tr key={entry.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-slate-900">{entry.bags?.name || "Bolso eliminado"}</p>
                        <p className="text-sm text-slate-600">{entry.bags?.brand}</p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-slate-900">{entry.email}</p>
                    </td>
                    <td className="py-3 px-4">
                      <p className="text-sm text-slate-600">
                        {new Date(entry.created_at).toLocaleDateString("es-ES", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </p>
                    </td>
                    <td className="py-3 px-4">
                      {entry.notified ? (
                        <Badge className="bg-green-100 text-green-800">Notificado</Badge>
                      ) : (
                        <Badge variant="outline">Pendiente</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex justify-end space-x-2">
                        {!entry.notified && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => notifyUser(entry.id, entry.email, entry.bags?.name || "bolso")}
                            className="text-blue-600 hover:text-blue-700"
                          >
                            <Mail className="h-4 w-4 mr-1" />
                            Notificar
                          </Button>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => removeFromWaitlist(entry.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
