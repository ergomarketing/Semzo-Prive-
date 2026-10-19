"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LegalDoc } from "@/app/components/legal-doc"
import type { DocBlock } from "@/lib/colecciona-legal"

interface PurchasePreview {
  ready: boolean
  reason: "already_sold" | "condition_report_missing" | null
  bag_label: string
  amounts: { price: number; credit: number; due: number }
  needs_document: boolean
  conditions_accepted: boolean
  conditions_version: string
  contract_version: string
  annex_phrase: string
  contract_blocks: DocBlock[]
  annex_blocks: DocBlock[]
  withdrawal_blocks: DocBlock[]
  photos: string[]
}

export interface PurchaseConfirmation {
  expected_amount: number
  accepted_conditions: boolean
  accepted_contract: boolean
  accepted_annex: boolean
  document_number?: string
}

const formatEUR = (value: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR", minimumFractionDigits: 2 }).format(value)

/**
 * Pantalla de compra de Modo Colecciona. Muestra TODO antes de pagar: importes, contrato con los datos
 * de la socia, Anexo I (estado y fotos del bolso) y las aceptaciones: Condiciones del Programa (si faltan),
 * contrato y, en casilla SEPARADA, el estado del bolso. Sin las tres no se habilita el pago.
 */
export function ColeccionaPurchaseDialog({
  open,
  onOpenChange,
  onConfirm,
  busy,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (payload: PurchaseConfirmation) => void
  busy: boolean
}) {
  const [preview, setPreview] = useState<PurchasePreview | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [acceptedConditions, setAcceptedConditions] = useState(false)
  const [acceptedContract, setAcceptedContract] = useState(false)
  const [acceptedAnnex, setAcceptedAnnex] = useState(false)
  const [documentNumber, setDocumentNumber] = useState("")

  useEffect(() => {
    if (!open) return
    let cancelled = false
    setLoading(true)
    setError(null)
    setPreview(null)
    setAcceptedConditions(false)
    setAcceptedContract(false)
    setAcceptedAnnex(false)
    setDocumentNumber("")
    fetch("/api/user/ownership/purchase-preview")
      .then(async (res) => {
        const json = await res.json().catch(() => ({}))
        if (cancelled) return
        if (!res.ok) setError(json.error || "No se pudo preparar la compra. Inténtalo de nuevo.")
        else setPreview(json as PurchasePreview)
      })
      .catch(() => !cancelled && setError("No se pudo preparar la compra. Inténtalo de nuevo."))
      .finally(() => !cancelled && setLoading(false))
    return () => {
      cancelled = true
    }
  }, [open])

  const needsConditions = !!preview && !preview.conditions_accepted
  const documentOk = !preview?.needs_document || documentNumber.trim().length >= 8
  const canPay =
    !!preview?.ready && acceptedContract && acceptedAnnex && (!needsConditions || acceptedConditions) && documentOk && !busy

  // Lo que falta para habilitar "Continuar al pago" (antes el boton quedaba gris sin explicar por que).
  const pending: string[] = []
  if (preview?.ready) {
    if (!documentOk) pending.push("escribir tu DNI o NIE")
    if (needsConditions && !acceptedConditions) pending.push("aceptar las Condiciones del Programa")
    if (!acceptedContract) pending.push("aceptar el contrato de compraventa")
    if (!acceptedAnnex) pending.push("aceptar el estado del bolso")
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif text-2xl text-indigo-dark">
            Confirmar compra{preview?.bag_label ? ` de ${preview.bag_label}` : ""}
          </DialogTitle>
          <DialogDescription>
            Revisa el contrato y el estado del bolso. En la siguiente pantalla elegirás cómo pagar.
          </DialogDescription>
        </DialogHeader>

        {loading && (
          <div className="flex items-center justify-center py-12 text-slate-500">
            <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Preparando tu compra…
          </div>
        )}

        {error && <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{error}</p>}

        {preview && !preview.ready && (
          <p className="rounded-md bg-rose-nude/40 p-4 text-sm text-slate-700">
            {preview.reason === "already_sold"
              ? "Este bolso ya ha sido vendido."
              : "Estamos terminando la ficha del estado de tu bolso. Te avisaremos en cuanto puedas completar la compra."}
          </p>
        )}

        {preview?.ready && (
          <div className="space-y-5">
            <dl className="space-y-1 rounded-lg border border-slate-200 p-4 text-sm text-slate-600">
              <div className="flex justify-between">
                <dt>Precio del bolso (IVA incluido)</dt>
                <dd>{formatEUR(preview.amounts.price)}</dd>
              </div>
              <div className="flex justify-between">
                <dt>Crédito Colecciona aplicado</dt>
                <dd>- {formatEUR(preview.amounts.credit)}</dd>
              </div>
              <div className="flex justify-between border-t border-slate-200 pt-1 font-medium text-indigo-dark">
                <dt>Importe final (IVA incluido)</dt>
                <dd>{formatEUR(preview.amounts.due)}</dd>
              </div>
            </dl>

            <details className="rounded-lg border border-slate-200 p-4">
              <summary className="cursor-pointer font-medium text-indigo-dark">
                Contrato de compraventa ({preview.contract_version})
              </summary>
              <div className="mt-3 max-h-80 overflow-y-auto pr-2">
                <LegalDoc blocks={preview.contract_blocks} compact />
                <div className="mt-4 border-t border-slate-200 pt-3">
                  <LegalDoc blocks={preview.withdrawal_blocks} compact />
                </div>
              </div>
            </details>

            <section className="rounded-lg border border-rose-pastel/60 bg-rose-nude/20 p-4">
              <h3 className="mb-3 font-serif text-lg text-indigo-dark">Anexo I · Estado del bolso</h3>
              <LegalDoc blocks={preview.annex_blocks.slice(0, 3)} compact />
              {preview.photos.length > 0 && (
                <div className="mt-3 grid grid-cols-4 gap-2">
                  {preview.photos.slice(0, 8).map((src, index) => (
                    <a key={index} href={src} target="_blank" rel="noopener noreferrer">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={src}
                        alt={`Foto ${index + 1} de ${preview.bag_label}`}
                        className="aspect-square w-full rounded-md object-cover"
                      />
                    </a>
                  ))}
                </div>
              )}
            </section>

            {preview.needs_document && (
              <div className="rounded-lg border border-slate-200 p-4">
                <Label htmlFor="colecciona-document" className="text-indigo-dark">
                  DNI o NIE para tu factura
                </Label>
                <Input
                  id="colecciona-document"
                  value={documentNumber}
                  onChange={(e) => setDocumentNumber(e.target.value)}
                  placeholder="12345678Z"
                  autoComplete="off"
                  className="mt-1 max-w-xs uppercase"
                />
                <p className="mt-1 text-xs text-slate-500">
                  La factura de una compra de este importe debe identificarte. Se guarda en tu perfil.
                </p>
              </div>
            )}

            <div className="space-y-3">
              {needsConditions && (
                <label className="flex items-start gap-3 text-sm text-slate-700">
                  <Checkbox
                    checked={acceptedConditions}
                    onCheckedChange={(v) => setAcceptedConditions(v === true)}
                    className="mt-0.5"
                  />
                  <span>
                    He leído y acepto las{" "}
                    <a href="/colecciona/condiciones" target="_blank" rel="noopener noreferrer" className="underline">
                      Condiciones del Programa Colecciona ({preview.conditions_version})
                    </a>
                    .
                  </span>
                </label>
              )}
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <Checkbox
                  checked={acceptedContract}
                  onCheckedChange={(v) => setAcceptedContract(v === true)}
                  className="mt-0.5"
                />
                <span>
                  He leído y acepto el contrato de compraventa ({preview.contract_version}), incluido mi derecho de
                  desistimiento de 14 días.
                </span>
              </label>
              <label className="flex items-start gap-3 text-sm text-slate-700">
                <Checkbox
                  checked={acceptedAnnex}
                  onCheckedChange={(v) => setAcceptedAnnex(v === true)}
                  className="mt-0.5"
                />
                <span>{preview.annex_phrase}</span>
              </label>
            </div>
          </div>
        )}

        {preview?.ready && pending.length > 0 && !busy && (
          <p className="rounded-md bg-amber-50 p-3 text-sm text-amber-800">
            Para continuar al pago falta: {pending.join(", ")}.
          </p>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            Cancelar
          </Button>
          {preview?.ready && (
            <Button
              disabled={!canPay}
              onClick={() =>
                onConfirm({
                  expected_amount: preview.amounts.due,
                  accepted_conditions: acceptedConditions || preview.conditions_accepted,
                  accepted_contract: acceptedContract,
                  accepted_annex: acceptedAnnex,
                  ...(preview.needs_document ? { document_number: documentNumber.trim() } : {}),
                })
              }
              className="bg-indigo-dark text-white hover:bg-indigo-dark/90"
            >
              {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Continuar al pago · {formatEUR(preview.amounts.due)}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
