"use client"

import { useState } from "react"
import useSWR from "swr"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
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
import { Repeat, Heart, FileCheck, Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

interface MyBagData {
  hasBag: boolean
  bag?: {
    id: string
    name: string
    brand: string
    image_url: string | null
    purchase_price: number | null
    authenticity_certificate_url: string | null
  }
  ownership?: {
    mode: "discover" | "collect"
    accumulated: number
    purchase_price_snapshot: number | null
  }
}

const formatEUR = (value: number) =>
  new Intl.NumberFormat("es-ES", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(value)

export function MyBagCard() {
  const { data, isLoading, mutate } = useSWR<MyBagData>("/api/user/my-bag", fetcher)
  const router = useRouter()
  const { toast } = useToast()
  const [busy, setBusy] = useState<null | "complete" | "cancel" | "convert">(null)
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [confirmConvert, setConfirmConvert] = useState(false)

  const handleComplete = async () => {
    setBusy("complete")
    try {
      const res = await fetch("/api/user/ownership/complete", { method: "POST" })
      const json = await res.json()
      if (res.ok && json.success) {
        toast({
          title: "¡Felicidades!",
          description: `El bolso ya es tuyo. Cargo: ${new Intl.NumberFormat("es-ES", {
            style: "currency",
            currency: "EUR",
          }).format(json.paid_amount)}`,
        })
        mutate()
      } else if (json.requires_action) {
        toast({
          title: "Confirmación requerida",
          description: "Tu banco solicita verificación. Inténtalo de nuevo o cambia el método de pago.",
          variant: "destructive",
        })
      } else {
        toast({
          title: "No se pudo completar la compra",
          description: json.error || "Inténtalo de nuevo.",
          variant: "destructive",
        })
      }
    } catch (err) {
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : "Error desconocido",
        variant: "destructive",
      })
    } finally {
      setBusy(null)
    }
  }

  const handleCancel = async () => {
    setBusy("cancel")
    setConfirmCancel(false)
    try {
      const res = await fetch("/api/user/ownership/cancel-collect", { method: "POST" })
      const json = await res.json()
      if (res.ok && json.success) {
        toast({
          title: "Compra cancelada",
          description: "Has renunciado a esta compra. Ya puedes cambiar de bolso.",
        })
        mutate()
      } else {
        toast({
          title: "Error",
          description: json.error || "No se pudo cancelar.",
          variant: "destructive",
        })
      }
    } finally {
      setBusy(null)
    }
  }

  const handleConvert = async (bagId: string) => {
    setBusy("convert")
    setConfirmConvert(false)
    try {
      const res = await fetch("/api/user/ownership/convert-to-collect", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bag_id: bagId }),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        toast({
          title: "Modo Colecciona activado",
          description: "A partir de hoy cada cuota suma hacia la compra.",
        })
        mutate()
      } else {
        toast({
          title: "Error",
          description: json.error || "No se pudo activar.",
          variant: "destructive",
        })
      }
    } finally {
      setBusy(null)
    }
  }

  if (isLoading) {
    return (
      <Card className="border-slate-200">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    )
  }

  if (!data?.hasBag || !data.bag) {
    return null // No mostrar nada si no hay bolso en posesion
  }

  const { bag, ownership } = data
  const mode = ownership?.mode ?? "discover"
  const accumulated = ownership?.accumulated ?? 0
  const targetPrice = ownership?.purchase_price_snapshot ?? bag.purchase_price ?? 0
  const remaining = Math.max(targetPrice - accumulated, 0)
  const progressPct = targetPrice > 0 ? Math.min((accumulated / targetPrice) * 100, 100) : 0

  return (
    <Card className="overflow-hidden border-slate-200">
      <CardContent className="p-0">
        <div className="grid grid-cols-1 md:grid-cols-[260px_1fr]">
          {/* Imagen del bolso */}
          <div className="relative aspect-square bg-rose-nude/40 md:aspect-auto">
            {bag.image_url ? (
              <Image
                src={bag.image_url || "/placeholder.svg"}
                alt={`${bag.brand} ${bag.name}`}
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 260px"
              />
            ) : (
              <div className="flex h-full items-center justify-center text-slate-400">Sin imagen</div>
            )}
            {/* Badge de modo flotante */}
            <div className="absolute left-3 top-3">
              {mode === "collect" ? (
                <Badge className="bg-indigo-dark text-white hover:bg-indigo-dark gap-1">
                  <Heart className="h-3 w-3" />
                  Modo Colecciona
                </Badge>
              ) : (
                <Badge className="bg-white text-indigo-dark border border-indigo-dark/20 hover:bg-white gap-1">
                  <Repeat className="h-3 w-3" />
                  Modo Descubre
                </Badge>
              )}
            </div>
          </div>

          {/* Contenido */}
          <div className="flex flex-col justify-between p-6">
            <div>
              <p className="text-xs uppercase tracking-wider text-slate-500">Tu bolso actual</p>
              <h3 className="mt-1 font-serif text-2xl text-indigo-dark">{bag.brand}</h3>
              <p className="text-sm text-slate-600">{bag.name}</p>
            </div>

            {/* Vista MODO COLECCIONA */}
            {mode === "collect" && targetPrice > 0 && (
              <div className="mt-5">
                <div className="mb-2 flex items-baseline justify-between gap-2">
                  <span className="text-sm text-slate-600">Progreso hacia la compra</span>
                  <span className="font-serif text-base text-indigo-dark">
                    {formatEUR(accumulated)} <span className="text-slate-400">/ {formatEUR(targetPrice)}</span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-rose-nude">
                  <div
                    className="h-full rounded-full bg-indigo-dark transition-all duration-700"
                    style={{ width: `${progressPct}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-slate-500">
                  {remaining > 0
                    ? `Faltan ${formatEUR(remaining)} para que sea tuyo`
                    : "¡Has completado el precio! Puedes finalizar la compra."}
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    onClick={handleComplete}
                    disabled={busy !== null}
                    className="bg-indigo-dark text-white hover:bg-indigo-dark/90"
                  >
                    {busy === "complete" ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Procesando...
                      </>
                    ) : (
                      "Hacerlo mío ahora"
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setConfirmCancel(true)}
                    disabled={busy !== null}
                    className="border-slate-300 text-slate-700 hover:bg-slate-50"
                  >
                    Renunciar y cambiar
                  </Button>
                </div>

                {/* Certificado de autenticidad */}
                {bag.authenticity_certificate_url && (
                  <a
                    href={bag.authenticity_certificate_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 text-sm text-indigo-dark underline-offset-4 hover:underline"
                  >
                    <FileCheck className="h-4 w-4" />
                    Ver certificado de autenticidad
                  </a>
                )}
              </div>
            )}

            {/* Vista MODO DESCUBRE */}
            {mode === "discover" && (
              <div className="mt-5">
                <p className="text-sm text-slate-600">
                  Disfrutas de este bolso como parte de tu suscripción. Cuando quieras, devuélvelo y elige otro.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <Button
                    onClick={() => router.push("/catalog")}
                    className="bg-indigo-dark text-white hover:bg-indigo-dark/90"
                  >
                    Cambiar bolso
                  </Button>
                  {bag.purchase_price != null && bag.purchase_price > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setConfirmConvert(true)}
                      disabled={busy !== null}
                      className="border-indigo-dark/30 text-indigo-dark hover:bg-rose-nude/50"
                    >
                      {busy === "convert" ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Heart className="mr-2 h-4 w-4" />
                      )}
                      Convertir en mío
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>

      {/* Confirmación: renunciar a Colecciona */}
      <AlertDialog open={confirmCancel} onOpenChange={setConfirmCancel}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Renunciar a esta compra?</AlertDialogTitle>
            <AlertDialogDescription>
              Perderás los {formatEUR(accumulated)} acumulados hacia este bolso. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-rose-600 text-white hover:bg-rose-700">
              Sí, renunciar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmación: convertir a Colecciona */}
      <AlertDialog open={confirmConvert} onOpenChange={setConfirmConvert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Quieres hacer tuyo este bolso?</AlertDialogTitle>
            <AlertDialogDescription>
              A partir de hoy, cada cuota que pagues acumulará crédito hacia su compra. Las cuotas anteriores no cuentan.
              Cuando completes {bag.purchase_price ? formatEUR(bag.purchase_price) : "el precio"}, será tuyo.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => handleConvert(bag.id)}
              className="bg-indigo-dark text-white hover:bg-indigo-dark/90"
            >
              Sí, hacerlo mío
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
