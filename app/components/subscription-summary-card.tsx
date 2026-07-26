"use client"

import useSWR from "swr"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Copy, Check, CreditCard, Calendar, Hash, Crown, Loader2, AlertTriangle } from "lucide-react"
import { useRouter } from "next/navigation"
import { ChangePaymentMethodDialog } from "./change-payment-method-dialog"
import { useTranslations, useLocale } from "next-intl"

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
  membership_status: string | null
  cancel_at_period_end: boolean | null
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

function formatDate(iso: string | null, locale: string): string {
  if (!iso) return "—"
  try {
    return new Date(iso).toLocaleDateString(locale === "en" ? "en-GB" : "es-ES", {
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
  const t = useTranslations("subscriptionCard")
  const locale = useLocale()
  const router = useRouter()
  const [copied, setCopied] = useState(false)
  const [showPaymentDialog, setShowPaymentDialog] = useState(false)
  const { data, error, isLoading, mutate } = useSWR<Summary>("/api/user/subscription-summary", fetcher, {
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

  if (isLoading) {
    return (
      <Card className="border-rose-pastel/40">
        <CardContent className="flex items-center gap-3 py-6">
          <Loader2 className="h-5 w-5 animate-spin text-slate-400" />
          <span className="text-sm text-slate-500">{t("loading")}</span>
        </CardContent>
      </Card>
    )
  }

  if (error || !data || data.error) {
    return null
  }

  // Si Stripe no esta disponible pero hay datos basicos, igual mostramos
  const hasAnyData =
    data.friendly_id || data.member_since || data.membership_type || data.next_charge_at

  return (
    <Card className="border-rose-pastel/40">
      <CardHeader className="pb-3">
        <CardTitle className="font-serif text-xl text-indigo-dark flex items-center gap-2">
          <Crown className="h-5 w-5 text-rose-pastel" />
          {t("title")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-5">
          {/* ID de suscripción */}
          {data.friendly_id && (
            <div className="flex items-start gap-3">
              <Hash className="h-4 w-4 text-indigo-dark/60 mt-1 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-dark/70 mb-1">
                  {t("subscriptionId")}
                </p>
                <div className="flex items-center gap-2">
                  <code className="font-mono text-sm font-semibold text-indigo-dark bg-rose-nude/40 px-2 py-1 rounded">
                    {data.friendly_id}
                  </code>
                  <button
                    onClick={handleCopy}
                    className="text-indigo-dark/60 hover:text-indigo-dark transition-colors"
                    aria-label={t("copyId")}
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
              <Crown className="h-4 w-4 text-indigo-dark/60 mt-1 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-dark/70 mb-1">
                  {t("currentPlan")}
                </p>
                <p className="text-sm font-semibold text-indigo-dark">
                  {getPlanName(data.membership_type)}
                  {data.billing_cycle && (
                    <span className="ml-2 text-xs text-indigo-dark/60 font-normal">
                      · {data.billing_cycle === "quarterly" ? t("billingQuarterly") : data.billing_cycle === "monthly" ? t("billingMonthly") : data.billing_cycle === "yearly" || data.billing_cycle === "annual" ? t("billingYearly") : data.billing_cycle}
                    </span>
                  )}
                </p>
              </div>
            </div>
          )}

          {/* Socia desde */}
          {data.member_since && (
            <div className="flex items-start gap-3">
              <Calendar className="h-4 w-4 text-indigo-dark/60 mt-1 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-dark/70 mb-1">
                  {t("memberSince")}
                </p>
                <p className="text-sm font-semibold text-indigo-dark">
                  {formatDate(data.member_since, locale)}
                </p>
              </div>
            </div>
          )}

          {/* Próximo cobro / fin de acceso */}
          {(() => {
            // Estados que NO representan una suscripción al corriente: para ellos
            // la fecha relevante es el fin de acceso REAL de BD (end_date), no la
            // proyección de próximo cobro de Stripe (next_charge_at).
            const isEndedOrUnpaid =
              ["past_due", "expired", "cancelled", "canceled", "cancelling", "limited_access"].includes(
                data.membership_status || "",
              ) ||
              data.stripe_status === "canceled" ||
              data.stripe_status === "past_due" ||
              data.stripe_status === "unpaid" ||
              data.cancel_at_period_end === true

            const displayDate = isEndedOrUnpaid
              ? data.end_date || data.next_charge_at
              : data.next_charge_at || data.end_date

            if (!displayDate) return null

            return (
              <div className="flex items-start gap-3">
                <Calendar className="h-4 w-4 text-indigo-dark/60 mt-1 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-dark/70 mb-1">
                    {isEndedOrUnpaid ? t("accessUntil") : t("nextCharge")}
                  </p>
                  <p className="text-sm font-semibold text-indigo-dark">{formatDate(displayDate, locale)}</p>
                </div>
              </div>
            )
          })()}

          {/* Método de pago */}
          {data.payment_method && (
            <div className="flex items-start gap-3 md:col-span-2">
              <CreditCard className="h-4 w-4 text-indigo-dark/60 mt-1 shrink-0" />
              <div className="flex-1 min-w-0 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-dark/70 mb-1">
                    {t("paymentMethod")}
                  </p>
                  <p className="text-sm font-semibold text-indigo-dark">
                    {formatBrand(data.payment_method.brand)} •••• {data.payment_method.last4}
                    {data.payment_method.exp_month > 0 && data.payment_method.exp_year > 0 && (
                      <span className="ml-2 text-xs text-indigo-dark/60 font-normal">
                        {t("expires")} {String(data.payment_method.exp_month).padStart(2, "0")}/
                        {String(data.payment_method.exp_year).slice(-2)}
                      </span>
                    )}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-rose-pastel/60 text-indigo-dark hover:bg-rose-nude/40"
                  onClick={() => setShowPaymentDialog(true)}
                >
                  {t("change")}
                </Button>
              </div>
            </div>
          )}

          {/* Si no tenemos método de pago pero hay membresía activa */}
          {!data.payment_method && data.membership_type && (
            <div className="flex items-start gap-3 md:col-span-2">
              <CreditCard className="h-4 w-4 text-indigo-dark/60 mt-1 shrink-0" />
              <div className="flex-1 min-w-0 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-indigo-dark/70 mb-1">
                    {t("paymentMethod")}
                  </p>
                  <p className="text-sm text-indigo-dark/60">{t("notConfigured")}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="bg-transparent border-rose-pastel/60 text-indigo-dark hover:bg-rose-nude/40"
                  onClick={() => setShowPaymentDialog(true)}
                >
                  {t("configure")}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Acciones de la suscripcion (Fase B sencilla: solo reportar incidencia) */}
        <div className="mt-5 pt-4 border-t border-rose-pastel/30 flex items-center justify-between flex-wrap gap-3">
          <div className="flex items-center gap-2 text-xs text-indigo-dark/70" />
          <Button
            variant="ghost"
            size="sm"
            className="text-indigo-dark hover:text-indigo-dark hover:bg-rose-nude/40"
            asChild
          >
            <a
              href={`mailto:soporte@semzoprive.com?subject=${encodeURIComponent(
                `Reportar incidencia - ${data.friendly_id ?? "Suscripcion"}`,
              )}&body=${encodeURIComponent(
                `Hola equipo Semzo,\n\nQuiero reportar una incidencia con mi bolso.\n\nID de suscripcion: ${data.friendly_id ?? "-"}\nPlan: ${getPlanName(data.membership_type)}\n\nDescripcion del problema:\n\n\nGracias.`,
              )}`}
            >
              <AlertTriangle className="h-4 w-4 mr-2" />
              {t("reportIssue")}
            </a>
          </Button>
        </div>
      </CardContent>

      <ChangePaymentMethodDialog
        open={showPaymentDialog}
        onOpenChange={setShowPaymentDialog}
        currentBrand={data.payment_method?.brand ?? null}
        currentLast4={data.payment_method?.last4 ?? null}
        membershipType={data.membership_type ?? "signature"}
        onSuccess={() => mutate()}
      />
    </Card>
  )
}
