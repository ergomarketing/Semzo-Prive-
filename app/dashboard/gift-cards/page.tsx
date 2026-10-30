"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader } from "@/components/panel/card"
import { PageHeader, PanelEmpty } from "@/components/panel/page-header"
import { Button } from "@/components/ui/button"
import { Gift, Copy, RefreshCw, Plus } from "lucide-react"
import { toast } from "sonner"
import Link from "next/link"

interface GiftCard {
  id: string
  code: string
  amount: number
  original_amount: number
  status: string
  expires_at: string | null
  created_at: string
  transactions: Array<{
    amount_used: number
    created_at: string
    order_reference: string
  }>
}

const formatEuro = (cents: number) =>
  new Intl.NumberFormat("es-ES", { style: "currency", currency: "EUR" }).format(cents / 100)

const formatDay = (iso: string) =>
  new Date(iso).toLocaleDateString("es-ES", { day: "numeric", month: "long", year: "numeric" })

/** El historial guarda referencias internas (bag_pass_<id>...): se muestran con un nombre claro. */
function describeReference(reference: string): string {
  const ref = (reference || "").toLowerCase()
  if (ref.startsWith("bag_pass")) return "Pase de bolso"
  if (ref.startsWith("membership") || ref.startsWith("sub_") || ref.startsWith("in_")) return "Membresía"
  if (ref.startsWith("ownership") || ref.startsWith("colecciona")) return "Colecciona"
  return "Compra en Semzo Privé"
}

const STATUS: Record<string, { label: string; className: string }> = {
  active: { label: "Activa", className: "bg-[#b08d57]/15 text-[#7a5f33]" },
  used: { label: "Usada", className: "bg-slate-100 text-slate-600" },
  expired: { label: "Expirada", className: "bg-rose-pastel/40 text-indigo-dark" },
}

export default function UserGiftCardsPage() {
  const [giftCards, setGiftCards] = useState<GiftCard[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchGiftCards()
  }, [])

  const fetchGiftCards = async () => {
    try {
      const res = await fetch("/api/user/gift-cards")
      if (res.ok) {
        const data = await res.json()
        setGiftCards(data.giftCards || [])
      }
    } catch (error) {
      console.error("Error fetching gift cards:", error)
    } finally {
      setLoading(false)
    }
  }

  const copyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      toast.success("Código copiado")
    } catch {
      // Safari o webviews sin permiso de portapapeles: se copia seleccionando un campo temporal
      try {
        const area = document.createElement("textarea")
        area.value = code
        area.style.position = "fixed"
        area.style.opacity = "0"
        document.body.appendChild(area)
        area.focus()
        area.select()
        const ok = document.execCommand("copy")
        document.body.removeChild(area)
        if (!ok) throw new Error("copy failed")
        toast.success("Código copiado")
      } catch {
        toast.error("No se pudo copiar. Selecciona el código y cópialo a mano.")
      }
    }
  }

  const totalAvailable = giftCards.filter((gc) => gc.status === "active").reduce((sum, gc) => sum + gc.amount, 0)

  const buyButton = (
    <Link href="/gift-cards">
      <Button className="h-11 rounded-md bg-indigo-dark px-6 text-xs font-medium uppercase tracking-[0.18em] text-white hover:bg-indigo-dark/90">
        <Plus className="mr-2 h-4 w-4 text-[#d9bd8a]" />
        Comprar gift card
      </Button>
    </Link>
  )

  if (loading) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <RefreshCw className="h-8 w-8 animate-spin text-slate-400" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        eyebrow="Tarjetas regalo"
        title="Mis gift cards"
        subtitle="Consulta el saldo y los movimientos de tus tarjetas regalo"
        action={buyButton}
      />

      <Card className="mb-6 border-rose-pastel/60 bg-rose-nude/70">
        <CardContent className="flex items-center gap-4 p-6">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/80 text-[#b08d57]">
            <Gift className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Saldo total disponible</p>
            <p className="font-serif text-4xl text-indigo-dark">{formatEuro(totalAvailable)}</p>
          </div>
        </CardContent>
      </Card>

      {giftCards.length === 0 ? (
        <Card>
          <PanelEmpty
            icon={<Gift className="h-6 w-6" />}
            title="Aún no tienes gift cards"
            text="Tus tarjetas regalo aparecerán aquí cuando las recibas o las compres."
            action={buyButton}
          />
        </Card>
      ) : (
        <div className="space-y-4">
          {giftCards.map((card) => {
            const status = STATUS[card.status] || { label: card.status, className: "bg-slate-100 text-slate-600" }
            return (
              <Card key={card.id}>
                <CardHeader className="pb-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#b08d57]/10 text-[#b08d57]">
                        <Gift className="h-5 w-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-1">
                          <code className="rounded-md bg-[#b08d57]/10 px-3 py-1 font-serif text-lg tracking-wider text-indigo-dark">
                            {card.code}
                          </code>
                          <Button type="button" variant="ghost" size="sm" onClick={() => copyCode(card.code)} aria-label="Copiar código">
                            <Copy className="h-3.5 w-3.5 text-slate-500" />
                          </Button>
                        </div>
                        <p className="mt-1 text-sm text-slate-500">
                          {card.expires_at ? `Expira el ${formatDay(card.expires_at)}` : "Sin fecha de expiración"}
                        </p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-medium ${status.className}`}>{status.label}</span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="mb-4 grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Valor original</p>
                      <p className="font-serif text-2xl text-indigo-dark">{formatEuro(card.original_amount)}</p>
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-slate-500">Saldo actual</p>
                      <p className="font-serif text-2xl text-indigo-dark">{formatEuro(card.amount)}</p>
                    </div>
                  </div>

                  {card.transactions && card.transactions.length > 0 && (
                    <div className="border-t border-indigo-dark/10 pt-4">
                      <p className="mb-3 text-xs uppercase tracking-wide text-slate-500">Historial de uso</p>
                      <div className="space-y-2">
                        {card.transactions.map((tx, idx) => (
                          <div key={idx} className="flex items-center justify-between text-sm">
                            <span className="text-slate-600">
                              {formatDay(tx.created_at)} · {describeReference(tx.order_reference)}
                            </span>
                            <span className="font-serif text-base text-indigo-dark">-{formatEuro(tx.amount_used)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
