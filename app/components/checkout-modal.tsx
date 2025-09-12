"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { X } from "lucide-react"
import { useAuth } from "@/app/hooks/useAuth"
import { useRouter } from "next/navigation"

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
  const { signIn, signUp } = useAuth()
  const router = useRouter()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      if (isLogin) {
        await signIn(email, password)
        // Redirect to checkout with cart items
        router.push("/checkout")
      } else {
        await signUp(email, password, name)
        // After signup, redirect to checkout
        router.push("/checkout")
      }
      onClose()
    } catch (error) {
      console.error("Auth error:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
          <X size={24} />
        </button>

        <h2 className="text-2xl font-medium text-center mb-6 text-slate-900">
          {isLogin ? "INICIAR SESIÓN" : "ÚNETE AL CLUB"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <Input
              type="text"
              placeholder="Nombre completo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full"
            />
          )}

          <Input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          />

          <Input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full"
          />

          {isLogin && (
            <div className="text-center">
              <button type="button" className="text-sm text-slate-600 underline hover:text-slate-800">
                ¿Olvidaste tu contraseña?
              </button>
            </div>
          )}

          <div className="flex space-x-3">
            <Button type="submit" disabled={loading} className="flex-1 bg-slate-900 hover:bg-slate-800 text-white">
              {loading ? "..." : isLogin ? "INICIAR SESIÓN" : "CREAR CUENTA"}
            </Button>

            <Button
              type="button"
              onClick={() => setIsLogin(!isLogin)}
              className="flex-1 bg-slate-600 hover:bg-slate-700 text-white"
            >
              {isLogin ? "ÚNETE AL CLUB" : "YA TENGO CUENTA"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}
