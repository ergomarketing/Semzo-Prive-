"use client"

import { useState } from "react"
import { EMAIL_CONFIG } from "@/app/config/email-config"

export default function EmailTest() {
  const [destinatario, setDestinatario] = useState("")
  const [asunto, setAsunto] = useState("Prueba de email desde Semzo Privé")
  const [mensaje, setMensaje] = useState(
    "Este es un email de prueba para verificar la configuración de Resend con el dominio verificado.",
  )
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto p-4 max-w-3xl">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h1 className="text-3xl font-bold mb-6 text-center text-gray-800">🧪 Prueba de Email - Semzo Privé</h1>

          <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-200">
            <h2 className="font-semibold text-blue-800 mb-2">📧 Configuración actual:</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
              <div>
                <strong>Proveedor:</strong> {EMAIL_CONFIG.provider}
              </div>
              <div>
                <strong>Email de origen:</strong> {EMAIL_CONFIG.fromEmail}
              </div>
              <div>
                <strong>Nombre de origen:</strong> {EMAIL_CONFIG.fromName}
              </div>
              <div>
                <strong>Modo desarrollo:</strong> {EMAIL_CONFIG.isDevelopment ? "Activado" : "Desactivado"}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="destinatario" className="block text-sm font-medium mb-2 text-gray-700">
                📮 Email destinatario:
              </label>
              <input
                type="email"
                id="destinatario"
                value={destinatario}
                onChange={(e) => setDestinatario(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="tu-email@ejemplo.com"
                required
              />
            </div>

            <div>
              <label htmlFor="asunto" className="block text-sm font-medium mb-2 text-gray-700">
                📝 Asunto:
              </label>
              <input
                type="text"
                id="asunto"
                value={asunto}
                onChange={(e) => setAsunto(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div>
              <label htmlFor="mensaje" className="block text-sm font-medium mb-2 text-gray-700">
                💬 Mensaje:
              </label>
              <textarea
                id="mensaje"
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                className="w-full p-3 border border-gray-300 rounded-lg h-32 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <button
              onClick={enviarEmail}
              disabled={enviando || !destinatario}
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              {enviando ? "📤 Enviando..." : "🚀 Enviar email de prueba"}
            </button>
          </div>

          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <p className="font-semibold">❌ Error:</p>
              <p>{error}</p>
            </div>
          )}

          {resultado && (
            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
              <p className="font-semibold">✅ Email enviado correctamente:</p>
              <div className="mt-2 text-sm">
                <p>
                  <strong>Para:</strong> {resultado.to}
                </p>
                <p>
                  <strong>ID:</strong> {resultado.id}
                </p>
              </div>
              <details className="mt-2">
                <summary className="cursor-pointer text-sm font-medium">Ver detalles técnicos</summary>
                <pre className="mt-2 text-xs overflow-auto p-2 bg-white rounded border max-h-32">
                  {JSON.stringify(resultado, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
