"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import {
  Settings,
  Database,
  Mail,
  CreditCard,
  Users,
  BarChart3,
  MessageSquare,
  Shield,
  CheckCircle,
  AlertTriangle,
  Wrench,
  FileText,
  HelpCircle,
} from "lucide-react"

export default function AdminDashboard() {
  const adminSections = [
    {
      title: "Configuración del Sistema",
      description: "Configurar y verificar servicios principales",
      icon: Settings,
      items: [
        {
          name: "Diagnóstico de Variables",
          href: "/admin/env-debug",
          icon: Wrench,
          description: "Verificar variables de entorno",
          status: "active",
        },
        {
          name: "Configuración Supabase",
          href: "/admin/supabase-diagnostics",
          icon: Database,
          description: "Verificar conexión a base de datos",
          status: "active",
        },
        {
          name: "Configuración Stripe",
          href: "/admin/stripe-diagnostics",
          icon: CreditCard,
          description: "Verificar integración de pagos",
          status: "active",
        },
        {
          name: "Configuración Email",
          href: "/admin/email-diagnostico",
          icon: Mail,
          description: "Verificar servicio de emails",
          status: "active",
        },
      ],
    },
    {
      title: "Gestión de Usuarios",
      description: "Administrar usuarios y membresías",
      icon: Users,
      items: [
        {
          name: "Lista de Miembros",
          href: "/admin/members",
          icon: Users,
          description: "Ver y gestionar usuarios registrados",
          status: "active",
        },
        {
          name: "Confirmar Usuarios",
          href: "/admin/confirm-users",
          icon: CheckCircle,
          description: "Confirmar emails de usuarios manualmente",
          status: "active",
        },
        {
          name: "Configurar Base de Datos",
          href: "/admin/setup-database",
          icon: Database,
          description: "Crear tablas y configurar BD",
          status: "active",
        },
        {
          name: "Limpiar Usuarios Huérfanos",
          href: "/auth/cleanup",
          icon: Shield,
          description: "Limpiar usuarios sin perfil",
          status: "active",
        },
      ],
    },
    {
      title: "Sistema de Emails",
      description: "Gestionar y probar emails",
      icon: Mail,
      items: [
        {
          name: "Enviar Email de Prueba",
          href: "/admin/email-send-test",
          icon: Mail,
          description: "Probar envío de emails",
          status: "active",
        },
        {
          name: "Logs de Emails",
          href: "/admin/email-logs",
          icon: FileText,
          description: "Ver historial de emails enviados",
          status: "active",
        },
        {
          name: "Dashboard de Emails",
          href: "/admin/emails",
          icon: BarChart3,
          description: "Estadísticas de emails",
          status: "active",
        },
      ],
    },
    {
      title: "Herramientas de Desarrollo",
      description: "Herramientas para desarrollo y debug",
      icon: Wrench,
      items: [
        {
          name: "Guía de Configuración",
          href: "/admin/setup-guide",
          icon: HelpCircle,
          description: "Guía paso a paso de configuración",
          status: "active",
        },
        {
          name: "Modo Demo",
          href: "/admin/demo-mode-guide",
          icon: AlertTriangle,
          description: "Activar modo demostración",
          status: "warning",
        },
        {
          name: "Chat de Soporte",
          href: "/admin/chat",
          icon: MessageSquare,
          description: "Chat en vivo con soporte",
          status: "active",
        },
      ],
    },
    {
      title: "Analytics y Reportes",
      description: "Métricas y análisis del sistema",
      icon: BarChart3,
      items: [
        {
          name: "Analytics",
          href: "/admin/analytics",
          icon: BarChart3,
          description: "Métricas de uso y rendimiento",
          status: "active",
        },
        {
          name: "Inventario",
          href: "/admin/inventory",
          icon: Database,
          description: "Gestión de inventario de productos",
          status: "active",
        },
        {
          name: "Página de Éxito",
          href: "/admin/success-celebration",
          icon: CheckCircle,
          description: "Celebrar configuración exitosa",
          status: "success",
        },
      ],
    },
  ]

  const getStatusColor = (status: string) => {
    switch (status) {
      case "success":
        return "bg-green-500"
      case "warning":
        return "bg-yellow-500"
      case "error":
        return "bg-red-500"
      default:
        return "bg-blue-500"
    }
  }

  const getStatusText = (status: string) => {
    switch (status) {
      case "success":
        return "Listo"
      case "warning":
        return "Atención"
      case "error":
        return "Error"
      default:
        return "Activo"
    }
  }

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">Panel de Administración</h1>
        <p className="text-gray-600 text-lg">Centro de control para Semzo Privé</p>
      </div>

      <div className="grid gap-8">
        {adminSections.map((section, sectionIndex) => (
          <Card key={sectionIndex} className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100">
              <CardTitle className="flex items-center gap-3">
                <section.icon className="h-6 w-6 text-blue-600" />
                {section.title}
              </CardTitle>
              <CardDescription className="text-base">{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {section.items.map((item, itemIndex) => (
                  <Link key={itemIndex} href={item.href}>
                    <Card className="h-full transition-all duration-200 hover:shadow-lg hover:scale-105 cursor-pointer border-2 hover:border-blue-200">
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between mb-3">
                          <item.icon className="h-8 w-8 text-blue-600 flex-shrink-0" />
                          <Badge className={`${getStatusColor(item.status)} text-white text-xs`}>
                            {getStatusText(item.status)}
                          </Badge>
                        </div>
                        <h3 className="font-semibold text-lg mb-2 line-clamp-2">{item.name}</h3>
                        <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-3 mb-3">
          <HelpCircle className="h-6 w-6 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-900">¿Necesitas ayuda?</h3>
        </div>
        <p className="text-blue-700 mb-4">
          Si tienes problemas con la configuración, comienza por el diagnóstico de variables de entorno y sigue la guía
          de configuración paso a paso.
        </p>
        <div className="flex gap-3">
          <Button asChild variant="outline" className="border-blue-300 text-blue-700 hover:bg-blue-100 bg-transparent">
            <Link href="/admin/env-debug">Diagnóstico Rápido</Link>
          </Button>
          <Button asChild className="bg-blue-600 hover:bg-blue-700">
            <Link href="/admin/setup-guide">Guía Completa</Link>
          </Button>
        </div>
      </div>
    </div>
  )
}
