"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/utils/supabase/client"
import MembershipUpgradeClient from "@/app/components/MembershipUpgradeClient"
import { Loader2 } from "lucide-react"

const PLAN = {
  membershipType: "prive",
  billingCycle: "monthly",
  price: 279,
  label: "La experiencia definitiva para verdaderas conocedoras.",
  priceSuffix: "/mes",
  features: [
    "1 bolso por mes",
    "Envío express gratuito",
    "Seguro premium incluido",
    "Acceso VIP a nuevas colecciones",
    "Personal shopper dedicado",
    "Eventos exclusivos",
    "Servicio de conserjería",
  ],
}

export default function PriveUpgradeClient() {
  const [userId, setUserId] = useState<string | null>(null)
  const [checked, setChecked] = useState(false)
  const router = useRouter()

  useEffect(() => {
    const supabase = createClient()
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user?.id) {
        setUserId(data.user.id)
      } else {
        router.push("/auth/login?redirect=/membership/upgrade/prive")
      }
      setChecked(true)
    })
  }, [router])

  if (!checked || !userId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="animate-spin h-8 w-8 text-slate-600" />
      </div>
    )
  }

  return <MembershipUpgradeClient plan={PLAN} userId={userId} />
}
