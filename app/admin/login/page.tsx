"use client"

import type React from "react"
import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password: password.trim() }),
      })

      const data = await res.json()

      if (res.ok && data.success) {
        // La cookie httpOnly admin_session ya fue seteada por el servidor.
        // Guardamos el email solo para mostrarlo en el sidebar (no es auth).
        try {
          localStorage.setItem("admin_email", email.trim())
        } catch {}
        window.location.replace("/admin")
      } else {
        setError(data.message || "Usuario o contraseña incorrectos")
      }
    } catch {
      setError("Error de conexión. Inténtalo de nuevo.")
    }

    setLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#faf8f7" }}>
      <Card className="w-full max-w-md border-0 shadow-lg bg-white">
        <CardHeader className="text-center pb-2">
          <div className="mb-4">
            <h1 className="text-2xl font-serif" style={{ color: "#1a2c4e" }}>
              Semzo Privé
            </h1>
            <p className="text-sm mt-1" style={{ color: "#888" }}>
              Panel de Administración
            </p>
          </div>
          <CardTitle className="text-lg" style={{ color: "#1a2c4e" }}>
            Iniciar Sesión
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email" className="text-sm font-medium" style={{ color: "#1a2c4e" }}>
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@semzoprive.com"
                className="mt-1 border-gray-200 focus:border-[#1a2c4e] focus:ring-[#1a2c4e]"
                required
              />
            </div>

            <div>
              <Label htmlFor="password" className="text-sm font-medium" style={{ color: "#1a2c4e" }}>
                Contraseña
              </Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1 border-gray-200 focus:border-[#1a2c4e] focus:ring-[#1a2c4e]"
                required
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#fde8e8", color: "#1a2c4e" }}>
                <p className="text-sm">{error}</p>
              </div>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full text-white"
              style={{ backgroundColor: "#1a2c4e" }}
            >
              {loading ? "Verificando..." : "Acceder"}
            </Button>
          </form>

          <div className="mt-6 p-3 rounded-lg text-center" style={{ backgroundColor: "#f5f0eb" }}>
            <p className="text-xs" style={{ color: "#1a2c4e" }}>
              Acceso restringido solo para administradores
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
