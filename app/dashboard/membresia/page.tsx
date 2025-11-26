"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "../../hooks/useAuth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Check, Loader2, Calendar, Sparkles } from "lucide-react"
import { supabase } from "../../lib/supabaseClient"

interface MembershipData {
  membership_status: string
  membership_type: string | null
  created_at: string | null
  billing_cycle?: string | null
}

export default function MembresiaPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [membershipData, setMembershipData] = useState<MembershipData | null>(null)

  useEffect(() => {
    const fetchMembership = async () => {
      if (!user) return

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("membership_status, membership_type, created_at, billing_cycle")
          .eq("id", user.id)
          .maybeSingle()

        if (error) throw error

        if (data) {
          setMembershipData(data)
        }
      } catch (error) {
        console.error("Error fetching membership:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchMembership()
  }, [user])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  const membershipType = membershipData?.membership_type || "free"
  const billingCycle = membershipData?.billing_cycle || "monthly"
  const isActive = membershipData?.membership_status === "active"

  const membershipInfo = {
    petite: { name: "Petite", price: 19.99, period: "semana", description: "Alquiler semanal flexible" },
    essentiel: { name: "L'Essentiel", price: 59, period: "mes", description: "Introducción al lujo" },
    signature: { name: "Signature", price: 129, period: "mes", description: "La experiencia preferida" },
    prive: { name: "Privé", price: 189, period: "mes", description: "Experiencia definitiva" },
    free: { name: "Free", price: 0, period: "mes", description: "Acceso básico" },
  }

  const currentMembership = membershipInfo[membershipType as keyof typeof membershipInfo] || membershipInfo.free

  const petiteFeatures = [
    "1 bolso por semana",
    "Renovación semanal flexible",
    "Amplía hasta 3 meses",
    "Sin compromiso a largo plazo",
    "Envío gratuito",
    "Seguro incluido",
  ]

  const priveFeatures = [
    "Acceso completo al catálogo exclusivo",
    "Reservas prioritarias",
    "Lista de espera ilimitada",
    "Envío gratuito",
    "Soporte prioritario 24/7",
    "Acceso anticipado a nuevas colecciones",
    "Eventos exclusivos para miembros",
  ]

  const signatureFeatures = [
    "1 bolso por mes",
    "Envío express gratuito",
    "Seguro premium incluido",
    "Acceso a colecciones exclusivas",
    "Personal shopper dedicado",
  ]

  const essentielFeatures = ["1 bolso por mes", "Envío gratuito", "Seguro incluido", "Atención al cliente prioritaria"]

  const freeFeatures = [
    "Acceso básico al catálogo",
    "Ver bolsos disponibles",
    "Lista de espera limitada",
    "Soporte por email",
  ]

  const getFeatures = () => {
    switch (membershipType) {
      case "petite":
        return petiteFeatures
      case "essentiel":
        return essentielFeatures
      case "signature":
        return signatureFeatures
      case "prive":
        return priveFeatures
      default:
        return freeFeatures
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <h2 className="text-3xl font-serif text-slate-900 mb-2">Mi Membresía</h2>
        <p className="text-slate-600">Gestiona tu membresía y accede a beneficios exclusivos</p>
      </div>

      <Card className="border-2 border-slate-900 mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-serif text-2xl flex items-center gap-2">
              {isActive && membershipType === "petite" ? (
                <Sparkles className="h-6 w-6 text-[#1a2c4e]" />
              ) : isActive ? (
                <Crown className="h-6 w-6 text-slate-900" />
              ) : null}
              {currentMembership.name}
            </CardTitle>
            <Badge variant="secondary" className="bg-rose-50 text-[#1a2c4e] border-rose-100">
              Actual
            </Badge>
          </div>
          <CardDescription className="text-3xl font-bold text-slate-900 mt-2">
            €{currentMembership.price}/{currentMembership.period}
          </CardDescription>
          {currentMembership.description && <p className="text-slate-500 mt-1">{currentMembership.description}</p>}
        </CardHeader>
        <CardContent>
          <ul className="space-y-3 mb-6">
            {getFeatures().map((feature, index) => (
              <li key={index} className="flex items-start gap-2">
                <Check className="h-5 w-5 text-slate-600 mt-0.5 flex-shrink-0" />
                <span className="text-slate-700">{feature}</span>
              </li>
            ))}
          </ul>

          {isActive && membershipType === "petite" && (
            <Button
              onClick={() => router.push("/catalog")}
              className="w-full bg-[#1a2c4e] hover:bg-[#2a3c5e] text-white font-serif mb-3"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Elegir mi bolso de la semana
            </Button>
          )}

          {!isActive && (
            <Button
              onClick={() => router.push("/membership/upgrade")}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-serif"
            >
              <Crown className="h-4 w-4 mr-2" />
              Upgrade a Privé
            </Button>
          )}
        </CardContent>
      </Card>

      {isActive && (
        <Card>
          <CardHeader>
            <CardTitle className="font-serif">Información de Suscripción</CardTitle>
            <CardDescription>Detalles de tu membresía {currentMembership.name}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <span className="text-slate-600">Estado</span>
              <Badge variant="secondary" className="bg-rose-50 text-[#1a2c4e] border-rose-100">
                {isActive ? "Activa" : "Inactiva"}
              </Badge>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <span className="text-slate-600">Ciclo de facturación</span>
              <span className="font-medium text-slate-900">
                {membershipType === "petite" ? "Semanal" : billingCycle === "quarterly" ? "Trimestral" : "Mensual"}
              </span>
            </div>
            <div className="flex items-center justify-between py-3 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-slate-600" />
                <span className="text-slate-600">Miembro desde</span>
              </div>
              <span className="font-medium text-slate-900">
                {membershipData?.created_at
                  ? new Date(membershipData.created_at).toLocaleDateString("es-ES", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "No disponible"}
              </span>
            </div>

            {membershipType === "petite" && (
              <div className="bg-rose-50 rounded-lg p-4 mt-4">
                <p className="text-sm text-rose-700">
                  <strong>Membresía Petite:</strong> Puedes renovar semanalmente y ampliar tu alquiler hasta 3 meses.
                  Visita el catálogo para elegir tu próximo bolso.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
