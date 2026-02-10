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
  mode?: "signup" | "login"
}

export function SMSAuthModal({ isOpen, onClose, onSuccess, mode = "signup" }: SMSAuthModalProps) {
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
      const supabase = getSupabaseBrowser()

      // Check if phone already exists ONLY in signup mode
      if (!isResend && mode === "signup") {
        const { data: existingPhone, error: checkError } = await supabase
          .from("profiles")
          .select("phone, full_name")
          .eq("phone", phone)
          .limit(1)
          .maybeSingle()

        if (existingPhone) {
          setError(`Este número ya está registrado${existingPhone.full_name ? ` a nombre de ${existingPhone.full_name}` : ""}. Por favor inicia sesión en lugar de crear una nueva cuenta.`)
          setLoading(false)
          return
        }
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
        console.error("[v0] [SMS] Verify error:", error.message)

        if (error.message.includes("expired") || error.message.includes("Token has expired")) {
          setError(
            "Código expirado. Los códigos SMS de Supabase expiran en 60 segundos. Solicita un nuevo código haciendo clic en 'Reenviar código'.",
          )
          setCanResend(true)
          setResendCooldown(0)
        } else {
          setError("Código incorrecto o expirado. Haz clic en 'Reenviar código' para recibir uno nuevo.")
          setCanResend(true)
          setResendCooldown(0)
        }
      } else if (data.user) {
        console.log("[v0] [SMS] Verification successful for user:", data.user.id)
        console.log("[v0] [SMS] User phone:", data.user.phone)
        console.log("[v0] [SMS] User email:", data.user.email)

        await new Promise((resolve) => setTimeout(resolve, 2000))

        console.log("[v0] [SMS] Checking if profile exists for user:", data.user.id)
        const { data: existingProfile, error: checkError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle()

        if (checkError) {
          console.error("[v0] [SMS] Profile check error:", checkError)
        }

        console.log("[v0] [SMS] Profile check result:", existingProfile ? "EXISTS" : "NOT FOUND")

        if (!existingProfile) {
          console.log("[v0] [SMS] Creating profile manually for user:", data.user.id)

          const profileData = {
            id: data.user.id,
            email: data.user.email || `${data.user.phone}@phone.semzoprive.com`,
            phone: data.user.phone || phone,
            full_name: data.user.user_metadata?.full_name || null,
            first_name: data.user.user_metadata?.first_name || null,
            last_name: data.user.user_metadata?.last_name || null,
            membership_status: "inactive",
          }

          console.log("[v0] [SMS] Profile data to insert:", profileData)

          const { data: newProfile, error: insertError } = await supabase
            .from("profiles")
            .insert(profileData)
            .select()
            .single()

          if (insertError) {
            console.error("[v0] [SMS] Profile creation error:", insertError)
            console.error("[v0] [SMS] Error details:", JSON.stringify(insertError))
            setError("Error creando perfil. Contacta a soporte.")
            setLoading(false)
            return
          }

          console.log("[v0] [SMS] Profile created successfully:", newProfile)
        } else {
          console.log("[v0] [SMS] Profile already exists, updating phone if needed")
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              phone: data.user.phone || phone,
              updated_at: new Date().toISOString(),
            })
            .eq("id", data.user.id)

          if (updateError) {
            console.error("[v0] [SMS] Profile update error:", updateError)
          } else {
            console.log("[v0] [SMS] Profile updated successfully")
          }
        }

        const { data: finalProfile, error: finalCheckError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .single()

        if (finalCheckError || !finalProfile) {
          console.error("[v0] [SMS] CRITICAL: Profile not found after creation/update:", finalCheckError)
          setError("Error crítico: perfil no se guardó correctamente. Contacta a soporte.")
          setLoading(false)
          return
        }

        console.log("[v0] [SMS] VERIFIED: Profile exists in database:", finalProfile)
        
        // Check if user has a name, if not ask for it
        if (!finalProfile.full_name) {
          console.log("[v0] [SMS] User has no name, showing profile step")
          setStep("profile")
          return
        }
        
        console.log("[v0] [SMS] SUCCESS: User registration completed")
        onSuccess(data.user)
        onClose()
      }
    } catch (err) {
      console.error("[v0] [SMS] Verify exception:", err)
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

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({
          full_name: name,
          first_name: name.split(" ")[0],
          last_name: name.split(" ").slice(1).join(" "),
          updated_at: new Date().toISOString(),
        })
        .eq("id", data.user?.id)

      if (profileUpdateError) {
        console.error("[v0] Profile table update error:", profileUpdateError)
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
            {mode === "signup" ? "Verificación por SMS" : "Iniciar sesión por SMS"}
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

export default SMSAuthModal
