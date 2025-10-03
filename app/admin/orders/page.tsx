"use client"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ShoppingBag, Truck, Package, CheckCircle } from "lucide-react"

export default function OrdersPage() {
  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-serif font-bold text-slate-900 mb-2">Gestión de Pedidos</h1>
          <p className="text-slate-600">Seguimiento de pedidos y envíos</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Pendientes</p>
                  <p className="text-3xl font-bold text-orange-600">5</p>
                </div>
                <ShoppingBag className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">En Tránsito</p>
                  <p className="text-3xl font-bold text-blue-600">3</p>
                </div>
                <Truck className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Preparando</p>
                  <p className="text-3xl font-bold text-purple-600">2</p>
                </div>
                <Package className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-600">Entregados</p>
                  <p className="text-3xl font-bold text-green-600">28</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Integration Notice */}
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-8 text-center">
            <Truck className="h-16 w-16 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-slate-900 mb-2">Integración con Zoho Inventory</h3>
            <p className="text-slate-600 mb-4">
              Conecta con Zoho Inventory para gestionar automáticamente pedidos, envíos y tracking
            </p>
            <Button className="bg-blue-600 hover:bg-blue-700">Configurar Integración</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
