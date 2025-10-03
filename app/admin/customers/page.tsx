"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Users, Mail, Phone, MapPin, Search, Download } from "lucide-react"
import { createClient } from "@supabase/supabase-js"

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface Customer {
  id: string
  name: string
  email: string
  phone: string
  membership: string
  joinDate: string
  status: string
  shippingAddress?: string
  shippingCity?: string
  shippingPostalCode?: string
  shippingCountry?: string
}

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterMembership, setFilterMembership] = useState<string>("all")

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      setLoading(true)
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      const formattedCustomers: Customer[] =
        profiles?.map((profile) => ({
          id: profile.id,
          name: profile.full_name || `${profile.first_name || ""} ${profile.last_name || ""}`.trim() || "Usuario",
          email: profile.email,
          phone: profile.shipping_phone || "No disponible",
          membership: profile.membership_type || "free",
          joinDate: profile.created_at,
          status: profile.membership_status || "active",
          shippingAddress: profile.shipping_address,
          shippingCity: profile.shipping_city,
          shippingPostalCode: profile.shipping_postal_code,
          shippingCountry: profile.shipping_country,
        })) || []

      setCustomers(formattedCustomers)
    } catch (error) {
      console.error("Error fetching customers:", error)
    } finally {
      setLoading(false)
    }
  }

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesMembership = filterMembership === "all" || customer.membership === filterMembership
    return matchesSearch && matchesMembership
  })

  const getMembershipColor = (membership: string) => {
    const colors = {
      essentiel: "bg-rose-100 text-rose-800",
      signature: "bg-purple-100 text-purple-800",
      prive: "bg-indigo-100 text-indigo-800",
      free: "bg-gray-100 text-gray-800",
    }
    return colors[membership as keyof typeof colors] || colors.free
  }

  const exportToCSV = () => {
    const headers = ["Nombre", "Email", "Teléfono", "Membresía", "Fecha de Registro", "Dirección"]
    const rows = filteredCustomers.map((c) => [
      c.name,
      c.email,
      c.phone,
      c.membership,
      new Date(c.joinDate).toLocaleDateString(),
      `${c.shippingAddress || ""} ${c.shippingCity || ""} ${c.shippingPostalCode || ""}`,
    ])

    const csvContent = [headers, ...rows].map((row) => row.join(",")).join("\n")
    const blob = new Blob([csvContent], { type: "text/csv" })
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `clientes-${new Date().toISOString().split("T")[0]}.csv`
    a.click()
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Gestión de Clientes</h1>
          <p className="text-slate-600">Base de datos completa de clientes</p>
        </div>

        {/* Filters and Actions */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar por nombre o email..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              <div className="flex gap-2">
                <select
                  value={filterMembership}
                  onChange={(e) => setFilterMembership(e.target.value)}
                  className="px-4 py-2 border rounded-lg bg-white"
                >
                  <option value="all">Todas las membresías</option>
                  <option value="prive">Privé</option>
                  <option value="signature">Signature</option>
                  <option value="essentiel">L'Essentiel</option>
                  <option value="free">Free</option>
                </select>

                <Button onClick={exportToCSV} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar CSV
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Customer List */}
        <div className="grid gap-4">
          {loading ? (
            <Card>
              <CardContent className="p-12 text-center">
                <p className="text-slate-600">Cargando clientes...</p>
              </CardContent>
            </Card>
          ) : filteredCustomers.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <Users className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <p className="text-slate-600">No se encontraron clientes</p>
              </CardContent>
            </Card>
          ) : (
            filteredCustomers.map((customer) => (
              <Card key={customer.id} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-4 flex-1">
                      <div className="p-3 bg-indigo-100 rounded-full">
                        <Users className="h-6 w-6 text-indigo-600" />
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-semibold text-slate-900">{customer.name}</h3>
                          <Badge className={getMembershipColor(customer.membership)}>
                            {customer.membership.toUpperCase()}
                          </Badge>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {customer.email}
                          </div>
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {customer.phone}
                          </div>
                        </div>

                        {customer.shippingAddress && (
                          <div className="mt-3 p-3 bg-green-50 rounded-lg">
                            <p className="text-sm font-medium text-green-900 flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              Dirección de envío
                            </p>
                            <p className="text-sm text-green-700 mt-1">
                              {customer.shippingAddress}, {customer.shippingCity} {customer.shippingPostalCode},{" "}
                              {customer.shippingCountry}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-slate-600">Miembro desde</p>
                      <p className="text-sm font-medium text-slate-900">
                        {new Date(customer.joinDate).toLocaleDateString()}
                      </p>
                      <Button size="sm" className="mt-3">
                        Ver Perfil
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
