"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

const QR_URL = "https://www.semzoprive.com/lista-privada"

export default function QRPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    // Genera QR usando la API pública de QR Server
    const img = new Image()
    img.crossOrigin = "anonymous"
    img.src = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(QR_URL)}&size=400x400&margin=20&color=1a1a4b&bgcolor=f8f6f3&format=png`
    img.onload = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext("2d")
      if (!ctx) return
      ctx.drawImage(img, 0, 0, 400, 400)
    }
  }, [])

  const handleDownload = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const link = document.createElement("a")
    link.download = "semzo-prive-lista-privada-qr.png"
    link.href = canvas.toDataURL("image/png")
    link.click()
  }

  return (
    <div className="min-h-screen bg-[#f8f6f3] flex flex-col items-center justify-center px-4 py-16">
      <Link href="/" className="mb-10 font-serif text-2xl text-[#1a1a4b]">
        Semzo Privé
      </Link>

      <div className="rounded-2xl border border-gray-200 bg-white p-10 shadow-lg flex flex-col items-center gap-6 max-w-sm w-full">
        <p className="text-sm uppercase tracking-widest text-gray-400">Lista Privada · Marbella</p>
        <h1 className="font-serif text-2xl text-[#1a1a4b] text-center">Escanea para unirte</h1>

        {/* QR generado */}
        <canvas
          ref={canvasRef}
          width={400}
          height={400}
          className="w-64 h-64 rounded-xl"
        />

        {/* URL visible */}
        <p className="text-xs text-gray-400 tracking-wide">{QR_URL}</p>

        <Button
          onClick={handleDownload}
          className="w-full bg-[#1a1a4b] text-white hover:bg-[#1a1a4b]/90 gap-2"
        >
          <Download className="h-4 w-4" />
          Descargar QR
        </Button>
      </div>

      <p className="mt-8 text-xs text-gray-400 text-center max-w-xs">
        Imprime este QR en flyers, tarjetas o soporte físico. Dirige a las usuarias directamente al formulario de acceso prioritario.
      </p>
    </div>
  )
}
