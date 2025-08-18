"use client"
import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { ADMIN_CONFIG } from "../../../config/email-config"


export default function AdminLogin() {
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    console.log("🔍 Debug Login:")
    console.log("Username ingresado:", username)
    console.log("Username esperado:", ADMIN_CONFIG.username)
    console.log("Password match:", password === ADMIN_CONFIG.password)

    // Verificar credenciales
    if (username === ADMIN_CONFIG.username && password === ADMIN_CONFIG.password) {
      // Guardar sesión
      localStorage.setItem("admin_session", "authenticated")
      localStorage.setItem("admin_login_time", Date.now().toString())
      // Redirigir al panel
      router.push("/admin")
    } else {
      setError(`Credenciales incorrectas. Usuario esperado: ${ADMIN_CONFIG.username}`)
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-rose-nude flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-white shadow-lg rounded-lg p-6">
        <h1 className="text-2xl font-serif text-indigo-dark text-center mb-4">Semzo Privé - Panel de Administración</h1>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-700">
              Usuario
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700">
              Contraseña
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="mt-1 w-full border border-gray-300 rounded px-3 py-2"
            />
          </div>
          {error && <p className="text-red-600 text-sm">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-indigo-dark text-white py-2 rounded hover:bg-indigo-dark/90 transition"
          >
            {loading ? "Verificando..." : "Acceder"}
          </button>
        </form>
        <p className="text-center text-xs text-slate-500 mt-4">
          Credenciales por defecto: <strong>admin / semzo2024!</strong>
        </p>
      </div>
    </div>
  )
}
