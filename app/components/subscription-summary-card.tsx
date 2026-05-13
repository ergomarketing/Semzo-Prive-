"use client"

import useSWR from "swr"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Copy, Check, CreditCard, Calendar, Hash, Crown, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

const fetcher = (url: string) => fetch(url).then((r) => r.json())

type PaymentMethod = {
  brand: string
  last4: string
  exp_month: number
  exp_year: number
}

type Summary = {
  friendly_id: string | null
  member_since: string | null
  membership_type: string | null
  billing_cycle: string | null
  end_date: string | null
  next_charge_at: string | null
  stripe_status: string | null
  payment_method: PaymentMethod | null
  stripe_available: boolean
  error?: string
}

function getPlanName(type: string | null): string {
  if (!type) return "—"
  const map: Record<string, string> = {
    essentiel: "L'Essentiel",
    lessentiel: "L'Essentiel",
    signature: "Signature",
    prive: "Privé",
    petite: "Petite",
  }
  return map[type.toLowerCase()] || type
}

function getBillingLabel(cycle: string | null): string {
  if (!cycle) return ""
  if (cycle === "quarterly") return "Trimestral"
  if (cycle === "monthly") return "Mensual"
  if (cycle === "yearly" || cycle === "annual") return "Anual"
  return cycle
}

function formatDate(iso: string | null): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString("es-ES", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })
  } catch {
    return "—"
  }
}

function formatBrand(brand: string): string {
  const map: Record<string, string> = {
    visa: "Visa",
    mastercard: "Mastercard",
    amex: "American Express",
    discover: "Discover",
    diners: "Diners",
    jcb: "JCB",
    unionpay: "UnionPay",
  }
  return map[brand?.toLowerCase()] || (brand?.charAt(0).toUpperCase() + brand?.slice(1)) || "Tarjeta"
}

export function SubscriptionSummaryCard() {
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const { data, error, isLoading } = useSWR<Summary>("/api/user/subscription-summary", fetcher, {
    revalidateOnFocus: false,
  })

  const handleCopy = async () => {
    if (!data?.friendly_id) return
    try {
      await navigator.clipboard.writeText(data.friendly_id)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // fallback silencioso
    }
  }

  console.log("[v0] SubscriptionSummaryCard render", { isLoading, error, data })

  if (isLoading) {
    return (
      <Card className="border-rose-pastel/40">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
        </CardContent>
      </Card>
    )
  }

  if (error) {
    console.log("[v0] SubscriptionSummaryCard SWR error:", error)
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="py-6 text-sm text-amber-900">
          No se pudo cargar el resumen de tu suscripcion. Recarga la pagina para reintentar.
        </CardContent>
      </Card>
    )
  }

  if (!data) {
    return null
  }

  if (data.error) {
    console.log("[v0] SubscriptionSummaryCard API error:", data.error)
    return (
      <Card className="border-amber-200 bg-amber-50/50">
        <CardContent className="py-6 text-sm text-amber-900">
          {data.error}
        </CardContent>
      </Card>
    )
  }

  // Si Stripe no esta disponible pero hay datos basicos, igual mostramos
  const hasAnyData =
    data.friendly_id || data.member_since || data.membership_type || data.next_charge_at

  return (
    <Card className="border-rose-pastel/40">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-xl text-indigo-dark flex items-center gap-2">
          <Crown className="h-5 w-5 text-rose-pastel" />
          Resumen de tu suscripción
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {/* ID de suscripción */}
          {data.friendly_id && (
            <div className="flex items-start gap-3">
              <Hash className="h-4 w-4 text-slate-400 mt-1 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
                  ID de suscripción
                </p>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-sm font-semibold text-indigo-dark bg-rose-nude/40 px-2 py-1 rounded">
                    {data.friendly_id}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="text-slate-400 hover:text-indigo-dark transition-colors"
                    aria-label="Copiar ID"
                  >
                    {copied ? <Check className="h-4 w-4 text-green-600" /> : <Copy className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Plan actual */}
          {data.membership_type && (
            <div className="flex items-start gap-3">
              <Crown className="h-4 w-4 text-slate-400 mt-1 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
                  Plan actual
                </p>
                <p className="text-sm font-semibold text-indigo-dark">
                  {getPlanName(data.membership_type)}
                  {data.billing_cycle && (
                    <span className="ml-2 text-xs text-slate-500 font-normal">
                      · {getBillingLabel(data.billing_cycle)}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Socia desde */}
          {data.member_since && (
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-slate-400 mt-1 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
                  Socia desde
                </p>
                <p className="text-sm font-semibold text-indigo-dark">
                  {formatDate(data.member_since)}
                </p>
              </div>
            </div>
          )}

          {/* Próximo cobro / fin de acceso */}
          {(data.next_charge_at || data.end_date) && (
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-slate-400 mt-1 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
                  {data.stripe_status === "canceled" || data.end_date
                    ? "Acceso hasta"
                    : "Próximo cobro"}
                </p>
                <p className="text-sm font-semibold text-indigo-dark">
                  {formatDate(data.next_charge_at || data.end_date)}
                </p>
              </div>
            </div>
          )}

          {/* Método de pago */}
          {data.payment_method && (
            <div className="flex items-start gap-3 md:col-span-2">
              <CreditCard className="h-4 w-4 text-slate-400 mt-1 shrink-0" />
              <div className="flex-1 min-w-0 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
                    Método de pago
                  </p>
                  <p className="text-sm font-semibold text-indigo-dark">
                    {formatBrand(data.payment_method.brand)} •••• {data.payment_method.last4}
                    <span className="ml-2 text-xs text-slate-500 font-normal">
                      Caduca {String(data.payment_method.exp_month).padStart(2, "0")}/
                      {String(data.payment_method.exp_year).slice(-2)}
                    </span>
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-rose-pastel/60 text-indigo-dark hover:bg-rose-nude/40"
                  onClick={() => router.push("/dashboard/payment-method")}
                >
                  Cambiar
                </Button>
              </div>
            </div>
          )}

          {/* Si no tenemos método de pago pero hay membresía activa */}
          {!data.payment_method && data.membership_type && (
            <div className="flex items-start gap-3 md:col-span-2">
              <CreditCard className="h-4 w-4 text-slate-400 mt-1 shrink-0" />
              <div className="flex-1 min-w-0 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500 mb-1">
                    Método de pago
                  </p>
                  <p className="text-sm text-slate-500">No configurado</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-rose-pastel/60 text-indigo-dark hover:bg-rose-nude/40"
                  onClick={() => router.push("/dashboard/payment-method")}
                >
                  Configurar
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Estado en Stripe si no es active (informativo) */}
        {data.stripe_status && data.stripe_status !== "active" && data.stripe_status !== "trialing" && (
          <div className="mt-5 pt-4 border-t border-rose-pastel/30">
            <div className="flex items-center gap-2 text-xs text-slate-600">
              <span>Estado en Stripe:</span>
              <Badge variant="outline" className="font-mono">
                {data.stripe_status}
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
