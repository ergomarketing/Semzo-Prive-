"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, Check, Gift, Users, Crown } from "lucide-react"

interface ReferralData {
  referralCode: string
  referralsCount: number
  freeMonthsEarned: number
  pendingReferrals: number
  totalSavings: number
}

export default function ReferralSystem() {
  const [copied, setCopied] = useState(false)
  const [referralData, setReferralData] = useState<ReferralData>({
    referralCode: "MARIA2024",
    referralsCount: 3,
    freeMonthsEarned: 1,
    pendingReferrals: 2,
    totalSavings: 129,
  })

  const referralLink = `https://semzoprive.com/signup?ref=${referralData.referralCode}`

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const shareViaWhatsApp = () => {
    const message = `¡Descubre Semzo Privé! 💎 Alquila bolsos de lujo de Chanel, Hermès, Dior y más. Con mi código obtienes 15% de descuento en tu primera mensualidad: ${referralLink}`
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, "_blank")
  }

  const shareViaEmail = () => {
    const subject = "¡Descubre Semzo Privé - Bolsos de lujo por suscripción!"
    const body = `Hola,\n\n¡Te tengo que contar sobre Semzo Privé! Es una plataforma increíble donde puedes alquilar bolsos de lujo de marcas como Chanel, Hermès, Dior y Louis Vuitton por una fracción del precio.\n\nCon mi código de referido obtienes un 15% de descuento en tu primera mensualidad:\n${referralLink}\n\n¡Es el arte de poseer sin comprar! 💎\n\nUn abrazo`
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
            Invita a tus amigas y gana meses gratis. Ellas también obtienen descuentos especiales.
          </p>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <Users className="h-8 w-8 text-indigo-dark mx-auto mb-2" />
            <p className="text-2xl font-bold text-indigo-dark">{referralData.referralsCount}</p>
            <p className="text-sm text-slate-600">Amigas referidas</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <Crown className="h-8 w-8 text-rose-500 mx-auto mb-2" />
            <p className="text-2xl font-bold text-rose-500">{referralData.freeMonthsEarned}</p>
            <p className="text-sm text-slate-600">Meses gratis ganados</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <div className="h-8 w-8 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-amber-600 font-bold">⏳</span>
            </div>
            <p className="text-2xl font-bold text-amber-600">{referralData.pendingReferrals}</p>
            <p className="text-sm text-slate-600">Pendientes</p>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-md">
          <CardContent className="p-4 text-center">
            <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
              <span className="text-green-600 font-bold">€</span>
            </div>
            <p className="text-2xl font-bold text-green-600">{referralData.totalSavings}€</p>
            <p className="text-sm text-slate-600">Ahorrado total</p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card className="border-0 shadow-md">
        <CardHeader>
          <CardTitle className="text-lg font-serif text-indigo-dark">Tu enlace de referido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Input value={referralLink} readOnly className="bg-slate-50 font-mono text-sm" />
            <Button size="icon" onClick={copyToClipboard} variant="outline" className="flex-shrink-0">
              {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Button onClick={shareViaWhatsApp} className="bg-green-600 hover:bg-green-700 text-white">
              <span className="mr-2">📱</span>
              Compartir por WhatsApp
            </Button>
            <Button
              onClick={shareViaEmail}
              variant="outline"
              className="border-indigo-dark text-indigo-dark hover:bg-indigo-dark hover:text-white"
            >
              <span className="mr-2">📧</span>
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
                Envía tu enlace personalizado a tus amigas por WhatsApp, email o redes sociales.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-rose-pastel/50 rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-indigo-dark font-bold">2</span>
              </div>
              <h4 className="font-semibold text-indigo-dark mb-2">Ellas se suscriben</h4>
              <p className="text-sm text-slate-600">
                Tus amigas obtienen 15% de descuento en su primera mensualidad usando tu código.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-dark rounded-full flex items-center justify-center mx-auto mb-3">
                <span className="text-white font-bold">3</span>
              </div>
              <h4 className="font-semibold text-indigo-dark mb-2">Tú ganas</h4>
              <p className="text-sm text-slate-600">
                Por cada 3 referidos exitosos, obtienes 1 mes completamente gratis.
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
            <li>• Las amigas referidas deben completar al menos 1 mes de suscripción</li>
            <li>• Los meses gratis se acreditan automáticamente cada 3 referidos exitosos</li>
            <li>• El descuento del 15% aplica solo para la primera mensualidad</li>
            <li>• No hay límite en la cantidad de referidos que puedes hacer</li>
            <li>• Los meses gratis no son transferibles ni canjeables por dinero</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}
