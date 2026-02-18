"use client"

import type React from "react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { useRouter } from "next/navigation"
import { getSupabaseBrowser } from "../lib/supabase"

interface CheckoutModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const supabase = getSupabaseBrowser()
      if (!supabase) throw new Error("Supabase no disponible")

      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        })
        if (error) throw error
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: name },
          },
        })
        if (error) throw error
      }

      /**
       * CLAVE:
       * - NO redirigimos a /checkout
       * - NO forzamos dashboard
       * - Simplemente cerramos el modal
       * - El flujo activo (cart / payment / identity) continúa
       */
      onClose()
      router.refresh()
    } catch (error) {
      console.error("Auth error:", error)
      alert(error instanceof Error ? error.message : "Error de autenticación")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
        >
          <X size={24} />
        </button>

        <h2 className="text-2xl font-medium text-center mb-6 text-slate-900">
          {isLogin ? "INICIAR SESIÓN" : "CREAR CUENTA"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <Input
              type="text"
              placeholder="Nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}

          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <div className="flex gap-3 pt-2">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1 bg-slate-900 hover:bg-slate-800 text-white"
            >
              {loading ? "Procesando…" : isLogin ? "Entrar" : "Crear cuenta"}
            </Button>

            <Button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
            >
              {isLogin ? "Crear cuenta" : "Ya tengo cuenta"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
