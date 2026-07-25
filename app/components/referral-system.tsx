"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Copy, Check, Gift, Users, Crown, Wallet, Loader2 } from "lucide-react"
import { useTranslations, useLocale } from "next-intl"

interface ReferralStatsResponse {
  referralCode: string
  referralLink: string
  totalReferrals: number
  pendingReferrals: number
  qualifiedReferrals: number
  rewardedReferrals: number
  balanceEuros: number
}

interface RedemptionRow {
  id: string
  amount_euros: number
  status: "pending" | "applied" | "failed" | "reverted"
  created_at: string
  applied_at: string | null
  failure_reason: string | null
}

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error || `HTTP ${res.status}`)
  }
  return await res.json()
}

const REDEEM_OPTIONS = [50, 100, 150, 200, 250, 300, 350, 400, 450, 500]

export default function ReferralSystem() {
  const t = useTranslations("referralSystem")
  const locale = useLocale()
  const [copied, setCopied] = useState(false)
  const [redeemOpen, setRedeemOpen] = useState(false)
  const [redeemAmount, setRedeemAmount] = useState<number>(50)
  const [redeemLoading, setRedeemLoading] = useState(false)
  const [redeemError, setRedeemError] = useState<string | null>(null)
  const [redeemSuccess, setRedeemSuccess] = useState<string | null>(null)

  const {
    data,
    error,
    isLoading,
    mutate,
  } = useSWR<ReferralStatsResponse>("/api/referrals/me", fetcher, {
    revalidateOnFocus: false,
  })

  const { data: historyData, mutate: mutateHistory } = useSWR<{ redemptions: RedemptionRow[] }>(
    "/api/referrals/redemptions",
    fetcher,
    { revalidateOnFocus: false },
  )

  if (isLoading) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-10 text-center text-slate-500">
          {t("loading")}
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-10 text-center text-slate-500">
          {t("loadError")}
        </CardContent>
      </Card>
    )
  }

  const copyToClipboard = () => {
    navigator.clipboard.writeText(data.referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareViaWhatsApp = () => {
    const message = t("whatsappMsg", { link: data.referralLink })
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank")
  }

  const shareViaEmail = () => {
    const subject = t("emailSubject")
    const body = t("emailBody", { link: data.referralLink })
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`)
  }

  const openRedeemDialog = () => {
    setRedeemError(null)
    setRedeemSuccess(null)
    // Por defecto canjear todo lo posible en multiplos de 50.
    const maxRedeemable = Math.floor(data.balanceEuros / 50) * 50
    setRedeemAmount(Math.min(50, Math.max(50, maxRedeemable || 50)))
    setRedeemOpen(true)
  }

  const handleRedeem = async () => {
    setRedeemLoading(true)
    setRedeemError(null)
    setRedeemSuccess(null)

    try {
      const res = await fetch("/api/referrals/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: redeemAmount }),
      })
      const body = await res.json().catch(() => ({}))

      if (!res.ok || !body?.ok) {
        const reasonMap: Record<string, string> = {
          insufficient_balance: t("reasonInsufficient"),
          no_stripe_customer: t("reasonNoStripe"),
          another_pending: t("reasonPending"),
          invalid_amount: t("reasonInvalid"),
          stripe_error: body?.message || t("reasonStripe"),
          unauthorized: t("reasonUnauthorized"),
        }
        setRedeemError(reasonMap[body?.reason] || body?.message || t("errorCode", { reason: body?.reason }))
        setRedeemLoading(false)
        return
      }

      setRedeemSuccess(body.message || `${redeemAmount}€ canjeados.`)
      // Refrescar balance e historial.
      await Promise.all([mutate(), mutateHistory()])
    } catch (err: any) {
      setRedeemError(err?.message || "Error de red.")
    } finally {
      setRedeemLoading(false)
    }
  }

  const canRedeem = data.balanceEuros >= 50
  const maxRedeem = Math.min(500, Math.floor(data.balanceEuros / 50) * 50)
  const availableOptions = REDEEM_OPTIONS.filter((v) => v <= maxRedeem)

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="border-0 shadow-lg bg-gradient-to-r from-rose-nude to-rose-pastel/30">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-2xl font-serif text-indigo-dark">
            <Gift className="h-6 w-6" />
            {t("programTitle")}
          </CardTitle>
          <p className="text-slate-700 mt-2">{t("programDesc")}</p>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-indigo-dark mx-auto mb-2" />
            <p className="text-2xl font-bold text-indigo-dark">{data.totalReferrals}</p>
            <p className="text-sm text-slate-600">{t("statFriends")}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <Crown className="h-8 w-8 text-rose-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-rose-500">{data.qualifiedReferrals}</p>
            <p className="text-sm text-slate-600">{t("statQualified")}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-amber-600 font-bold">⏳</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{data.pendingReferrals}</p>
            <p className="text-sm text-slate-600">{t("statPending")}</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 font-bold">€</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{data.balanceEuros}€</p>
            <p className="text-sm text-slate-600">{t("statCredit")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Canje de credito */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-serif text-indigo-dark flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {t("redeemTitle")}
          </CardTitle>
          <p className="text-sm text-slate-600 mt-1">{t("redeemDesc")}</p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={openRedeemDialog}
            disabled={!canRedeem}
            className="bg-indigo-dark hover:bg-indigo-dark/90 text-white"
          >
            {canRedeem ? t("redeemBtn", { amount: data.balanceEuros }) : t("redeemNeedMore")}
          </Button>
          {!canRedeem && data.balanceEuros > 0 && (
            <p className="text-xs text-slate-500 mt-2">
              {t("redeemNeedMoreHint", { amount: data.balanceEuros })}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Historial de canjes */}
      {historyData?.redemptions && historyData.redemptions.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-serif text-indigo-dark">
              {t("redemptionHistory")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {historyData.redemptions.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-4 py-3 border-b border-slate-100 last:border-0"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-indigo-dark">{r.amount_euros}€</p>
                    <p className="text-xs text-slate-500">
                      {new Date(r.created_at).toLocaleDateString(locale === "en" ? "en-GB" : "es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      {r.applied_at &&
                        ` · ${t("statusApplied")} ${new Date(r.applied_at).toLocaleDateString(locale === "en" ? "en-GB" : "es-ES")}`}
                    </p>
                    {r.status === "failed" && r.failure_reason && (
                      <p className="text-xs text-rose-600 mt-1">{t("errorCode", { reason: r.failure_reason })}</p>
                    )}
                  </div>
                  <span
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      r.status === "applied"
                        ? "bg-green-100 text-green-700"
                        : r.status === "pending"
                          ? "bg-amber-100 text-amber-700"
                          : "bg-rose-100 text-rose-700"
                    }`}
                  >
                    {r.status === "applied"
                      ? t("statusApplied")
                      : r.status === "pending"
                        ? t("statusPending")
                        : r.status === "failed"
                          ? t("statusFailed")
                          : t("statusReverted")}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referral Link */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-serif text-indigo-dark">
            {t("referralLinkTitle")}
          </CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            {t("code")}{" "}
            <span className="font-mono font-semibold text-indigo-dark">{data.referralCode}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input value={data.referralLink} readOnly className="bg-slate-50 font-mono text-sm" />
            <Button size="icon" onClick={copyToClipboard} variant="outline" className="flex-shrink-0" title={copied ? t("copied") : t("copyCode")}>
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button onClick={shareViaWhatsApp} className="bg-green-600 hover:bg-green-700 text-white">
              {t("shareWhatsApp")}
            </Button>
            <Button
              onClick={shareViaEmail}
              variant="outline"
              className="border-indigo-dark text-indigo-dark hover:bg-indigo-dark hover:text-white"
            >
              {t("shareEmail")}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-serif text-indigo-dark">{t("howItWorksTitle")}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-rose-nude rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-indigo-dark font-bold">1</span>
              </div>
              <h4 className="font-semibold text-indigo-dark mb-2">{t("step1Title")}</h4>
              <p className="text-sm text-slate-600">{t("step1Desc")}</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-rose-pastel/50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-indigo-dark font-bold">2</span>
              </div>
              <h4 className="font-semibold text-indigo-dark mb-2">{t("step2Title")}</h4>
              <p className="text-sm text-slate-600">{t("step2Desc")}</p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-dark rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">3</span>
              </div>
              <h4 className="font-semibold text-indigo-dark mb-2">{t("step3Title")}</h4>
              <p className="text-sm text-slate-600">{t("step3Desc")}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms */}
      <Card className="border-0 shadow-md bg-slate-50">
        <CardContent className="p-4">
          <h4 className="font-semibold text-slate-800 mb-2">{t("termsTitle")}</h4>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• {t("term1")}</li>
            <li>• {t("term2")}</li>
            <li>• {t("term3")}</li>
            <li>• {t("term4")}</li>
            <li>• {t("term5")}</li>
            <li>• {t("term6")}</li>
          </ul>
        </CardContent>
      </Card>

      {/* Dialog de canje */}
      <Dialog open={redeemOpen} onOpenChange={setRedeemOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-indigo-dark">{t("redeemTitle")}</DialogTitle>
            <DialogDescription>{t("dialogDesc")}</DialogDescription>
          </DialogHeader>

          {redeemSuccess ? (
            <div className="py-6 text-center space-y-3">
              <div className="mx-auto h-12 w-12 rounded-full bg-green-100 flex items-center justify-center">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <p className="font-semibold text-indigo-dark">¡Canje realizado!</p>
              <p className="text-sm text-slate-600">{redeemSuccess}</p>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">
                  Importe a canjear
                </label>
                <Select
                  value={String(redeemAmount)}
                  onValueChange={(v) => setRedeemAmount(Number(v))}
                  disabled={redeemLoading}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableOptions.map((v) => (
                      <SelectItem key={v} value={String(v)}>
                        {v}€
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="bg-slate-50 rounded-md p-3 text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Saldo actual</span>
                  <span className="font-semibold text-indigo-dark">{data.balanceEuros}€</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Canje</span>
                  <span className="font-semibold text-rose-600">-{redeemAmount}€</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-1 mt-1">
                  <span className="text-slate-700 font-medium">Saldo restante</span>
                  <span className="font-bold text-indigo-dark">
                    {data.balanceEuros - redeemAmount}€
                  </span>
                </div>
              </div>

              {redeemError && (
                <p className="text-sm text-rose-600 bg-rose-50 rounded-md p-2">{redeemError}</p>
              )}
            </div>
          )}

          <DialogFooter>
            {redeemSuccess ? (
              <Button onClick={() => setRedeemOpen(false)} className="bg-indigo-dark hover:bg-indigo-dark/90 text-white">
                Cerrar
              </Button>
            ) : (
              <>
                <Button variant="outline" onClick={() => setRedeemOpen(false)} disabled={redeemLoading}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleRedeem}
                  disabled={redeemLoading || availableOptions.length === 0}
                  className="bg-indigo-dark hover:bg-indigo-dark/90 text-white"
                >
                  {redeemLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Procesando...
                    </>
                  ) : (
                    `Confirmar canje de ${redeemAmount}€`
                  )}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
