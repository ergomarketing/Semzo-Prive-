"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Home, Package, Loader2, CheckCircle2, Info } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface ReturnStatus {
  hasBag: boolean
  bagName?: string
  defaultAddress?: string
  hasPendingReturn?: boolean
  pendingReturn?: { method: string; status: string; requestedAt: string } | null
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const SLOTS = [
  { value: "09:00-14:00", label: "Mañana (9:00 - 14:00)" },
  { value: "14:00-19:00", label: "Tarde (14:00 - 19:00)" },
]

export function ReturnBagDialog({
  open,
  onOpenChange,
  onDone,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onDone?: () => void
}) {
  const { toast } = useToast()
  const [status, setStatus] = useState<ReturnStatus | null>(null)
  const [loading, setLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const [method, setMethod] = useState<"pickup" | "dropoff">("pickup")
  const [pickupDate, setPickupDate] = useState("")
  const [pickupSlot, setPickupSlot] = useState(SLOTS[0].value)
  const [address, setAddress] = useState("")
  const [tracking, setTracking] = useState("")
  const [note, setNote] = useState("")

  useEffect(() => {
    if (!open) return
    setLoading(true)
    fetcher("/api/user/returns")
      .then((data: ReturnStatus) => {
        setStatus(data)
        if (data.defaultAddress) setAddress(data.defaultAddress)
      })
      .finally(() => setLoading(false))
  }, [open])

  const minDate = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split("T")[0]

  const handleSubmit = async () => {
    if (method === "pickup" && (!pickupDate || !address.trim())) {
      toast({ title: "Faltan datos", description: "Indica fecha y dirección de recogida.", variant: "destructive" })
      return
    }
    setSubmitting(true)
    try {
      const res = await fetch("/api/user/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          method === "pickup"
            ? { method, pickupDate, pickupSlot, address: address.trim(), note: note.trim() || undefined }
            : { method, tracking: tracking.trim() || undefined, note: note.trim() || undefined },
        ),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast({ title: "Devolución solicitada", description: json.message })
        onOpenChange(false)
        onDone?.()
      } else {
        toast({ title: "No se pudo solicitar", description: json.error || "Inténtalo de nuevo.", variant: "destructive" })
      }
    } catch (e) {
      toast({ title: "Error", description: e instanceof Error ? e.message : "Error", variant: "destructive" })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-serif text-indigo-dark">Devolver bolso</DialogTitle>
          <DialogDescription>
            {status?.bagName ? `Estás devolviendo ${status.bagName}.` : "Programa la devolución de tu bolso."}
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
          </div>
        ) : status?.hasPendingReturn ? (
          <div className="flex flex-col items-center gap-3 py-6 text-center">
            <CheckCircle2 className="h-10 w-10 text-green-600" />
            <p className="text-sm text-slate-700">
              Ya tienes una devolución solicitada
              {status.pendingReturn?.method === "pickup" ? " (recogida a domicilio)" : " (entrega en punto)"}. Nuestro
              equipo de logística la está gestionando.
            </p>
          </div>
        ) : !status?.hasBag ? (
          <p className="py-6 text-center text-sm text-slate-600">No tienes ningún bolso pendiente de devolver.</p>
        ) : (
          <div className="space-y-4">
            {/* La etiqueta ya va en el paquete */}
            <div className="flex gap-2 rounded-md bg-rose-nude/50 p-3 text-xs text-indigo-dark">
              <Info className="h-4 w-4 shrink-0" />
              <span>La etiqueta de devolución viene incluida en tu paquete original. No necesitas imprimir nada.</span>
            </div>

            {/* Selector de método */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setMethod("pickup")}
                className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-colors ${
                  method === "pickup"
                    ? "border-indigo-dark bg-indigo-dark/5 text-indigo-dark"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <Home className="h-5 w-5" />
                Recogida a domicilio
              </button>
              <button
                type="button"
                onClick={() => setMethod("dropoff")}
                className={`flex flex-col items-center gap-1 rounded-lg border p-3 text-sm transition-colors ${
                  method === "dropoff"
                    ? "border-indigo-dark bg-indigo-dark/5 text-indigo-dark"
                    : "border-slate-200 text-slate-600 hover:border-slate-300"
                }`}
              >
                <Package className="h-5 w-5" />
                Entrega en punto
              </button>
            </div>

            {method === "pickup" ? (
              <>
                <div className="grid gap-2">
                  <Label htmlFor="pickup-date">Fecha de recogida</Label>
                  <Input
                    id="pickup-date"
                    type="date"
                    min={minDate}
                    value={pickupDate}
                    onChange={(e) => setPickupDate(e.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <Label>Franja horaria</Label>
                  <Select value={pickupSlot} onValueChange={setPickupSlot}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {SLOTS.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="pickup-address">Dirección de recogida</Label>
                  <Textarea
                    id="pickup-address"
                    rows={2}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Calle, número, código postal, ciudad"
                  />
                </div>
              </>
            ) : (
              <div className="grid gap-2">
                <Label htmlFor="tracking">Nº de seguimiento (opcional)</Label>
                <Input
                  id="tracking"
                  value={tracking}
                  onChange={(e) => setTracking(e.target.value)}
                  placeholder="Lo recibes al entregar el paquete"
                />
                <p className="text-xs text-slate-500">
                  Lleva el paquete con la etiqueta incluida a tu punto de mensajería más cercano.
                </p>
              </div>
            )}

            <div className="grid gap-2">
              <Label htmlFor="return-note">Nota (opcional)</Label>
              <Textarea
                id="return-note"
                rows={2}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Instrucciones para portería, horario preferente, etc."
              />
            </div>
          </div>
        )}

        {status?.hasBag && !status?.hasPendingReturn && !loading && (
          <DialogFooter>
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
              Cancelar
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-indigo-dark text-white hover:bg-indigo-dark/90"
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {method === "pickup" ? "Solicitar recogida" : "Confirmar devolución"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}
