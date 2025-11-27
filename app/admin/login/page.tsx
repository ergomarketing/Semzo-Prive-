"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

const ADMIN_EMAIL = "mailbox@semzoprive.com"
const ADMIN_PASSWORD = "Semzoprive1*"

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (!mounted) return

    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("admin_session_token") : null
      if (token === "valid_admin_token") {
        window.location.replace("/admin")
      }
    } catch (err) {
      console.error("Error checking admin session:", err)
    }
  }, [mounted])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const inputEmail = email.trim().toLowerCase()
      const inputPassword = password.trim()

      const expectedEmail = ADMIN_EMAIL.toLowerCase()
      const expectedPassword = ADMIN_PASSWORD

      if (inputEmail === expectedEmail && inputPassword === expectedPassword) {
        if (typeof window !== "undefined") {
          localStorage.setItem("admin_session_token", "valid_admin_token")
          localStorage.setItem("admin_login_time", Date.now().toString())
          localStorage.setItem("admin_email", ADMIN_EMAIL)
        }
        await new Promise((resolve) => setTimeout(resolve, 100))
        window.location.replace("/admin")
        return
      } else {
        setError("Usuario o contraseña incorrectos")
      }
    } catch (err) {
      console.error("Error during login:", err)
      setError("Error al procesar el login")
    }

    setLoading(false)
  }

  if (!mounted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#faf8f7" }}>
        <div className="animate-pulse">Cargando...</div>
      </div>
    )
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
                placeholder="mailbox@semzoprive.com"
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
              <div className="p-3 rounded-lg" style={{ backgroundColor: "#d4a5a5", color: "#1a2c4e" }}>
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

          <div className="mt-6 p-3 rounded-lg text-center" style={{ backgroundColor: "#d4a5a5" }}>
            <p className="text-xs" style={{ color: "#1a2c4e" }}>
              Acceso restringido solo para administradores
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
