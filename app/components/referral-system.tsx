"use client"

import { useState } from "react"
import useSWR from "swr"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Check, Gift, Users, Crown } from "lucide-react"

interface ReferralStatsResponse {
  referralCode: string
  referralLink: string
  totalReferrals: number
  pendingReferrals: number
  qualifiedReferrals: number
  rewardedReferrals: number
  balanceEuros: number
}

const fetcher = async (url: string) => {
  const res = await fetch(url, { credentials: "include" })
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body?.error || `HTTP ${res.status}`)
  }
  return (await res.json()) as ReferralStatsResponse
}

export default function ReferralSystem() {
  const [copied, setCopied] = useState(false)
  // Fase 1: leemos del backend real. Sin datos mock.
  const { data, error, isLoading } = useSWR<ReferralStatsResponse>(
    "/api/referrals/me",
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

      {/* Referral Link */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-serif text-indigo-dark">
            Tu enlace de referido
          </CardTitle>
          <p className="text-xs text-slate-500 mt-1">
            Código: <span className="font-mono font-semibold text-indigo-dark">{data.referralCode}</span>
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
            <li>• Semzo Privé puede modificar o cancelar el programa con preaviso.</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
