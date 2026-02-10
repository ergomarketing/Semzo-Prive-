"use client"
import { useState } from "react"

export default function ConfirmUserPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const handleConfirm = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/auth/confirm-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()
      setMessage(result.success ? "Usuario confirmado exitosamente" : "Error confirmando usuario")
    } catch (error) {
      setMessage("Error confirmando usuario")
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full space-y-8 p-8 bg-white rounded-lg shadow">
        <h2 className="text-2xl font-bold text-center">Confirmar Usuario</h2>
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email del usuario"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={handleConfirm}
            disabled={loading || !email}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Confirmando..." : "Confirmar Usuario"}
          </button>
          {message && (
            <p className={`text-center ${message.includes("exitosamente") ? "text-green-600" : "text-red-600"}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
