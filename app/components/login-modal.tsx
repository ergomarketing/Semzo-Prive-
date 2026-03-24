"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X, Eye, EyeOff, Loader2 } from "lucide-react"
import { createClient } from "@/lib/supabase/client"
import { toast } from "sonner"

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
  onClose?: () => void
}

export function LoginModal({ open, onOpenChange, onSuccess, onClose }: LoginModalProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleClose = () => {
    onOpenChange(false)
    onClose?.()
    // Reset form
    setEmail("")
    setPassword("")
    setError("")
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const supabase = createClient()
      const { data, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (authError) {
        if (authError.message.includes("Invalid login")) {
          setError("Email o contraseña incorrectos")
        } else if (authError.message.includes("Email not confirmed")) {
          setError("Por favor confirma tu email antes de iniciar sesión")
        } else {
          setError(authError.message)
        }
        setLoading(false)
        return
      }

      if (data.user) {
        toast.success("Sesión iniciada correctamente")
        // Reset form
        setEmail("")
        setPassword("")
        setError("")
        // Trigger success callback
        onSuccess()
      }
    } catch {
      setError("Error al iniciar sesión. Intenta de nuevo.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white border-0 rounded-2xl">
        <div className="grid md:grid-cols-2">
          {/* Imagen lado izquierdo */}
          <div className="relative hidden md:block">
            <div className="absolute inset-0">
              <Image
                src="/images/login-modal-chanel.jpg"
                alt="Bolso de lujo Semzo Prive"
                fill
                className="object-cover"
                priority
              />
            </div>
            {/* Overlay con logo */}
            <div className="absolute bottom-8 left-8 right-8">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm font-medium" style={{ color: "#1a1a4b" }}>
                  SEMZO PRIVE
                </p>
                <p className="text-xs text-slate-600 mt-1">
                  Acceso exclusivo al lujo
                </p>
              </div>
            </div>
          </div>

          {/* Formulario lado derecho */}
          <div className="relative p-8 md:p-10">
            {/* Boton cerrar */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 rounded-full hover:bg-gray-100 transition-colors"
              aria-label="Cerrar"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>

            <div className="max-w-sm mx-auto">
              {/* Header */}
              <div className="text-center mb-8">
                <h2 
                  className="font-serif text-3xl font-light mb-2"
                  style={{ color: "#1a1a4b" }}
                >
                  Iniciar Sesion
                </h2>
                <p className="text-sm text-slate-600">
                  Accede a tu cuenta para continuar
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleLogin} className="space-y-5">
                <div className="space-y-2">
                  <Label 
                    htmlFor="email" 
                    className="text-sm font-medium"
                    style={{ color: "#1a1a4b" }}
                  >
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    required
                    className="h-12 border-gray-200 focus:border-[#1a1a4b] focus:ring-[#1a1a4b] rounded-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label 
                    htmlFor="password" 
                    className="text-sm font-medium"
                    style={{ color: "#1a1a4b" }}
                  >
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                      required
                      className="h-12 border-gray-200 focus:border-[#1a1a4b] focus:ring-[#1a1a4b] rounded-lg pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <Link 
                    href="/forgot-password" 
                    className="text-sm hover:underline"
                    style={{ color: "#1a1a4b" }}
                    onClick={handleClose}
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>

                {error && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-sm text-red-600">{error}</p>
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="w-full h-12 rounded-lg text-sm uppercase tracking-widest font-medium"
                    style={{ 
                      backgroundColor: "#1a1a4b",
                      color: "#ffffff",
                    }}
                  >
                    {loading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      "Iniciar Sesion"
                    )}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-lg text-sm uppercase tracking-widest font-medium border-2"
                    style={{ 
                      borderColor: "#1a1a4b",
                      color: "#1a1a4b",
                    }}
                    onClick={() => {
                      handleClose()
                      window.location.href = "/registro"
                    }}
                  >
                    Unirse al Club
                  </Button>
                </div>
              </form>

              {/* Footer */}
              <p className="text-center text-xs text-slate-500 mt-6">
                Al continuar, aceptas nuestros{" "}
                <Link href="/terminos" className="underline hover:text-slate-700" onClick={handleClose}>
                  Terminos y Condiciones
                </Link>
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
