"use client"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { CheckCircle2, AlertCircle, ArrowLeft } from "lucide-react"
import RealPaymentGateway from "./real-payment-gateway"

interface PaymentGatewayProps {
  amount: number
  description: string
  onSuccess: (paymentId: string) => void
  onError: (error: string) => void
}

export function PaymentSuccess({ paymentId, onContinue }: { paymentId: string; onContinue: () => void }) {
  return (
    <Card className="border-0 shadow-lg max-w-md mx-auto">
      <CardContent className="p-8 text-center">
        <div className="mb-6">
          <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">¡Pago exitoso!</h2>
          <p className="text-slate-600">Tu membresía ha sido activada correctamente.</p>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 mb-6">
          <p className="text-sm text-slate-600">ID de transacción:</p>
          <p className="font-mono text-sm text-slate-900">{paymentId}</p>
        </div>

        <Button onClick={onContinue} className="w-full bg-indigo-dark text-white hover:bg-indigo-dark/90">
          Continuar a mi cuenta
        </Button>
      </CardContent>
    </Card>
  )
}

export function PaymentError({ error, onRetry }: { error: string; onRetry: () => void }) {
  return (
    <Card className="border-0 shadow-lg max-w-md mx-auto">
      <CardContent className="p-8 text-center">
        <div className="mb-6">
          <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Error en el pago</h2>
          <p className="text-slate-600 mb-4">{error}</p>
        </div>

        <div className="space-y-3">
          <Button onClick={onRetry} className="w-full bg-indigo-dark text-white hover:bg-indigo-dark/90">
            Intentar de nuevo
          </Button>
          <Button variant="outline" className="w-full" onClick={() => window.history.back()}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Volver
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export default function PaymentGateway({ amount, description, onSuccess, onError }: PaymentGatewayProps) {
  return (
    <div className="max-w-md mx-auto">
      <RealPaymentGateway
        amount={amount}
        membershipType={description}
        userEmail="usuario@ejemplo.com"
        onSuccess={onSuccess}
        onError={onError}
      />
    </div>
  )
}
