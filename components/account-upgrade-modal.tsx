"use client"

import React from "react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/utils/supabase/client"
import { useState } from "react"
import { toast } from "sonner"

interface AccountUpgradeModalProps {
  currentPhone: string
  onSuccess: () => void
  onCancel: () => void
}

export function AccountUpgradeModal({ currentPhone, onSuccess, onCancel }: AccountUpgradeModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleUpgrade = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!email || !password || !confirmPassword) {
      toast.error("Todos los campos son obligatorios")
      return
    }

    if (password !== confirmPassword) {
      toast.error("Las contraseñas no coinciden")
      return
    }

    if (password.length < 6) {
      toast.error("La contraseña debe tener al menos 6 caracteres")
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/user/upgrade-account", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Error al actualizar la cuenta")
      }

      toast.success("Cuenta actualizada correctamente")
      onSuccess()
    } catch (error) {
      console.error("[AccountUpgrade] Error:", error)
      toast.error(error instanceof Error ? error.message : "Error al actualizar la cuenta")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <h2 className="mb-4 text-xl font-semibold text-[#1a1a4b]">Actualiza tu Cuenta</h2>
        <p className="mb-6 text-sm text-gray-600">
          Te registraste con teléfono <strong>{currentPhone}</strong>. Para poder iniciar sesión con email y
          contraseña, debes completar esta información:
        </p>

        <form onSubmit={handleUpgrade} className="space-y-4">
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="password">Contraseña</Label>
            <Input
              id="password"
              type="password"
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div>
            <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirma tu contraseña"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              disabled={loading}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onCancel} disabled={loading} className="flex-1 bg-transparent">
              Cancelar
            </Button>
            <Button type="submit" disabled={loading} className="flex-1 bg-[#1a1a4b] hover:bg-[#151538]">
              {loading ? "Actualizando..." : "Actualizar Cuenta"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
