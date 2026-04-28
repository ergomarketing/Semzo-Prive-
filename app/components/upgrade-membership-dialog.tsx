"use client"

import { useRouter } from "next/navigation"
import Image from "next/image"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Crown, ShoppingBag } from "lucide-react"

const TIER_NAMES: Record<string, string> = {
  essentiel: "L'Essentiel",
  signature: "Signature",
  prive: "Privé",
}

const TIER_PASS_PRICE: Record<string, number> = {
  essentiel: 52,
  signature: 99,
  prive: 137,
}

const TIER_MEMBERSHIP_PRICE: Record<string, number> = {
  essentiel: 59,
  signature: 149,
  prive: 279,
}

interface UpgradeMembershipDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  currentMembership: string | null
  requiredTier: string
  bagBrand?: string
  bagName?: string
  bagImage?: string
  onBuyPass: () => void
}

export function UpgradeMembershipDialog({
  open,
  onOpenChange,
  currentMembership,
  requiredTier,
  bagBrand,
  bagName,
  bagImage,
  onBuyPass,
}: UpgradeMembershipDialogProps) {
  const router = useRouter()

  const requiredTierName = TIER_NAMES[requiredTier] || "Privé"
  const currentTierName = currentMembership ? TIER_NAMES[currentMembership] || currentMembership : ""
  const passPrice = TIER_PASS_PRICE[requiredTier] || 137
  const membershipPrice = TIER_MEMBERSHIP_PRICE[requiredTier] || 279

  const handleUpgrade = () => {
    onOpenChange(false)
    router.push(`/signup?plan=${requiredTier}`)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden border-0 bg-white">
        {bagImage ? (
          <div className="relative h-48 w-full bg-gray-50">
            <Image
              src={bagImage || "/placeholder.svg"}
              alt={`${bagBrand ?? ""} ${bagName ?? ""}`.trim() || "Bolso"}
              fill
              className="object-contain"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent" />
          </div>
        ) : null}

        <div className="px-6 pb-6 pt-4">
          <DialogHeader className="space-y-3">
            <div className="flex items-center justify-center">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-dark/10">
                <Crown className="h-6 w-6 text-indigo-dark" aria-hidden="true" />
              </div>
            </div>
            <DialogTitle className="text-center font-serif text-2xl text-slate-900">
              Acceso reservado a la colección {requiredTierName}
            </DialogTitle>
          </DialogHeader>

          <div className="mt-4 space-y-3 text-center">
            {bagBrand && bagName ? (
              <p className="text-pretty text-sm text-slate-600">
                <span className="font-medium text-slate-900">
                  {bagBrand} {bagName}
                </span>{" "}
                pertenece a nuestra coleccion mas exclusiva.
              </p>
            ) : null}
            {currentTierName ? (
              <p className="text-pretty text-sm leading-relaxed text-slate-600">
                Tu membresia <span className="font-medium">{currentTierName}</span> no incluye este nivel. Elige
                como continuar:
              </p>
            ) : (
              <p className="text-pretty text-sm leading-relaxed text-slate-600">
                Elige como continuar:
              </p>
            )}
          </div>

          <div className="mt-6 space-y-3">
            <button
              type="button"
              onClick={() => {
                onOpenChange(false)
                onBuyPass()
              }}
              className="group w-full rounded-lg border border-slate-200 bg-white p-4 text-left transition-all hover:border-indigo-dark hover:shadow-sm"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-rose-nude/30">
                  <ShoppingBag className="h-4 w-4 text-slate-700" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-serif text-base text-slate-900">Pase de Bolso</span>
                    <span className="text-sm font-medium text-slate-900">{passPrice}€</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-slate-600">
                    Acceso unico a este bolso por una semana, sin cambiar tu membresia.
                  </p>
                </div>
              </div>
            </button>

            <button
              type="button"
              onClick={handleUpgrade}
              className="group w-full rounded-lg border border-indigo-dark bg-indigo-dark p-4 text-left text-white transition-all hover:bg-indigo-dark/90"
            >
              <div className="flex items-start gap-3">
                <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-white/15">
                  <Crown className="h-4 w-4 text-white" aria-hidden="true" />
                </div>
                <div className="flex-1">
                  <div className="flex items-baseline justify-between gap-2">
                    <span className="font-serif text-base">Membresia {requiredTierName}</span>
                    <span className="text-sm font-medium">{membershipPrice}€/mes</span>
                  </div>
                  <p className="mt-1 text-xs leading-relaxed text-white/80">
                    Acceso ilimitado a toda la coleccion {requiredTierName} y los niveles inferiores.
                  </p>
                </div>
              </div>
            </button>
          </div>

          <Button
            variant="ghost"
            className="mt-4 w-full text-sm text-slate-500 hover:bg-transparent hover:text-slate-700"
            onClick={() => onOpenChange(false)}
          >
            Quizas mas tarde
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
