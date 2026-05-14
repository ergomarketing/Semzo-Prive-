"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Repeat, Heart, Check, Loader2 } from "lucide-react"

interface ModeSelectorDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bagName: string
  bagBrand: string
  purchasePrice?: number | null
  monthlyPrice?: number | null
  onSelect: (mode: "discover" | "collect") => Promise<void> | void
}

/**
 * Modal mostrado al reservar un bolso para que la socia elija modo.
 * Mantiene la misma identidad visual que la seccion "Tu bolso, tus reglas"
 * de la home: mismos iconos (Repeat/Heart), mismos colores indigo/rose-pastel.
 */
export function ModeSelectorDialog({
  open,
  onOpenChange,
  bagName,
  bagBrand,
  purchasePrice,
  monthlyPrice,
  onSelect,
}: ModeSelectorDialogProps) {
  const [selected, setSelected] = useState<"discover" | "collect" | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const canCollect = purchasePrice != null && purchasePrice > 0
  const monthsEstimate =
    canCollect && monthlyPrice && monthlyPrice > 0 ? Math.ceil(Number(purchasePrice) / monthlyPrice) : null

  const handleConfirm = async () => {
    if (!selected) return
    setSubmitting(true)
    try {
      await onSelect(selected)
      onOpenChange(false)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-indigo-dark">¿Cómo quieres disfrutar este bolso?</DialogTitle>
          <DialogDescription className="text-slate-600">
            Elige el modo para {bagBrand} {bagName}. Puedes cambiar de modo más adelante.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2 mt-4">
          {/* Modo Descubre */}
          <button
            type="button"
            onClick={() => setSelected("discover")}
            className={`text-left rounded-xl border-2 p-5 transition-all ${
              selected === "discover"
                ? "border-indigo-dark bg-rose-nude/30 shadow-sm"
                : "border-slate-200 bg-white hover:border-indigo-dark/40"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-pastel/40">
                <Repeat className="h-5 w-5 text-indigo-dark" />
              </div>
              {selected === "discover" && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-dark text-white">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
            <h3 className="font-serif text-lg text-indigo-dark mb-1">Modo Descubre</h3>
            <p className="text-sm text-slate-600 mb-3">Cámbialo cuando quieras por otro de tu colección.</p>
            <ul className="space-y-1.5 text-xs text-slate-700">
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-indigo-dark mt-0.5 shrink-0" />
                Libertad total para rotar
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-indigo-dark mt-0.5 shrink-0" />
                Seguro de uso incluido
              </li>
              <li className="flex items-start gap-2">
                <Check className="h-3.5 w-3.5 text-indigo-dark mt-0.5 shrink-0" />
                Sin compromiso de compra
              </li>
            </ul>
          </button>

          {/* Modo Colecciona */}
          <button
            type="button"
            disabled={!canCollect}
            onClick={() => canCollect && setSelected("collect")}
            className={`text-left rounded-xl border-2 p-5 transition-all ${
              !canCollect
                ? "border-slate-200 bg-slate-50 opacity-60 cursor-not-allowed"
                : selected === "collect"
                  ? "border-indigo-dark bg-rose-nude/30 shadow-sm"
                  : "border-slate-200 bg-white hover:border-indigo-dark/40"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-rose-pastel/40">
                <Heart className="h-5 w-5 text-indigo-dark" />
              </div>
              {selected === "collect" && (
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-dark text-white">
                  <Check className="h-3.5 w-3.5" />
                </div>
              )}
            </div>
            <h3 className="font-serif text-lg text-indigo-dark mb-1">Modo Colecciona</h3>
            <p className="text-sm text-slate-600 mb-3">
              {canCollect
                ? "Cada cuota suma hacia su compra. Cuando completes el precio, es tuyo."
                : "No disponible para este bolso."}
            </p>
            {canCollect && (
              <ul className="space-y-1.5 text-xs text-slate-700">
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-indigo-dark mt-0.5 shrink-0" />
                  Precio fijado: {Number(purchasePrice).toLocaleString("es-ES")}€
                </li>
                {monthsEstimate && (
                  <li className="flex items-start gap-2">
                    <Check className="h-3.5 w-3.5 text-indigo-dark mt-0.5 shrink-0" />
                    Estimado: ~{monthsEstimate} meses
                  </li>
                )}
                <li className="flex items-start gap-2">
                  <Check className="h-3.5 w-3.5 text-indigo-dark mt-0.5 shrink-0" />
                  Certificado de autenticidad desde el día 1
                </li>
              </ul>
            )}
          </button>
        </div>

        {selected === "collect" && (
          <div className="rounded-lg bg-rose-nude/30 border border-rose-pastel/40 p-3 text-xs text-slate-700">
            <strong className="text-indigo-dark">Nota:</strong> Si cancelas la membresía o cambias de bolso, el crédito
            acumulado se pierde.
          </div>
        )}

        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!selected || submitting}
            className="bg-indigo-dark hover:bg-indigo-dark/90 text-white"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Confirmando...
              </>
            ) : (
              "Confirmar y reservar"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
