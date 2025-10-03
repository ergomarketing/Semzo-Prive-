"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Database, Users, Package, Calendar, Mail } from "lucide-react"

export default function DatabasePage() {
  const tables = [
    { name: "profiles", icon: Users, records: 45, description: "Perfiles de usuarios" },
    { name: "bags", icon: Package, records: 28, description: "Inventario de bolsos" },
    { name: "reservations", icon: Calendar, records: 156, description: "Historial de reservas" },
    { name: "email_logs", icon: Mail, records: 342, description: "Registro de emails" },
  ]

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Base de Datos</h1>
          <p className="text-slate-600">Gestión y mantenimiento de datos</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {tables.map((table, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="bg-blue-100 p-3 rounded-lg">
                    <table.icon className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{table.name}</CardTitle>
                    <p className="text-sm text-slate-600">{table.description}</p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-600">Registros totales</p>
                    <p className="text-2xl font-bold text-slate-900">{table.records}</p>
                  </div>
                  <Button variant="outline" size="sm">
                    Ver Tabla
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card className="bg-gradient-to-r from-slate-50 to-slate-100 border-slate-200">
          <CardContent className="p-8 text-center">
            <Database className="h-16 w-16 text-slate-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Gestión Avanzada</h3>
            <p className="text-slate-600 mb-4">
              Accede a Supabase para gestión avanzada de base de datos, backups y configuración
            </p>
            <Button variant="outline">Abrir Supabase Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
