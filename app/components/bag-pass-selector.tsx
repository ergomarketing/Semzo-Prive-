"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Crown, Sparkles, Star } from "lucide-react"

interface BagPass {
  id: string
  pass_tier: string
  purchased_at: string
  expires_at: string | null
}

interface BagPassSelectorProps {
  requiredTier: string
  userId: string
  onPassSelected: (passId: string | null) => void
}

export function BagPassSelector({ requiredTier, userId, onPassSelected }: BagPassSelectorProps) {
  const [availablePasses, setAvailablePasses] = useState<BagPass[]>([])
  const [selectedPass, setSelectedPass] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchAvailablePasses()
  }, [requiredTier])

  const fetchAvailablePasses = async () => {
    try {
      const response = await fetch("/api/bag-passes/available")
      const data = await response.json()

      if (data.passes) {
        const tierPasses = data.passes.filter((p: BagPass) => p.pass_tier === requiredTier)
        setAvailablePasses(tierPasses)
      }
    } catch (error) {
      console.error("Error fetching passes:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleSelectPass = (passId: string) => {
    setSelectedPass(passId)
    onPassSelected(passId)
  }

  const getTierInfo = (tier: string) => {
    const tierMap = {
      lessentiel: { name: "L'Essentiel", icon: Star, color: "text-amber-600" },
      signature: { name: "Signature", icon: Sparkles, color: "text-purple-600" },
      prive: { name: "Privé", icon: Crown, color: "text-indigo-dark" },
    }
    return tierMap[tier as keyof typeof tierMap] || tierMap.lessentiel
  }

  const tierInfo = getTierInfo(requiredTier)
  const TierIcon = tierInfo.icon

  if (loading) {
    return (
      <div className="bg-rose-nude border border-rose-pastel/30 p-4 rounded-lg">
        <p className="text-sm text-indigo-dark">Verificando pases disponibles...</p>
      </div>
    )
  }

  if (availablePasses.length === 0) {
    return (
      <div className="bg-rose-nude border border-rose-pastel/30 p-4 rounded-lg">
        <div className="flex items-start gap-3">
          <TierIcon className={`w-5 h-5 ${tierInfo.color} flex-shrink-0 mt-0.5`} />
          <div>
            <h4 className="font-medium text-indigo-dark mb-2">Pase {tierInfo.name} Requerido</h4>
            <p className="text-sm text-indigo-dark/70 mb-3">
              Este bolso requiere un Pase {tierInfo.name}. No tienes pases disponibles para esta colección.
            </p>
            <Button
              onClick={() => (window.location.href = "/dashboard/membresia")}
              className="bg-indigo-dark hover:bg-indigo-dark/90 text-white"
            >
              Comprar Pase {tierInfo.name}
            </Button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-rose-nude border border-rose-pastel/30 p-4 rounded-lg">
      <div className="flex items-start gap-3 mb-3">
        <TierIcon className={`w-5 h-5 ${tierInfo.color} flex-shrink-0 mt-0.5`} />
        <div>
          <h4 className="font-medium text-indigo-dark mb-1">Selecciona un Pase {tierInfo.name}</h4>
          <p className="text-sm text-indigo-dark/70">
            Tienes {availablePasses.length} pase{availablePasses.length > 1 ? "s" : ""} disponible
            {availablePasses.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {availablePasses.map((pass) => (
          <button
            key={pass.id}
            onClick={() => handleSelectPass(pass.id)}
            className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
              selectedPass === pass.id
                ? "border-indigo-dark bg-white"
                : "border-transparent bg-white hover:border-rose-pastel/50"
            }`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-indigo-dark">Pase {tierInfo.name}</p>
                <p className="text-xs text-indigo-dark/60">
                  Comprado: {new Date(pass.purchased_at).toLocaleDateString("es-ES")}
                </p>
              </div>
              {selectedPass === pass.id && (
                <div className="w-5 h-5 rounded-full bg-indigo-dark flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
