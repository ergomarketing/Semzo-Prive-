"use client"

import { useState } from "react"
import useSWR from "swr"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface PendingCharge {
  reservation_id: string
  amount: number
  failed_at: string
  bag: string
}

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((r) => (r.ok ? r.json() : { charges: [] }))
const eur = (value: number) => `${value.toFixed(2).replace(".", ",")} €`

/**
 * "Pago pendiente": el banco rechazo el cargo por no devolucion de un bolso (p. ej. fondos insuficientes) y la socia
 * debe completarlo a mano. Solo se muestra si hay alguno.
 */
export function PendingChargeCard() {
  const { data } = useSWR<{ charges: PendingCharge[] }>("/api/user/pending-charges", fetcher)
  const { toast } = useToast()
  const [busy, setBusy] = useState<string | null>(null)

  const charges = data?.charges || []
  if (charges.length === 0) return null

  const pay = async (charge: PendingCharge) => {
    setBusy(charge.reservation_id)
    try {
      const res = await fetch("/api/user/pending-charges/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reservation_id: charge.reservation_id }),
      })
      const json = await res.json()
      if (!res.ok || !json.url) throw new Error(json.error || "No se pudo iniciar el pago")
      window.location.href = json.url
    } catch (err) {
      toast({
        variant: "destructive",
        title: "No se pudo iniciar el pago",
        description: err instanceof Error ? err.message : "Inténtalo de nuevo.",
      })
      setBusy(null)
    }
  }

  return (
    <div className="space-y-3">
      {charges.map((charge) => (
        <Card key={charge.reservation_id} className="border-rose-300 bg-rose-50">
          <CardContent className="flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-serif text-lg text-indigo-dark">Pago pendiente</p>
              <p className="text-sm text-slate-700">
                Tu banco rechazó el cobro de <strong>{charge.bag}</strong> (bolso no devuelto en el plazo). Importe
                pendiente: <strong>{eur(charge.amount)}</strong>.
              </p>
            </div>
            <Button onClick={() => pay(charge)} disabled={busy !== null} className="shrink-0">
              {busy === charge.reservation_id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Completar el pago"}
            </Button>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
