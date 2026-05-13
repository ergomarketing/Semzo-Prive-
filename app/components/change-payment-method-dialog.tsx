"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CreditCard, CheckCircle2 } from "lucide-react"
import SetupIntentPayment from "@/components/setup-intent-payment"
import { useAuth } from "@/app/hooks/useAuth"

interface ChangePaymentMethodDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentBrand?: string | null
  currentLast4?: string | null
  membershipType?: string
  onSuccess?: () => void
}

/**
 * Modal aislado para cambiar/actualizar el metodo de pago.
 * Reutiliza el componente SetupIntentPayment existente (NO modifica nada de pagos).
 * Es puramente UI - el flujo real de Stripe sigue igual.
 */
export function ChangePaymentMethodDialog({
  open,
  onOpenChange,
  currentBrand,
  currentLast4,
  membershipType = "signature",
  onSuccess,
}: ChangePaymentMethodDialogProps) {
  const { user } = useAuth()
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSuccess = () => {
    setSuccess(true)
    setError(null)
    setTimeout(() => {
      onSuccess?.()
      onOpenChange(false)
      setSuccess(false)
    }, 1500)
  }

  const handleError = (msg: string) => {
    setError(msg)
  }

  const handleClose = (next: boolean) => {
    if (!next) {
      setError(null)
      setSuccess(false)
    }
    onOpenChange(next)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-xl text-slate-900">
            Cambiar metodo de pago
          </DialogTitle>
          <DialogDescription>
            {currentBrand && currentLast4 ? (
              <>
                Tarjeta actual: {currentBrand.toUpperCase()} terminada en {currentLast4}
              </>
            ) : (
              "Anade una tarjeta para pagos automaticos"
            )}
          </DialogDescription>
        </DialogHeader>

        {success ? (
          <div className="py-8 flex flex-col items-center gap-3 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
            <p className="font-medium text-slate-900">Metodo de pago actualizado</p>
            <p className="text-sm text-slate-500">Tu nueva tarjeta esta lista</p>
          </div>
        ) : (
          <>
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                {error}
              </div>
            )}

            {user?.id ? (
              <SetupIntentPayment
                userId={user.id}
                membershipType={membershipType}
                onSuccess={handleSuccess}
                onError={handleError}
              />
            ) : (
              <div className="py-6 text-center text-sm text-slate-500">
                <CreditCard className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                Cargando...
              </div>
            )}

            <div className="pt-2">
              <Button
                variant="outline"
                className="w-full bg-transparent"
                onClick={() => handleClose(false)}
              >
                Cancelar
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
