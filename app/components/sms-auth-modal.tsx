"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { getSupabaseBrowser } from "@/app/lib/supabaseClient"

interface SMSAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (user: any) => void
}

export function SMSAuthModal({ isOpen, onClose, onSuccess }: SMSAuthModalProps) {
  const [step, setStep] = useState<"phone" | "code" | "profile">("phone")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [canResend, setCanResend] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendAttempts, setResendAttempts] = useState(0)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            setCanResend(true)
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [resendCooldown])

  useEffect(() => {
    if (!isOpen || step !== "code") {
      setCanResend(false)
      setResendCooldown(0)
      setResendAttempts(0)
    }
  }, [isOpen, step])

  const handleSendCode = async (isResend = false) => {
    setLoading(true)
    setError("")

    try {
      console.log("[v0] Sending SMS code to:", phone)

      const supabase = getSupabaseBrowser()

      if (!supabase) {
        setError("Error de configuración. Contacta al administrador.")
        setLoading(false)
        return
      }

      const { error } = await supabase.auth.signInWithOtp({
        phone: phone,
        options: {
          channel: "sms",
        },
      })

      if (error) {
        console.error("[v0] SMS send error:", error)

        if (error.message.includes("unverified") && error.message.includes("Trial accounts")) {
          setError(
            `⚠️ Cuenta Twilio en modo prueba: El número ${phone} debe ser verificado primero. 
            
            Opciones:
            1. Verifica tu número en: twilio.com/user/account/phone-numbers/verified
            2. O usa el registro gratuito con email en su lugar
            3. O actualiza tu cuenta Twilio para enviar a números no verificados`,
          )
        } else {
          setError(`Error enviando SMS: ${error.message}`)
        }
      } else {
        console.log("[v0] SMS sent successfully")
        if (!isResend) {
          setStep("code")
        }
        setCanResend(false)
        setResendCooldown(60) // 60 seconds cooldown
        if (isResend) {
          setResendAttempts((prev) => prev + 1)
        }
      }
    } catch (err) {
      console.error("[v0] SMS send exception:", err)
      setError("Error enviando código SMS")
    } finally {
      setLoading(false)
    }
  }

  const handleResendCode = async () => {
    if (resendAttempts >= 3) {
      setError("Máximo de reenvíos alcanzado. Intenta con otro número o usa registro por email.")
      return
    }
    await handleSendCode(true)
  }

  const handleVerifyCode = async () => {
    setLoading(true)
    setError("")

    try {
      console.log("[v0] Verifying SMS code:", code)

      const supabase = getSupabaseBrowser()

      if (!supabase) {
        setError("Error de configuración. Contacta al administrador.")
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.verifyOtp({
        phone: phone,
        token: code,
        type: "sms",
      })

      if (error) {
        console.error("[v0] SMS verify error:", error.message)

        if (error.message.includes("expired")) {
          setError("❌ Código expirado. Los códigos SMS expiran en 60 segundos. Solicita un nuevo código.")
          setCanResend(true)
          setResendCooldown(0)
        } else if (error.message.includes("invalid")) {
          setError("❌ Código incorrecto. Verifica el código recibido por SMS e inténtalo de nuevo.")
        } else {
          setError(`❌ Error: ${error.message}`)
        }
      } else if (data.user) {
        console.log("[v0] SMS verification successful:", data.user)

        // Si el usuario ya tiene nombre, completar directamente
        if (data.user.user_metadata?.full_name) {
          onSuccess(data.user)
          onClose()
        } else {
          setStep("profile")
        }
      }
    } catch (err) {
      console.error("[v0] SMS verify exception:", err)
      setError("Error verificando código")
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteProfile = async () => {
    setLoading(true)
    setError("")

    try {
      const supabase = getSupabaseBrowser()

      if (!supabase) {
        setError("Error de configuración. Contacta al administrador.")
        setLoading(false)
        return
      }

      const { data, error } = await supabase.auth.updateUser({
        data: {
          full_name: name,
          first_name: name.split(" ")[0],
          last_name: name.split(" ").slice(1).join(" "),
        },
      })

      if (error) {
        console.error("[v0] Profile update error:", error)
        setError(`Error actualizando perfil: ${error.message}`)
        return
      }

      const { error: profileError } = await supabase.from("profiles").upsert({
        id: data.user?.id,
        email: data.user?.email || null,
        phone: phone,
        full_name: name,
        first_name: name.split(" ")[0],
        last_name: name.split(" ").slice(1).join(" "),
        email_confirmed: false, // SMS users don't have email confirmed
        member: "free", // Default membership
        updated_at: new Date().toISOString(),
      })

      if (profileError) {
        console.error("[v0] Profile table insert error:", profileError)
        // No mostramos error al usuario ya que el auth funcionó
        console.log("[v0] User authenticated but profile creation failed - will continue")
      } else {
        console.log("[v0] Profile created successfully in profiles table")
      }

      console.log("[v0] Profile updated successfully:", data.user)
      onSuccess(data.user)
      onClose()
    } catch (err) {
      console.error("[v0] Profile update exception:", err)
      setError("Error completando registro")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Verificación por SMS
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>

        {step === "phone" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="phone">Número de teléfono</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="+34 600 000 000"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
              />
              <p className="text-sm text-gray-600 mt-1">Incluye el código de país (+34 para España)</p>
            </div>
            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md whitespace-pre-line">{error}</div>}
            <Button onClick={() => handleSendCode(false)} disabled={!phone || loading} className="w-full">
              {loading ? "Enviando..." : "Enviar código SMS"}
            </Button>
            <div className="text-center">
              <p className="text-sm text-gray-600 mb-2">¿Problemas con SMS?</p>
              <Button variant="outline" onClick={() => (window.location.href = "/signup")} className="w-full">
                Registrarse gratis con email
              </Button>
            </div>
          </div>
        )}

        {step === "code" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="code">Código de verificación</Label>
              <Input
                id="code"
                type="text"
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                maxLength={6}
              />
              <p className="text-sm text-gray-600 mt-1">Enviado a {phone}</p>
              <p className="text-xs text-amber-600 mt-1">⏱️ El código expira en 60 segundos</p>
            </div>
            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md whitespace-pre-line">{error}</div>}

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">¿No recibiste el código?</p>
              {resendCooldown > 0 ? (
                <p className="text-sm text-gray-500">Reenviar en {resendCooldown}s</p>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResendCode}
                  disabled={!canResend || loading || resendAttempts >= 3}
                  className="text-sm"
                >
                  {resendAttempts >= 3 ? "Máximo alcanzado" : "Reenviar código"}
                </Button>
              )}
              {resendAttempts > 0 && resendAttempts < 3 && (
                <p className="text-xs text-gray-500">Reenvíos: {resendAttempts}/3</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("phone")} className="flex-1">
                Cambiar número
              </Button>
              <Button onClick={handleVerifyCode} disabled={!code || loading} className="flex-1">
                {loading ? "Verificando..." : "Verificar"}
              </Button>
            </div>
          </div>
        )}

        {step === "profile" && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">Nombre completo</Label>
              <Input
                id="name"
                type="text"
                placeholder="Tu nombre"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button onClick={handleCompleteProfile} disabled={!name || loading} className="w-full">
              {loading ? "Completando..." : "Completar registro"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
