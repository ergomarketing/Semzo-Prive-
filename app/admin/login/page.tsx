"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
// import { createClient } from "@/utils/supabase/client" // Ya no se usa Supabase para este login

export default function AdminLogin() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [showDebug, setShowDebug] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")

    const ADMIN_EMAIL = process.env.NEXT_PUBLIC_ADMIN_EMAIL
    const ADMIN_PASSWORD = process.env.NEXT_PUBLIC_ADMIN_PASSWORD

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      // Simular la creación de una sesión simple (usando localStorage o cookies)
      // Para mantener la sesión, usaremos un simple token en localStorage
      localStorage.setItem("admin_session_token", "valid_admin_token")
      localStorage.setItem("admin_email", email)

      // Redirigir al panel de administración
      console.log("[v0] ✅ Login exitoso, redirigiendo...")
      router.push("/admin")
    } else {
      setError("Credenciales inválidas. Verifica tu email y contraseña.")
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
                <Label htmlFor="email" className="text-sm font-medium text-slate-700">
                  Email
                </Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
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

          <div className="mt-4">
            {/* Eliminada la sección de debug de credenciales fijas */}
          </div>

          <div className="mt-6 p-3 bg-rose-pastel/10 rounded-lg">
            <p className="text-xs text-slate-600 text-center">🔒 Acceso restringido solo para administradores</p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
