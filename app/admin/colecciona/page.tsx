"use client"

import { PageHeader } from "@/components/panel/page-header"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/panel/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Loader2, RotateCcw } from "lucide-react"

interface Sale {
  progress_id: string
  sold_at: string
  member: string
  email: string | null
  bag: string
  price: number | null
  progress_status: string | null
  reversed_at: string | null
  credit_note: string | null
  reason: string | null
}

interface Plan {
  bag: string
  member: string
  invoiceNumber: string | null
  amountPaidCents: number
  refundCents: number
  restoredCredit: number
  purchasePrice: number
  bagAfter: "rented" | "available"
  reservationReopened: boolean
}

const eur = (cents: number) => `${(cents / 100).toFixed(2).replace(".", ",")} €`
const day = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })

export default function AdminColeccionaPage() {
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [target, setTarget] = useState<Sale | null>(null)
  const [plan, setPlan] = useState<Plan | null>(null)
  const [planError, setPlanError] = useState<string | null>(null)
  const [planLoading, setPlanLoading] = useState(false)
  const [bagReturned, setBagReturned] = useState(false)
  const [reason, setReason] = useState("Desistimiento de la compradora (14 días)")
  const [executing, setExecuting] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/ownership/sales", { cache: "no-store" })
      const json = await res.json()
      setSales(json.sales || [])
    } catch {
      toast.error("No se pudieron cargar las ventas")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const call = async (sale: Sale, confirm: boolean) => {
    const res = await fetch("/api/admin/ownership/reverse-sale", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ progress_id: sale.progress_id, confirm, reason, bag_returned: bagReturned }),
    })
    return { res, json: await res.json() }
  }

  // Cada vez que se abre o se cambia "ya devolvió el bolso", se recalcula el plan (sin tocar nada).
  useEffect(() => {
    if (!target) return
    let cancelled = false
    setPlanLoading(true)
    setPlan(null)
    setPlanError(null)
    call(target, false)
      .then(({ res, json }) => {
        if (cancelled) return
        if (!res.ok) setPlanError(json.error || "No se pudo preparar la anulación")
        else setPlan(json.plan)
      })
      .catch(() => !cancelled && setPlanError("No se pudo preparar la anulación"))
      .finally(() => !cancelled && setPlanLoading(false))
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, bagReturned])

  const execute = async () => {
    if (!target) return
    setExecuting(true)
    try {
      const { res, json } = await call(target, true)
      if (!res.ok) throw new Error(json.error || "No se pudo anular la venta")
      toast.success(`Venta anulada. Nota de crédito ${json.creditNoteNumber || json.creditNoteId}`)
      setTarget(null)
      await load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "No se pudo anular la venta")
    } finally {
      setExecuting(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader eyebrow="Miembros y pagos" title="Colecciona" subtitle="Ventas cerradas en Modo Colecciona. Desde aquí se anula una venta por desistimiento (14 días): nota de crédito y reembolso en Stripe, y la socia queda como antes de comprar." />

      <Card>
        <CardHeader>
          <CardTitle>Ventas</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="flex items-center text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando…
            </p>
          ) : sales.length === 0 ? (
            <p className="text-slate-500">Todavía no hay ventas.</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Socia</TableHead>
                  <TableHead>Bolso</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead />
                </TableRow>
              </TableHeader>
              <TableBody>
                {sales.map((sale) => (
                  <TableRow key={sale.progress_id}>
                    <TableCell>{day(sale.sold_at)}</TableCell>
                    <TableCell>
                      {sale.member}
                      {sale.email && <div className="text-xs text-slate-500">{sale.email}</div>}
                    </TableCell>
                    <TableCell>{sale.bag}</TableCell>
                    <TableCell>{sale.price != null ? `${sale.price} €` : "—"}</TableCell>
                    <TableCell>
                      {sale.reversed_at ? (
                        <Badge variant="secondary">Anulada · {sale.credit_note || day(sale.reversed_at)}</Badge>
                      ) : sale.progress_status === "completed" ? (
                        <Badge>Vendida</Badge>
                      ) : (
                        <Badge variant="outline">{sale.progress_status}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {!sale.reversed_at && sale.progress_status === "completed" && (
                        <Button variant="outline" size="sm" onClick={() => setTarget(sale)}>
                          <RotateCcw className="mr-2 h-4 w-4" /> Anular venta
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!target} onOpenChange={(open) => !open && !executing && setTarget(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Anular venta · {target?.bag}</DialogTitle>
            <DialogDescription>
              Revisa qué va a pasar. Hasta que pulses «Anular venta y reembolsar» no se toca Stripe ni la base de datos.
            </DialogDescription>
          </DialogHeader>

          {planLoading && (
            <p className="flex items-center text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Calculando…
            </p>
          )}
          {planError && <p className="rounded-md bg-rose-50 p-3 text-sm text-rose-700">{planError}</p>}

          {plan && (
            <div className="space-y-4 text-sm">
              <ul className="list-disc space-y-1 pl-5 text-slate-700">
                <li>
                  <strong>Stripe:</strong> nota de crédito sobre la factura {plan.invoiceNumber} y reembolso de{" "}
                  <strong>{eur(plan.refundCents)}</strong> a la tarjeta de la compradora.
                </li>
                <li>
                  <strong>Crédito:</strong> se restituye ({plan.restoredCredit} € de {plan.purchasePrice} €) y vuelve a
                  aparecer «Hacerlo mío ahora».
                </li>
                <li>
                  <strong>Bolso:</strong>{" "}
                  {plan.bagAfter === "available"
                    ? "vuelve al inventario como disponible."
                    : "sigue en poder de la socia (en curso); debe devolverlo en 14 días."}
                </li>
                <li>El contrato archivado se conserva, marcado como anulado.</li>
              </ul>

              <label className="flex items-start gap-3">
                <Checkbox checked={bagReturned} onCheckedChange={(v) => setBagReturned(v === true)} className="mt-0.5" />
                <span>La socia ya ha devuelto el bolso (volverlo al inventario)</span>
              </label>

              <div>
                <Label htmlFor="reversal-reason">Motivo (queda en la nota de crédito)</Label>
                <Input id="reversal-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="mt-1" />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setTarget(null)} disabled={executing}>
              Cancelar
            </Button>
            <Button onClick={execute} disabled={!plan || executing} className="bg-rose-600 text-white hover:bg-rose-700">
              {executing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Anular venta y reembolsar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
