"use client"

import { useState } from "react"
import useSWR from "swr"
import Image from "next/image"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import type { NextBagInfo } from "@/hooks/use-next-bag"

const fetcher = (url: string) => fetch(url, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null))

const formatDay = (iso: string) => new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long" })

/**
 * "Tu proximo bolso": reserva en cola (sale cuando recibimos la devolucion del actual), o aviso de que ya se puede
 * elegir uno (ultimos 7 dias del ciclo). No muestra nada si no aplica.
 */
export function NextBagCard() {
  const { data, mutate } = useSWR<NextBagInfo | null>("/api/user/next-bag", fetcher)
  const { toast } = useToast()
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!data) return null

  const cancelQueued = async () => {
    setBusy(true)
    try {
      const res = await fetch("/api/user/next-bag", { method: "DELETE" })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "No se pudo cancelar")
      toast({ title: "Próximo bolso cancelado", description: "El bolso vuelve a estar disponible." })
      await mutate()
    } catch (err) {
      toast({
        variant: "destructive",
        title: "No se pudo cancelar",
        description: err instanceof Error ? err.message : "Inténtalo de nuevo.",
      })
    } finally {
      setBusy(false)
      setConfirmCancel(false)
    }
  }

  if (data.queued) {
    return (
      <Card className="border-rose-pastel/40">
        <CardContent className="p-5 flex items-center gap-4">
          {data.queued.imageUrl && (
            <div className="relative h-20 w-20 shrink-0 rounded bg-gray-50">
              <Image src={data.queued.imageUrl} alt={data.queued.bagLabel} fill className="object-contain p-1" />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-xs tracking-widest uppercase text-slate-500">Tu próximo bolso</p>
            <p className="font-serif text-lg text-indigo-dark truncate">{data.queued.bagLabel}</p>
            <p className="text-sm text-slate-600">
              Reservado para ti. Saldrá hacia tu casa en cuanto recibamos
              {data.ongoing ? ` ${data.ongoing.bagLabel}` : " el bolso que tienes ahora"}.
            </p>
          </div>
          <Button variant="outline" size="sm" disabled={busy} onClick={() => setConfirmCancel(true)}>
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : "Cancelar"}
          </Button>
        </CardContent>

        <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>¿Cancelar tu próximo bolso?</AlertDialogTitle>
              <AlertDialogDescription>
                {data.queued.bagLabel} volverá a estar disponible para otras socias. Si lo reservaste con un Pase de
                Bolso, el pase se te devuelve.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Mantenerlo</AlertDialogCancel>
              <AlertDialogAction onClick={cancelQueued}>Sí, cancelar</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </Card>
    )
  }

  if (data.canQueue) {
    return (
      <Card className="border-rose-pastel/40 bg-rose-pastel/10">
        <CardContent className="p-5 flex items-center justify-between gap-4">
          <div>
            <p className="font-serif text-lg text-indigo-dark">Ya puedes elegir tu próximo bolso</p>
            <p className="text-sm text-slate-600">
              Resérvalo ahora y saldrá hacia ti en cuanto recibamos el que tienes.
            </p>
          </div>
          <Button asChild className="shrink-0">
            <Link href="/catalog">Elegir mi próximo bolso</Link>
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (data.hasBagInHand && data.reason === "window_closed" && data.windowOpensAt) {
    return (
      <p className="text-sm text-slate-500">
        A partir del {formatDay(data.windowOpensAt)} podrás reservar tu próximo bolso, sin esperar a devolver el actual.
      </p>
    )
  }

  return null
}
