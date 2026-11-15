"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Loader2, CalendarClock } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

interface AutochargeState {
  eligible?: boolean
  consented?: boolean
  text?: string
  amountCents?: number | null
  passExpiresAt?: string | null
  renewalsDone?: number
  maxRenewals?: number
}

const fetcher = (url: string) => fetch(url).then((r) => r.json())

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", { weekday: "long", day: "numeric", month: "long", timeZone: "Europe/Madrid" })

const eur = (cents: number) => `${cents % 100 === 0 ? cents / 100 : (cents / 100).toFixed(2).replace(".", ",")} €`

/**
 * Renovacion automatica del pase semanal (socias Petite en Modo Colecciona).
 * No pinta nada si la socia no esta en ese caso. Sin autorizacion expresa no se cobra nada.
 */
export function ColeccionaAutochargeBox() {
  const { data, mutate } = useSWR<AutochargeState>("/api/user/ownership/autocharge", fetcher)
  const { toast } = useToast()
  const [accepted, setAccepted] = useState(false)
  const [busy, setBusy] = useState(false)

  if (!data?.eligible) return null

  const amount = data.amountCents ? eur(data.amountCents) : "el importe de tu pase"
  const ends = data.passExpiresAt ? formatDay(data.passExpiresAt) : null

  const call = async (method: "POST" | "DELETE") => {
    setBusy(true)
    try {
      const res = await fetch("/api/user/ownership/autocharge", {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "POST" ? JSON.stringify({ accepted: true }) : undefined,
      })
      const json = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(json.error || "No se pudo completar")
      toast({
        title: method === "POST" ? "Renovación automática activada" : "Renovación automática desactivada",
        description:
          method === "POST"
            ? "Te avisaremos por correo antes de cada cobro."
            : "No se cobrarán más pases. Recuerda devolver el bolso al terminar el pase en curso.",
      })
      setAccepted(false)
      await mutate()
    } catch (err) {
      toast({ title: "Error", description: err instanceof Error ? err.message : "Error", variant: "destructive" })
    } finally {
      setBusy(false)
    }
  }

  if (data.consented) {
    return (
      <div className="mt-5 rounded-lg border border-slate-200 bg-rose-nude/30 p-4 text-sm text-indigo-dark">
        <p className="flex items-center gap-2 font-medium">
          <CalendarClock className="h-4 w-4" />
          Renovación automática del pase activada
        </p>
        <p className="mt-1 text-slate-600">
          {ends ? `Tu pase actual termina el ${ends}. ` : ""}Ese día cobraremos {amount} en tu tarjeta guardada (te avisamos por
          correo antes) y podrás quedarte el bolso otra semana. Cada pase suma a tu crédito Colecciona. Renovaciones:{" "}
          {data.renewalsDone ?? 0} de {data.maxRenewals ?? 8}.
        </p>
        <button
          type="button"
          onClick={() => call("DELETE")}
          disabled={busy}
          className="mt-2 text-xs text-slate-500 underline underline-offset-2 hover:text-indigo-dark"
        >
          {busy ? "Desactivando…" : "Desactivar la renovación automática"}
        </button>
      </div>
    )
  }

  return (
    <div className="mt-5 rounded-lg border border-[#b08d57]/40 bg-rose-nude/30 p-4 text-sm text-indigo-dark">
      <p className="flex items-center gap-2 font-medium">
        <CalendarClock className="h-4 w-4" />
        Para quedarte el bolso más semanas
      </p>
      <p className="mt-1 text-slate-600">
        {ends ? `Tu pase termina el ${ends}. ` : ""}Si activas la renovación automática, cada semana cobraremos {amount} y
        podrás conservar el bolso hasta que lo compres. Sin activarla, tendrás que devolverlo al terminar el pase.
      </p>
      <label className="mt-3 flex items-start gap-2 text-xs text-slate-600">
        <input
          type="checkbox"
          checked={accepted}
          onChange={(e) => setAccepted(e.target.checked)}
          className="mt-0.5"
        />
        <span>{data.text}</span>
      </label>
      <Button
        onClick={() => call("POST")}
        disabled={!accepted || busy}
        className="mt-3 bg-indigo-dark text-white hover:bg-indigo-dark/90"
      >
        {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        Activar renovación automática
      </Button>
    </div>
  )
}
