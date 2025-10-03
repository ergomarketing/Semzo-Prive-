"use client"

import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Zap, Mail, Database, Workflow, CheckCircle, XCircle, Settings } from "lucide-react"

export default function IntegrationsPage() {
  const integrations = [
    {
      name: "Zoho Inventory",
      description: "Gestión automática de inventario y pedidos",
      icon: Database,
      status: "disconnected",
      color: "bg-red-500",
    },
    {
      name: "Zoho Mail",
      description: "Sistema de email marketing y automatizaciones",
      icon: Mail,
      status: "disconnected",
      color: "bg-blue-500",
    },
    {
      name: "n8n Workflows",
      description: "Automatizaciones personalizadas",
      icon: Workflow,
      status: "disconnected",
      color: "bg-purple-500",
    },
    {
      name: "Stripe",
      description: "Procesamiento de pagos",
      icon: Zap,
      status: "connected",
      color: "bg-green-500",
    },
    {
      name: "Supabase",
      description: "Base de datos y autenticación",
      icon: Database,
      status: "connected",
      color: "bg-green-500",
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Integraciones</h1>
          <p className="text-slate-600">Conecta y automatiza tu negocio</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {integrations.map((integration, index) => (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className={`${integration.color} w-12 h-12 rounded-lg flex items-center justify-center`}>
                    <integration.icon className="h-6 w-6 text-white" />
                  </div>
                  <Badge
                    className={
                      integration.status === "connected" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                    }
                  >
                    {integration.status === "connected" ? (
                      <>
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Conectado
                      </>
                    ) : (
                      <>
                        <XCircle className="h-3 w-3 mr-1" />
                        Desconectado
                      </>
                    )}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <h3 className="font-semibold text-lg mb-2 text-slate-900">{integration.name}</h3>
                <p className="text-sm text-slate-600 mb-4">{integration.description}</p>
                <Button className="w-full" variant={integration.status === "connected" ? "outline" : "default"}>
                  <Settings className="h-4 w-4 mr-2" />
                  {integration.status === "connected" ? "Configurar" : "Conectar"}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* n8n Workflows Section */}
        <Card className="mt-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-8">
            <div className="flex items-start gap-6">
              <div className="bg-purple-500 w-16 h-16 rounded-lg flex items-center justify-center flex-shrink-0">
                <Workflow className="h-8 w-8 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-semibold text-slate-900 mb-2">Automatizaciones con n8n</h3>
                <p className="text-slate-600 mb-4">
                  Crea flujos de trabajo personalizados para automatizar tareas repetitivas:
                </p>
                <ul className="space-y-2 text-slate-700 mb-6">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Notificaciones automáticas de reservas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Sincronización con Zoho Inventory
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Emails de seguimiento personalizados
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    Recordatorios de devolución
                  </li>
                </ul>
                <Button className="bg-purple-600 hover:bg-purple-700">Configurar n8n</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
