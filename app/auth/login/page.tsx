"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Eye, EyeOff, Loader2, CheckCircle, AlertCircle, Smartphone } from "lucide-react"
import { getSupabaseBrowser } from "@/app/lib/supabase"
import { useAuth } from "../../hooks/useAuth"
import { SMSAuthModal } from "@/app/components/sms-auth-modal"


export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null)
  const [showSMSModal, setShowSMSModal] = useState(false)
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, loading } = useAuth()

  useEffect(() => {
    const plan = searchParams.get("plan")
    const registered = searchParams.get("registered")
    const confirmed = searchParams.get("confirmed")

    if (plan) {
      setSelectedPlan(plan)
    }

    if (registered === "true") {
      setMessage("Registro exitoso. Ahora puedes iniciar sesión para continuar con tu membresía.")
    }

    if (confirmed === "true") {
      setMessage("¡Email confirmado exitosamente! Por favor inicia sesión.")
    }
  }, [searchParams])

  useEffect(() => {
    if (!loading && user) {
      const plan = searchParams.get("plan")
      const bag = searchParams.get("bag")
      let redirectUrl = "/dashboard"
      if (plan && bag) {
        redirectUrl = `/cart?plan=${plan}&bag=${bag}`
      } else if (plan) {
        redirectUrl = `/cart?plan=${plan}`
      } else if (bag) {
        redirectUrl = `/cart?bag=${bag}`
      }
      // Navegacion dura para que el webview de Instagram aplique la sesion
      window.location.href = redirectUrl
    }
  }, [user, loading, searchParams])

  useEffect(() => {
    const urlMessage = searchParams.get("message")
    const urlError = searchParams.get("error")

    if (urlMessage === "email_confirmed") {
      setMessage("¡Email confirmado exitosamente! Ya puedes iniciar sesión.")
    } else if (urlMessage === "password_updated") {
      setMessage("¡Contraseña actualizada! Ya puedes iniciar sesión con tu nueva contraseña.")
    } else if (urlMessage === "already_confirmed") {
      setMessage("Tu email ya está confirmado. Puedes iniciar sesión.")
    } else if (urlError === "confirmation_failed") {
      setMessage("Error al confirmar el email. Intenta nuevamente.")
    } else if (urlError === "invalid_link") {
      setMessage("Enlace de confirmación inválido o expirado.")
    } else if (urlError === "invalid_token") {
      setMessage("Token de confirmación inválido. Solicita un nuevo enlace.")
    } else if (urlError === "config_error") {
      setMessage("Error de configuración del servidor.")
    } else if (urlError === "unexpected_error") {
      setMessage("Error inesperado. Intenta más tarde.")
    }
  }, [searchParams])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setMessage("")

    if (!email || !password) {
      setMessage("Email y contraseña son requeridos")
      setIsLoading(false)
      return
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      setMessage("Por favor ingresa un email válido")
      setIsLoading(false)
      return
    }

    if (password.trim().length < 6) {
      setMessage("La contraseña debe tener al menos 6 caracteres")
      setIsLoading(false)
      return
    }

    try {
      const supabase = getSupabaseBrowser()

      if (!supabase) {
        setMessage("Error de configuración. Contacta al administrador.")
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password.trim(),
      })

      if (error) {
        if (
          error.message.includes("Invalid login credentials") ||
          error.message.includes("Email not confirmed") ||
          error.message.includes("Invalid email or password")
        ) {
          setMessage("Email o contraseña incorrectos")
        } else if (error.message.includes("Email not confirmed")) {
          setMessage("Por favor confirma tu email antes de iniciar sesión")
        } else {
          setMessage("Error de autenticación. Inténtalo de nuevo.")
        }
        return
      }

      if (data.user) {
        setMessage("¡Login exitoso! Redirigiendo...")
        
        // Leer returnUrl del localStorage (guardado en signup)
        const savedUrl = localStorage.getItem("semzo_post_confirm_url")
        const plan = searchParams.get("plan") || savedUrl?.match(/plan=([^&]+)/)?.[1]
        const bag = searchParams.get("bag") || savedUrl?.match(/bag=([^&]+)/)?.[1]
        
        // Si hay bolso, construir el carrito antes de redirigir
        if (bag && plan) {
          try {
            const { data: bagData } = await supabase
              .from("bags")
              .select("name, brand, image_url, images, membership_type")
              .eq("id", bag)
              .maybeSingle()
            
            const membershipType = plan || bagData?.membership_type
            const membershipPrices: Record<string, { name: string; price: number }> = {
              essentiel: { name: "L'Essentiel", price: 59 },
              signature: { name: "Signature", price: 149 },
              prive: { name: "Privé", price: 279 },
            }
            
            if (membershipType && membershipPrices[membershipType]) {
              const membership = membershipPrices[membershipType]
              const membershipItem = {
                id: `${membershipType}-membership-monthly`,
                name: membership.name.toUpperCase(),
                price: `${membership.price}€`,
                billingCycle: "monthly",
                description: bagData ? `${bagData.brand} ${bagData.name}` : `Membresía ${membership.name}`,
                image: bagData?.images?.[0] || bagData?.image_url || `/images/membership-${membershipType}.jpg`,
                brand: bagData?.brand || "Semzo Privé",
                itemType: "membership",
              }
              
              const existingCart = localStorage.getItem("cartItems")
              const cartItems = existingCart ? JSON.parse(existingCart) : []
              const withoutMembership = cartItems.filter((i: any) => i.itemType !== "membership")
              localStorage.setItem("cartItems", JSON.stringify([...withoutMembership, membershipItem]))
            }
          } catch (e) {
            // continuar sin carrito
          }
        }
        
        localStorage.removeItem("semzo_post_confirm_url")
        
        let redirectUrl = "/dashboard"
        if (plan && bag) {
          redirectUrl = `/cart?plan=${plan}&bag=${bag}`
        } else if (plan) {
          redirectUrl = `/cart?plan=${plan}`
        } else if (bag) {
          redirectUrl = `/cart?bag=${bag}`
        }

        setTimeout(() => {
          router.push(redirectUrl)
        }, 1000)
      }
    } catch (error: any) {
      setMessage("Error de conexión. Inténtalo de nuevo.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSMSSuccess = (user: any) => {
    setMessage("¡Login exitoso! Redirigiendo...")
    const plan = searchParams.get("plan")
    const bag = searchParams.get("bag")
    let redirectUrl = "/dashboard"
    if (plan && bag) {
      redirectUrl = `/cart?plan=${plan}&bag=${bag}`
    } else if (plan) {
      redirectUrl = `/cart?plan=${plan}`
    } else if (bag) {
      redirectUrl = `/cart?bag=${bag}`
    }

    setTimeout(() => {
      router.push(redirectUrl)
    }, 1000)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8" />
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 py-12 px-4">
      <div className="w-full max-w-4xl bg-white rounded-2xl overflow-hidden shadow-2xl">
        <div className="grid md:grid-cols-2">
          {/* Imagen lado izquierdo - igual que el LoginModal */}
          <div className="relative hidden md:block min-h-[600px]">
            <img
              src="/images/login-modal-chanel.jpg"
              alt="Bolso de lujo Semzo Prive"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute bottom-8 left-8 right-8">
              <div className="bg-white/90 backdrop-blur-sm rounded-xl p-4">
                <p className="text-sm font-medium" style={{ color: "#1a1a4b" }}>SEMZO PRIVE</p>
                <p className="text-xs text-slate-600 mt-1">Acceso exclusivo al lujo</p>
              </div>
            </div>
          </div>

          {/* Formulario lado derecho */}
          <div className="p-8 md:p-10 flex items-center">
            <div className="w-full max-w-sm mx-auto">
              <div className="text-center mb-8">
                <h2 className="font-serif text-3xl font-light mb-2" style={{ color: "#1a1a4b" }}>
                  Iniciar Sesion
                </h2>
                <p className="text-sm text-slate-600">Accede a tu cuenta para continuar</p>
                {selectedPlan && (
                  <div className="mt-3 p-2 bg-slate-50 border border-slate-200 rounded-lg">
                    <p className="text-xs text-slate-700">
                      Plan seleccionado: <span className="font-semibold capitalize">{selectedPlan}</span>
                    </p>
                  </div>
                )}
              </div>

              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium" style={{ color: "#1a1a4b" }}>
                    Email
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="h-12 border-gray-200 focus:border-[#1a1a4b] rounded-lg"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium" style={{ color: "#1a1a4b" }}>
                    Contraseña
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="********"
                      className="h-12 border-gray-200 focus:border-[#1a1a4b] rounded-lg pr-12"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                    </button>
                  </div>
                </div>

                <div className="text-right">
                  <a href="/auth/forgot-password" className="text-sm hover:underline" style={{ color: "#1a1a4b" }}>
                    ¿Olvidaste tu contraseña?
                  </a>
                </div>

                {message && (
                  <div className={`p-3 rounded-lg flex items-center gap-2 text-sm ${
                    message.includes("exitoso") || message.includes("confirmado") || message.includes("actualizada")
                      ? "bg-green-50 border border-green-200 text-green-700"
                      : "bg-red-50 border border-red-200 text-red-700"
                  }`}>
                    {message.includes("exitoso") || message.includes("confirmado") || message.includes("actualizada")
                      ? <CheckCircle className="h-4 w-4 shrink-0" />
                      : <AlertCircle className="h-4 w-4 shrink-0" />
                    }
                    {message}
                  </div>
                )}

                <div className="space-y-3 pt-2">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="w-full h-12 rounded-lg text-sm uppercase tracking-widest font-medium"
                    style={{ backgroundColor: "#1a1a4b", color: "#ffffff" }}
                  >
                    {isLoading ? <Loader2 className="animate-spin h-4 w-4" /> : "Iniciar Sesion"}
                  </Button>

                  <Button
                    type="button"
                    variant="outline"
                    className="w-full h-12 rounded-lg text-sm uppercase tracking-widest font-medium border-2 bg-transparent"
                    style={{ borderColor: "#1a1a4b", color: "#1a1a4b" }}
                    onClick={() => router.push(selectedPlan ? `/signup?plan=${selectedPlan}` : "/signup")}
                  >
                    Unirse al Club
                  </Button>
                </div>
              </form>

              <p className="text-center text-xs text-slate-500 mt-6">
                Al continuar, aceptas nuestros{" "}
                <a href="/terminos" className="underline hover:text-slate-700">Terminos y Condiciones</a>
              </p>
            </div>
          </div>
        </div>
      </div>

      <SMSAuthModal
        isOpen={showSMSModal}
        onClose={() => setShowSMSModal(false)}
        onSuccess={handleSMSSuccess}
        mode="login"
        plan={searchParams.get("plan") ?? undefined}
        bag={searchParams.get("bag") ?? undefined}
      />
    </div>
  )
}
