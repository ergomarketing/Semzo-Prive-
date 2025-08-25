"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ADMIN_CONFIG } from "../../config/email-config"

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

    // Simular verificación (en producción usar hash/bcrypt)
    if (username === ADMIN_CONFIG.username && password === ADMIN_CONFIG.password) {
      // Guardar sesión
      localStorage.setItem("admin_session", "authenticated")
      localStorage.setItem("admin_login_time", Date.now().toString())

      // Redirigir al panel
      router.push("/admin")
    } else {
      setError("Credenciales incorrectas")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen bg-rose-nude flex items-center justify-center p-4">
      <Card className="w-full max-w-md border-0 shadow-lg bg-white">
        <CardHeader className="text-center">
          <div className="mb-4">
            <h1 className="text-2xl font-serif text-indigo-dark">Semzo Privé</h1>
            <p className="text-sm text-slate-600 mt-1">Panel de Administración</p>
          </div>
          <CardTitle className="text-lg text-indigo-dark">Iniciar Sesión</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-sm font-medium text-slate-700">
                Usuario
              </Label>
              <Input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium text-slate-700">
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1"
                required
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-dark hover:bg-indigo-dark/90 text-white"
            >
              {loading ? "Verificando..." : "Acceder"}
            </Button>
          </form>

          <div className="mt-6 p-3 bg-rose-pastel/10 rounded-lg">
            <p className="text-xs text-slate-600 text-center">🔒 Acceso restringido solo para administradores</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
