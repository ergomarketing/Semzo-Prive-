"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Loader2,
  MapPin,
  Search,
  Download,
  User,
  Phone,
  Mail,
  AlertCircle,
  CheckCircle2,
  FileText,
} from "lucide-react"

interface ShippingAddress {
  id: string
  email: string
  full_name: string
  phone: string | null
  membership_type: string
  shipping_first_name: string | null
  shipping_last_name_1: string | null
  shipping_last_name_2: string | null
  shipping_document_type: string | null
  shipping_document_number: string | null
  shipping_via_type: string | null
  shipping_via_name: string | null
  shipping_number: string | null
  shipping_portal: string | null
  shipping_floor: string | null
  shipping_door: string | null
  shipping_address: string | null
  shipping_city: string | null
  shipping_postal_code: string | null
  shipping_province: string | null
  shipping_phone: string | null
  shipping_country: string | null
  correos_ready: boolean
  correos_missing_fields: string[]
  created_at: string
  updated_at: string
}

interface AdminStats {
  total: number
  withShipping: number
  withoutShipping: number
  correosReady: number
  correosIncomplete: number
  byMembership: {
    prive: number
    signature: number
    essentiel: number
    petite: number
    free: number
  }
}

const FIELD_LABELS: Record<string, string> = {
  shipping_first_name: "Nombre",
  shipping_last_name_1: "Primer apellido",
  shipping_document_type: "Tipo documento",
  shipping_document_number: "Nº documento",
  shipping_via_type: "Tipo de vía",
  shipping_via_name: "Nombre de la vía",
  shipping_door: "Puerta",
  shipping_postal_code: "Código postal",
  shipping_city: "Localidad",
  shipping_province: "Provincia",
  shipping_phone: "Móvil",
}

