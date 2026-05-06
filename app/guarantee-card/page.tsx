"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Loader2, Shield, AlertTriangle } from "lucide-react"
import { toast } from "sonner"
import SetupIntentPayment from "@/components/setup-intent-payment"
import { getSupabaseBrowser } from "@/lib/supabase-browser"
import { Button } from "@/components/ui/button"

interface PendingGiftCardActivation {
  userId: string
  giftCardId: string
  membershipType: string
  billingCycle: string
  amountCents?: number
  source: "cart" | "upgrade" | "checkout"
  // Cart-only: limpiar cart tras activacion
  clearCartAfter?: boolean
}

const STORAGE_KEY = "semzo_pending_gift_card_activation"

/**
 * Pagina intermedia entre "aplicar gift card" y "activar membresia".
 *
 * Flujo:
 * 1. CartClient / MembershipUpgradeClient guardan los datos de la activacion
 *    pendiente en sessionStorage[STORAGE_KEY] y redirigen aqui.
 * 2. Esta pagina pide la tarjeta de garantia con SetupIntentPayment.
 * 3. Tras confirmar la tarjeta, llama a /api/memberships/purchase-with-gift-card
 *    con setupIntentId para que la membresia quede activada con tarjeta on-file.
 * 4. Redirige a /verify-identity.
 *
 * Si la usuaria abandona aqui, la gift card NO se descuenta (la lógica de
 * descuento vive en el endpoint del paso 3).
 */
export default function GuaranteeCardPage() {
  const router = useRouter()
  const [pending, setPending] = useState<PendingGiftCardActivation | null>(null)
  const [loading, setLoading] = useState(true)
  const [activating, setActivating] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(STORAGE_KEY)
      if (!raw) {
        setErrorMsg("No hay ninguna activación pendiente. Vuelve a aplicar tu gift card.")
        setLoading(false)
        return
      }
      const data: PendingGiftCardActivation = JSON.parse(raw)
      if (!data.userId || !data.giftCardId || !data.membershipType) {
        setErrorMsg("Datos de activación incompletos. Vuelve a aplicar tu gift card.")
        setLoading(false)
        return
      }
      setPending(data)
    } catch {
      setErrorMsg("No se pudo leer la activación pendiente.")
    } finally {
      setLoading(false)
    }
  }, [])

  const finishActivation = async (setupIntentId: string) => {
    if (!pending || activating) return
    setActivating(true)

    try {
      // Confirmar que la sesion esta viva antes de llamar al endpoint
      const supabase = getSupabaseBrowser()
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session?.user) {
        toast.error("Tu sesión expiró. Inicia sesión de nuevo.")
        router.push("/login")
        return
      }

      const res = await fetch("/api/memberships/purchase-with-gift-card", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: pending.userId,
          giftCardId: pending.giftCardId,
          membershipType: pending.membershipType,
          billingCycle: pending.billingCycle,
          amountCents: pending.amountCents,
          setupIntentId,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error activando la membresía")

      // Limpiar contexto pendiente
      sessionStorage.removeItem(STORAGE_KEY)

      // Si venimos del cart, vaciarlo (lo gestionamos via flag para que
      // el cart se entere al cargar /verify-identity)
      if (pending.clearCartAfter) {
        sessionStorage.setItem("semzo_clear_cart_on_next_load", "1")
      }

      toast.success("¡Membresía activada! Ahora verifica tu identidad.")
      router.push("/verify-identity")
    } catch (err: any) {
      toast.error(err?.message || "Error inesperado al activar la membresía.")
      setActivating(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-indigo-dark" />
      </div>
    )
  }

  if (errorMsg) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-4">
          <AlertTriangle className="h-10 w-10 text-amber-500 mx-auto" />
          <h1 className="font-serif text-2xl text-indigo-dark">No se puede continuar</h1>
          <p className="text-slate-600 text-sm">{errorMsg}</p>
          <Button
            onClick={() => router.push("/cart")}
            className="bg-indigo-dark text-white hover:bg-indigo-dark/90"
          >
            Volver al carrito
          </Button>
        </div>
      </div>
    )
  }

  if (!pending) return null

  return (
    <div className="min-h-screen bg-background py-10 px-4">
      <div className="max-w-xl mx-auto space-y-6">
        <header className="text-center">
          <Shield className="h-10 w-10 text-indigo-dark mx-auto mb-3" />
          <h1 className="font-serif text-3xl text-indigo-dark">Tarjeta de garantía</h1>
          <p className="text-slate-600 text-sm mt-2 max-w-md mx-auto leading-relaxed">
            Tu gift card cubre el coste de la membresía. Como respaldo, necesitamos una
            tarjeta para cubrir posibles incidencias (no devolución, daños o pérdida del
            bolso). <strong>No se realizará ningún cargo ahora.</strong>
          </p>
        </header>

        {activating ? (
          <div className="bg-white rounded-2xl shadow-lg p-10 text-center space-y-4">
            <Loader2 className="h-6 w-6 animate-spin text-indigo-dark mx-auto" />
            <p className="text-slate-600 text-sm">Activando tu membresía…</p>
          </div>
        ) : (
          <SetupIntentPayment
            userId={pending.userId}
            membershipType={pending.membershipType}
            // autoConfirm=false: NO llamar a confirm-payment-method aqui.
            // purchase-with-gift-card vinculara el payment method a la
            // membresia con los datos correctos (es nuestro unico paso).
            autoConfirm={false}
            onSuccess={async ({ setupIntentId }) => {
              await finishActivation(setupIntentId)
            }}
            onError={(err) => toast.error(err)}
          />
        )}

        <p className="text-center text-xs text-slate-400">
          Pago 100% seguro. Procesado por Stripe.
        </p>
      </div>
    </div>
  )
}
