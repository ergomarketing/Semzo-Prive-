"use client"

import { useState } from "react"
import { EMAIL_CONFIG } from "@/app/config/email-config"

export default function EmailDiagnostico() {
  const [destinatario, setDestinatario] = useState("")
  const [asunto, setAsunto] = useState("Prueba de email desde Semzo Privé")
  const [mensaje, setMensaje] = useState("Este es un email de prueba para verificar la configuración de Resend.")
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const enviarEmail = async () => {
    setEnviando(true)
    setError(null)
    setResultado(null)

    try {
      const response = await fetch("/api/emails/resend-test", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          to: destinatario,
          subject: asunto,
          text: mensaje,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al enviar el email")
      }

      setResultado(data)
    } catch (err: any) {
      setError(err.message || "Error desconocido al enviar el email")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="container mx-auto p-4 max-w-3xl">
      <h1 className="text-2xl font-bold mb-6">Diagnóstico de Email</h1>

      <div className="bg-blue-50 p-4 rounded-lg mb-6">
        <h2 className="font-semibold text-blue-800">Configuración actual:</h2>
        <ul className="mt-2 space-y-1 text-sm">
          <li>
            <strong>Proveedor:</strong> {EMAIL_CONFIG.provider}
          </li>
          <li>
            <strong>Email de origen:</strong> {EMAIL_CONFIG.fromEmail}
          </li>
          <li>
            <strong>Nombre de origen:</strong> {EMAIL_CONFIG.fromName}
          </li>
          <li>
            <strong>Modo desarrollo:</strong> {EMAIL_CONFIG.isDevelopment ? "Activado" : "Desactivado"}
          </li>
        </ul>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="destinatario" className="block text-sm font-medium mb-1">
            Email destinatario:
          </label>
          <input
            type="email"
            id="destinatario"
            value={destinatario}
            onChange={(e) => setDestinatario(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="ejemplo@gmail.com"
            required
          />
        </div>

        <div>
          <label htmlFor="asunto" className="block text-sm font-medium mb-1">
            Asunto:
          </label>
          <input
            type="text"
            id="asunto"
            value={asunto}
            onChange={(e) => setAsunto(e.target.value)}
            className="w-full p-2 border rounded"
            required
          />
        </div>

        <div>
          <label htmlFor="mensaje" className="block text-sm font-medium mb-1">
            Mensaje:
          </label>
          <textarea
            id="mensaje"
            value={mensaje}
            onChange={(e) => setMensaje(e.target.value)}
            className="w-full p-2 border rounded h-32"
            required
          />
        </div>

        <button
          onClick={enviarEmail}
          disabled={enviando || !destinatario}
          className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {enviando ? "Enviando..." : "Enviar email de prueba"}
        </button>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700">
          <p className="font-semibold">Error:</p>
          <p>{error}</p>
        </div>
      )}

      {resultado && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded text-green-700">
          <p className="font-semibold">Email enviado correctamente:</p>
          <pre className="mt-2 text-xs overflow-auto p-2 bg-white rounded">{JSON.stringify(resultado, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
