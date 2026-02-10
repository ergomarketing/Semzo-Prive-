"use client"

import { useState } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Download, Copy, Check } from "lucide-react"
import { Button } from "@/app/components/ui/button"

export default function InvitacionesAdmin() {
  const [copied, setCopied] = useState(false)
  const invitationUrl = "https://semzoprive.com/invitacion"
  const couponCode = "PRIVE50"

  const handleCopyUrl = () => {
    navigator.clipboard.writeText(invitationUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleDownloadQR = () => {
    const svg = document.getElementById("qr-code-svg")
    if (!svg) return

    const svgData = new XMLSerializer().serializeToString(svg)
    const canvas = document.createElement("canvas")
    const ctx = canvas.getContext("2d")
    const img = new Image()

    canvas.width = 1000
    canvas.height = 1000

    img.onload = () => {
      ctx!.fillStyle = "white"
      ctx!.fillRect(0, 0, 1000, 1000)
      ctx!.drawImage(img, 0, 0, 1000, 1000)

      const pngFile = canvas.toDataURL("image/png")
      const downloadLink = document.createElement("a")
      downloadLink.download = "semzo-prive-invitacion-qr.png"
      downloadLink.href = pngFile
      downloadLink.click()
    }

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
  }

  return (
    <div className="min-h-screen bg-[#fff0f3] p-8">
      <div className="mx-auto max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="font-serif text-4xl font-bold text-[#1a1a4b] mb-2">Generador de Invitaciones</h1>
          <p className="text-gray-600">
            Genera códigos QR para tarjetas de invitación exclusivas con descuento PRIVE50
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {/* QR Code Preview */}
          <div className="bg-white rounded-lg border border-gray-200 p-8">
            <h2 className="font-serif text-2xl font-bold text-[#1a1a4b] mb-6">Código QR</h2>

            <div className="flex justify-center mb-6">
              <div className="bg-white p-6 rounded-lg border-2 border-[#1a1a4b]">
                <QRCodeSVG
                  id="qr-code-svg"
                  value={invitationUrl}
                  size={256}
                  level="H"
                  includeMargin={true}
                  fgColor="#1a1a4b"
                  bgColor="#ffffff"
                />
              </div>
            </div>

            <Button onClick={handleDownloadQR} className="w-full bg-[#1a1a4b] hover:bg-[#1a1a4b]/90 text-white">
              <Download className="w-4 h-4 mr-2" />
              Descargar QR (1000x1000px)
            </Button>

            <p className="text-xs text-gray-500 mt-4 text-center">Formato PNG de alta resolución para impresión</p>
          </div>

          {/* Info and Settings */}
          <div className="space-y-6">
            {/* URL Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-[#1a1a4b] mb-3">URL de Invitación</h3>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={invitationUrl}
                  readOnly
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm"
                />
                <Button
                  onClick={handleCopyUrl}
                  variant="outline"
                  size="sm"
                  className="border-[#1a1a4b] text-[#1a1a4b] hover:bg-[#fff0f3] bg-transparent"
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                </Button>
              </div>
            </div>

            {/* Coupon Info */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-[#1a1a4b] mb-3">Código de Descuento</h3>
              <div className="bg-[#fff0f3] border-2 border-[#f4c4cc] rounded-lg p-4">
                <p className="text-3xl font-bold text-[#1a1a4b] text-center tracking-wider">{couponCode}</p>
                <p className="text-sm text-gray-600 text-center mt-2">50% de descuento primer mes</p>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-[#1a1a4b] mb-3">Instrucciones de Uso</h3>
              <ol className="text-sm text-gray-600 space-y-2">
                <li className="flex gap-2">
                  <span className="font-semibold text-[#1a1a4b]">1.</span>
                  Descarga el código QR en alta resolución
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-[#1a1a4b]">2.</span>
                  Imprime el QR en tus tarjetas de invitación
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-[#1a1a4b]">3.</span>
                  Los invitados escanean y acceden a /invitacion
                </li>
                <li className="flex gap-2">
                  <span className="font-semibold text-[#1a1a4b]">4.</span>
                  Aplican el código PRIVE50 en el checkout
                </li>
              </ol>
            </div>

            {/* Stats */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <h3 className="font-semibold text-[#1a1a4b] mb-3">Estadísticas</h3>
              <p className="text-sm text-gray-600">
                Para ver el uso del cupón PRIVE50, ve al{" "}
                <a
                  href="https://dashboard.stripe.com/coupons"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#1a1a4b] underline hover:text-[#f4c4cc]"
                >
                  Dashboard de Stripe
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Preview Card */}
        <div className="mt-8 bg-white rounded-lg border border-gray-200 p-8">
          <h3 className="font-serif text-2xl font-bold text-[#1a1a4b] mb-6 text-center">Vista Previa de Tarjeta</h3>
          <div className="max-w-md mx-auto bg-gradient-to-br from-[#1a1a4b] to-[#2a2a5b] rounded-lg p-8 text-white shadow-xl">
            <div className="text-center mb-6">
              <h4 className="font-serif text-2xl mb-2">SEMZO PRIVÉ</h4>
              <p className="text-sm opacity-80">Invitación Exclusiva</p>
            </div>

            <div className="bg-white p-4 rounded-lg mb-6">
              <QRCodeSVG
                value={invitationUrl}
                size={180}
                level="H"
                includeMargin={true}
                fgColor="#1a1a4b"
                bgColor="#ffffff"
                className="mx-auto"
              />
            </div>

            <div className="text-center">
              <p className="text-xs mb-2 opacity-80">Código de descuento:</p>
              <p className="text-xl font-bold tracking-wider bg-white/10 rounded px-4 py-2">{couponCode}</p>
              <p className="text-xs mt-3 opacity-70">50% de descuento en tu primer mes</p>
            </div>
          </div>
          <p className="text-center text-sm text-gray-500 mt-4">Ejemplo de cómo se vería en una tarjeta física</p>
        </div>
      </div>
    </div>
  )
}
