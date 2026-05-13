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
          Cargando tu programa de referidos...
        </CardContent>
      </Card>
    )
  }

  if (error || !data) {
    return (
      <Card className="border-0 shadow-md">
        <CardContent className="p-10 text-center text-slate-500">
          No hemos podido cargar tu programa de referidos. Vuelve a
          intentarlo en unos segundos.
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
    const message = `¡Descubre Semzo Privé! Alquila bolsos de lujo de Chanel, Hermès, Dior y más. Regístrate con mi enlace y obtén 50€ en crédito en tu primera membresía: ${data.referralLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank")
  }

  const shareViaEmail = () => {
    const subject = "Te invito a Semzo Privé — 50€ de crédito"
    const body = `Hola,\n\nTe invito a Semzo Privé, la plataforma premium de alquiler de bolsos de lujo (Chanel, Hermès, Dior, Louis Vuitton y más).\n\nRegístrate con mi enlace y obtén 50€ en crédito Semzo Privé en tu primera membresía:\n${data.referralLink}\n\nUn abrazo`
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
          insufficient_balance: "Saldo insuficiente para ese importe.",
          no_stripe_customer:
            "Aun no tienes un metodo de pago activo. Activa una membresia primero.",
          another_pending: "Ya tienes un canje en curso. Espera unos segundos.",
          invalid_amount: "Importe no valido.",
          stripe_error: body?.message || "Error procesando el canje. Saldo devuelto.",
          unauthorized: "Inicia sesion de nuevo.",
        }
        setRedeemError(reasonMap[body?.reason] || body?.message || "No se pudo canjear.")
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
            Programa de Referidos
          </CardTitle>
          <p className="text-slate-700 mt-2">
            Invita a tus amigas y gana 50€ en crédito Semzo Privé. Ellas
            también reciben 50€ al registrarse.
          </p>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-indigo-dark mx-auto mb-2" />
            <p className="text-2xl font-bold text-indigo-dark">{data.totalReferrals}</p>
            <p className="text-sm text-slate-600">Amigas referidas</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <Crown className="h-8 w-8 text-rose-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-rose-500">{data.qualifiedReferrals}</p>
            <p className="text-sm text-slate-600">Cualificadas (60 días)</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-amber-600 font-bold">⏳</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{data.pendingReferrals}</p>
            <p className="text-sm text-slate-600">Pendientes</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 font-bold">€</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{data.balanceEuros}€</p>
            <p className="text-sm text-slate-600">Crédito disponible</p>
          </CardContent>
        </Card>
      </div>

      {/* Canje de credito */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-serif text-indigo-dark flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Canjear crédito
          </CardTitle>
          <p className="text-sm text-slate-600 mt-1">
            Aplica tu saldo de referidos como descuento en tu próxima factura.
            Mínimo 50€, en múltiplos de 50€.
          </p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={openRedeemDialog}
            disabled={!canRedeem}
            className="bg-indigo-dark hover:bg-indigo-dark/90 text-white"
          >
            {canRedeem ? `Canjear (${data.balanceEuros}€ disponibles)` : "Necesitas al menos 50€"}
          </Button>
          {!canRedeem && data.balanceEuros > 0 && (
            <p className="text-xs text-slate-500 mt-2">
              Tienes {data.balanceEuros}€. Invita a más amigas para alcanzar el mínimo de 50€.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Historial de canjes */}
      {historyData?.redemptions && historyData.redemptions.length > 0 && (
        <Card className="border-0 shadow-md">
          <CardHeader>
            <CardTitle className="text-lg font-serif text-indigo-dark">
              Historial de canjes
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
                      {new Date(r.created_at).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                      {r.applied_at &&
                        ` · Aplicado ${new Date(r.applied_at).toLocaleDateString("es-ES")}`}
                    </p>
                    {r.status === "failed" && r.failure_reason && (
                      <p className="text-xs text-rose-600 mt-1">Error: {r.failure_reason}</p>
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
                      ? "Aplicado"
                      : r.status === "pending"
                        ? "Pendiente"
                        : r.status === "failed"
                          ? "Fallido"
                          : "Revertido"}
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
            Tu enlace de referido
          </CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            Código:{" "}
            <span className="font-mono font-semibold text-indigo-dark">{data.referralCode}</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input value={data.referralLink} readOnly className="bg-slate-50 font-mono text-sm" />
            <Button size="icon" onClick={copyToClipboard} variant="outline" className="flex-shrink-0">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button onClick={shareViaWhatsApp} className="bg-green-600 hover:bg-green-700 text-white">
              Compartir por WhatsApp
            </Button>
            <Button
              onClick={shareViaEmail}
              variant="outline"
              className="border-indigo-dark text-indigo-dark hover:bg-indigo-dark hover:text-white"
            >
              Compartir por Email
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* How it Works */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-serif text-indigo-dark">¿Cómo funciona?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-rose-nude rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-indigo-dark font-bold">1</span>
              </div>
              <h4 className="font-semibold text-indigo-dark mb-2">Comparte tu enlace</h4>
              <p className="text-sm text-slate-600">
                Envía tu enlace personalizado a tus amigas por WhatsApp, email
                o redes sociales.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-rose-pastel/50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-indigo-dark font-bold">2</span>
              </div>
              <h4 className="font-semibold text-indigo-dark mb-2">Ella se registra</h4>
              <p className="text-sm text-slate-600">
                Tu amiga obtiene 50€ en crédito Semzo Privé al activar
                cualquier membresía.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-dark rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">3</span>
              </div>
              <h4 className="font-semibold text-indigo-dark mb-2">Tú ganas 50€</h4>
              <p className="text-sm text-slate-600">
                Cuando tu amiga completa 60 días de membresía, recibes 50€ en
                crédito Semzo Privé.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Terms */}
      <Card className="border-0 shadow-md bg-slate-50">
        <CardContent className="p-4">
          <h4 className="font-semibold text-slate-800 mb-2">Términos y condiciones:</h4>
          <ul className="text-sm text-slate-600 space-y-1">
            <li>• La amiga referida debe completar al menos 60 días de membresía activa.</li>
            <li>• Los 50€ son crédito Semzo Privé aplicable a futuras mensualidades.</li>
            <li>• El crédito no es transferible ni canjeable por dinero.</li>
            <li>• No hay límite en la cantidad de referidos que puedes hacer.</li>
            <li>• Canje mínimo: 50€. Canje máximo por operación: 500€.</li>
            <li>• Semzo Privé puede modificar o cancelar el programa con preaviso.</li>
          </ul>
        </CardContent>
      </Card>

      {/* Dialog de canje */}
      <Dialog open={redeemOpen} onOpenChange={setRedeemOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif text-indigo-dark">Canjear crédito</DialogTitle>
            <DialogDescription>
              El importe se aplicará como descuento en tu próxima factura de Semzo Privé.
            </DialogDescription>
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
