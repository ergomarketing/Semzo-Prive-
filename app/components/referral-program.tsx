"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Share2, Copy, Check } from "lucide-react"

export default function ReferralProgram() {
  const [copied, setCopied] = useState(false)
  const referralLink = "https://semzoprive.com/r/MARIA2023"

  const copyToClipboard = () => {
    navigator.clipboard.writeText(referralLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-rose-500 to-indigo-500 text-white rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Share2 className="h-5 w-5" />
          Programa de Referidos
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        <p className="mb-4">
          Invita a tus amigas y recibe un mes gratis cuando se suscriban. Ellas también recibirán un 15% de descuento en
          su primera mensualidad.
        </p>

        <div className="flex items-center gap-2 mb-6">
          <Input value={referralLink} readOnly className="bg-gray-50" />
          <Button size="icon" onClick={copyToClipboard} variant="outline" className="flex-shrink-0">
            {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-rose-500">3</p>
            <p className="text-sm text-gray-500">Amigas referidas</p>
          </div>
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-2xl font-bold text-indigo-500">1</p>
            <p className="text-sm text-gray-500">Meses gratis ganados</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
