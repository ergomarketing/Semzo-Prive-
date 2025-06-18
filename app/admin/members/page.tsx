import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Users, Mail, Phone, Calendar } from "lucide-react"
import Navbar from "../../components/navbar"

export default function MembersAdminPage() {
  const members = [
    {
      id: 1,
      name: "María García",
      email: "maria@ejemplo.com",
      phone: "+34 666 123 456",
      membership: "signature",
      joinDate: "2024-01-15",
      status: "active",
      currentBag: "Chanel Classic Flap",
      totalRentals: 8,
    },
    {
      id: 2,
      name: "Ana López",
      email: "ana@ejemplo.com",
      phone: "+34 677 234 567",
      membership: "prive",
      joinDate: "2024-02-20",
      status: "active",
      currentBag: "Louis Vuitton Neverfull",
      totalRentals: 12,
    },
    {
      id: 3,
      name: "Carmen Ruiz",
      email: "carmen@ejemplo.com",
      phone: "+34 688 345 678",
      membership: "essentiel",
      joinDate: "2024-03-10",
      status: "waiting",
      currentBag: null,
      totalRentals: 3,
    },
  ]

  const getMembershipColor = (membership: string) => {
    switch (membership) {
      case "essentiel":
        return "bg-rose-100 text-rose-800"
      case "signature":
        return "bg-purple-100 text-purple-800"
      case "prive":
        return "bg-indigo-100 text-indigo-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800"
      case "waiting":
        return "bg-yellow-100 text-yellow-800"
      case "inactive":
        return "bg-red-100 text-red-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <>
      <Navbar />
      <main className="pt-24 min-h-screen bg-slate-50">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-serif text-slate-900 mb-2">Gestión de Miembros</h1>
            <p className="text-slate-600">Administra todas las membresías y clientes</p>
          </div>

          <div className="grid gap-6">
            {members.map((member) => (
              <Card key={member.id} className="border-0 shadow-lg">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className="p-3 bg-indigo-100 rounded-full">
                        <Users className="h-6 w-6 text-indigo-600" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-slate-900">{member.name}</h3>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-slate-600">
                          <div className="flex items-center">
                            <Mail className="h-4 w-4 mr-1" />
                            {member.email}
                          </div>
                          <div className="flex items-center">
                            <Phone className="h-4 w-4 mr-1" />
                            {member.phone}
                          </div>
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Desde {new Date(member.joinDate).toLocaleDateString()}
                          </div>
                        </div>

                        <div className="flex items-center space-x-3 mt-3">
                          <Badge className={getMembershipColor(member.membership)}>
                            {member.membership.toUpperCase()}
                          </Badge>
                          <Badge className={getStatusColor(member.status)}>
                            {member.status === "active"
                              ? "Activo"
                              : member.status === "waiting"
                                ? "En espera"
                                : "Inactivo"}
                          </Badge>
                        </div>

                        {member.currentBag && (
                          <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                            <p className="text-sm font-medium text-blue-900">Bolso actual:</p>
                            <p className="text-sm text-blue-700">{member.currentBag}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm text-slate-600">Total alquileres</p>
                      <p className="text-2xl font-bold text-slate-900">{member.totalRentals}</p>
                      <div className="flex space-x-2 mt-4">
                        <Button size="sm" variant="outline">
                          Ver historial
                        </Button>
                        <Button size="sm">Contactar</Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </>
  )
}
