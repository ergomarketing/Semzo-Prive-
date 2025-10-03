"use client"

import { Card, CardContent } from "@/components/ui/card"
import Link from "next/link"
import {
  Package,
  Users,
  Mail,
  BarChart3,
  Settings,
  Zap,
  Database,
  TrendingUp,
  ShoppingBag,
  Calendar,
  MessageSquare,
} from "lucide-react"

export default function AdminDashboard() {
  const mainSections = [
    {
      title: "Operaciones",
      description: "Gestión diaria del negocio",
      cards: [
        {
          name: "Inventario",
          href: "/admin/inventory",
          icon: Package,
          description: "Gestión de bolsos y disponibilidad",
          color: "bg-blue-500",
        },
        {
          name: "Reservas",
          href: "/admin/reservations",
          icon: Calendar,
          description: "Calendario y gestión de alquileres",
          color: "bg-purple-500",
        },
        {
          name: "Clientes",
          href: "/admin/customers",
          icon: Users,
          description: "Base de datos de clientes",
          color: "bg-green-500",
        },
        {
          name: "Pedidos",
          href: "/admin/orders",
          icon: ShoppingBag,
          description: "Gestión de pedidos y envíos",
          color: "bg-orange-500",
        },
      ],
    },
    {
      title: "Comunicación",
      description: "Gestión de emails y mensajes",
      cards: [
        {
          name: "Email Marketing",
          href: "/admin/emails",
          icon: Mail,
          description: "Campañas y automatizaciones",
          color: "bg-pink-500",
        },
        {
          name: "Chat en Vivo",
          href: "/admin/chat",
          icon: MessageSquare,
          description: "Soporte al cliente",
          color: "bg-indigo-500",
        },
      ],
    },
    {
      title: "Analytics & Integraciones",
      description: "Métricas y conexiones externas",
      cards: [
        {
          name: "Dashboard Analytics",
          href: "/admin/analytics",
          icon: BarChart3,
          description: "Métricas de negocio",
          color: "bg-cyan-500",
        },
        {
          name: "Integraciones",
          href: "/admin/integrations",
          icon: Zap,
          description: "Zoho, n8n y automatizaciones",
          color: "bg-yellow-500",
        },
        {
          name: "Base de Datos",
          href: "/admin/database",
          icon: Database,
          description: "Gestión de datos",
          color: "bg-slate-500",
        },
      ],
    },
  ]

  const quickStats = [
    { label: "Bolsos Disponibles", value: "12", trend: "+2", icon: Package, color: "text-blue-600" },
    { label: "Reservas Activas", value: "8", trend: "+3", icon: Calendar, color: "text-purple-600" },
    { label: "Clientes Totales", value: "45", trend: "+5", icon: Users, color: "text-green-600" },
    { label: "Ingresos del Mes", value: "€2,450", trend: "+12%", icon: TrendingUp, color: "text-orange-600" },
  ]

  return (
    <div className="container mx-auto p-8 max-w-7xl">
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-serif font-bold text-slate-900 mb-3">Dashboard Principal</h1>
        <p className="text-slate-600 text-lg">Bienvenido al centro de control de Semzo Privé</p>
      </div>

      {/* Quick Stats - Mejorado espaciado */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
        {quickStats.map((stat, index) => (
          <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-2">{stat.label}</p>
                  <p className="text-3xl font-bold text-slate-900">{stat.value}</p>
                  <p className="text-sm text-green-600 mt-2">{stat.trend}</p>
                </div>
                <stat.icon className={`h-14 w-14 ${stat.color}`} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Sections - Mejorado espaciado entre secciones */}
      <div className="space-y-12">
        {mainSections.map((section, sectionIndex) => (
          <div key={sectionIndex}>
            <div className="mb-6">
              <h2 className="text-2xl font-serif font-bold text-slate-900 mb-2">{section.title}</h2>
              <p className="text-slate-600 text-base">{section.description}</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {section.cards.map((card, cardIndex) => (
                <Link key={cardIndex} href={card.href}>
                  <Card className="h-full border-0 shadow-lg hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer group">
                    <CardContent className="p-8">
                      <div
                        className={`${card.color} w-14 h-14 rounded-lg flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}
                      >
                        <card.icon className="h-7 w-7 text-white" />
                      </div>
                      <h3 className="font-semibold text-lg mb-3 text-slate-900">{card.name}</h3>
                      <p className="text-sm text-slate-600 leading-relaxed">{card.description}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions - Mejorado espaciado */}
      <Card className="mt-12 border-0 shadow-lg bg-gradient-to-r from-indigo-500 to-purple-600">
        <CardContent className="p-8">
          <div className="flex items-center justify-between text-white">
            <div>
              <h3 className="text-xl font-semibold mb-2">¿Necesitas ayuda?</h3>
              <p className="text-indigo-100">Accede a la documentación o contacta con soporte técnico</p>
            </div>
            <Link href="/admin/settings">
              <button className="bg-white text-indigo-600 px-8 py-4 rounded-lg font-semibold hover:bg-indigo-50 transition-colors">
                <Settings className="inline h-5 w-5 mr-2" />
                Configuración
              </button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
