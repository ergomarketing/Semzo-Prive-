"use client"

import { useState, useEffect } from "react"
import { QRCodeSVG } from "qrcode.react"
import { Download, Copy, Check, Users, RefreshCw } from "lucide-react"
import { Button } from "@/app/components/ui/button"

interface Registration {
  id: string
  nombre: string
  email: string
  whatsapp: string | null
  codigo_descuento: string
  created_at: string
}

function RegistrationsList() {
  const [registrations, setRegistrations] = useState<Registration[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRegistrations = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/invitation-registrations")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Error al cargar")
      setRegistrations(data.registrations)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRegistrations()
  }, [])

  return (
    <div className="mb-12">
      <div className="flex items-center justify-between mb-6 border-b border-[#f4c4cc] pb-3">
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-[#1a1a4b]" />
          <h2 className="font-serif text-2xl font-bold text-[#1a1a4b]">
            Registros de Invitación
            {!loading && (
              <span className="ml-3 text-base font-normal text-gray-500">
                ({registrations.length} persona{registrations.length !== 1 ? "s" : ""})
              </span>
            )}
          </h2>
        </div>
        <Button
          onClick={fetchRegistrations}
          variant="outline"
          size="sm"
          className="border-[#1a1a4b] text-[#1a1a4b] hover:bg-[#fff0f3] bg-transparent"
          disabled={loading}
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualizar
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-700 text-sm mb-4">
          Error: {error}
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          Cargando registros...
        </div>
      ) : registrations.length === 0 ? (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center text-gray-500">
          No hay registros todavía.
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-[#f8f6f3] border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 font-semibold text-[#1a1a4b]">Nombre</th>
                <th className="text-left px-4 py-3 font-semibold text-[#1a1a4b]">Email</th>
                <th className="text-left px-4 py-3 font-semibold text-[#1a1a4b]">WhatsApp</th>
                <th className="text-left px-4 py-3 font-semibold text-[#1a1a4b]">Código</th>
                <th className="text-left px-4 py-3 font-semibold text-[#1a1a4b]">Fecha</th>
              </tr>
            </thead>
            <tbody>
              {registrations.map((r, i) => (
                <tr key={r.id} className={i % 2 === 0 ? "bg-white" : "bg-[#fdfcfb]"}>
                  <td className="px-4 py-3 text-gray-900">{r.nombre}</td>
                  <td className="px-4 py-3 text-gray-600">{r.email}</td>
                  <td className="px-4 py-3 text-gray-600">{r.whatsapp || "—"}</td>
                  <td className="px-4 py-3">
                    <span className="font-mono font-semibold text-[#1a1a4b] bg-[#fff0f3] px-2 py-0.5 rounded text-xs">
                      {r.codigo_descuento}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {new Date(r.created_at).toLocaleString("es-ES", {
                      day: "2-digit", month: "2-digit", year: "numeric",
                      hour: "2-digit", minute: "2-digit"
                    })}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

function downloadQR(svgId: string, filename: string) {
  const svg = document.getElementById(svgId)
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
    const link = document.createElement("a")
    link.download = filename
    link.href = pngFile
    link.click()
  }
  img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)))
}

function QRSection({
  lang,
  url,
  svgId,
  label,
  downloadLabel,
  urlLabel,
  couponLabel,
  instructionsLabel,
  instructions,
  previewLabel,
  exclusiveLabel,
  discountLabel,
}: {
  lang: string
  url: string
  svgId: string
  label: string
  downloadLabel: string
  urlLabel: string
  couponLabel: string
  instructionsLabel: string
  instructions: string[]
  previewLabel: string
  exclusiveLabel: string
  discountLabel: string
}) {
  const [copied, setCopied] = useState(false)
  const couponCode = "PRIVE50"

  return (
    <div className="mb-12">
      <h2 className="font-serif text-2xl font-bold text-[#1a1a4b] mb-6 border-b border-[#f4c4cc] pb-3">{label}</h2>

      <div className="grid gap-8 md:grid-cols-2">
        {/* QR */}
        <div className="bg-white rounded-lg border border-gray-200 p-8">
          <div className="flex justify-center mb-6">
            <div className="bg-white p-6 rounded-lg border-2 border-[#1a1a4b]">
              <QRCodeSVG id={svgId} value={url} size={256} level="H" includeMargin fgColor="#1a1a4b" bgColor="#ffffff" />
            </div>
          </div>
          <Button onClick={() => downloadQR(svgId, `semzo-prive-${lang}-qr.png`)} className="w-full bg-[#1a1a4b] hover:bg-[#1a1a4b]/90 text-white">
            <Download className="w-4 h-4 mr-2" />
            {downloadLabel}
          </Button>
        </div>

        {/* Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-[#1a1a4b] mb-3">{urlLabel}</h3>
            <div className="flex items-center gap-2">
              <input type="text" value={url} readOnly className="flex-1 px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-sm" />
              <Button
                onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                variant="outline" size="sm"
                className="border-[#1a1a4b] text-[#1a1a4b] hover:bg-[#fff0f3] bg-transparent"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-[#1a1a4b] mb-3">{couponLabel}</h3>
            <div className="bg-[#fff0f3] border-2 border-[#f4c4cc] rounded-lg p-4">
              <p className="text-3xl font-bold text-[#1a1a4b] text-center tracking-wider">{couponCode}</p>
              <p className="text-sm text-gray-600 text-center mt-2">{discountLabel}</p>
            </div>
          </div>

          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="font-semibold text-[#1a1a4b] mb-3">{instructionsLabel}</h3>
            <ol className="text-sm text-gray-600 space-y-2">
              {instructions.map((step, i) => (
                <li key={i} className="flex gap-2">
                  <span className="font-semibold text-[#1a1a4b]">{i + 1}.</span>
                  {step}
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      {/* Preview card */}
      <div className="mt-8 bg-white rounded-lg border border-gray-200 p-8">
        <h3 className="font-serif text-xl font-bold text-[#1a1a4b] mb-6 text-center">{previewLabel}</h3>
        <div className="max-w-md mx-auto bg-gradient-to-br from-[#1a1a4b] to-[#2a2a5b] rounded-lg p-8 text-white shadow-xl">
          <div className="text-center mb-6">
            <h4 className="font-serif text-2xl mb-2">SEMZO PRIVÉ</h4>
            <p className="text-sm opacity-80">{exclusiveLabel}</p>
          </div>
          <div className="bg-white p-4 rounded-lg mb-6">
            <QRCodeSVG value={url} size={180} level="H" includeMargin fgColor="#1a1a4b" bgColor="#ffffff" className="mx-auto" />
          </div>
          <div className="text-center">
            <p className="text-xs mb-2 opacity-80">{couponLabel}:</p>
            <p className="text-xl font-bold tracking-wider bg-white/10 rounded px-4 py-2">{couponCode}</p>
            <p className="text-xs mt-3 opacity-70">{discountLabel}</p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function InvitacionesAdmin() {
  return (
    <div className="min-h-screen bg-[#fff0f3] p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-10">
          <h1 className="font-serif text-4xl font-bold text-[#1a1a4b] mb-2">Generador de Invitaciones</h1>
          <p className="text-gray-600">Códigos QR para tarjetas de invitación exclusivas — ES / EN</p>
        </div>

        <RegistrationsList />

        <QRSection
          lang="es"
          url="https://semzoprive.com/invitacion"
          svgId="qr-es"
          label="Español — /invitacion"
          downloadLabel="Descargar QR (1000x1000px)"
          urlLabel="URL de Invitación"
          couponLabel="Código de Descuento"
          instructionsLabel="Instrucciones de Uso"
          instructions={[
            "Descarga el código QR en alta resolución",
            "Imprime el QR en tus tarjetas de invitación",
            "Los invitados escanean y acceden a /invitacion",
            "Aplican el código PRIVE50 en el checkout",
          ]}
          previewLabel="Vista Previa de Tarjeta"
          exclusiveLabel="Invitación Exclusiva"
          discountLabel="50% de descuento primer mes"
        />

        <QRSection
          lang="en"
          url="https://semzoprive.com/invitation"
          svgId="qr-en"
          label="English — /invitation"
          downloadLabel="Download QR (1000x1000px)"
          urlLabel="Invitation URL"
          couponLabel="Discount Code"
          instructionsLabel="Instructions"
          instructions={[
            "Download the QR code in high resolution",
            "Print the QR on your invitation cards",
            "Guests scan and land on /invitation",
            "They apply PRIVE50 at checkout",
          ]}
          previewLabel="Card Preview"
          exclusiveLabel="Exclusive Invitation"
          discountLabel="50% off first month"
        />
      </div>
    </div>
  )
}