export default function AdminShippingPage() {
  const [addresses, setAddresses] = useState<ShippingAddress[]>([])
  const [allUsers, setAllUsers] = useState<ShippingAddress[]>([])
  const [stats, setStats] = useState<AdminStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filteredAddresses, setFilteredAddresses] = useState<ShippingAddress[]>([])
  const [showAll, setShowAll] = useState(false)
  const [filterCorreosReady, setFilterCorreosReady] = useState<"all" | "ready" | "incomplete">("all")

  useEffect(() => {
    fetchShippingAddresses()
  }, [])

  useEffect(() => {
    let dataToFilter = showAll ? allUsers : addresses

    if (filterCorreosReady === "ready") {
      dataToFilter = dataToFilter.filter((a) => a.correos_ready)
    } else if (filterCorreosReady === "incomplete") {
      dataToFilter = dataToFilter.filter((a) => !a.correos_ready)
    }

    const filtered = dataToFilter.filter(
      (address) =>
        address.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        address.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        address.shipping_city?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        address.shipping_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        address.shipping_via_name?.toLowerCase().includes(searchTerm.toLowerCase()),
    )
    setFilteredAddresses(filtered)
  }, [searchTerm, addresses, allUsers, showAll, filterCorreosReady])

  const fetchShippingAddresses = async () => {
    try {
      const response = await fetch("/api/admin/shipping")
      if (response.ok) {
        const data = await response.json()
        setAddresses(data.shipping_addresses || [])
        setAllUsers(data.all_users || [])
        setStats(data.stats || null)
      }
    } catch (error) {
      console.error("Error fetching shipping addresses:", error)
    } finally {
      setLoading(false)
    }
  }

  const buildFullName = (a: ShippingAddress) => {
    const parts = [a.shipping_first_name, a.shipping_last_name_1, a.shipping_last_name_2].filter(Boolean)
    return parts.length > 0 ? parts.join(" ") : a.full_name || "Sin nombre"
  }

  const buildFullAddress = (a: ShippingAddress) => {
    if (!a.shipping_via_name) return a.shipping_address || null
    const parts = [
      a.shipping_via_type,
      a.shipping_via_name,
      a.shipping_number ? `nº ${a.shipping_number}` : null,
      a.shipping_portal ? `Portal ${a.shipping_portal}` : null,
      a.shipping_floor ? `Piso ${a.shipping_floor}` : null,
      a.shipping_door ? `Pta ${a.shipping_door}` : null,
    ].filter(Boolean)
    return parts.join(", ")
  }

  const exportToCSV = () => {
    const csvContent = [
      [
        "Nombre",
        "Apellidos",
        "Email",
        "Membresía",
        "Tipo Doc",
        "Nº Doc",
        "Tipo Vía",
        "Vía",
        "Número",
        "Portal",
        "Piso",
        "Puerta",
        "CP",
        "Localidad",
        "Provincia",
        "Teléfono",
        "Listo Correos",
      ],
      ...filteredAddresses.map((a) => [
        a.shipping_first_name || "",
        `${a.shipping_last_name_1 || ""} ${a.shipping_last_name_2 || ""}`.trim(),
        a.email,
        a.membership_type || "free",
        a.shipping_document_type || "",
        a.shipping_document_number || "",
        a.shipping_via_type || "",
        a.shipping_via_name || "",
        a.shipping_number || "",
        a.shipping_portal || "",
        a.shipping_floor || "",
        a.shipping_door || "",
        a.shipping_postal_code || "",
        a.shipping_city || "",
        a.shipping_province || "",
        a.shipping_phone || a.phone || "",
        a.correos_ready ? "Sí" : "No",
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
        return <Badge className="bg-slate-600 text-white">L&apos;Essentiel</Badge>
      case "petite":
        return <Badge className="bg-amber-500 text-white">Petite</Badge>
      default:
        return <Badge variant="outline">Free</Badge>
    }
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
            <p className="text-gray-600 text-lg">Gestión de datos de entrega para Correos</p>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por nombre, email, ciudad, vía..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-3 flex-wrap">
            <Button
              onClick={() => setFilterCorreosReady(filterCorreosReady === "ready" ? "all" : "ready")}
              variant={filterCorreosReady === "ready" ? "default" : "outline"}
              className="bg-transparent"
              size="sm"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Listos Correos
            </Button>
            <Button
              onClick={() => setFilterCorreosReady(filterCorreosReady === "incomplete" ? "all" : "incomplete")}
              variant={filterCorreosReady === "incomplete" ? "default" : "outline"}
              className="bg-transparent"
              size="sm"
            >
              <AlertCircle className="h-4 w-4 mr-1" />
              Incompletos
            </Button>
            <Button onClick={() => setShowAll(!showAll)} variant={showAll ? "default" : "outline"} className="bg-transparent" size="sm">
              {showAll ? "Solo con Dirección" : "Mostrar Todos"}
            </Button>
            <Button onClick={exportToCSV} variant="outline" className="flex items-center gap-2 bg-transparent" size="sm">
              <Download className="h-4 w-4" />
              CSV
            </Button>
            <Button onClick={fetchShippingAddresses} className="bg-blue-600 hover:bg-blue-700" size="sm">
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{stats?.withShipping || 0}</div>
                <div className="text-sm text-gray-600">Con Dirección</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{stats?.correosReady || 0}</div>
                <div className="text-sm text-gray-600">Listos Correos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{stats?.correosIncomplete || 0}</div>
                <div className="text-sm text-gray-600">Datos Incompletos</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{stats?.withoutShipping || 0}</div>
                <div className="text-sm text-gray-600">Sin Dirección</div>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-xl font-bold text-slate-900">{stats?.byMembership.prive || 0}</div>
                <div className="text-xs text-gray-600">Privé</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-rose-600">{stats?.byMembership.signature || 0}</div>
                <div className="text-xs text-gray-600">Signature</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-slate-600">{stats?.byMembership.essentiel || 0}</div>
                <div className="text-xs text-gray-600">L&apos;Essentiel</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-amber-600">{stats?.byMembership.petite || 0}</div>
                <div className="text-xs text-gray-600">Petite</div>
              </div>
              <div className="text-center">
                <div className="text-xl font-bold text-gray-600">{stats?.byMembership.free || 0}</div>
                <div className="text-xs text-gray-600">Free</div>
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
              {showAll ? "No hay usuarios" : "No hay direcciones"}
            </h3>
            <p className="text-gray-600">
              {searchTerm
                ? "No se encontraron resultados que coincidan con tu búsqueda."
                : "No hay usuarios que cumplan los filtros aplicados."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredAddresses.map((address) => (
            <Card
              key={address.id}
              className={`hover:shadow-lg transition-shadow ${
                !address.correos_ready && address.shipping_via_name ? "border-orange-300" : ""
              }`}
            >
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Datos personales */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <User className="h-4 w-4 text-gray-500" />
                      <span className="font-semibold">{buildFullName(address)}</span>
                      {getMembershipBadge(address.membership_type)}
                      {address.correos_ready ? (
                        <Badge className="bg-green-100 text-green-800 border border-green-300">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Correos OK
                        </Badge>
                      ) : (
                        <Badge className="bg-orange-100 text-orange-800 border border-orange-300">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Incompleto
                        </Badge>
                      )}
                    </div>
                    {address.shipping_document_number && (
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <FileText className="h-4 w-4" />
                        {address.shipping_document_type}: {address.shipping_document_number}
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Mail className="h-4 w-4" />
                      {address.email}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Phone className="h-4 w-4" />
                      {address.shipping_phone || address.phone || "Sin teléfono"}
                    </div>
                  </div>

                  {/* Dirección */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 mb-2">
                      <MapPin className="h-4 w-4 text-gray-500" />
                      <span className="font-medium text-gray-900">Dirección de Envío</span>
                    </div>
                    {buildFullAddress(address) ? (
                      <div className="text-sm space-y-1">
                        <div className="font-medium">{buildFullAddress(address)}</div>
                        <div className="text-gray-600">
                          {address.shipping_postal_code} {address.shipping_city}
                          {address.shipping_province ? `, ${address.shipping_province}` : ""}
                        </div>
                        <div className="text-gray-500 text-xs">{address.shipping_country || "España"}</div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-sm text-orange-600">
                        <AlertCircle className="h-4 w-4" />
                        <span>Sin dirección de envío configurada</span>
                      </div>
                    )}
                  </div>

                  {/* Estado Correos / metadata */}
                  <div className="space-y-2">
                    {!address.correos_ready && address.correos_missing_fields.length > 0 && (
                      <div className="bg-orange-50 border border-orange-200 rounded p-3">
                        <div className="text-xs font-semibold text-orange-900 mb-1">Faltan campos para Correos:</div>
                        <ul className="text-xs text-orange-800 space-y-0.5 list-disc list-inside">
                          {address.correos_missing_fields.map((f) => (
                            <li key={f}>{FIELD_LABELS[f] || f}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <div className="text-xs text-gray-500">
                      Actualizado: {new Date(address.updated_at).toLocaleDateString("es-ES")}
                    </div>
                    <div className="text-xs text-gray-500">
                      Registrado: {new Date(address.created_at).toLocaleDateString("es-ES")}
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
