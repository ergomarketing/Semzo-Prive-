"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { CreditCard, AlertTriangle, CheckCircle2 } from "lucide-react"
import SetupIntentPayment from "@/components/setup-intent-payment"
import { useAuth } from "@/app/hooks/useAuth"

export default function PaymentMethodPage() {
  const { user } = useAuth()
  const [membershipData, setMembershipData] = useState<any>(null)
  const [showAddCard, setShowAddCard] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user?.id) {
      fetchMembershipData()
    }
  }, [user])

  const fetchMembershipData = async () => {
    try {
      const response = await fetch(`/api/user/membership-state?userId=${user?.id}`)
      const data = await response.json()
      setMembershipData(data)
    } catch (error) {
      console.error("Error fetching membership:", error)
    } finally {
      setLoading(false)
    }
  }

  const handlePaymentMethodAdded = () => {
    setShowAddCard(false)
    fetchMembershipData()
  }

  if (loading) {
    return <div>Cargando...</div>
  }

  const hasPaymentMethod = membershipData?.payment_method_verified

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="font-serif text-3xl text-slate-900 mb-8">Método de Pago</h1>

      {!hasPaymentMethod && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardContent className="p-6">
            <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-amber-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-amber-900 mb-2">Método de pago requerido</h3>
                <p className="text-sm text-amber-700 mb-4">
                  Para mantener tu membresía activa, necesitas agregar un método de pago válido. No se realizará ningún
                  cargo hasta tu próxima renovación.
                </p>
                <Button onClick={() => setShowAddCard(true)} className="bg-indigo-dark text-white">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Agregar Tarjeta
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {hasPaymentMethod && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-700">
              <CheckCircle2 className="h-5 w-5 mr-2" />
              Método de Pago Activo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600">
                  {membershipData.payment_method_brand?.toUpperCase()} terminada en{" "}
                  {membershipData.payment_method_last4}
                </p>
                <p className="text-sm text-slate-500 mt-1">Verificada y lista para pagos automáticos</p>
              </div>
              <Button variant="outline" onClick={() => setShowAddCard(true)}>
                Actualizar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {showAddCard && user && (
        <div className="mt-6">
          <SetupIntentPayment
            userId={user.id}
            membershipType={membershipData?.membership_type || "signature"}
            onSuccess={handlePaymentMethodAdded}
            onError={(error) => alert(error)}
          />
        </div>
      )}
    </div>
  )
}
