"use client"

import { useState } from "react"
import { Calendar, CalendarDays, Clock, Package, PieChart, Users, Shield } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

import VisualInventoryDashboard from "@/app/components/visual-inventory-dashboard"
import ReservationStatusTimeline from "@/app/components/reservation-status-timeline"
import CompleteReservationForm from "@/app/components/complete-reservation-form"
import EnhancedReservationCalendar from "@/app/components/enhanced-reservation-calendar"

// Mock data para las reservas
const mockReservation = {
  id: "RSV-2024-001",
  bagId: "BAG-001",
  bagName: "Classic Flap Bag",
  bagBrand: "Chanel",
  bagImages: ["/images/chanel-signature.jpeg"],
  customerName: "María García",
  customerEmail: "maria@example.com",
  customerPhone: "+34 600 123 456",
  startDate: new Date(2024, 2, 15),
  endDate: new Date(2024, 3, 15),
  totalDays: 30,
  totalAmount: "€450",
  membershipType: "signature" as const,
  status: "active" as const,
  createdAt: new Date(2024, 2, 10),
  updatedAt: new Date(2024, 2, 14),
}

const data = [
  { name: "Jan", uv: 4000, pv: 2400, amt: 2400 },
  { name: "Feb", uv: 3000, pv: 1398, amt: 2210 },
  { name: "Mar", uv: 2000, pv: 9800, amt: 2290 },
  { name: "Apr", uv: 2780, pv: 3908, amt: 2000 },
  { name: "May", uv: 1890, pv: 4800, amt: 2181 },
  { name: "Jun", uv: 2390, pv: 3800, amt: 2500 },
  { name: "Jul", uv: 3490, pv: 4300, amt: 2100 },
]

const transactions = [
  {
    id: "728ed52f",
    date: "2023-03-02",
    description: "Subscription renewal - Basic",
    amount: "9.00",
    status: "success",
  },
  {
    id: "728ed52f",
    date: "2023-03-02",
    description: "Subscription renewal - Basic",
    amount: "9.00",
    status: "success",
  },
  {
    id: "728ed52f",
    date: "2023-03-02",
    description: "Subscription renewal - Basic",
    amount: "9.00",
    status: "success",
  },
  {
    id: "728ed52f",
    date: "2023-03-02",
    description: "Subscription renewal - Basic",
    amount: "9.00",
    status: "success",
  },
  {
    id: "728ed52f",
    date: "2023-03-02",
    description: "Subscription renewal - Basic",
    amount: "9.00",
    status: "success",
  },
]

export default function AdminDashboardPage() {
  const [activeView, setActiveView] = useState<"overview" | "inventory" | "reservations" | "calendar" | "timeline">(
    "overview",
  )

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Barra lateral de navegación */}
      <div className="w-64 bg-gray-50 border-r border-gray-200 flex-shrink-0">
        <div className="p-4">
          <h1 className="text-2xl font-semibold">Panel de Administración</h1>
        </div>
        <Separator />
        <nav className="mt-6 px-2 space-y-1">
          <Button
            onClick={() => setActiveView("overview")}
            className="w-full justify-start bg-white text-slate-700 hover:bg-slate-50"
          >
            <PieChart className="h-4 w-4 mr-3" />
            Resumen General
          </Button>

          <Button
            onClick={() => setActiveView("inventory")}
            className="w-full justify-start bg-white text-slate-700 hover:bg-slate-50"
          >
            <Package className="h-4 w-4 mr-3" />
            Gestión de Inventario
          </Button>

          <Button
            onClick={() => setActiveView("reservations")}
            className="w-full justify-start bg-white text-slate-700 hover:bg-slate-50"
          >
            <Calendar className="h-4 w-4 mr-3" />
            Reservas Activas
          </Button>

          <Button
            onClick={() => setActiveView("timeline")}
            className="w-full justify-start bg-white text-slate-700 hover:bg-slate-50"
          >
            <Clock className="h-4 w-4 mr-3" />
            Estado de Reservas
          </Button>

          <Button
            onClick={() => setActiveView("calendar")}
            className="w-full justify-start bg-white text-slate-700 hover:bg-slate-50"
          >
            <CalendarDays className="h-4 w-4 mr-3" />
            Calendario
          </Button>

          <Button
            onClick={() => (window.location.href = "/admin/user-diagnostics")}
            className="w-full justify-start bg-white text-slate-700 hover:bg-slate-50"
          >
            <Shield className="h-4 w-4 mr-3" />
            Diagnóstico de Usuarios
          </Button>
        </nav>
      </div>

      {/* Contenido principal */}
      <div className="flex-1 p-4">
        {activeView === "overview" && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setActiveView("inventory")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Bolsos en inventario
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">45</div>
                  <p className="text-sm text-gray-500">12 disponibles, 33 alquilados</p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setActiveView("reservations")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Clientes activos
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">+23</div>
                  <p className="text-sm text-gray-500">Comparado con el mes pasado</p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setActiveView("timeline")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-4 w-4" />
                    Tasa de utilización
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">78%</div>
                  <p className="text-sm text-gray-500">Promedio de ocupación</p>
                </CardContent>
              </Card>

              <Card
                className="cursor-pointer hover:shadow-lg transition-shadow"
                onClick={() => setActiveView("calendar")}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-4 w-4" />
                    Reservas pendientes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">8</div>
                  <p className="text-sm text-gray-500">Para esta semana</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
              <Card className="col-span-2">
                <CardHeader>
                  <CardTitle>Ingresos mensuales</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart
                      data={data}
                      margin={{
                        top: 10,
                        right: 30,
                        left: 0,
                        bottom: 0,
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="pv" stroke="#8884d8" fill="#8884d8" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Transacciones recientes</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[100px]">Fecha</TableHead>
                        <TableHead>Descripción</TableHead>
                        <TableHead className="text-right">Monto</TableHead>
                        <TableHead className="text-center">Estado</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {transactions.map((transaction) => (
                        <TableRow key={transaction.id}>
                          <TableCell className="font-medium">{transaction.date}</TableCell>
                          <TableCell>{transaction.description}</TableCell>
                          <TableCell className="text-right">€{transaction.amount}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant={transaction.status}>{transaction.status}</Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </>
        )}

        {activeView === "inventory" && <VisualInventoryDashboard />}

        {activeView === "reservations" && (
          <CompleteReservationForm onSubmit={(data) => console.log("Reserva enviada:", data)} />
        )}

        {activeView === "timeline" && (
          <ReservationStatusTimeline
            reservation={mockReservation}
            onExtendReservation={() => alert("Extender reserva")}
            onRequestReturn={() => alert("Solicitar devolución")}
            onCancelReservation={() => alert("Cancelar reserva")}
            onRateExperience={(rating, review) => alert(`Calificación: ${rating} estrellas`)}
            onContactSupport={() => alert("Contactar soporte")}
          />
        )}

        {activeView === "calendar" && (
          <EnhancedReservationCalendar
            onDateSelect={(date) => console.log("Fecha seleccionada:", date)}
            onReservationCreate={(reservation) => console.log("Reserva creada:", reservation)}
          />
        )}
      </div>
    </div>
  )
}
