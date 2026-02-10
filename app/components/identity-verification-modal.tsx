"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Shield, CheckCircle, AlertCircle, Loader2, User, Phone, MapPin, CreditCard } from "lucide-react"

interface IdentityVerificationModalProps {
  isOpen: boolean
  onClose: () => void
  onVerificationComplete: (verified: boolean) => void
  userId: string
  membershipType: string
}

export function IdentityVerificationModal({
  isOpen,
  onClose,
  onVerificationComplete,
  userId,
  membershipType,
}: IdentityVerificationModalProps) {
  const [step, setStep] = useState<"form" | "verification" | "complete" | "reintentar">("form")
  const [loading, setLoading] = useState(false)
  const [verificationUrl, setVerificationUrl] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    documentNumber: "",
    address: "",
    city: "",
    postalCode: "",
    country: "España",
  })

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      // Crear sesión de verificación de Stripe Identity directamente
      const verificationResponse = await fetch("/api/stripe/create-verification-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId,
          membershipType,
          // No pasamos returnUrl, el backend usa la configuración correcta
        }),
      })

      const verificationData = await verificationResponse.json()

      if (verificationData.error) {
        throw new Error(verificationData.error)
      }

      setVerificationUrl(verificationData.url)
      setStep("verification")
    } catch (error: any) {
      console.error("Error:", error)
      setStep("reintentar")
    } finally {
      setLoading(false)
    }
  }

  const handleStartVerification = () => {
    if (verificationUrl) {
      window.location.href = verificationUrl
    }
  }

  // El usuario será redirigido a /verification-complete que consulta el estado real

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-[#1a1a4b]">
            <Shield className="h-5 w-5" />
            Verificación de Identidad
          </DialogTitle>
          <DialogDescription>
            Para comenzar a disfrutar de tu membresía {membershipType}, completa este paso rápido de verificación. Es un
            proceso seguro que solo toma unos minutos.
          </DialogDescription>
        </DialogHeader>

        {step === "form" && (
          <form onSubmit={handleFormSubmit} className="space-y-4">
            <div className="bg-[#fff0f3] border border-[#f4c4cc] rounded-lg p-4 mb-4">
              <p className="text-sm text-[#1a1a4b]">
                Este proceso es obligatorio para todas las membresías y nos ayuda a prevenir fraudes, protegiendo tanto
                a nuestras clientas como a los bolsos de lujo que ofrecemos.
              </p>
            </div>

            <div className="grid gap-4">
              <div>
                <Label htmlFor="fullName" className="flex items-center gap-2">
                  <User className="h-4 w-4" /> Nombre completo (como aparece en tu documento)
                </Label>
                <Input
                  id="fullName"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  placeholder="María García López"
                  required
                />
              </div>

              <div>
                <Label htmlFor="documentNumber" className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4" /> Número de documento (DNI/NIE/Pasaporte)
                </Label>
                <Input
                  id="documentNumber"
                  value={formData.documentNumber}
                  onChange={(e) => setFormData({ ...formData, documentNumber: e.target.value })}
                  placeholder="12345678A"
                  required
                />
              </div>

              <div>
                <Label htmlFor="phone" className="flex items-center gap-2">
                  <Phone className="h-4 w-4" /> Teléfono móvil
                </Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="+34 612 345 678"
                  required
                />
              </div>

              <div>
                <Label htmlFor="address" className="flex items-center gap-2">
                  <MapPin className="h-4 w-4" /> Dirección completa
                </Label>
                <Input
                  id="address"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Calle Mayor 123, 2º B"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="city">Ciudad</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    placeholder="Madrid"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="postalCode">Código postal</Label>
                  <Input
                    id="postalCode"
                    value={formData.postalCode}
                    onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                    placeholder="28001"
                    required
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full bg-[#1a1a4b] hover:bg-[#1a1a4b]/90" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                "Continuar con verificación"
              )}
            </Button>
          </form>
        )}

        {step === "verification" && (
          <div className="text-center space-y-4">
            <div className="bg-[#fff0f3] rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
              <Shield className="h-8 w-8 text-[#1a1a4b]" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1a1a4b]">Verificación de documento + selfie</h3>
              <p className="text-sm text-gray-600 mt-2">Se abrirá una ventana segura de Stripe donde deberás:</p>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>1. Fotografiar tu documento de identidad</li>
                <li>2. Tomar un selfie para comparar</li>
              </ul>
            </div>
            <Button onClick={handleStartVerification} className="w-full bg-[#1a1a4b] hover:bg-[#1a1a4b]/90">
              Iniciar verificación segura
            </Button>
            <p className="text-xs text-gray-500">Procesado por Stripe. Tus datos están protegidos.</p>
          </div>
        )}

        {step === "complete" && (
          <div className="text-center space-y-4">
            <div className="bg-green-100 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1a1a4b]">¡Verificación completada!</h3>
              <p className="text-sm text-gray-600 mt-2">
                Tu identidad ha sido verificada correctamente. Ahora puedes continuar con tu membresía.
              </p>
            </div>
            <Button
              onClick={() => {
                onVerificationComplete(true)
                onClose()
              }}
              className="w-full bg-[#1a1a4b] hover:bg-[#1a1a4b]/90"
            >
              Continuar
            </Button>
          </div>
        )}

        {step === "reintentar" && (
          <div className="text-center space-y-4">
            <div className="bg-blue-100 rounded-full p-4 w-16 h-16 mx-auto flex items-center justify-center">
              <AlertCircle className="h-8 w-8 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-[#1a1a4b]">Vamos a intentarlo de nuevo</h3>
              <p className="text-sm text-gray-600 mt-2">
                No pudimos completar la verificación en este momento. No te preocupes, tu membresía está guardada.
                Puedes intentarlo de nuevo cuando quieras.
              </p>
            </div>
            <Button onClick={() => setStep("form")} className="w-full bg-[#1a1a4b] hover:bg-[#1a1a4b]/90">
              Reintentar verificación
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full border-[#1a1a4b]/20 text-[#1a1a4b] hover:bg-rose-nude bg-transparent"
            >
              Intentar más tarde
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
