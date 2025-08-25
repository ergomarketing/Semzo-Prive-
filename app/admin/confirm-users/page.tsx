"use client"

import { useState } from "react"

export default function ConfirmUsersPage() {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")

  const confirmUser = async () => {
    if (!email) {
      setMessage("Por favor ingresa un email")
      return
    }

    setLoading(true)
    try {
      const response = await fetch("/api/admin/confirm-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const result = await response.json()
      setMessage(result.message)
    } catch (error) {
      setMessage("Error al confirmar usuario")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Confirmar Usuarios Manualmente</h1>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Email del usuario a confirmar:</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md"
            placeholder="usuario@ejemplo.com"
          />
        </div>

        <button
          onClick={confirmUser}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Confirmando..." : "Confirmar Usuario"}
        </button>

        {message && (
          <div
            className={`mt-4 p-3 rounded-md ${
              message.includes("Error") ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
            }`}
          >
            {message}
          </div>
        )}
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-md p-4">
        <h3 className="font-medium text-yellow-800">Usuario de prueba:</h3>
        <p className="text-yellow-700">ergomaria@hotmail.com</p>
        <p className="text-sm text-yellow-600 mt-1">
          Confirma este usuario para que pueda hacer login con la contraseña: 21032005
        </p>
      </div>
    </div>
  )
}
