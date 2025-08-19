"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AdminDirectPage() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    // Verificación directa
    if (username === "admin" && password === "semzo2024!") {
      // Guardar sesión y redirigir directamente
      localStorage.setItem("admin_session", "authenticated")
      localStorage.setItem("admin_login_time", Date.now().toString())

      // Redirigir al dashboard específico
      window.location.href = "/admin/dashboard"
    } else {
      alert("Credenciales incorrectas")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-rose-nude flex items-center justify-center">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold text-center mb-6 text-indigo-dark">Acceso Directo Admin</h1>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Usuario</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-dark text-white py-2 px-4 rounded-md hover:bg-indigo-800 disabled:opacity-50"
          >
            {loading ? "Accediendo..." : "Acceder"}
          </button>
        </form>

        <div className="mt-4 text-center text-sm text-gray-600">
          <p>Credenciales: admin / semzo2024!</p>
        </div>
      </div>
    </div>
  )
}
