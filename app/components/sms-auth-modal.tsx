"use client"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

import { getSupabaseBrowser } from "@/app/lib/supabase"

interface SMSAuthModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: (user: any) => void
  mode?: "signup" | "login"
  plan?: string
  bag?: string
}

export function SMSAuthModal({ isOpen, onClose, onSuccess, mode = "signup", plan, bag }: SMSAuthModalProps) {
  const [step, setStep] = useState<"phone" | "code" | "profile">("phone")
  const [phone, setPhone] = useState("")
  const [code, setCode] = useState("")
  const [name, setName] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [canResend, setCanResend] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendAttempts, setResendAttempts] = useState(0)
  // Guardamos el usuario verificado para usarlo en el step "profile"
  // sin depender de auth.updateUser (que requiere sesion refrescada)
  const [verifiedUser, setVerifiedUser] = useState<any>(null)

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
    if (!isOpen) {
      // Reset completo al cerrar
      setStep("phone")
      setPhone("")
      setCode("")
      setError("")
      setCanResend(false)
      setResendCooldown(0)
      setResendAttempts(0)
    }
  }, [isOpen])

  const handleSendCode = async (isResend = false) => {
    // Guardar contexto de compra en sessionStorage antes de autenticar
    if (!isResend && (plan || bag)) {
      const ctx: Record<string, string> = {}
      if (plan) ctx.plan = plan
      if (bag) ctx.bag = bag
      sessionStorage.setItem("semzo_purchase_context", JSON.stringify(ctx))
    }
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
        setError("Código incorrecto o expirado. Solicita un nuevo código.")
        setCanResend(true)
        setResendCooldown(0)
        setLoading(false)
        return
      }

      if (!data?.user) {
        setError("No se pudo verificar el código. Solicita uno nuevo.")
        setCanResend(true)
        setResendCooldown(0)
        setLoading(false)
        return
      }

      if (data.user) {
        await new Promise((resolve) => setTimeout(resolve, 1000))

        const { data: existingProfile, error: checkError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle()

        if (!existingProfile) {
          // Solo datos de contacto — estado de membresía e identidad se gestionan en sus tablas propias
          const profileData = {
            id: data.user.id,
            email: data.user.email || `${data.user.phone}@phone.semzoprive.com`,
            phone: data.user.phone || phone,
            full_name: data.user.user_metadata?.full_name || null,
            first_name: data.user.user_metadata?.first_name || null,
            last_name: data.user.user_metadata?.last_name || null,
          }

          const { error: upsertError } = await supabase
            .from("profiles")
            .upsert(profileData, { onConflict: "id", ignoreDuplicates: false })

          if (upsertError && upsertError.code !== "23505") {
            setError("Error creando perfil. Contacta a soporte.")
            setLoading(false)
            return
          }
        } else {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              phone: data.user.phone || phone,
              updated_at: new Date().toISOString(),
            })
            .eq("id", data.user.id)


        }

        const { data: finalProfile } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", data.user.id)
          .maybeSingle()

        if (!finalProfile?.full_name) {
          // Guardar usuario para usarlo en step profile sin llamar auth.updateUser
          setVerifiedUser(data.user)
          setStep("profile")
          return
        }

        onSuccess(data.user)
        onClose()
      }
    } catch (err) {
      setError("Error verificando código")
    } finally {
      setLoading(false)
    }
  }

  const handleCompleteProfile = async () => {
    setLoading(true)
    setError("")

    // Usar el usuario guardado en el step anterior.
    // NO usar auth.updateUser aqui: inmediatamente tras verifyOtp la sesion
    // no esta completamente refrescada en el cliente browser y falla con
    // "Auth session missing". Actualizar profiles directamente con el id
    // del usuario verificado es equivalente y no requiere sesion refrescada.
    const userId = verifiedUser?.id
    if (!userId) {
      setError("Sesion no encontrada. Vuelve a verificar tu número.")
      setLoading(false)
      return
    }

    try {
      const supabase = getSupabaseBrowser()

      const nameParts = name.trim().split(" ")
      const firstName = nameParts[0] || ""
      const lastName = nameParts.slice(1).join(" ") || ""

      const { error: profileUpdateError } = await supabase
        .from("profiles")
        .update({
          full_name: name.trim(),
          first_name: firstName,
          last_name: lastName,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)

      if (profileUpdateError) {
        setError(`Error guardando nombre: ${profileUpdateError.message}`)
        return
      }

      // Intentar actualizar user_metadata de forma no bloqueante
      // (puede fallar si la sesion no esta lista, pero no bloquea el flujo)
      supabase.auth.updateUser({
        data: { full_name: name.trim(), first_name: firstName, last_name: lastName },
      }).catch(() => {
        // No bloquear si falla — el perfil ya fue actualizado en la tabla profiles
      })

      onSuccess(verifiedUser)
      onClose()
    } catch (err) {
      setError("Error completando registro")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {mode === "signup" ? "Verificación por SMS" : "Iniciar sesión por SMS"}
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
              <Button
                variant="outline"
                onClick={() => {
                  const params = new URLSearchParams()
                  if (plan) params.set("plan", plan)
                  if (bag) params.set("bag", bag)
                  const query = params.toString()
                  window.location.href = `/signup${query ? `?${query}` : ""}`
                }}
                className="w-full"
              >
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
