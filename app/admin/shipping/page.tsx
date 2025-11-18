"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Loader2, MapPin, Search, Download, User, Phone, Mail, AlertCircle, Shield } from "lucide-react"
import { useAuth } from "../../hooks/useAuth"

interface ShippingAddress {
  id: string
  email: string
  full_name: string
  membership_type: string
  shipping_address: string
  shipping_city: string
  shipping_postal_code: string
  shipping_phone: string
  shipping_country: string
  created_at: string
  updated_at: string
}

interface AdminStats {
  total: number
  withShipping: number
  withoutShipping: number
  byMembership: {
    prive: number
    signature: number
    essentiel: number
    free: number
  }
}

export default function AdminShippingPage() {
  const { user, loading: authLoading } = useAuth()
  const [isAuthorized, setIsAuthorized] = useState(false)
  const [addresses, setAddresses] = useState<ShippingAddress[]>([])
  const [allUsers, setAllUsers] = useState<ShippingAddress[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredAddresses, setFilteredAddresses] = useState<ShippingAddress[]>([])
  const [showAll, setShowAll] = useState(false)

  useEffect(() => {
    // Obtener emails de admin desde variables de entorno
    const adminEmailsEnv = process.env.NEXT_PUBLIC_ADMIN_EMAILS || "admin@semzoprive.com"
    const adminEmails = adminEmailsEnv.split(",").map((email) => email.trim())

    if (!authLoading && user) {
      console.log("[v0] Admin Panel - Checking authorization for:", user.email)
      const authorized = adminEmails.includes(user.email || "")
      setIsAuthorized(authorized)

      if (!authorized) {
        console.log("[v0] Admin Panel - Access denied for:", user.email)
      }
    } else if (!authLoading && !user) {
      console.log("[v0] Admin Panel - No user logged in")
      setIsAuthorized(false)
    }
  }, [user, authLoading])

  useEffect(() => {
    if (isAuthorized) {
      fetchShippingAddresses()
    }
  }, [isAuthorized])

  const fetchShippingAddresses = async () => {
    try {
      console.log("[v0] Admin Panel - Fetching shipping addresses...")
      const response = await fetch("/api/admin/shipping")
      console.log("[v0] Admin Panel - Response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("[v0] Admin Panel - Data received:", {
          shippingAddresses: data.shipping_addresses?.length,
          allUsers: data.all_users?.length,
          stats: data.stats,
          rawData: data,
        })

        setAddresses(data.shipping_addresses || [])
        setAllUsers(data.all_users || [])
        setStats(data.stats || null)
      } else {
        const errorData = await response.json()
        console.error("[v0] Admin Panel - Error response:", errorData)
      }
    } catch (error) {
      console.error("[v0] Admin Panel - Fetch error:", error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    const csvContent = [
      [
        "Nombre",
        "Email",
        "Membresía",
        "Dirección",
        "Ciudad",
        "Código Postal",
        "Teléfono",
        "País",
        "Fecha Actualización",
      ],
      ...filteredAddresses.map((address) => [
        address.full_name || "",
        address.email,
        address.membership_type || "free",
        address.shipping_address || "Sin dirección",
        address.shipping_city || "",
        address.shipping_postal_code || "",
        address.shipping_phone || "",
        address.shipping_country || "",
        new Date(address.updated_at).toLocaleDateString("es-ES"),
      ]),
    ]
      .map((row) => row.map((field) => `"${field}"`).join(","))
      .join("\n")

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" })
    const link = document.createElement("a")
    const url = URL.createObjectURL(blob)
    link.setAttribute("href", url)
    link.setAttribute("download", `direcciones_envio_${new Date().toISOString().split("T")[0]}.csv`)
    link.style.visibility = "hidden"
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const getMembershipBadge = (membership: string) => {
    switch (membership) {
      case "prive":
        return <Badge className="bg-slate-900 text-white">Privé</Badge>
      case "signature":
        return <Badge className="bg-rose-500 text-white">Signature</Badge>
      case "essentiel":
        return <Badge className="bg-slate-600 text-white">L'Essentiel</Badge>
      default:
        return <Badge variant="outline">Free</Badge>
    }
  }

  if (authLoading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="animate-spin h-8 w-8 text-slate-600 mx-auto mb-4" />
            <p className="text-gray-600">Verificando autenticación...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="text-center py-12">
              <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso Restringido</h3>
              <p className="text-gray-600 text-lg">Debes iniciar sesión para acceder al panel de administración.</p>
              <Button onClick={() => (window.location.href = "/auth/login")} className="bg-blue-600 hover:bg-blue-700">
                Iniciar Sesión
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!isAuthorized) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <Card className="w-full max-w-md">
            <CardContent className="text-center py-12">
              <Shield className="h-12 w-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Acceso Denegado</h3>
              <p className="text-gray-600 mb-2">No tienes permisos para acceder al panel de administración.</p>
              <p className="text-sm text-gray-500 mb-4">Usuario actual: {user.email}</p>
              <Button onClick={() => (window.location.href = "/dashboard")} className="bg-blue-600 hover:bg-blue-700">
                Volver al Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6 max-w-7xl">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="animate-spin h-8 w-8 text-slate-600 mx-auto mb-4" />
            <p className="text-gray-600">Cargando direcciones de envío...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-4xl font-bold">Direcciones de Envío</h1>
            <p className="text-gray-600 text-lg">Gestión de direcciones de entrega de usuarios</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nombre, email, ciudad..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => setShowAll(!showAll)}
              variant={showAll ? "default" : "outline"}
              className="bg-transparent"
            >
              {showAll ? "Solo con Dirección" : "Mostrar Todos"}
            </Button>
            <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2 bg-transparent">
              <Download className="h-4 w-4" />
              Exportar CSV
            </Button>
            <Button onClick={fetchShippingAddresses} className="bg-blue-600 hover:bg-blue-700">
              Actualizar
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-4 mb-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Resumen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats?.withShipping || 0}</div>
                <div className="text-sm text-gray-600">Total Direcciones</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats?.byMembership.prive || 0}</div>
                <div className="text-sm text-gray-600">Miembros Privé</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-rose-600">{stats?.byMembership.signature || 0}</div>
                <div className="text-sm text-gray-600">Miembros Signature</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-600">{stats?.byMembership.essentiel || 0}</div>
                <div className="text-sm text-gray-600">Miembros L'Essentiel</div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-600">{stats?.total || 0}</div>
                <div className="text-sm text-gray-600">Total Usuarios</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats?.withoutShipping || 0}</div>
                <div className="text-sm text-gray-600">Sin Dirección</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{stats?.byMembership.free || 0}</div>
                <div className="text-sm text-gray-600">Usuarios Free</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {filteredAddresses.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <MapPin className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {showAll ? "No hay usuarios" : "No hay direcciones de envío"}
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? "No se encontraron resultados que coincidan con tu búsqueda."
                : showAll
                  ? "No hay usuarios registrados en el sistema."
                  : "Aún no hay usuarios con direcciones de envío configuradas."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAddresses.map((address) => (
            <Card key={address.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* User Info */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold">{address.full_name || "Sin nombre"}</span>
                      {getMembershipBadge(address.membership_type)}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      {address.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      {address.shipping_phone || "Sin teléfono"}
                    </div>
                  </div>

                  {/* Shipping Address */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-900">Dirección de Envío</span>
                    </div>
                    {address.shipping_address ? (
                      <div className="text-sm space-y-1">
                        <div className="font-medium">{address.shipping_address}</div>
                        <div className="text-gray-600">
                          {address.shipping_city}, {address.shipping_postal_code}
                        </div>
                        <div className="text-gray-600">{address.shipping_country}</div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-orange-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>Sin dirección de envío configurada</span>
                      </div>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Actualizado:</span>
                      <div className="text-gray-600">
                        {new Date(address.updated_at).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                    <div className="text-sm">
                      <span className="font-medium text-gray-700">Registrado:</span>
                      <div className="text-gray-600">
                        {new Date(address.created_at).toLocaleDateString("es-ES", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
