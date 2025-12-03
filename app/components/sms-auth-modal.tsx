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
  const [codeSentAt, setCodeSentAt] = useState<number | null>(null)
  const [timeRemaining, setTimeRemaining] = useState(60)

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (codeSentAt && step === "code") {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - codeSentAt) / 1000)
        const remaining = Math.max(0, 60 - elapsed)
        setTimeRemaining(remaining)
        if (remaining <= 0) {
          setCanResend(true)
        }
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [codeSentAt, step])

  useEffect(() => {
    if (!isOpen || step !== "code") {
      setCanResend(false)
      setResendCooldown(0)
      setResendAttempts(0)
      setCodeSentAt(null)
      setTimeRemaining(60)
    }
  }, [isOpen, step])

  useEffect(() => {
    if (isOpen) {
      setStep("phone")
      setPhone("")
      setCode("")
      setName("")
      setError("")
      setCodeSentAt(null)
      setTimeRemaining(60)
    }
  }, [isOpen])

  const handleSendCode = async (isResend = false) => {
    setLoading(true)
    setError("")

    try {
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
        if (!isResend) {
          setStep("code")
        }
        setCodeSentAt(Date.now())
        setTimeRemaining(60)
        setCanResend(false)
        setResendCooldown(60)
        if (isResend) {
          setResendAttempts((prev) => prev + 1)
        }
      }
    } catch (err) {
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

    if (codeSentAt && Date.now() - codeSentAt > 60000) {
      setError("El código ha expirado. Solicita uno nuevo haciendo clic en 'Reenviar código'.")
      setCanResend(true)
      setLoading(false)
      return
    }

    try {
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
        if (error.message.includes("expired") || error.message.includes("Token has expired")) {
          setError("Código expirado. Solicita un nuevo código haciendo clic en 'Reenviar código'.")
          setCanResend(true)
        } else if (
          error.message.includes("invalid") ||
          error.message.includes("Token") ||
          error.message.includes("OTP")
        ) {
          setError("Código incorrecto. Verifica el código e intenta de nuevo.")
        } else {
          setError(`Error: ${error.message}`)
        }
      } else if (data.user) {
        onSuccess(data.user)
        onClose()
      }
    } catch (err) {
      setError("Error verificando código")
    } finally {
      setLoading(false)
    }
  }

  const handleEmailSignup = () => {
    window.location.href = "/signup?returnTo=cart"
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
              <Button variant="outline" onClick={handleEmailSignup} className="w-full bg-transparent">
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
              <p className={`text-xs mt-1 ${timeRemaining <= 10 ? "text-red-600 font-semibold" : "text-amber-600"}`}>
                ⏱️{" "}
                {timeRemaining > 0
                  ? `El código expira en ${timeRemaining} segundos`
                  : "Código expirado - solicita uno nuevo"}
              </p>
            </div>
            {error && <div className="text-sm text-red-600 bg-red-50 p-3 rounded-md whitespace-pre-line">{error}</div>}

            <div className="text-center space-y-2">
              <p className="text-sm text-gray-600">¿No recibiste el código?</p>
              <Button
                variant="outline"
                size="sm"
                onClick={handleResendCode}
                disabled={!canResend || loading || resendAttempts >= 3}
                className="text-sm"
              >
                {resendAttempts >= 3 ? "Máximo alcanzado" : "Reenviar código"}
              </Button>
              {resendAttempts > 0 && resendAttempts < 3 && (
                <p className="text-xs text-gray-500">Reenvíos: {resendAttempts}/3</p>
              )}
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setStep("phone")} className="flex-1">
                Cambiar número
              </Button>
              <Button onClick={handleVerifyCode} disabled={!code || loading || timeRemaining <= 0} className="flex-1">
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
            <Button onClick={() => onSuccess({ phone })} disabled={!name || loading} className="w-full">
              {loading ? "Completando..." : "Completar registro"}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
